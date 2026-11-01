'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { bookSound } from '../../lib/book-sound-engine';

export interface ArchivalOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface ArchivalSelectProps<T extends string = string> {
  value: T;
  onChange: (next: T) => void;
  options: ArchivalOption<T>[];
  ariaLabel: string;
  prefixLabel?: string;
  variant?: 'parchment' | 'brass' | 'minimal';
  size?: 'sm' | 'md';
  compact?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Custom-designed VerseVault Archival Parchment & Brass Dropdown
 * Replaces all native browser <select> elements with a bespoke bookbinder index plate & popover folio.
 */
export function ArchivalSelect<T extends string = string>({
  value,
  onChange,
  options,
  ariaLabel,
  prefixLabel,
  variant = 'parchment',
  size = 'md',
  compact = false,
  align = 'left',
  className = '',
}: ArchivalSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const variantClasses =
    variant === 'brass'
      ? 'bg-gradient-to-b from-[#4B3321] to-[#362315] text-[#F5E8D3] border-[#8C6747] shadow-[inset_0_1px_0_rgba(255,235,205,0.22),0_2px_5px_rgba(25,14,7,0.25)]'
      : variant === 'minimal'
      ? 'bg-[#EFE2CC]/75 dark:bg-[#2A231C]/85 text-[var(--ink)] border-[#C9B190] dark:border-[#463C30] hover:bg-[#E6D4B7] shadow-[inset_0_1px_0_rgba(255,252,245,0.65)]'
      : 'bg-gradient-to-b from-[#FAF3E6] to-[#EDE0C9] dark:from-[#2E2720] dark:to-[#241E18] text-[var(--ink)] border-[#C4AC89] dark:border-[#4A3F33] hover:border-[#9E7B56] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_3px_rgba(52,34,20,0.08)]';

  const effectiveSize = compact ? 'sm' : size;
  const sizeClasses =
    effectiveSize === 'sm'
      ? 'px-2.5 py-1 text-[11.5px] rounded-[5px]'
      : 'px-3 py-1.5 text-xs sm:text-[13px] rounded-[6px]';

  const isFullWidth = className.includes('w-full');

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          bookSound.playBrassClickSound();
          setOpen((prev) => !prev);
        }}
        className={`group relative inline-flex items-center justify-between gap-2 border font-bangla transition-all select-none ${
          isFullWidth ? 'w-full' : ''
        } ${variantClasses} ${sizeClasses}`}
      >
        {/* Subtle brass pin studs on corners */}
        <span
          aria-hidden="true"
          className="w-1 h-1 rounded-full bg-[#9E7B56]/60 shrink-0 hidden sm:inline-block"
        />
        <span className="truncate flex items-center gap-1.5">
          {prefixLabel && (
            <span className="opacity-70 text-[10.5px] uppercase tracking-wider font-sans">
              {prefixLabel}:
            </span>
          )}
          <span className="font-medium truncate">{selectedOption?.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 opacity-75 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#8C583A]' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            aria-label={ariaLabel}
            className={`absolute z-50 mt-1.5 min-w-[195px] max-h-64 overflow-y-auto rounded-[7px] bg-[#FAF2E4] dark:bg-[#26201A] border-2 border-[#B3946E] dark:border-[#524436] shadow-[0_14px_34px_rgba(28,16,8,0.32),inset_0_0_0_2px_rgba(255,248,236,0.55)] p-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Ornamental header rule inside dropdown */}
            <div className="px-2.5 py-1 border-b border-[#DFCBB0] dark:border-[#3A3128] flex items-center justify-between text-[9.5px] uppercase tracking-[0.16em] text-[#7D6249] dark:text-[#A9927A]">
              <span>✦ {ariaLabel}</span>
              <span>❦</span>
            </div>
            <div className="py-0.5 space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      bookSound.playBrassClickSound();
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs font-bangla flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#5A3E28] text-[#FAF2E4] font-semibold shadow-2xs'
                        : 'text-[var(--ink)] hover:bg-[#EAD8BE]/80 dark:hover:bg-[#352D24]'
                    }`}
                  >
                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          className={`block text-[10px] truncate ${
                            isSelected ? 'text-[#E3CBB0]' : 'text-[var(--ink-faint)]'
                          }`}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-[3px] ${
                            isSelected
                              ? 'bg-[#3E291A] text-[#E8CFAF]'
                              : 'bg-[#E6D4BA] dark:bg-[#342C23] text-[#664B34] dark:text-[#C5AE93]'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E5B879]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Custom Embossed Leather Clasp Button with stitched gold thread & brass rivets
 */
interface LeatherClaspButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'walnut' | 'crimson' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}

