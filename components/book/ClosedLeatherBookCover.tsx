'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  GoldenQuillEmblem,
  LeatherMountainMoonArtwork,
  VintageTitleFlourish,
} from '../common/JournalArtwork';
import { BrassCornerOrnament } from '../ui/VerseVaultUI';
import { toBanglaDigits } from '../../lib/entry-utils';

interface ClosedLeatherBookCoverProps {
  onOpenBook: () => void;
  totalEntries: number;
  poemsCount: number;
  collectionsCount: number;
  favoritesCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function ClosedLeatherBookCover({
  onOpenBook,
  totalEntries,
  poemsCount,
  collectionsCount,
  favoritesCount,
  soundEnabled,
  onToggleSound,
}: ClosedLeatherBookCoverProps) {
  const spinePositions = ['12%', '30%', '48%', '66%', '84%'];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-hidden">
      {/* Top ambient desk toolbar */}
      <div className="w-full max-w-[540px] flex items-center justify-between mb-4 px-1 text-[#DFC6A6]/85 text-xs font-bangla">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D8A868]" />
          <span>চামড়ায় বাঁধানো ব্যক্তিগত পাণ্ডুলিপি (Hand-Bound Leather Edition)</span>
        </span>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute book sounds' : 'Enable book sounds'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#2B1B10]/90 hover:bg-[#3A2516] border border-[#6E4E35] text-[#E9D3B6] text-[11px] cursor-pointer transition-colors"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#DFB274]" />
              <span>ধ্বনি চালু (Sound On)</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
              <span>নীরব (Muted)</span>
            </>
          )}
        </button>
      </div>

      {/* 3D Closed Leather Tome Container */}
      <motion.div
        initial={{ opacity: 0, rotateY: -18, scale: 0.94 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 2000 }}
        className="relative w-full max-w-[520px]"
      >
        {/* Stacked Gilt Parchment Page Block Edges on Right & Bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3 -right-3.5 bottom-2 w-5 rounded-r-[8px] bg-[repeating-linear-gradient(90deg,#E8D7BE_0px,#E8D7BE_1.5px,#B99D78_1.5px,#B99D78_3px)] border-y border-r border-[#8A6B48] shadow-[14px_24px_45px_rgba(0,0,0,0.75)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 left-5 right-0 h-4 rounded-b-[8px] bg-[repeating-linear-gradient(0deg,#DFCBB0_0px,#DFCBB0_1.5px,#AD906B_1.5px,#AD906B_3px)] border-x border-b border-[#8A6B48]"
        />

        {/* Crimson Silk Ribbon Tail Peeking Out From Bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-6 w-5 h-9 bg-gradient-to-b from-[#7E241C] to-[#56140E] shadow-lg"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)' }}
        />

        {/* Front Hand-Tooled Walnut Leather Cover Board */}
        <div
          onClick={onOpenBook}
          role="button"
          tabIndex={0}
          aria-label="ডায়েরি খুলুন (Open VerseVault Leather Journal)"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenBook();
            }
          }}
          className="group relative rounded-l-[10px] rounded-r-[16px] bg-gradient-to-br from-[#3B2618] via-[#27180E] to-[#1A0F08] border-2 border-[#6B4B32] p-6 sm:p-9 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,224,182,0.22),inset_0_0_50px_rgba(12,6,2,0.8)] cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
        >
          {/* Left Molded Book Spine Hinge & 5 Raised Cord Hubs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-9 rounded-l-[8px] bg-gradient-to-r from-[#170D07] via-[#3A2416] to-[#1B1009] border-r-2 border-[#120A05] shadow-[inset_-3px_0_8px_rgba(0,0,0,0.7)]"
          >
            {spinePositions.map((top, i) => (
              <div
                key={i}
                style={{ top }}
                className="absolute left-0 right-0 h-3.5 bg-gradient-to-r from-[#23140B] via-[#5E3E28] to-[#23140B] border-y border-[#A67C52]/55 shadow-[0_3px_5px_rgba(0,0,0,0.65)]"
              />
            ))}
          </div>

          {/* 4 Antique Brass Corner Protectors */}
          <BrassCornerOrnament position="tl" className="left-11 top-2.5 w-8 h-8" />
          <BrassCornerOrnament position="tr" className="right-2.5 top-2.5 w-8 h-8" />
          <BrassCornerOrnament position="bl" className="left-11 bottom-2.5 w-8 h-8" />
          <BrassCornerOrnament position="br" className="right-2.5 bottom-2.5 w-8 h-8" />

          {/* Interactive Antique Brass Lock Clasp on Right Edge */}
          <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 z-20">
            <div className="px-3 py-3.5 rounded-l-[8px] rounded-r-[5px] bg-gradient-to-b from-[#DFB77C] via-[#B48547] to-[#7D5624] border-2 border-[#F5D9A6] shadow-[-4px_6px_16px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.65)] flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
              <span className="w-2 h-2 rounded-full bg-[#3A2412] shadow-inner" />
              <BookOpen className="w-4 h-4 text-[#2B190B]" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#2B190B] font-bangla">
                খুলুন
              </span>
              <span className="w-2 h-2 rounded-full bg-[#3A2412] shadow-inner" />
            </div>
          </div>

          {/* Inner Gold-Foil Tooled Frame */}
          <div className="ml-6 rounded-[10px] border border-[#9E774F]/55 p-1.5 shadow-[inset_0_0_24px_rgba(0,0,0,0.65)]">
            <div className="rounded-[8px] border border-dashed border-[#C89D66]/40 px-5 py-7 sm:px-8 sm:py-9 flex flex-col items-center text-center space-y-5">
              {/* Top Embossed Medallion */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#2A190E] to-[#180E07] border-2 border-[#B38856]/70 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85),0_2px_10px_rgba(216,168,104,0.15)] flex items-center justify-center">
                  <GoldenQuillEmblem className="w-11 h-11" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C89D66]/85">
                  ✦ Ex Libris · Personal Literary Archive ✦
                </span>
              </div>

              {/* Embossed Gold Foil Title Plate */}
              <div className="space-y-1.5">
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FAE5C3] via-[#DFB578] to-[#A8793E] drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)]">
                  VerseVault
                </h1>
                <p className="text-sm sm:text-base font-bangla text-[#DFC4A2] tracking-wide">
                  আমার একান্ত ডায়েরি ও সাহিত্য সংকলন
                </p>
                <div className="pt-1 flex justify-center">
                  <VintageTitleFlourish className="w-36 h-3.5 text-[#C89D66]/75" />
                </div>
              </div>

              {/* Center Hand-Tooled Mountain & Crescent Moon Artwork */}
              <div className="w-full max-w-[270px] rounded-[8px] overflow-hidden border border-[#6E4F35]/60 bg-[#1B1009]/70 p-2 shadow-inner opacity-95">
                <LeatherMountainMoonArtwork />
              </div>

              {/* Brass Archival Counter Plaque */}
              <div className="w-full grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'মোট লেখা', value: toBanglaDigits(totalEntries) },
                  { label: 'কবিতা', value: toBanglaDigits(poemsCount) },
                  { label: 'সংকলন', value: toBanglaDigits(collectionsCount) },
                  { label: 'প্রিয় পাতা', value: toBanglaDigits(favoritesCount) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[5px] bg-[#21140B]/90 border border-[#6E4F35]/70 py-2 px-1.5 shadow-inner"
                  >
                    <div className="text-sm sm:text-base font-bold font-bangla text-[#ECC790]">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-bangla text-[#B89B7A]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Call to Open */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBook();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-gradient-to-b from-[#C89B5E] via-[#A6783B] to-[#835B26] text-[#221307] font-bangla font-bold text-xs sm:text-sm border border-[#F1D29D] shadow-[0_4px_14px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] group-hover:brightness-105 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ডায়েরির পাতা খুলুন (Unlatch &amp; Open Book)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
