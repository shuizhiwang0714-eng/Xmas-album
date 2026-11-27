import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  Images,
  Music,
  Pause,
  Play,
  Snowflake,
  Sparkles,
  Trees,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HandGestureState, TreeMode } from '../../types';

interface ControlDockProps {
  treeMode: TreeMode;
  onModeChange: (mode: TreeMode) => void;
  isSnowing: boolean;
  onToggleSnow: () => void;
  isAlbumOpen: boolean;
  onToggleAlbum: () => void;
  gestureState: HandGestureState;
  onToggleCamera: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMusicPlaying: boolean;
  isMusicOpen: boolean;
  currentTrackTitle: string;
  isMuted: boolean;
  onToggleMusicPlay: () => void;
  onToggleMusicPanel: () => void;
  onToggleMute: () => void;
}

export function ControlDock({
  treeMode,
  onModeChange,
  isSnowing,
  onToggleSnow,
  isAlbumOpen,
  onToggleAlbum,
  gestureState,
  onToggleCamera,
  isCollapsed,
  onToggleCollapse,
  isMusicPlaying,
  isMusicOpen,
  currentTrackTitle,
  isMuted,
  onToggleMusicPlay,
  onToggleMusicPanel,
  onToggleMute,
}: ControlDockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center">
      {/* Collapse / Expand Pill Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-[#d4af37]/30 bg-[#070f22]/92 px-3 py-1 text-[11px] font-medium text-[#ebd59a] transition-colors hover:border-[#d4af37]/60 hover:text-white cursor-pointer"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>展开控制栏</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>收起控制栏</span>
          </>
        )}
      </button>

      {/* Main Single-Row Horizontal Dock */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#d4af37]/28 bg-[#070f22]/92 px-3 py-2 shadow-[0_18px_48px_rgba(0,0,0,0.68)] max-w-[94vw]">
          {/* Tree Mode Segmented Switch */}
          <div className="flex items-center rounded-xl bg-[#040917] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => onModeChange('tree')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                treeMode === 'tree'
                  ? 'bg-[#144738] text-[#f8e7b4] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>圣诞树聚合态</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('scatter')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                treeMode === 'scatter'
                  ? 'bg-[#92691e] text-[#fff8e1] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>粒子散落态</span>
            </button>
          </div>

          <div className="hidden sm:block h-5 w-px bg-white/12" aria-hidden="true" />

          {/* Snowfall Toggle */}
          <button
            type="button"
            onClick={onToggleSnow}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isSnowing
                ? 'border-sky-300/50 bg-sky-900/50 text-sky-100'
                : 'border-white/12 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{isSnowing ? '飘雪中' : '飘雪'}</span>
          </button>

          {/* Polaroid Album Button */}
          <button
            type="button"
            onClick={onToggleAlbum}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isAlbumOpen
                ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#fff1c1]'
                : 'border-white/12 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>拍立得相册</span>
          </button>

          {/* MediaPipe Hand Gesture Camera Toggle */}
          <button
            type="button"
            onClick={onToggleCamera}
            disabled={gestureState.isLoading}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              gestureState.isEnabled
                ? 'border-[#10b981]/60 bg-[#0b4b38] text-[#d1fae5]'
                : 'border-white/12 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
            } disabled:opacity-60`}
          >
            {gestureState.isEnabled ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span>
              {gestureState.isLoading
                ? '启动手势识别...'
                : gestureState.isEnabled
                ? '关闭手势识别'
                : '开启手势识别'}
            </span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-white/12" aria-hidden="true" />

          {/* Background Festive Music Controls */}
          <div className="flex items-center rounded-xl border border-white/12 bg-[#040917] p-0.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMusicPlay}
              aria-label={isMusicPlaying ? '暂停背景音乐' : '播放背景音乐'}
              className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMusicPlaying
                  ? 'bg-[#d4af37] text-[#081020]'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onToggleMusicPanel}
              aria-label="打开圣诞播放列表"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMusicOpen
                  ? 'bg-[#112442] text-[#fff1c1]'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="max-w-[96px] truncate">{currentTrackTitle}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? '取消静音' : '静音'}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
