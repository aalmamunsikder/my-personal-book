import { AppearanceConfig, AppearancePreset } from '../types/appearance';
import {
  DEFAULT_APPEARANCE_CONFIG,
  FACTORY_PRESETS,
  FACTORY_THEMES,
  PAPER_SURFACES,
  PAGE_TEMPLATES,
  TYPOGRAPHY_PRESETS,
  COVER_STYLES,
} from './themes';

export const APPEARANCE_STORAGE_KEYS = {
  preferences: 'vv_appearance_preferences_v1',
  presets: 'vv_appearance_presets_v1',
};

/**
 * Validates and sanitizes an incoming appearance config against allowed presets and bounds
 */
export function sanitizeAppearanceConfig(raw: any): AppearanceConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_APPEARANCE_CONFIG };
  }

  const appThemeId = (raw.appThemeId in FACTORY_THEMES) ? raw.appThemeId : DEFAULT_APPEARANCE_CONFIG.appThemeId;
  const paperId = (raw.paperId in PAPER_SURFACES) ? raw.paperId : DEFAULT_APPEARANCE_CONFIG.paperId;
  const pageTemplateId = (raw.pageTemplateId in PAGE_TEMPLATES) ? raw.pageTemplateId : DEFAULT_APPEARANCE_CONFIG.pageTemplateId;
  const typographyPresetId = (raw.typographyPresetId in TYPOGRAPHY_PRESETS) ? raw.typographyPresetId : DEFAULT_APPEARANCE_CONFIG.typographyPresetId;
  const coverId = (raw.coverId && raw.coverId in COVER_STYLES) ? raw.coverId : DEFAULT_APPEARANCE_CONFIG.coverId;

  const colors = {
    accent: typeof raw.colors?.accent === 'string' ? raw.colors.accent : DEFAULT_APPEARANCE_CONFIG.colors?.accent,
    page: typeof raw.colors?.page === 'string' ? raw.colors.page : DEFAULT_APPEARANCE_CONFIG.colors?.page,
    ink: typeof raw.colors?.ink === 'string' ? raw.colors.ink : DEFAULT_APPEARANCE_CONFIG.colors?.ink,
  };

  const banglaFontSize = typeof raw.typography?.banglaFontSize === 'number'
    ? Math.max(14, Math.min(36, raw.typography.banglaFontSize))
    : DEFAULT_APPEARANCE_CONFIG.typography?.banglaFontSize;

  const englishFontSize = typeof raw.typography?.englishFontSize === 'number'
    ? Math.max(13, Math.min(34, raw.typography.englishFontSize))
    : DEFAULT_APPEARANCE_CONFIG.typography?.englishFontSize;

  const lineHeight = typeof raw.typography?.lineHeight === 'number'
    ? Math.max(1.3, Math.min(2.5, raw.typography.lineHeight))
    : DEFAULT_APPEARANCE_CONFIG.typography?.lineHeight;

  const readingWidth = ['narrow', 'standard', 'wide'].includes(raw.typography?.readingWidth)
    ? raw.typography.readingWidth
    : DEFAULT_APPEARANCE_CONFIG.typography?.readingWidth;

  const paragraphSpacing = typeof raw.typography?.paragraphSpacing === 'number'
    ? Math.max(0.8, Math.min(2.5, raw.typography.paragraphSpacing))
    : DEFAULT_APPEARANCE_CONFIG.typography?.paragraphSpacing;

  const alignment = ['left', 'center'].includes(raw.typography?.alignment)
    ? raw.typography.alignment
    : DEFAULT_APPEARANCE_CONFIG.typography?.alignment;

  const decorations = {
    botanical: typeof raw.decorations?.botanical === 'boolean' ? raw.decorations.botanical : true,
    divider: typeof raw.decorations?.divider === 'boolean' ? raw.decorations.divider : true,
    pageEdge: typeof raw.decorations?.pageEdge === 'boolean' ? raw.decorations.pageEdge : true,
    cornerAccent: typeof raw.decorations?.cornerAccent === 'boolean' ? raw.decorations.cornerAccent : true,
    dropCap: typeof raw.decorations?.dropCap === 'boolean' ? raw.decorations.dropCap : false,
    dateStamp: typeof raw.decorations?.dateStamp === 'boolean' ? raw.decorations.dateStamp : true,
  };

  return {
    schemaVersion: 1,
    appThemeId,
    paperId,
    pageTemplateId,
    typographyPresetId,
    coverId,
    colors,
    typography: {
      banglaFontSize,
      englishFontSize,
      lineHeight,
      readingWidth,
      paragraphSpacing,
      alignment,
    },
    decorations,
    reducedMotion: Boolean(raw.reducedMotion),
  };
}

