import { Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { FESTIVE_PLAYLIST } from '../../utils/festiveAudioEngine';

interface MusicPlaylistPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onSelectTrack: (index: number) => void;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function MusicPlaylistPopover({
  isOpen,
  onClose,
  currentTrackIndex,
  isPlaying,
  volume,
  isMuted,
  onSelectTrack,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
}: MusicPlaylistPopoverProps) {
  if (!isOpen) return null;

  const activeTrack = FESTIVE_PLAYLIST[currentTrackIndex];
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 w-[min(420px,92vw)] rounded-xl border border-[#d4af37]/30 bg-[#070f22]/96 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.72)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-[#d4af37]" />
          <h3 className="font-display text-base font-semibold tracking-wide text-[#f7e5b2]">
            圣诞八音盒播放列表
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭音乐面板"
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Transport & Volume Row */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#040917] px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-[#f8e7b4]">{activeTrack.title}</div>
          <div className="truncate text-[11px] text-slate-400">{activeTrack.subtitle}</div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPrevTrack}
            aria-label="上一首"
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? '暂停音乐' : '播放音乐'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d4af37] text-[#081020] transition-colors hover:bg-[#e8c65a] cursor-pointer"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onNextTrack}
            aria-label="下一首"
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Volume Slider */}
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? '取消静音' : '静音'}
          className="rounded p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          {effectiveVolume === 0 ? (
            <VolumeX className="h-4 w-4 text-slate-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#d4af37]" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={effectiveVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="背景音乐音量"
          className="h-1.5 flex-1 cursor-pointer accent-[#d4af37]"
        />
        <span className="w-9 text-right text-[11px] text-slate-300 tabular-nums">
          {Math.round(effectiveVolume * 100)}%
        </span>
      </div>

      {/* Playlist Items */}
      <div className="space-y-1">
        {FESTIVE_PLAYLIST.map((track, idx) => {
          const isCurrent = idx === currentTrackIndex;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelectTrack(idx)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                isCurrent
                  ? 'border border-[#d4af37]/45 bg-[#112442] text-[#fff1c1]'
                  : 'border border-transparent bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{track.title}</div>
                <div className="truncate text-[11px] text-slate-400">{track.subtitle}</div>
              </div>
              <span className="ml-2 shrink-0 text-[11px] text-[#d4af37]">
                {isCurrent ? (isPlaying ? '播放中' : '已选中') : `${track.bpm} BPM`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
