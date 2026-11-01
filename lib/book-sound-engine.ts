'use client';

import { useCallback, useEffect, useState } from 'react';

const SOUND_STORAGE_KEY = 'versevault_sound_enabled_v1';

export type SoundEffectType =
  | 'page-turn-next'
  | 'page-turn-prev'
  | 'book-open'
  | 'book-close'
  | 'pen-scratch'
  | 'ink-stamp'
  | 'ribbon-slide'
  | 'brass-click';

class BookSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastPenScratchAt: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      } catch {
        this.enabled = true;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    // Pink-ish warm paper noise
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
    }
    return buffer;
  }

  /**
   * Realistic crisp cotton-rag parchment page turn rustle & air sweep
   */
  public playPageTurnSound(direction: 'next' | 'prev' = 'next'): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.34;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer(ctx, duration);

      // Sweeping bandpass filter simulating paper bending and settling
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(1.8, now);
      if (direction === 'next') {
        bandpass.frequency.setValueAtTime(680, now);
        bandpass.frequency.exponentialRampToValueAtTime(1850, now + 0.14);
        bandpass.frequency.exponentialRampToValueAtTime(520, now + duration);
      } else {
        bandpass.frequency.setValueAtTime(820, now);
        bandpass.frequency.exponentialRampToValueAtTime(1600, now + 0.13);
        bandpass.frequency.exponentialRampToValueAtTime(610, now + duration);
      }

      // High-shelf crisp edge snap
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(320, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      noiseSource.connect(highpass);
      highpass.connect(bandpass);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        const startPan = direction === 'next' ? 0.35 : -0.35;
        const endPan = direction === 'next' ? -0.3 : 0.3;
        panner.pan.setValueAtTime(startPan, now);
        panner.pan.linearRampToValueAtTime(endPan, now + duration);
        bandpass.connect(panner);
        panner.connect(gain);
      } else {
        bandpass.connect(gain);
      }

      gain.connect(ctx.destination);
      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch {
      // Ignore Web Audio errors when autoplay blocked
    }
  }

  /**
   * Deep leather binding creak + warm wooden desk tome settling
   */
  public playBookOpenSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Soft low leather thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.24);

      oscGain.gain.setValueAtTime(0.18, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);

      // Accompanying multi-page fan rustle
      setTimeout(() => {
        this.playPageTurnSound('next');
      }, 75);
    } catch {
      // Ignore
    }
  }

  /**
   * Heavy leather cover closing with brass clasp click
   */
  public playBookCloseSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Warm tome thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(98, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.28);

      oscGain.gain.setValueAtTime(0.24, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Brass lock clasp click
      setTimeout(() => {
        this.playBrassClickSound();
      }, 140);
    } catch {
      // Ignore
    }
  }

  /**
   * Subtle fountain-pen nib friction on cotton paper when typing
   */
  public playPenScratchSound(): void {
    if (!this.enabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastPenScratchAt < 55) return;
    this.lastPenScratchAt = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.045;
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 650, now);
      filter.Q.setValueAtTime(3.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  /**
   * Wax seal / archival stamp impression sound
   */
  public playInkStampSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.12);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  /**
   * Delicate antique brass clasp / mechanical switch click
   */
  public playBrassClickSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.032);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore
    }
  }

  /**
   * Silk ribbon bookmark swish
   */
  public playRibbonSlideSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.16;
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + duration);
      filter.Q.setValueAtTime(2.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }
}

export const bookSound = new BookSoundSynthesizer();

export function useBookSound() {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => bookSound.isEnabled());

  const toggleSound = useCallback(() => {
    const next = !bookSound.isEnabled();
    bookSound.setEnabled(next);
    setSoundEnabledState(next);
    if (next) {
      bookSound.playBrassClickSound();
    }
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playPageTurn: (dir: 'next' | 'prev' = 'next') => bookSound.playPageTurnSound(dir),
    playBookOpen: () => bookSound.playBookOpenSound(),
    playBookClose: () => bookSound.playBookCloseSound(),
    playPenScratch: () => bookSound.playPenScratchSound(),
    playInkStamp: () => bookSound.playInkStampSound(),
    playBrassClick: () => bookSound.playBrassClickSound(),
    playRibbonSlide: () => bookSound.playRibbonSlideSound(),
  };
}