export function LeatherClaspButton({
  variant = 'walnut',
  size = 'md',
  compact = false,
  ariaLabel,
  className = '',
  onClick,
  children,
  ...props
}: LeatherClaspButtonProps) {
  const palette =
    variant === 'crimson'
      ? 'bg-gradient-to-b from-[#7C2D26] via-[#63201A] to-[#4A1612] text-[#FCEEE9] border-[#A85248] hover:from-[#8B342C] hover:to-[#571B16]'
      : variant === 'gold'
      ? 'bg-gradient-to-b from-[#C89B5E] via-[#A97B3E] to-[#8A6029] text-[#23150B] border-[#E5C18A] hover:from-[#D4A86A] hover:to-[#986B30]'
      : 'bg-gradient-to-b from-[#6C4C35] via-[#563B28] to-[#422C1D] text-[#FBF3E6] border-[#967052] hover:from-[#78553C] hover:to-[#4D3423]';

  const effectiveSize = compact ? 'sm' : size;
  const sizing =
    effectiveSize === 'sm'
      ? 'px-3 py-1 text-xs rounded-[6px]'
      : effectiveSize === 'lg'
      ? 'px-5 py-2.5 text-sm sm:text-base rounded-[8px]'
      : 'px-4 py-1.5 text-xs sm:text-sm rounded-[7px]';

  return (
    <button
      type="button"
      aria-label={ariaLabel || props['aria-label']}
      onClick={(e) => {
        bookSound.playBrassClickSound();
        onClick?.(e);
      }}
      className={`group relative inline-flex items-center justify-center gap-2 border font-bangla font-medium shadow-[0_3px_8px_rgba(32,18,9,0.28),inset_0_1px_0_rgba(255,238,212,0.28)] active:translate-y-[1px] transition-all cursor-pointer select-none ${palette} ${sizing} ${className}`}
      {...props}
    >
      {/* Inner gold stitched frame */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] rounded-[5px] border border-dashed border-[#DFB982]/35"
      />
      {/* Left & Right Antique Brass Studs */}
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#F3D5A3] to-[#9B703B] shadow-[0_1px_1px_rgba(0,0,0,0.45)] shrink-0"
      />
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#F3D5A3] to-[#9B703B] shadow-[0_1px_1px_rgba(0,0,0,0.45)] shrink-0"
      />
    </button>
  );
}

/**
 * Custom Deckled Parchment & Brass Plate Button
 */
interface ParchmentPlateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: 'xs' | 'sm' | 'md';
  compact?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}

