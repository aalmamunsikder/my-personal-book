/**
 * WCAG 2.2 Contrast Ratio and Luminance Utilities
 * Implements W3C WCAG 2.2 Success Criteria 1.4.3 & 1.4.11
 */

export interface ContrastResult {
  ratio: number;
  passesNormal: boolean; // >= 4.5:1
  passesLarge: boolean;  // >= 3.0:1
  rating: 'AAA' | 'AA' | 'FAIL';
  summary: string;
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
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

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

export function calculateContrastRatio(color1Hex: string, color2Hex: string): number {
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

export function validateContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const ratio = calculateContrastRatio(foregroundHex, backgroundHex);
  const passesNormal = ratio >= 4.5;
  const passesLarge = ratio >= 3.0;

  let rating: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
  if (ratio >= 7.0) {
    rating = 'AAA';
  } else if (ratio >= 4.5) {
    rating = 'AA';
  }

  let summary = '';
  if (ratio >= 7.0) {
    summary = `Excellent contrast (${ratio}:1, WCAG AAA). Crisp and effortless to read.`;
  } else if (ratio >= 4.5) {
    summary = `Good contrast (${ratio}:1, WCAG AA). Meets standard reading criteria.`;
  } else if (ratio >= 3.0) {
    summary = `Acceptable for large titles only (${ratio}:1). Body text may feel washed out.`;
  } else {
    summary = `Low contrast warning (${ratio}:1). Text may be difficult to read on this surface.`;
  }

  return {
    ratio,
    passesNormal,
    passesLarge,
    rating,
    summary,
  };
}

/**
 * Given a background color, suggest an accessible ink color (either deep charcoal or crisp ivory)
 */
export function suggestAccessibleInk(backgroundHex: string): string {
  const bg = parseHexColor(backgroundHex);
  if (!bg) return '#30261F';
  const lum = getRelativeLuminance(bg.r, bg.g, bg.b);
  // If background is bright, use deep archival ink; if dark, use warm ivory ink
  return lum > 0.4 ? '#261F1A' : '#F6EFE6';
}