/**
 * Loads stored user appearance preferences from localStorage
 */
export function getStoredAppearanceConfig(): AppearanceConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_APPEARANCE_CONFIG };
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEYS.preferences);
    if (!raw) return { ...DEFAULT_APPEARANCE_CONFIG };
    const parsed = JSON.parse(raw);
    return sanitizeAppearanceConfig(parsed);
  } catch {
    return { ...DEFAULT_APPEARANCE_CONFIG };
  }
}

/**
 * Saves appearance preferences to localStorage
 */
export function saveStoredAppearanceConfig(config: AppearanceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = sanitizeAppearanceConfig(config);
    localStorage.setItem(APPEARANCE_STORAGE_KEYS.preferences, JSON.stringify(clean));
  } catch {
    // quota exceeded or storage disabled
  }
}

/**
 * Loads all presets (factory presets merged with user custom presets)
 */
export function getStoredAppearancePresets(): AppearancePreset[] {
  if (typeof window === 'undefined') return [...FACTORY_PRESETS];
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEYS.presets);
    const customList: AppearancePreset[] = raw ? JSON.parse(raw) : [];
    // Ensure all factory presets exist
    const map = new Map<string, AppearancePreset>();
    FACTORY_PRESETS.forEach((p) => map.set(p.id, p));
    customList.forEach((p) => {
      if (p.id && p.name && p.config) {
        map.set(p.id, {
          ...p,
          config: sanitizeAppearanceConfig(p.config),
        });
      }
    });
    return Array.from(map.values());
  } catch {
    return [...FACTORY_PRESETS];
  }
}

/**
 * Saves custom presets list to localStorage (filters out factory presets)
 */
export function saveStoredAppearancePresets(presets: AppearancePreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    const customOnly = presets.filter((p) => !p.isFactory);
    localStorage.setItem(APPEARANCE_STORAGE_KEYS.presets, JSON.stringify(customOnly));
  } catch {
    // ignore quota error
  }
}

/**
 * Resets a single layer to factory defaults without touching the other 3 layers
 */
export function resetLayer(
  current: AppearanceConfig,
  layer: 'appTheme' | 'cover' | 'pageTemplate' | 'typography' | 'decorations' | 'all'
): AppearanceConfig {
  const result: AppearanceConfig = { ...current };

  if (layer === 'appTheme' || layer === 'all') {
    result.appThemeId = DEFAULT_APPEARANCE_CONFIG.appThemeId;
    result.colors = {
      ...result.colors,
      accent: DEFAULT_APPEARANCE_CONFIG.colors?.accent,
      page: DEFAULT_APPEARANCE_CONFIG.colors?.page,
      ink: DEFAULT_APPEARANCE_CONFIG.colors?.ink,
    };
  }

  if (layer === 'cover' || layer === 'all') {
    result.coverId = DEFAULT_APPEARANCE_CONFIG.coverId;
  }

  if (layer === 'pageTemplate' || layer === 'all') {
    result.pageTemplateId = DEFAULT_APPEARANCE_CONFIG.pageTemplateId;
    result.paperId = DEFAULT_APPEARANCE_CONFIG.paperId;
  }

  if (layer === 'typography' || layer === 'all') {
    result.typographyPresetId = DEFAULT_APPEARANCE_CONFIG.typographyPresetId;
    result.typography = { ...DEFAULT_APPEARANCE_CONFIG.typography };
  }

  if (layer === 'decorations' || layer === 'all') {
    result.decorations = { ...DEFAULT_APPEARANCE_CONFIG.decorations };
  }

  return sanitizeAppearanceConfig(result);
}
