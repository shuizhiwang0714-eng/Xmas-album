import { ImagePlus, Images, X } from 'lucide-react';
import { useRef } from 'react';
import { PolaroidItem } from '../../types';

interface AlbumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  polaroids: PolaroidItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Pick<PolaroidItem, 'imageUrl' | 'caption' | 'aspectRatio'>>) => void;
}

export function AlbumDrawer({
  isOpen,
  onClose,
  polaroids,
  selectedId,
  onSelect,
  onUpdate,
}: AlbumDrawerProps) {
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const batchInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const uploadedCount = polaroids.filter((p) => p.imageUrl !== null).length;

  const readImageFile = (file: File, targetId: string) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalRatio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        onUpdate(targetId, { imageUrl: dataUrl, aspectRatio: naturalRatio });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageFile(file, id);
    e.target.value = '';
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, polaroids.length);
    if (files.length === 0) return;

    // Prefer filling empty slots first, then overwrite from the start if more files remain
    const emptyIds = polaroids.filter((p) => !p.imageUrl).map((p) => p.id);
    const filledIds = polaroids.filter((p) => p.imageUrl).map((p) => p.id);
    const targetOrder = [...emptyIds, ...filledIds];

    files.forEach((file, idx) => {
      const targetId = targetOrder[idx];
      if (targetId) {
        readImageFile(file, targetId);
      }
    });

    e.target.value = '';
  };

  return (
    <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 w-[min(820px,94vw)] rounded-xl border border-[#d4af37]/28 bg-[#070f22]/95 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.72)]">
      <input
        ref={batchInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleBatchUpload}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold tracking-wide text-[#f7e5b2]">
              圣诞树拍立得相册
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-[#e8cb7a] tabular-nums">
              已上传 {uploadedCount} / {polaroids.length} 张
            </span>
          </div>
          <p className="text-xs text-slate-400">
            保留照片原始比例，支持单张替换或批量选择最多 {polaroids.length} 张照片
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => batchInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-[#081020] transition-colors hover:bg-[#e8c65a] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Images className="w-3.5 h-3.5" />
            <span>批量上传照片</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭相册"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="thin-scrollbar grid max-h-[44vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-6">
        {polaroids.map((item, idx) => {
          const active = selectedId === item.id;
          return (
            <div
              key={item.id}
              className={`flex flex-col rounded-lg border p-2 transition-colors ${
                active
                  ? 'border-[#d4af37] bg-[#10203d]'
                  : 'border-white/10 bg-[#0b152c] hover:border-white/25'
              }`}
            >
              <input
                ref={(el) => {
                  fileInputsRef.current[item.id] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(item.id, e)}
              />

              <button
                type="button"
                onClick={() => onSelect(active ? null : item.id)}
                className="group relative mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded bg-[#050c1d] cursor-pointer"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.caption || `拍立得 ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-[#f5dfa1]">
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-[11px]">空白 #{idx + 1}</span>
                  </div>
                )}
              </button>

              <input
                type="text"
                value={item.caption}
                maxLength={32}
                onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
                placeholder={`第 ${idx + 1} 张寄语`}
                className="mb-1.5 w-full rounded border border-white/10 bg-[#040917] px-2 py-1 text-[11px] text-[#f5efe6] placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:outline-none"
              />

              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => fileInputsRef.current[item.id]?.click()}
                  className="flex-1 rounded bg-white/8 py-1 text-[11px] font-medium text-[#f2dfaa] transition-colors hover:bg-[#d4af37] hover:text-[#081020] cursor-pointer"
                >
                  {item.imageUrl ? '换图' : '上传'}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(active ? null : item.id)}
                  className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-white/10 cursor-pointer"
                >
                  {active ? '收回' : '看'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
