import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DetectedGesture, HandGestureState } from '../types';

interface UseHandGesturesOptions {
  onRightPinchGrabZoom: (offset: { x: number; y: number }) => void;
  onRightPinchMove: (offset: { x: number; y: number }) => void;
  onRightPinchRelease: () => void;
  onTwoHandsScatter: () => void;
  onTwoHandsTree: () => void;
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

interface AnalyzedHand {
  handedness: 'Left' | 'Right' | 'Unknown';
  lm: NormalizedLandmark[];
  isOpenPalm: boolean;
  isClosedFist: boolean;
  isPinching: boolean;
  isThumbsUp: boolean;
  isPalmDown: boolean;
  flutterDelta: number;
  tipSigns: number[];
  offset: { x: number; y: number };
}

function analyzeHand(
  lm: NormalizedLandmark[],
  rawCategory: string | undefined,
  prevTipYs: number[] | null
): { analyzed: AnalyzedHand; nextTipYs: number[] } {
  const wrist = lm[0];
  const thumbIp = lm[3];
  const thumbTip = lm[4];
  const indexMcp = lm[5];
  const indexTip = lm[8];
  const middleMcp = lm[9];
  const middleTip = lm[12];
  const ringTip = lm[16];
  const pinkyMcp = lm[17];
  const pinkyTip = lm[20];

  const palmScale = Math.max(0.06, dist2D(wrist, middleMcp));

  const indexExt = dist2D(wrist, indexTip) / palmScale;
  const middleExt = dist2D(wrist, middleTip) / palmScale;
  const ringExt = dist2D(wrist, ringTip) / palmScale;
  const pinkyExt = dist2D(wrist, pinkyTip) / palmScale;
  const thumbExt = dist2D(wrist, thumbTip) / palmScale;
  const avgFourExt = (indexExt + middleExt + ringExt + pinkyExt) / 4;
  const pinchDist = dist2D(thumbTip, indexTip) / palmScale;

  const isThumbsUp =
    thumbTip.y < thumbIp.y - 0.024 &&
    thumbTip.y < indexMcp.y - 0.032 &&
    avgFourExt < 1.38;

  const isClosedFist = avgFourExt < 1.18 && !isThumbsUp;
  const isPinching = pinchDist < 0.36 && !isClosedFist && !isThumbsUp;
  const isOpenPalm = avgFourExt > 1.66 && thumbExt > 1.12 && pinchDist > 0.42;

  // Palm facing down / fingers angled downward in front of camera
  const tipIndices = [8, 12, 16, 20];
  const mcpIndices = [5, 9, 13, 17];
  const avgTipY = tipIndices.reduce((acc, idx) => acc + lm[idx].y, 0) / 4;
  const avgMcpY = mcpIndices.reduce((acc, idx) => acc + lm[idx].y, 0) / 4;

  // Also check 3D palm normal (cross product of wrist->indexMcp and wrist->pinkyMcp)
  const ux = indexMcp.x - wrist.x;
  const uy = indexMcp.y - wrist.y;
  const uz = (indexMcp.z ?? 0) - (wrist.z ?? 0);
  const vx = pinkyMcp.x - wrist.x;
  const vy = pinkyMcp.y - wrist.y;
  const vz = (pinkyMcp.z ?? 0) - (wrist.z ?? 0);
  // Cross product Y component (in screen coords, +Y is downward)
  const normalY = uz * vx - ux * vz;
  const fingersPointingDown = avgTipY > wrist.y + 0.022 && avgTipY > avgMcpY + 0.008;
  const palmHorizDown =
    rawCategory === 'Right'
      ? normalY > -0.002 && avgTipY >= avgMcpY - 0.025 && avgTipY >= wrist.y - 0.015
      : false;
  const isPalmDown = fingersPointingDown || palmHorizDown;

  const nextTipYs = tipIndices.map((idx) => (lm[idx].y - wrist.y) / palmScale);
  let flutterDelta = 0;
  const tipSigns: number[] = [0, 0, 0, 0];
  if (prevTipYs) {
    for (let i = 0; i < nextTipYs.length; i++) {
      const diff = nextTipYs[i] - prevTipYs[i];
      flutterDelta += Math.abs(diff);
      if (Math.abs(diff) > 0.012) {
        tipSigns[i] = diff > 0 ? 1 : -1;
      }
    }
  }

  const hx = (0.5 - indexTip.x) * 2.0;
  const hy = (0.5 - indexTip.y) * 2.0;
  const offset = {
    x: Math.abs(hx) < 0.05 ? 0 : Math.max(-1, Math.min(1, hx)),
    y: Math.abs(hy) < 0.05 ? 0 : Math.max(-1, Math.min(1, hy)),
  };

  const handedness =
    rawCategory === 'Right' ? 'Right' : rawCategory === 'Left' ? 'Left' : 'Unknown';

  return {
    analyzed: {
      handedness,
      lm,
      isOpenPalm,
      isClosedFist,
      isPinching,
      isThumbsUp,
      isPalmDown,
      flutterDelta,
      tipSigns,
      offset,
    },
    nextTipYs,
  };
}

export function useHandGestures({
  onRightPinchGrabZoom,
  onRightPinchMove,
  onRightPinchRelease,
  onTwoHandsScatter,
  onTwoHandsTree,
}: UseHandGesturesOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const callbacksRef = useRef({
    onRightPinchGrabZoom,
    onRightPinchMove,
    onRightPinchRelease,
    onTwoHandsScatter,
    onTwoHandsTree,
  });
  callbacksRef.current = {
    onRightPinchGrabZoom,
    onRightPinchMove,
    onRightPinchRelease,
    onTwoHandsScatter,
    onTwoHandsTree,
  };

  const wasRightPinchingRef = useRef(false);
  const prevTipYsByHandRef = useRef<Record<string, number[]>>({});
  const prevSignByFingerRef = useRef<number[]>([0, 0, 0, 0]);
  const reversalTimestampsRef = useRef<number[]>([]);
  const flutterRateRef = useRef(0);
  const snowIntensityRef = useRef(0);
  const snowSpeedRef = useRef(1);
  const prevIndexXRef = useRef<number | null>(null);
  const prevFrameTimeRef = useRef(0);

  const twoOpenFramesRef = useRef(0);
  const twoFistFramesRef = useRef(0);
  const lastScatterTriggerRef = useRef(0);
  const lastTreeTriggerRef = useRef(0);
  const thumbsUpLastSeenRef = useRef(0);
  const releaseBadgeUntilRef = useRef(0);

  const [state, setState] = useState<HandGestureState>({
    isEnabled: false,
    isLoading: false,
    error: null,
    detectedGesture: 'none',
    handOffset: { x: 0, y: 0 },
    horizontalMotion: 0,
    snowIntensity: 0,
    snowSpeed: 1,
    santaActive: false,
    handCount: 0,
    handDetected: false,
  });

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (wasRightPinchingRef.current) {
      wasRightPinchingRef.current = false;
      callbacksRef.current.onRightPinchRelease();
    }
    prevTipYsByHandRef.current = {};
    prevSignByFingerRef.current = [0, 0, 0, 0];
    reversalTimestampsRef.current = [];
    flutterRateRef.current = 0;
    snowIntensityRef.current = 0;
    snowSpeedRef.current = 1;
    prevIndexXRef.current = null;
    twoOpenFramesRef.current = 0;
    twoFistFramesRef.current = 0;
    thumbsUpLastSeenRef.current = 0;

    setState({
      isEnabled: false,
      isLoading: false,
      error: null,
      detectedGesture: 'none',
      handOffset: { x: 0, y: 0 },
      horizontalMotion: 0,
      snowIntensity: 0,
      snowSpeed: 1,
      santaActive: false,
      handCount: 0,
      handDetected: false,
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        isEnabled: false,
        isLoading: false,
        error: '当前浏览器环境不支持前置摄像头访问（需 HTTPS 或本地安全上下文）。',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 360 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      prevFrameTimeRef.current = performance.now();

      setState({
        isEnabled: true,
        isLoading: false,
        error: null,
        detectedGesture: 'none',
        handOffset: { x: 0, y: 0 },
        horizontalMotion: 0,
        snowIntensity: 0,
        snowSpeed: 1,
        santaActive: false,
        handCount: 0,
        handDetected: false,
      });

      let lastVideoTime = -1;

      const processFrame = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;
        if (!video || !landmarker || !streamRef.current) return;

        if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const now = performance.now();
          const dt = Math.max(0.012, Math.min(0.1, (now - prevFrameTimeRef.current) / 1000));
          prevFrameTimeRef.current = now;

          const result = landmarker.detectForVideo(video, now);
          const landmarksList = result.landmarks ?? [];
          const handednessList = result.handedness ?? [];

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          if (landmarksList.length > 0) {
            const analyzedHands: AnalyzedHand[] = [];
            const nextTipMap: Record<string, number[]> = {};

            for (let i = 0; i < landmarksList.length; i++) {
              const lm = landmarksList[i];
              const category = handednessList[i]?.[0]?.categoryName;
              const key = `${category ?? 'H'}-${i}`;
              const { analyzed, nextTipYs } = analyzeHand(
                lm,
                category,
                prevTipYsByHandRef.current[key] ?? null
              );
              nextTipMap[key] = nextTipYs;
              analyzedHands.push(analyzed);

              if (canvas && ctx) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-canvas.width, 0);
                ctx.strokeStyle =
                  analyzed.handedness === 'Right'
                    ? 'rgba(245, 213, 122, 0.82)'
                    : 'rgba(110, 231, 183, 0.72)';
                ctx.lineWidth = 1.6;
                for (const [a, b] of HAND_CONNECTIONS) {
                  ctx.beginPath();
                  ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
                  ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
                  ctx.stroke();
                }
                ctx.fillStyle = analyzed.handedness === 'Right' ? '#fff3c4' : '#a7f3d0';
                for (const pt of lm) {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.2, 0, Math.PI * 2);
                  ctx.fill();
                }
                ctx.restore();
              }
            }
            prevTipYsByHandRef.current = nextTipMap;

            const rightHand = analyzedHands.find((h) => h.handedness === 'Right') ?? null;
            const primaryHand = rightHand ?? analyzedHands[0];

            // Slow tree rotation tracking
            let horizontalMotion = 0;
            const idxX = primaryHand.lm[8].x;
            if (prevIndexXRef.current !== null) {
              const dx = prevIndexXRef.current - idxX;
              horizontalMotion = Math.abs(dx) > 0.002 ? dx * 18 : 0;
            }
            prevIndexXRef.current = idxX;

            // Rule 1: Two hands Open Palm -> Scatter | Two hands Closed Fist -> Tree
            let twoHandsScatter = false;
            let twoHandsTree = false;
            if (analyzedHands.length === 2) {
              const [h0, h1] = analyzedHands;
              if (h0.isOpenPalm && h1.isOpenPalm) {
                twoOpenFramesRef.current += 1;
                twoFistFramesRef.current = 0;
                if (twoOpenFramesRef.current >= 3) {
                  twoHandsScatter = true;
                  if (now - lastScatterTriggerRef.current > 600) {
                    lastScatterTriggerRef.current = now;
                    callbacksRef.current.onTwoHandsScatter();
                  }
                }
              } else if (h0.isClosedFist && h1.isClosedFist) {
                twoFistFramesRef.current += 1;
                twoOpenFramesRef.current = 0;
                if (twoFistFramesRef.current >= 3) {
                  twoHandsTree = true;
                  if (now - lastTreeTriggerRef.current > 600) {
                    lastTreeTriggerRef.current = now;
                    callbacksRef.current.onTwoHandsTree();
                  }
                }
              } else {
                twoOpenFramesRef.current = 0;
                twoFistFramesRef.current = 0;
              }
            } else {
              twoOpenFramesRef.current = 0;
              twoFistFramesRef.current = 0;
            }

            // Rule 2: Right hand Thumb + Index pinch -> Grab & Zoom photo; Release -> Return photo
            const isRightPinching = Boolean(rightHand?.isPinching);
            if (isRightPinching && rightHand) {
              if (!wasRightPinchingRef.current) {
                callbacksRef.current.onRightPinchGrabZoom(rightHand.offset);
              } else {
                callbacksRef.current.onRightPinchMove(rightHand.offset);
              }
              wasRightPinchingRef.current = true;
            } else if (wasRightPinchingRef.current) {
              wasRightPinchingRef.current = false;
              callbacksRef.current.onRightPinchRelease();
              releaseBadgeUntilRef.current = now + 900;
            }

            // Rule 3: Right hand palm-down & fluttering fingers -> Snowfall, speed scales with flutter frequency
            if (
              rightHand &&
              rightHand.isPalmDown &&
              !rightHand.isClosedFist &&
              !rightHand.isPinching
            ) {
              const instantRate = rightHand.flutterDelta / dt;
              flutterRateRef.current = flutterRateRef.current * 0.65 + instantRate * 0.35;

              // Count oscillation direction reversals across fingers in a rolling 850ms window
              for (let f = 0; f < 4; f++) {
                const s = rightHand.tipSigns[f];
                if (s !== 0) {
                  if (prevSignByFingerRef.current[f] !== 0 && s !== prevSignByFingerRef.current[f]) {
                    reversalTimestampsRef.current.push(now);
                  }
                  prevSignByFingerRef.current[f] = s;
                }
              }
              reversalTimestampsRef.current = reversalTimestampsRef.current.filter(
                (ts) => now - ts <= 850
              );

              // Approx average oscillation frequency (Hz) across 4 fingers
              const freqHz = reversalTimestampsRef.current.length / (4 * 2 * 0.85);
              const isFluttering = flutterRateRef.current > 1.05 || freqHz > 0.65;

              if (isFluttering) {
                snowIntensityRef.current = Math.min(1, snowIntensityRef.current + dt * 3.8);
                // Map flutter frequency (~0.5Hz..6Hz) & instant rate smoothly to snowSpeed [0.55 .. 3.4]
                const freqFactor = Math.min(1, (freqHz * 0.65 + flutterRateRef.current * 0.14) / 3.6);
                const targetSpeed = 0.55 + freqFactor * 2.85;
                snowSpeedRef.current = snowSpeedRef.current * 0.72 + targetSpeed * 0.28;
              } else {
                snowIntensityRef.current = Math.max(0, snowIntensityRef.current - dt * 2.2);
                snowSpeedRef.current = snowSpeedRef.current * 0.85 + 0.65 * 0.15;
              }
            } else {
              flutterRateRef.current = 0;
              reversalTimestampsRef.current = [];
              prevSignByFingerRef.current = [0, 0, 0, 0];
              snowIntensityRef.current = Math.max(0, snowIntensityRef.current - dt * 2.8);
            }
            if (snowIntensityRef.current < 0.03) snowIntensityRef.current = 0;

            // Rule 4: Right hand Thumbs-Up continuous hold for Santa flight
            if (rightHand?.isThumbsUp) {
              thumbsUpLastSeenRef.current = now;
            }
            const santaActive = now - thumbsUpLastSeenRef.current < 160;

            // Primary UI gesture label
            let detectedGesture: DetectedGesture = 'none';
            if (twoHandsScatter) {
              detectedGesture = 'two_hands_scatter';
            } else if (twoHandsTree) {
              detectedGesture = 'two_hands_tree';
            } else if (isRightPinching) {
              detectedGesture = 'right_pinch_grab_zoom';
            } else if (santaActive) {
              detectedGesture = 'right_thumbs_up_santa';
            } else if (snowIntensityRef.current > 0.05) {
              detectedGesture = 'fingers_down_snow';
            } else if (now < releaseBadgeUntilRef.current) {
              detectedGesture = 'right_pinch_release';
            } else if (Math.abs(horizontalMotion) > 0.04 || Math.abs(primaryHand.offset.x) > 0.22) {
              detectedGesture = 'move_hand';
            }

            setState((prev) => ({
              ...prev,
              handDetected: true,
              handCount: analyzedHands.length,
              detectedGesture,
              handOffset: primaryHand.offset,
              horizontalMotion,
              snowIntensity: snowIntensityRef.current,
              snowSpeed: snowSpeedRef.current,
              santaActive,
            }));
          } else {
            if (wasRightPinchingRef.current) {
              wasRightPinchingRef.current = false;
              callbacksRef.current.onRightPinchRelease();
            }
            prevTipYsByHandRef.current = {};
            prevSignByFingerRef.current = [0, 0, 0, 0];
            reversalTimestampsRef.current = [];
            flutterRateRef.current = 0;
            snowIntensityRef.current = 0;
            snowSpeedRef.current = 1;
            prevIndexXRef.current = null;
            twoOpenFramesRef.current = 0;
            twoFistFramesRef.current = 0;
            thumbsUpLastSeenRef.current = 0;

            setState((prev) =>
              prev.handDetected || prev.santaActive || prev.snowIntensity > 0
                ? {
                    ...prev,
                    handDetected: false,
                    handCount: 0,
                    detectedGesture: 'none',
                    handOffset: { x: 0, y: 0 },
                    horizontalMotion: 0,
                    snowIntensity: 0,
                    snowSpeed: 1,
                    santaActive: false,
                  }
                : prev
            );
          }
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      stopCamera();
      let message = '摄像头启动失败，请检查设备连接后重试。';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = '摄像头权限已被拒绝，请在浏览器地址栏中允许摄像头访问权限。';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = '未检测到可用的前置摄像头设备。';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = '摄像头正被其他应用程序占用，请关闭后重试。';
        }
      } else if (err instanceof Error && err.message) {
        message = `手势模型加载失败（可能需要网络连接加载 MediaPipe）：${err.message}`;
      }
      setState((prev) => ({
        ...prev,
        isEnabled: false,
        isLoading: false,
        error: message,
      }));
    }
  }, [stopCamera]);

  const toggleCamera = useCallback(() => {
    if (state.isEnabled || state.isLoading) {
      stopCamera();
    } else {
      void startCamera();
    }
  }, [state.isEnabled, state.isLoading, startCamera, stopCamera]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  return {
    gestureState: state,
    videoRef,
    canvasRef,
    toggleCamera,
    clearError,
  };
}
