'use client';

import React from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { BrassCornerOrnament, LeatherClaspButton } from '../ui/VerseVaultUI';

export function OwnerLoginView() {
  const { isAdmin, authError, authReady, signInOwner } = useJournal();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-4 py-12">
      <div className="relative max-w-md w-full bg-gradient-to-b from-[#FAF3E6] to-[#EFE1CA] dark:from-[#262019] dark:to-[#1E1913] border-2 border-[#7E5B3D] rounded-[14px] p-8 sm:p-10 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        <BrassCornerOrnament position="tl" size="sm" />
        <BrassCornerOrnament position="tr" size="sm" />
        <BrassCornerOrnament position="bl" size="sm" />
        <BrassCornerOrnament position="br" size="sm" />

        <div className="space-y-2 text-center">
          <div className="w-11 h-11 rounded-full bg-[#3A2518] text-[#DFB578] border border-[#8E6544] flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">
            Private Archive · Owner Access Only
          </p>
          <h1 className="text-2xl sm:text-3xl font-literary font-semibold text-[var(--ink)]">
            VerseVault
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-bangla">
            এই ডায়েরি সম্পূর্ণ ব্যক্তিগত। কোনো লেখা পড়তে বা লিখতে হলে আর্কাইভের মালিকের Google অ্যাকাউন্টে সাইন-ইন করতে হবে।
          </p>
        </div>

        <div className="p-4 bg-[#E8D7BE]/60 dark:bg-[#2F271E] border border-[#C2A987] dark:border-[#493E31] rounded-[8px] text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
          <p className="font-semibold text-[var(--ink)]">শুধুমাত্র আর্কাইভের মালিক প্রবেশ করতে পারবেন</p>
          <p className="font-bangla">
            লগইন ছাড়া কোনো পাতা লোড হয় না — Firestore rules অনুযায়ী anonymous read সম্পূর্ণ বন্ধ, তাই UI লুকিয়ে রাখাই একমাত্র সুরক্ষা নয়।
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-[6px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] font-bangla">
            {authError}
          </div>
        )}

        <LeatherClaspButton
          onClick={() => void signInOwner()}
          variant="walnut"
          size="md"
          className="w-full"
          disabled={!authReady}
        >
          <LogIn className="w-4 h-4 text-[#DFB578]" />
          <span>{isAdmin ? 'Signed in' : 'Google দিয়ে সাইন-ইন'}</span>
        </LeatherClaspButton>

        <p className="text-[11px] text-[var(--ink-soft)] text-center font-bangla">
          পাসওয়ার্ড ভুলে গেলে Google অ্যাকাউন্টের রিকভারি প্রক্রিয়া ব্যবহার করুন — VerseVault কোনো পাসওয়ার্ড সংরক্ষণ করে না।
        </p>
      </div>
    </div>
  );
}
