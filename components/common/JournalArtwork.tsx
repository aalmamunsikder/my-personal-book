'use client';

import React from 'react';

/**
 * Ornamental vintage calligraphy divider placed beneath entry/poem titles ("── ❖ ──").
 */
export function VintageTitleFlourish({ className = '' }: { className?: string }) {
  return (
    <div
      style={{ color: 'var(--vv-accent)' }}
      className={`flex items-center gap-2 opacity-80 my-2 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 18"
        fill="none"
        className="w-40 sm:w-48 h-4"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="2" y1="9" x2="82" y2="9" stroke="currentColor" strokeWidth="1" strokeOpacity="0.65" />
        <circle cx="88" cy="9" r="1.6" fill="currentColor" />
        <path
          d="M110 3C105 3 102 6.5 96 9C102 11.5 105 15 110 15C115 15 118 11.5 124 9C118 6.5 115 3 110 3Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M104 9C106.5 6.2 108.2 6.2 110 9C111.8 11.8 113.5 11.8 116 9"
          stroke="currentColor"
          strokeWidth="1.1"
          fill="none"
        />
        <circle cx="132" cy="9" r="1.6" fill="currentColor" />
        <line x1="138" y1="9" x2="218" y2="9" stroke="currentColor" strokeWidth="1" strokeOpacity="0.65" />
      </svg>
    </div>
  );
}

/**
 * Golden feather quill emblem from the leather cover.
 */
export function GoldenQuillEmblem({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#27180F] border border-[#8B6343]/50 shadow-inner shrink-0 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <img
        src="/assets/illustrations/golden-quill.png"
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/**
 * Gold-embossed mountain and crescent moon leather cover illustration at the bottom of the left leather flap.
 */
export function LeatherMountainMoonArtwork() {
  return (
    <div
      className="w-full pt-3 select-none pointer-events-none overflow-hidden rounded-xl"
      aria-hidden="true"
    >
      <img
        src="/assets/illustrations/leather-mountain-moon.png"
        alt=""
        className="w-full h-auto object-cover rounded-lg opacity-95 mix-blend-lighten"
      />
    </div>
  );
}

/**
 * Fountain pen nib + dried white baby's breath blossoms on the bottom-right corner of the open reading page.
 */
export function FountainPenBlossomsCorner() {
  return (
    <div
      className="pointer-events-none select-none absolute bottom-0 right-1 w-24 sm:w-28 h-44 sm:h-48 opacity-95 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <img
        src="/assets/illustrations/fountain-pen-nib.png"
        alt=""
        className="w-full h-full object-contain object-right-bottom drop-shadow-sm dark:opacity-75"
      />
    </div>
  );
}

/**
 * Top-right plum-blossom branch & full moon watercolor artwork for the Poetry Scroll page variation.
 */
export function PlumBlossomMoonCorner() {
  return (
    <div
      className="pointer-events-none select-none absolute top-9 right-0 w-28 sm:w-36 h-24 sm:h-32 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <img
        src="/assets/illustrations/plum-blossom-moon.png"
        alt=""
        className="w-full h-full object-contain object-right-top mix-blend-multiply dark:mix-blend-screen dark:opacity-45"
      />
    </div>
  );
}

/**
 * Misty sunrise watercolor banner for the Greeting & Category Hub ("শুভ সন্ধ্যা 🌿").
 */
export function MistySunriseHeaderArtwork({ tintCss }: { tintCss?: string }) {
  return (
    <div
      style={{ background: 'var(--vv-card-bg)' }}
      className="w-full h-36 sm:h-40 relative overflow-hidden select-none pointer-events-none transition-all duration-500"
      aria-hidden="true"
    >
      <img
        src="/assets/illustrations/sunrise-mist-art.png"
        alt=""
        className="absolute right-0 top-0 h-full w-3/4 object-cover object-right opacity-90 mix-blend-multiply dark:mix-blend-luminosity dark:opacity-55"
      />
      {/* Smooth gradient blend on the left for Bangla greeting typography */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background:
            tintCss ||
            'var(--vv-header-tint, linear-gradient(90deg, #EFE1CA 0%, #EFE1CA 34%, rgba(239,225,202,0.75) 56%, rgba(239,225,202,0) 85%))',
        }}
      />
    </div>
  );
}

/**
 * Hand-painted watercolor collection header illustrations matching the 6 collection cards.
 */
export function CollectionCardIllustration({
  accent,
  index = 0,
}: {
  accent: string;
  index?: number;
}) {
  const variant = accent || ['walnut', 'slate', 'ochre', 'terracotta', 'olive', 'autumn'][index % 6];

  const srcMap: Record<string, string> = {
    walnut: '/assets/illustrations/col-dampotyo.png',
    slate: '/assets/illustrations/col-poribar.png',
    ochre: '/assets/illustrations/col-jibondorshon.png',
    terracotta: '/assets/illustrations/col-obhiman.png',
    olive: '/assets/illustrations/col-nirobota.png',
    autumn: '/assets/illustrations/col-kherokhata.png',
  };

  const imgSrc = srcMap[variant] || srcMap.walnut;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#E5D3B8]">
      <img
        src={imgSrc}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}

/**
 * Misty river and wooden boat watercolor footer artwork for the Poetry Scroll page variation.
 */
export function PoemRiverBoatFooterArtwork() {
  return (
    <div
      className="w-full pt-2 select-none pointer-events-none relative overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="w-full h-6 absolute top-0 inset-x-0 z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(246,236,220,0.95) 0%, rgba(246,236,220,0) 100%)',
        }}
      />
      <img
        src="/assets/illustrations/river-boat-footer.png"
        alt=""
        className="w-full h-24 sm:h-28 object-cover object-bottom mix-blend-multiply dark:mix-blend-luminosity dark:opacity-55"
      />
    </div>
  );
}

/**
 * Botanical leaf sprig ornament for the quote footer.
 */
export function BotanicalSprigOrnament({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <img
      src="/assets/illustrations/botanical-sprig.png"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none object-contain mix-blend-multiply dark:mix-blend-screen dark:opacity-60 ${className}`}
    />
  );
}

/**
 * Vintage postal cancel mark & wax-seal emblem for the Epistolary Letterhead page variation.
 */
export function EpistolaryWaxSealStamp() {
  return (
    <div
      className="pointer-events-none select-none flex items-center gap-2 opacity-85"
      aria-hidden="true"
    >
      {/* Wavy postal cancellation lines */}
      <svg viewBox="0 0 90 36" className="w-20 h-8 text-[#7C5A43]">
        <path
          d="M2 8 Q14 3 26 8 T50 8 T74 8 M2 16 Q14 11 26 16 T50 16 T74 16 M2 24 Q14 19 26 24 T50 24 T74 24"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeOpacity="0.6"
        />
        <circle
          cx="72"
          cy="18"
          r="14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          fill="none"
        />
        <text x="61" y="21" fontSize="6.5" fill="currentColor" fontFamily="serif">
          PRIVATE
        </text>
      </svg>

      {/* Wax seal */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8F392E] to-[#5E2018] border-2 border-[#B35346] shadow-md flex items-center justify-center text-[#F5D6B8] font-literary text-xs font-bold">
        VV
      </div>
    </div>
  );
}
