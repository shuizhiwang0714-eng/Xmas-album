import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChristmasScene } from './components/scene/ChristmasScene';
import { AlbumDrawer } from './components/ui/AlbumDrawer';
import { ControlDock } from './components/ui/ControlDock';
import { GiftCardModal } from './components/ui/GiftCardModal';
import { HandCameraPip } from './components/ui/HandCameraPip';
import { MusicPlaylistPopover } from './components/ui/MusicPlaylistPopover';
import { PolaroidEditorBar } from './components/ui/PolaroidEditorBar';
import { useHandGestures } from './hooks/useHandGestures';
import { GiftRecipient, PolaroidItem, TreeMode } from './types';
import { FESTIVE_PLAYLIST, FestiveAudioEngine } from './utils/festiveAudioEngine';

const DEFAULT_CAPTIONS = [
  '冬夜星光下的温暖记忆',
  'Merry Christmas 2026',
  '一起度过的金色瞬间',
  '灯火可亲 · 岁末安暖',
  '雪落满枝头的约定',
  '星尘与笑声常伴左右',
  '愿来年依旧温柔明亮',
  '我们的独家圣诞回忆',
  '平安喜乐 · 万事顺意',
  '壁炉旁的热可可时光',
  '把欢笑挂满整棵树',
  '璀璨夜色里的相聚',
  '岁岁年年 · 温暖同行',
  '记录此刻闪耀的微光',
  '冬日限定的浪漫篇章',
  '愿所有期盼皆有所回响',
  '家人闲坐 · 灯火暖心',
  '明年圣诞也要在一起',
];

const INITIAL_POLAROIDS: PolaroidItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `p${i + 1}`,
  imageUrl: null,
  caption: DEFAULT_CAPTIONS[i],
  aspectRatio: i % 3 === 0 ? 1 : i % 3 === 1 ? 4 / 3 : 3 / 4,
  heightFraction: 0.1 + (i / 17) * 0.74,
  angle: i * 2.39996 + 0.35,
}));

