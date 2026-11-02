'use client';

import React, { useSyncExternalStore } from 'react';
import { JournalProvider, useJournal } from '../context/JournalContext';
import { OpenLeatherJournalSpread } from './book/OpenLeatherJournalSpread';
import { OwnerLoginView } from './views/OwnerLoginView';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function JournalWorkspaceRouter() {
  const { activeSection, isVaultLocked } = useJournal();

  if (isVaultLocked || activeSection === 'login') {
    return <OwnerLoginView />;
  }

  return (
    <div className="min-h-screen relative z-10 bg-[var(--paper)] text-[var(--ink)] transition-colors duration-300 selection:bg-[#C8A882]/35 flex flex-col justify-center">
      <main className="w-full max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
        <OpenLeatherJournalSpread />
      </main>
    </div>
  );
}

export function VerseVaultApp() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#1F140D] flex items-center justify-center p-4">
        <div className="rounded-[18px] bg-[#2E1E14] border-2 border-[#593C28] p-8 max-w-sm w-full text-center space-y-3 shadow-2xl">
          <div className="w-11 h-11 rounded-full bg-[#3D281A] border border-[#8B6343] mx-auto flex items-center justify-center animate-pulse">
            <span className="text-[#DFB578] font-literary text-xl font-bold">V</span>
          </div>
          <h2 className="text-lg font-literary font-semibold text-[#F5E9D7]">VerseVault</h2>
          <p className="text-xs text-[#B89F82] font-bangla">ডায়েরির পাতা খোলা হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return (
    <JournalProvider>
      <JournalWorkspaceRouter />
    </JournalProvider>
  );
}