export function ParchmentPlateButton({
  active = false,
  size = 'sm',
  compact = false,
  ariaLabel,
  className = '',
  onClick,
  children,
  ...props
}: ParchmentPlateButtonProps) {
  const effectiveSize = compact ? 'xs' : size;
  const sizing =
    effectiveSize === 'xs'
      ? 'px-2 py-0.5 text-[11px] rounded-[4px]'
      : effectiveSize === 'sm'
      ? 'px-2.5 py-1 text-xs rounded-[5px]'
      : 'px-3.5 py-1.5 text-xs sm:text-sm rounded-[6px]';

  return (
    <button
      type="button"
      aria-label={ariaLabel || props['aria-label']}
      onClick={(e) => {
        bookSound.playBrassClickSound();
        onClick?.(e);
      }}
      className={`relative inline-flex items-center justify-center gap-1.5 border font-bangla transition-all cursor-pointer select-none ${
        active
          ? 'bg-gradient-to-b from-[#5B3F2B] to-[#432D1E] text-[#FAF1E2] border-[#8C6747] shadow-[inset_0_1px_0_rgba(255,235,205,0.25),0_2px_4px_rgba(35,20,10,0.2)] font-medium'
          : 'bg-gradient-to-b from-[#FBF5E9] to-[#EBDEC7] dark:from-[#2E2720] dark:to-[#241E18] text-[#4C3625] dark:text-[#D7C3AA] border-[#C6AE8C] dark:border-[#493E32] hover:bg-[#E7D5B8] dark:hover:bg-[#3A3226] hover:border-[#A4825C] dark:hover:border-[#6B5540] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_2px_rgba(45,28,15,0.08)]'
      } ${sizing} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Ornate Antique Brass Corner Filigree Protector for the Leather Binding & Inner Frames
 */
export function BrassCornerOrnament({
  position,
  size = 'md',
  className = '',
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const rotation =
    position === 'tl'
      ? 'rotate-0 top-1.5 left-1.5'
      : position === 'tr'
      ? 'rotate-90 top-1.5 right-1.5'
      : position === 'br'
      ? 'rotate-180 bottom-1.5 right-1.5'
      : '-rotate-90 bottom-1.5 left-1.5';

  const dim =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 36"
      className={`pointer-events-none absolute ${dim} text-[#C89D66]/65 ${rotation} ${className}`}
      fill="none"
    >
      <path
        d="M2 34V6C2 3.79086 3.79086 2 6 2H34"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 26V8C6 6.89543 6.89543 6 8 6H26"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="2 2"
      />
      <circle cx="6.5" cy="6.5" r="2" fill="currentColor" />
      <path d="M11 6.5L16 11.5M6.5 11L11.5 16" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

/**
 * 3D Raised Leather Bookbinding Spine Cord Hubs (5 stitched ribs along the outer bound leather spine edge)
 */
export function SpineCordHubs() {
  const positions = ['14%', '31%', '49%', '67%', '84%'];
  return (
    <div
      aria-hidden="true"
      className="hidden lg:block pointer-events-none absolute inset-y-0 left-0 w-3 z-30"
    >
      {positions.map((top, idx) => (
        <div
          key={idx}
          style={{ top }}
          className="absolute left-0 w-3 h-3.5 rounded-r-[3px] bg-gradient-to-r from-[#1A0E07] via-[#6A472F] to-[#2B190E] border-y border-r border-[#B88B5E]/60 shadow-[2px_2px_4px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,222,179,0.3)]"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-[1px] bg-[#E2B77D]/55" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Interactive 3D Curled Parchment Corner Control (Bottom-Left / Bottom-Right Page Peel)
 */
export function CurledPageCorner({
  side,
  onClick,
  disabled = false,
  label,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  if (disabled) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group absolute bottom-0 z-30 w-11 h-11 cursor-pointer focus:outline-none ${
        side === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <div
        className={`relative w-full h-full transition-all duration-300 ease-out group-hover:scale-125 ${
          side === 'right' ? 'origin-bottom-right' : 'origin-bottom-left'
        }`}
      >
        {/* Curled triangular page underside shadow & fold */}
        {side === 'right' ? (
          <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[-3px_-3px_5px_rgba(40,24,10,0.26)]">
            <defs>
              <linearGradient id="curlGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDF8F0" />
                <stop offset="55%" stopColor="#DFCCB0" />
                <stop offset="100%" stopColor="#B89B74" />
              </linearGradient>
            </defs>
            {/* Dark book edge underneath */}
            <polygon points="48,18 48,48 18,48" fill="#3D2718" opacity="0.45" />
            {/* Folded parchment triangle */}
            <path
              d="M48,16 L16,48 L19,19 C20,17 22,16 25,16 Z"
              fill="url(#curlGradRight)"
              stroke="#C5AD8B"
              strokeWidth="0.8"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[3px_-3px_5px_rgba(40,24,10,0.26)]">
            <defs>
              <linearGradient id="curlGradLeft" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDF8F0" />
                <stop offset="55%" stopColor="#DFCCB0" />
                <stop offset="100%" stopColor="#B89B74" />
              </linearGradient>
            </defs>
            <polygon points="0,18 0,48 30,48" fill="#3D2718" opacity="0.45" />
            <path
              d="M0,16 L32,48 L29,19 C28,17 26,16 23,16 Z"
              fill="url(#curlGradLeft)"
              stroke="#C5AD8B"
              strokeWidth="0.8"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