export default function App() {
  const [treeMode, setTreeMode] = useState<TreeMode>('tree');
  const [polaroids, setPolaroids] = useState<PolaroidItem[]>(INITIAL_POLAROIDS);
  const [selectedPolaroidId, setSelectedPolaroidId] = useState<string | null>(null);
  const [grabbedPolaroidId, setGrabbedPolaroidId] = useState<string | null>(null);
  const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const grabbedIdRef = useRef<string | null>(null);

  const [manualSnow, setManualSnow] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Festive background music player state (AudioContext initializes after first user interaction)
  const audioEngineRef = useRef<FestiveAudioEngine | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.55);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);

  // Gift opening white-light transition state
  const [openingGift, setOpeningGift] = useState<GiftRecipient | null>(null);
  const [whiteoutOpacity, setWhiteoutOpacity] = useState(0);
  const [revealedCard, setRevealedCard] = useState<GiftRecipient | null>(null);
  const giftTimersRef = useRef<number[]>([]);

  const frontmostPolaroidIdRef = useRef<string | null>(INITIAL_POLAROIDS[0].id);

  // Initialize AudioEngine lazily and attach first-user-interaction AudioContext bootstrap
  useEffect(() => {
    const engine = new FestiveAudioEngine();
    audioEngineRef.current = engine;

    const handleFirstInteraction = () => {
      void engine.initAfterInteraction();
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      engine.dispose();
      audioEngineRef.current = null;
    };
  }, []);

  // Auto-advance to the next carol when the current track finishes
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    engine.setOnTrackEnd(() => {
      setCurrentTrackIndex((prev) => {
        const next = (prev + 1) % FESTIVE_PLAYLIST.length;
        engine.setTrack(next, false);
        return next;
      });
    });
    return () => {
      engine.setOnTrackEnd(null);
    };
  }, []);

  // Keep engine volume synced with volume/mute state
  useEffect(() => {
    audioEngineRef.current?.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleToggleMusicPlay = useCallback(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    if (isMusicPlaying) {
      engine.pause();
      setIsMusicPlaying(false);
    } else {
      engine.setTrack(currentTrackIndex, false);
      void engine.play();
      setIsMusicPlaying(true);
    }
  }, [currentTrackIndex, isMusicPlaying]);

  const handleSelectTrack = useCallback((index: number) => {
    const engine = audioEngineRef.current;
    const normalized = ((index % FESTIVE_PLAYLIST.length) + FESTIVE_PLAYLIST.length) % FESTIVE_PLAYLIST.length;
    setCurrentTrackIndex(normalized);
    if (!engine) return;
    engine.setTrack(normalized, true);
    void engine.play();
    setIsMusicPlaying(true);
  }, []);

  const handlePrevTrack = useCallback(() => {
    handleSelectTrack(currentTrackIndex - 1);
  }, [currentTrackIndex, handleSelectTrack]);

  const handleNextTrack = useCallback(() => {
    handleSelectTrack(currentTrackIndex + 1);
  }, [currentTrackIndex, handleSelectTrack]);

  const handleVolumeChange = useCallback((nextVol: number) => {
    const clamped = Math.max(0, Math.min(1, nextVol));
    setVolume(clamped);
    if (clamped > 0) {
      setIsMuted(false);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Close album & music popover if user zooms a specific polaroid directly
  const handleSelectPolaroid = useCallback((id: string | null) => {
    setGrabbedPolaroidId(null);
    grabbedIdRef.current = null;
    setSelectedPolaroidId(id);
    if (id !== null) {
      setIsAlbumOpen(false);
      setIsMusicOpen(false);
    }
  }, []);

  const handleUpdatePolaroid = useCallback(
    (id: string, patch: Partial<Pick<PolaroidItem, 'imageUrl' | 'caption' | 'aspectRatio'>>) => {
      setPolaroids((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    []
  );

  // Rule 2: Right-hand thumb+index pinch -> Grab frontmost photo & zoom immediately
  const handleRightPinchGrabZoom = useCallback(
    (offset: { x: number; y: number }) => {
      const targetId = selectedPolaroidId || frontmostPolaroidIdRef.current;
      if (!targetId) return;
      grabOffsetRef.current = offset;
      grabbedIdRef.current = targetId;
      setSelectedPolaroidId(null);
      setIsAlbumOpen(false);
      setGrabbedPolaroidId(targetId);
    },
    [selectedPolaroidId]
  );

  const handleRightPinchMove = useCallback((offset: { x: number; y: number }) => {
    grabOffsetRef.current = offset;
  }, []);

  // Rule 2: Release right-hand pinch -> Return photo back to tree
  const handleRightPinchRelease = useCallback(() => {
    if (!grabbedIdRef.current) return;
    grabbedIdRef.current = null;
    setGrabbedPolaroidId(null);
    setSelectedPolaroidId(null);
  }, []);

  // Rule 1: Two hands open palm -> Particle scatter state
  const handleTwoHandsScatter = useCallback(() => {
    setTreeMode('scatter');
  }, []);

  // Rule 1: Two hands closed fist -> Assembled tree & panorama reset
  const handleTwoHandsTree = useCallback(() => {
    grabbedIdRef.current = null;
    setGrabbedPolaroidId(null);
    setSelectedPolaroidId(null);
    setIsAlbumOpen(false);
    setTreeMode('tree');
    setResetViewTrigger((n) => n + 1);
  }, []);

  const { gestureState, videoRef, canvasRef, toggleCamera, clearError } = useHandGestures({
    onRightPinchGrabZoom: handleRightPinchGrabZoom,
    onRightPinchMove: handleRightPinchMove,
    onRightPinchRelease: handleRightPinchRelease,
    onTwoHandsScatter: handleTwoHandsScatter,
    onTwoHandsTree: handleTwoHandsTree,
  });

  // Rule 3: Snowfall only when right-hand palm-down fingers flutter (or manual dock toggle)
  const effectiveSnowIntensity = manualSnow ? 0.85 : gestureState.isEnabled ? gestureState.snowIntensity : 0;
  const effectiveSnowSpeed = manualSnow ? 1.0 : gestureState.isEnabled ? gestureState.snowSpeed : 1.0;

  // Gift click -> white light emanates from gift, fills screen, fades out to reveal Gift Card
  const handleOpenGift = useCallback(
    (recipient: GiftRecipient) => {
      if (openingGift || revealedCard) return;

      giftTimersRef.current.forEach((t) => window.clearTimeout(t));
      giftTimersRef.current = [];

      grabbedIdRef.current = null;
      setGrabbedPolaroidId(null);
      setSelectedPolaroidId(null);
      setIsAlbumOpen(false);
      setOpeningGift(recipient);

      const t1 = window.setTimeout(() => {
        setWhiteoutOpacity(1);
      }, 280);

      const t2 = window.setTimeout(() => {
        setRevealedCard(recipient);
        setOpeningGift(null);
        setWhiteoutOpacity(0);
      }, 1150);

      giftTimersRef.current = [t1, t2];
    },
    [openingGift, revealedCard]
  );

  useEffect(() => {
    return () => {
      giftTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // ESC key closes zoomed polaroid, album, music popover, or gift card
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (revealedCard) setRevealedCard(null);
        else if (selectedPolaroidId) setSelectedPolaroidId(null);
        else if (isAlbumOpen) setIsAlbumOpen(false);
        else if (isMusicOpen) setIsMusicOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [revealedCard, selectedPolaroidId, isAlbumOpen, isMusicOpen]);

  const selectedPolaroid = useMemo(
    () => polaroids.find((p) => p.id === selectedPolaroidId) ?? null,
    [polaroids, selectedPolaroidId]
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030816] select-none">
      {/* Full-Bleed 3D Scene */}
      <ChristmasScene
        treeMode={treeMode}
        polaroids={polaroids}
        selectedPolaroidId={selectedPolaroidId}
        grabbedPolaroidId={grabbedPolaroidId}
        grabOffsetRef={grabOffsetRef}
        onSelectPolaroid={handleSelectPolaroid}
        onOpenGift={handleOpenGift}
        activeOpeningGift={openingGift}
        gestureState={gestureState}
        frontmostPolaroidIdRef={frontmostPolaroidIdRef}
        snowIntensity={effectiveSnowIntensity}
        snowSpeed={effectiveSnowSpeed}
        santaActive={gestureState.isEnabled && gestureState.santaActive}
        resetViewTrigger={resetViewTrigger}
      />

      {/* Minimal Top-Left Header & Unboxed Guide Metadata */}
      <header className="pointer-events-none fixed top-5 left-6 z-20 max-w-[82vw]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-wide text-[#f9ebc4]">
          Noël Lumière
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-300/80">
          <span>拖拽旋转缩放</span>
          <span aria-hidden="true">·</span>
          <span>点击拍立得放大定制</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#f3d98b]">点击树下 For Mom / For Dad 礼盒拆封</span>
        </p>
      </header>

      {/* Active Polaroid Quick Editor (visible when a Polaroid is zoomed out) */}
      <PolaroidEditorBar
        polaroid={selectedPolaroid}
        onUpdate={handleUpdatePolaroid}
        onClose={() => setSelectedPolaroidId(null)}
      />

      {/* Polaroid Album Management Drawer */}
      <AlbumDrawer
        isOpen={isAlbumOpen && !selectedPolaroid}
        onClose={() => setIsAlbumOpen(false)}
        polaroids={polaroids}
        selectedId={selectedPolaroidId}
        onSelect={handleSelectPolaroid}
        onUpdate={handleUpdatePolaroid}
      />

      {/* Festive Music Playlist Popover */}
      <MusicPlaylistPopover
        isOpen={isMusicOpen && !selectedPolaroid && !isAlbumOpen}
        onClose={() => setIsMusicOpen(false)}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isMusicPlaying}
        volume={volume}
        isMuted={isMuted}
        onSelectTrack={handleSelectTrack}
        onTogglePlay={handleToggleMusicPlay}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
      />

      {/* Collapsible Bottom Control Dock */}
      <ControlDock
        treeMode={treeMode}
        onModeChange={setTreeMode}
        isSnowing={effectiveSnowIntensity > 0.05}
        onToggleSnow={() => setManualSnow((v) => !v)}
        isAlbumOpen={isAlbumOpen}
        onToggleAlbum={() => {
          setSelectedPolaroidId(null);
          setIsMusicOpen(false);
          setIsAlbumOpen((v) => !v);
        }}
        gestureState={gestureState}
        onToggleCamera={toggleCamera}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed((v) => !v)}
        isMusicPlaying={isMusicPlaying}
        isMusicOpen={isMusicOpen}
        currentTrackTitle={FESTIVE_PLAYLIST[currentTrackIndex].title}
        isMuted={isMuted || volume === 0}
        onToggleMusicPlay={handleToggleMusicPlay}
        onToggleMusicPanel={() => {
          setSelectedPolaroidId(null);
          setIsAlbumOpen(false);
          setIsMusicOpen((v) => !v);
        }}
        onToggleMute={handleToggleMute}
      />

      {/* Optional MediaPipe Front Camera & Hand Skeleton Preview */}
      <HandCameraPip
        gestureState={gestureState}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onClearError={clearError}
        onStopCamera={toggleCamera}
      />

      {/* Luxury Dark-Green Hot-Foil Gift Card Modal */}
      <GiftCardModal recipient={revealedCard} onClose={() => setRevealedCard(null)} />

      {/* Full-Screen White Light Flood Transition Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] bg-[radial-gradient(circle_at_center,#ffffff_0%,#fffdf5_55%,#fff6d8_100%)] transition-opacity duration-700 ease-in-out"
        style={{ opacity: whiteoutOpacity }}
      />
    </main>
  );
}
