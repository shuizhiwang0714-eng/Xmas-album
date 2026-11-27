import { AlertCircle, Hand, X } from 'lucide-react';
import { DetectedGesture, HandGestureState } from '../../types';

interface HandCameraPipProps {
  gestureState: HandGestureState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClearError: () => void;
  onStopCamera: () => void;
}

const GESTURE_LABELS: Record<DetectedGesture, string> = {
  none: '等待手势 · 面向摄像头',
  move_hand: '左右移动 · 圣诞树缓慢旋转',
  two_hands_scatter: '双手张开 · 粒子散落态',
  two_hands_tree: '双手握拳 · 圣诞树聚合态',
  right_pinch_grab_zoom: '右手捏合 · 抓取并放大照片',
  right_pinch_release: '松开捏合 · 照片已放回树上',
  fingers_down_snow: '右手掌朝下抖动 · 频率控制雪速',
  right_thumbs_up_santa: '右手持续点赞 · 圣诞老人飞越天空',
};

export function HandCameraPip({
  gestureState,
  videoRef,
  canvasRef,
  onClearError,
  onStopCamera,
}: HandCameraPipProps) {
  return (
    <>
      {/* Camera Error Toast */}
      {gestureState.error && (
        <div className="fixed top-5 right-5 z-40 flex max-w-sm items-start gap-2.5 rounded-xl border border-amber-400/35 bg-[#121629]/95 px-3.5 py-3 text-xs text-amber-100 shadow-xl">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 leading-relaxed">{gestureState.error}</div>
          <button
            type="button"
            onClick={onClearError}
            aria-label="关闭提示"
            className="rounded p-0.5 text-amber-200/70 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Always-mounted hidden/PIP video container so videoRef is ready immediately */}
      <div
        className={`fixed bottom-20 right-4 z-30 w-64 overflow-hidden rounded-xl border border-[#d4af37]/30 bg-[#050c1d]/95 shadow-2xl transition-opacity duration-200 ${
          gestureState.isEnabled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 w-0 border-0'
        }`}
      >
        <div className="relative h-32 w-full">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover opacity-75"
          />
          <canvas
            ref={canvasRef}
            width={256}
            height={128}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <button
            type="button"
            onClick={onStopCamera}
            aria-label="关闭摄像头"
            className="absolute top-1.5 right-1.5 rounded-md bg-black/60 p-1 text-white/80 hover:bg-black/80 hover:text-white cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="border-t border-white/10 px-2.5 py-2 text-[11px] text-[#f4df9e]">
          <div className="flex items-center gap-1.5 font-medium">
            <Hand className="h-3.5 w-3.5 shrink-0 text-[#d4af37]" />
            <span className="truncate">
              {gestureState.handDetected
                ? GESTURE_LABELS[gestureState.detectedGesture]
                : '未检测到手部 · 请面向镜头'}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-1 gap-y-0.5 text-[10px] text-slate-400">
            <span>双手张开：粒子散落 · 双手握拳：聚合全景</span>
            <span>右手捏合：抓取放大 · 松开手：放回照片</span>
            <span>右手掌朝下抖动手指：飘雪（频率越快雪越快）</span>
            <span className="text-[#e8cb7a]/90">右手持续点赞：圣诞老人飞越（松开即消失）</span>
          </div>
        </div>
      </div>
    </>
  );
}
