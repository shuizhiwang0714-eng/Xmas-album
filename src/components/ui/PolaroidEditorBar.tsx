import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { PolaroidItem } from '../../types';

interface PolaroidEditorBarProps {
  polaroid: PolaroidItem | null;
  onUpdate: (id: string, patch: Partial<Pick<PolaroidItem, 'imageUrl' | 'caption' | 'aspectRatio'>>) => void;
  onClose: () => void;
}

export function PolaroidEditorBar({ polaroid, onUpdate, onClose }: PolaroidEditorBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!polaroid) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalRatio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        onUpdate(polaroid.id, {
          imageUrl: dataUrl,
          aspectRatio: naturalRatio,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 w-[min(600px,92vw)] rounded-xl border border-[#d4af37]/30 bg-[#070f22]/94 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.65)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-[#081020] transition-colors hover:bg-[#e8c65a] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>{polaroid.imageUrl ? '更换照片' : '上传照片'}</span>
        </button>

        {polaroid.imageUrl && (
          <button
            type="button"
            onClick={() => onUpdate(polaroid.id, { imageUrl: null })}
            title="清空照片"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <input
          type="text"
          value={polaroid.caption}
          maxLength={32}
          onChange={(e) => onUpdate(polaroid.id, { caption: e.target.value })}
          placeholder="输入拍立得底部文字说明..."
          className="min-w-[160px] flex-1 rounded-lg border border-white/15 bg-[#040917] px-3 py-1.5 text-xs text-[#f8f3e8] placeholder:text-slate-400 focus:border-[#d4af37]/70 focus:outline-none"
        />

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>放回树上</span>
        </button>
      </div>
    </div>
  );
}
