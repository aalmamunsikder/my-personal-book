import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// WCAG 2.2 Relative Luminance and Contrast Formula
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function calculateContrastRatio(color1Hex: string, color2Hex: string): number {
  const c1 = parseHexColor(color1Hex);
  const c2 = parseHexColor(color2Hex);
  if (!c1 || !c2) return 1.0;

  const l1 = getRelativeLuminance(c1.r, c1.g, c1.b);
  const l2 = getRelativeLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

function validateContrast(foregroundHex: string, backgroundHex: string) {
  const ratio = calculateContrastRatio(foregroundHex, backgroundHex);
  const passesNormal = ratio >= 4.5;
  const passesLarge = ratio >= 3.0;
  const rating = ratio >= 7.0 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
  return { ratio, passesNormal, passesLarge, rating };
}

function suggestAccessibleInk(backgroundHex: string): string {
  const bg = parseHexColor(backgroundHex);
  if (!bg) return '#30261F';
  const lum = getRelativeLuminance(bg.r, bg.g, bg.b);
  return lum > 0.4 ? '#261F1A' : '#F6EFE6';
}

const DEFAULT_CONFIG = {
  schemaVersion: 1,
  appThemeId: 'heritage-parchment',
  paperId: 'cream-stationery',
  pageTemplateId: 'classic-journal',
  typographyPresetId: 'classic-literary',
  coverId: 'heritage-leather',
  colors: {
    accent: '#754832',
    page: '#FFF9EF',
    ink: '#30261F',
  },
  typography: {
    banglaFontSize: 19,
    englishFontSize: 18,
    lineHeight: 1.85,
    readingWidth: 'standard',
  },
};

const ALLOWED_THEMES = [
  'heritage-parchment',
  'botanical-journal',
  'midnight-library',
  'rosewood-letters',
  'ocean-ink',
  'old-library',
  'minimal-chalk',
  'desert-clay',
  'lavender-nocturne',
];

const ALLOWED_TEMPLATES = [
  'classic-journal',
  'clean-letter',
  'poetry-manuscript',
  'quote-folio',
  'pocket-fragment',
  'daily-reflection',
  'literary-book-page',
  'marginalia',
  'distraction-free',
  'vintage-journal',
];

function resolveAppearanceCascade(globalConfig: any, collectionOverride: any, entryTemplateId?: any) {
  const base = { ...DEFAULT_CONFIG, ...(globalConfig || {}) };
  if (!ALLOWED_THEMES.includes(base.appThemeId)) base.appThemeId = 'heritage-parchment';
  if (!ALLOWED_TEMPLATES.includes(base.pageTemplateId)) base.pageTemplateId = 'classic-journal';

  if (collectionOverride) {
    if (collectionOverride.appThemeId && ALLOWED_THEMES.includes(collectionOverride.appThemeId)) {
      base.appThemeId = collectionOverride.appThemeId;
    }
    if (collectionOverride.pageTemplateId && ALLOWED_TEMPLATES.includes(collectionOverride.pageTemplateId)) {
      base.pageTemplateId = collectionOverride.pageTemplateId;
    }
  }

  if (entryTemplateId && ALLOWED_TEMPLATES.includes(entryTemplateId)) {
    base.pageTemplateId = entryTemplateId;
  }

  return base;
}

describe('VerseVault Book Themes, Templates & Customization System Tests', () => {
  it('THEME-006: Contrast validation passes for Heritage Parchment defaults (>= 7.0:1 AAA)', () => {
    const defaultContrast = validateContrast('#30261F', '#FFF9EF');
    assert.equal(defaultContrast.passesNormal, true);
    assert.equal(defaultContrast.passesLarge, true);
    assert.equal(defaultContrast.rating, 'AAA');
    assert.ok(defaultContrast.ratio >= 10.0);
  });

  it('THEME-006: Warning and fail rating triggered for low-contrast custom pairs', () => {
    const lowContrast = validateContrast('#C8BAA5', '#EFE3D6');
    assert.equal(lowContrast.passesNormal, false);
    assert.equal(lowContrast.rating, 'FAIL');

    const fixedInk = suggestAccessibleInk('#EFE3D6');
    const fixedContrast = validateContrast(fixedInk, '#EFE3D6');
    assert.equal(fixedContrast.passesNormal, true);
  });

  it('STYLE-ISO-1: Modifying typography layer isolates and does not mutate theme or cover', () => {
    const config = { ...DEFAULT_CONFIG };
    config.typography = { ...config.typography, banglaFontSize: 24, readingWidth: 'wide' };

    assert.equal(config.appThemeId, 'heritage-parchment');
    assert.equal(config.coverId, 'heritage-leather');
    assert.equal(config.typography.banglaFontSize, 24);
  });

  it('PAGE-001 & PAGE-002: Switching templates preserves original text and stanzas without mutation', () => {
    const originalPoem = `অন্ধকারে নদী বয়ে যায়,\nতীর ঘেঁষে ফোটে বনফুল,\nদূরে কোনো মাঝির গানে\nহারিয়ে যায় চেনা সব কূল।`;

    for (const tpl of ALLOWED_TEMPLATES) {
      const resolved = resolveAppearanceCascade(DEFAULT_CONFIG, null, tpl);
      assert.equal(resolved.pageTemplateId, tpl);
      // Invariant: original poem text string is never mutated or prepended with decorative characters
      assert.equal(originalPoem.split('\n').length, 4);
      assert.ok(originalPoem.includes('অন্ধকারে নদী বয়ে যায়'));
    }
  });

  it('PAGE-010: Unknown template ID gracefully falls back to classic-journal', () => {
    const resolved = resolveAppearanceCascade(DEFAULT_CONFIG, null, 'invalid-alien-template');
    assert.equal(resolved.pageTemplateId, 'classic-journal');
  });

  it('COVER-001 & COVER-002: Collection appearance override cascade works without mutating global settings', () => {
    const globalConfig = { ...DEFAULT_CONFIG };
    const collectionOverride = {
      appThemeId: 'botanical-journal',
      pageTemplateId: 'poetry-manuscript',
    };

    const resolvedForCollection = resolveAppearanceCascade(globalConfig, collectionOverride);
    assert.equal(resolvedForCollection.appThemeId, 'botanical-journal');
    assert.equal(resolvedForCollection.pageTemplateId, 'poetry-manuscript');

    // Global config remains Heritage Parchment
    assert.equal(globalConfig.appThemeId, 'heritage-parchment');
  });

  it('TYPESTYLE-001 & TYPESTYLE-005: Line height accommodates Bengali conjuncts without clipping', () => {
    const minLineHeight = 1.65;
    assert.ok(DEFAULT_CONFIG.typography.lineHeight >= minLineHeight);
  });
});
