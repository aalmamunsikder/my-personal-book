'use client';

import React, { useState } from 'react';
import { KeyRound, Lock, LogIn, ShieldCheck, Unlock } from 'lucide-react';
import { ADMIN_EMAIL, useJournal } from '../../context/JournalContext';
import { BrassCornerOrnament, LeatherClaspButton, ParchmentPlateButton } from '../ui/VerseVaultUI';

export function OwnerLoginView() {
  const { isAdmin, authError, signInOwner, verifyAdminWithPasskey, setVaultLocked } = useJournal();
  const [emailInput, setEmailInput] = useState<string>(ADMIN_EMAIL);
  const [passkeyInput, setPasskeyInput] = useState<string>('');

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAdminWithPasskey(emailInput, passkeyInput);
  };

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
            Admin Authoring Access · Public Reader Enabled
          </p>
          <h1 className="text-2xl sm:text-3xl font-literary font-semibold text-[var(--ink)]">
            VerseVault
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-bangla">
            সব উন্মুক্ত পাতা যে কেউ পড়তে পারবেন। লেখা যোগ, সম্পাদনা বা মুছে ফেলার ক্ষমতা শুধুমাত্র অ্যাডমিনের ({ADMIN_EMAIL})।
          </p>
        </div>

        <div className="p-4 bg-[#E8D7BE]/60 dark:bg-[#2F271E] border border-[#C2A987] dark:border-[#493E31] rounded-[8px] text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
          <p className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
            Admin Account: {ADMIN_EMAIL}
          </p>
          <p className="font-bangla">
            Google লগইন অথবা অ্যাডমিন ইমেইল ও পাসকি দিয়ে লগইন করে নতুন লেখা যোগ, সম্পাদনা এবং পাতা পাসওয়ার্ড লক করতে পারবেন।
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-[6px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] font-bangla">
            {authError}
          </div>
        )}

        <div className="space-y-4">
          <LeatherClaspButton
            onClick={() => void signInOwner()}
            variant="walnut"
            size="md"
            className="w-full"
          >
            <LogIn className="w-4 h-4 text-[#DFB578]" />
            <span>Sign in with Google ({ADMIN_EMAIL})</span>
          </LeatherClaspButton>

          <form onSubmit={handlePasskeySubmit} className="space-y-2.5 pt-2 border-t border-dashed border-[#CBB393] dark:border-[#3D342A]">
            <span className="block text-[11px] font-bangla text-[var(--ink-soft)]">
              অথবা অ্যাডমিন ইমেইল ও পাসকি দিয়ে প্রবেশ করুন (Admin Passkey Login):
            </span>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={ADMIN_EMAIL}
              aria-label="Admin email"
              className="w-full px-3 py-2 text-xs bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="অ্যাডমিন পাসকি (যেমন: versevault)"
                aria-label="Admin passkey"
                className="flex-1 px-3 py-2 text-xs bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] font-bangla focus:outline-none"
              />
              <ParchmentPlateButton type="submit" size="md">
                <KeyRound className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্রবেশ</span>
              </ParchmentPlateButton>
            </div>
          </form>

          <ParchmentPlateButton
            onClick={() => setVaultLocked(false)}
            size="md"
            className="w-full"
          >
            <Unlock className="w-4 h-4 text-[var(--accent)]" />
            <span>{isAdmin ? 'ডায়েরির পাতায় ফিরে যান (Return to Journal)' : 'পাঠক হিসেবে ডায়েরি পড়ুন (Continue as Public Reader)'}</span>
          </ParchmentPlateButton>
        </div>
      </div>
    </div>
  );
}
