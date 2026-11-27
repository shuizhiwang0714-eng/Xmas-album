import { X } from 'lucide-react';
import { useState } from 'react';
import { GiftRecipient } from '../../types';

interface GiftCardModalProps {
  recipient: GiftRecipient | null;
  onClose: () => void;
}

const GIFT_CONTENT: Record<GiftRecipient, { toLabel: string; giftTitle: string; subtitle: string; monogram: string }> = {
  dad: {
    toLabel: 'FOR DAD',
    giftTitle: '始祖鸟外套 + 帽子',
    subtitle: 'Wishing you warmth & mountain trails ahead',
    monogram: 'D',
  },
  mom: {
    toLabel: 'FOR MOM',
    giftTitle: '始祖鸟帽子 + 润唇膏',
    subtitle: 'Wishing you soft winter light & joy',
    monogram: 'M',
  },
};

export function GiftCardModal({ recipient, onClose }: GiftCardModalProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  if (!recipient) return null;
  const info = GIFT_CONTENT[recipient];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -ny * 10, ry: nx * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/82 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] select-none"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: '1100px' }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="收起礼物卡"
          className="absolute -top-11 right-0 inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-[#081226] px-3.5 py-1.5 text-xs font-medium text-[#f5e3a8] transition-colors hover:border-[#f5e3a8] hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>收起礼物卡</span>
        </button>

        {/* Folded Luxury Matte Forest-Green Card Sleeve (inspired by Attachment 4) */}
        <div
          className="relative overflow-hidden rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.75)] transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(-2deg)`,
          }}
        >
          {/* Upper Flap with Gold-Foil Stag Motif */}
          <div className="relative flex h-44 flex-col items-center justify-center bg-[#1c3938] matte-card-grain border-b border-black/30">
            <svg
              viewBox="0 0 100 100"
              className="h-16 w-16 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="stagGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b88b2e" />
                  <stop offset="35%" stopColor="#f8e39d" />
                  <stop offset="65%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#9c7322" />
                </linearGradient>
              </defs>
              {/* Graceful standing stag silhouette matching Attachment 4 */}
              <path
                fill="url(#stagGoldFoil)"
                d="M36 22c-1-3-4-5-6-7 2 0 4 1 6 3 0-3-1-6-3-8 2 1 4 3 5 6 1-2 3-4 5-5-1 3-2 5-3 7 2-1 4-2 6-1-2 1-4 3-5 4 2 2 3 4 4 7 4 3 12 4 18 5 4 1 7 3 8 7 1 5 0 11-1 16l2 14h-4l-2-13c-1-3-3-5-5-6l-1 19h-4l1-21c-4 1-9 1-14 0l-3 21h-4l2-18c-1-3-2-6-2-9-1 5-3 11-4 17h-4l3-19c0-5 2-10 4-14-2-2-4-4-7-5 2-2 5-2 7-2 1-2 2-4 3-6l-5-4c2 0 4 0 6 1z"
              />
            </svg>
          </div>

          {/* Lower Pocket Flap holding Die-Cut Inner Hot-Foil Card */}
          <div className="relative bg-[#264b49] px-7 py-8 matte-card-grain shadow-[inset_0_8px_18px_rgba(0,0,0,0.28)]">
            {/* Inner Removable-Style Card with Side Thumb Notches */}
            <div className="relative mx-auto rounded-lg bg-[#193534] px-6 py-8 text-center shadow-[0_10px_28px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(245,224,150,0.16)] border border-[#d4af37]/20">
              {/* Left & Right Curved Pocket Cutouts */}
              <span
                aria-hidden="true"
                className="absolute -left-3 top-1/2 h-9 w-5 -translate-y-1/2 rounded-r-full bg-[#264b49] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.25)]"
              />
              <span
                aria-hidden="true"
                className="absolute -right-3 top-1/2 h-9 w-5 -translate-y-1/2 rounded-l-full bg-[#264b49] shadow-[inset_2px_0_4px_rgba(0,0,0,0.25)]"
              />

              {/* Recipient Label */}
              <p className="font-display text-xs tracking-[0.34em] font-semibold gold-foil-text uppercase">
                {info.toLabel}
              </p>

              {/* Main Hot-Foil Gift Text */}
              <h2 className="font-display mt-3.5 text-2xl sm:text-[26px] font-bold tracking-[0.06em] gold-foil-text leading-snug">
                {info.giftTitle}
              </h2>

              <p className="font-display mt-2.5 text-xs italic tracking-wider text-[#d4af37]/75">
                {info.subtitle}
              </p>

              {/* Hot-Foil Monogram Crest */}
              <div className="mt-6 flex items-center justify-center gap-2.5">
                <span className="h-1 w-1 rounded-full bg-[#e6c567]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#d4af37]/60 font-display text-sm font-bold gold-foil-text">
                  {info.monogram}
                </div>
                <span className="h-1 w-1 rounded-full bg-[#e6c567]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
