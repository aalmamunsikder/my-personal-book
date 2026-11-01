export type AppThemeId =
  | 'heritage-parchment'
  | 'botanical-journal'
  | 'midnight-library'
  | 'rosewood-letters'
  | 'ocean-ink'
  | 'old-library'
  | 'minimal-chalk'
  | 'desert-clay'
  | 'lavender-nocturne';

export type PaperSurfaceId =
  | 'clean-cotton'
  | 'cream-stationery'
  | 'ruled-journal'
  | 'dot-grid'
  | 'fine-parchment'
  | 'manuscript'
  | 'recycled-paper'
  | 'night-paper'
  | 'pure-white'
  | 'linen';

export type PageTemplateId =
  | 'classic-journal'
  | 'clean-letter'
  | 'poetry-manuscript'
  | 'quote-folio'
  | 'pocket-fragment'
  | 'daily-reflection'
  | 'literary-book-page'
  | 'marginalia'
  | 'distraction-free'
  | 'vintage-journal';

export type TypographyPresetId =
  | 'classic-literary'
  | 'modern-journal'
  | 'editorial-serif'
  | 'minimal-reading'
  | 'comfortable-large';

export type CoverStyleId =
  | 'heritage-leather'
  | 'botanical-press'
  | 'midnight-library'
  | 'rosewood-letters'
  | 'ocean-archive'
  | 'minimal-linen'
  | 'old-library'
  | 'custom-color';

export interface AppThemeTokens {
  appBg: string;
  surface: string;
  surfaceSecondary: string;
  primaryInk: string;
  secondaryInk: string;
  mutedInk: string;
  accent: string;
  accentSoft: string;
  border: string;
  uiDarkSurface: string;
  uiDarkText: string;
  isDark?: boolean;
}

export interface AppThemeDefinition {
  id: AppThemeId;
  name: string;
  nameBn: string;
  description: string;
  tokens: AppThemeTokens;
  defaultPaper: PaperSurfaceId;
  bestFor: string;
}

export interface PaperSurfaceDefinition {
  id: PaperSurfaceId;
  name: string;
  nameBn: string;
  description: string;
  usage: string;
  cssClass: string;
}

export interface PageTemplateDefinition {
  id: PageTemplateId;
  name: string;
  nameBn: string;
  description: string;
  bestFor: string;
  defaultForType: 'diary' | 'poem' | 'quote' | 'fragment' | 'prose';
}

export interface TypographyPresetDefinition {
  id: TypographyPresetId;
  name: string;
  nameBn: string;
  banglaFont: string;
  englishFont: string;
  banglaFontSize: number;
  englishFontSize: number;
  lineHeight: number;
  feel: string;
}

export interface CoverStyleDefinition {
  id: CoverStyleId;
  name: string;
  nameBn: string;
  description: string;
  defaultBg: string;
  defaultText: string;
  defaultBorder: string;
  motif: string;
}

export interface AppearanceColors {
  accent?: string;
  page?: string;
  ink?: string;
}

export interface AppearanceTypography {
  banglaFontSize?: number;
  englishFontSize?: number;
  lineHeight?: number;
  readingWidth?: 'narrow' | 'standard' | 'wide';
  paragraphSpacing?: number;
  alignment?: 'left' | 'center';
}

export interface AppearanceDecorations {
  botanical?: boolean;
  divider?: boolean;
  pageEdge?: boolean;
  cornerAccent?: boolean;
  dropCap?: boolean;
  dateStamp?: boolean;
}

export interface AppearanceConfig {
  schemaVersion: 1;
  appThemeId: AppThemeId;
  paperId: PaperSurfaceId;
  pageTemplateId: PageTemplateId;
  typographyPresetId: TypographyPresetId;
  coverId?: CoverStyleId;
  colors?: AppearanceColors;
  typography?: AppearanceTypography;
  decorations?: AppearanceDecorations;
  reducedMotion?: boolean;
}

export interface AppearancePreset {
  id: string;
  name: string;
  description?: string;
  config: AppearanceConfig;
  isFavorite?: boolean;
  isFactory?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionAppearanceOverride {
  coverId?: CoverStyleId;
  coverBgColor?: string;
  coverTextColor?: string;
  appThemeId?: AppThemeId;
  paperId?: PaperSurfaceId;
  pageTemplateId?: PageTemplateId;
  typographyPresetId?: TypographyPresetId;
}
