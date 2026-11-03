import type {
  DeskBackgroundId,
  EntryMood,
  EntryType,
  InkColorId,
  PageVariation,
  WritingStyleId,
} from '../types/entry';

export interface PageVariationMeta {
  id: PageVariation;
  nameBn: string;
  nameEn: string;
  shortLabel: string;
  description: string;
  previewKind:
    | 'parchment'
    | 'ruled'
    | 'poetry'
    | 'letter'
    | 'dot'
    | 'nocturnal'
    | 'botanical'
    | 'illuminated'
    | 'khadi'
    | 'ledger';
}

export const PAGE_VARIATIONS: PageVariationMeta[] = [
  {
    id: 'vintage-parchment',
    nameBn: 'প্রাচীন পার্চমেন্ট',
    nameEn: 'Vintage Parchment',
    shortLabel: 'Parchment',
    description: 'Warm aged cream paper with subtle vignette and fountain pen artwork.',
    previewKind: 'parchment',
  },
  {
    id: 'ruled-notebook',
    nameBn: 'দাগটানা ডায়েরি',
    nameEn: 'Classic Ruled Diary',
    shortLabel: 'Ruled Lines',
    description: 'Fountain-pen horizontal lines with a classic red-terracotta left margin.',
    previewKind: 'ruled',
  },
  {
    id: 'poetry-scroll',
    nameBn: 'কাব্যিক স্ক্রল',
    nameEn: 'Calligraphic Poetry Scroll',
    shortLabel: 'Poetry Scroll',
    description: 'Double gold-ink border frame with plum-blossom moon and misty river boat.',
    previewKind: 'poetry',
  },
  {
    id: 'epistolary-letter',
    nameBn: 'চিঠির পাতা',
    nameEn: 'Epistolary Letterhead',
    shortLabel: 'Letterhead',
    description: 'Vintage postal stamp, wax-seal emblem, and personal letter margins.',
    previewKind: 'letter',
  },
  {
    id: 'dot-commonplace',
    nameBn: 'ডট-গ্রিড খেরোখাতা',
    nameEn: 'Dot-Grid Commonplace',
    shortLabel: 'Dot Grid',
    description: 'Fine architectural dot matrix for quotes, book notes, and fragments.',
    previewKind: 'dot',
  },
  {
    id: 'nocturnal-vellum',
    nameBn: 'রাতের কালো পাতা',
    nameEn: 'Nocturnal Vellum',
    shortLabel: 'Night Vellum',
    description: 'Deep midnight espresso vellum with warm golden ink and starlight glow.',
    previewKind: 'nocturnal',
  },
  {
    id: 'botanical-herbarium',
    nameBn: 'বনফুল ও ভেষজ পাতা',
    nameEn: 'Botanical Herbarium',
    shortLabel: 'Botanical',
    description: 'Soft sage-cream cotton paper with pressed botanical leaf watermark and olive frame.',
    previewKind: 'botanical',
  },
  {
    id: 'royal-illuminated',
    nameBn: 'স্বর্ণাক্ষর অলংকৃত পাতা',
    nameEn: 'Illuminated Manuscript',
    shortLabel: 'Illuminated',
    description: 'Ornate gold-and-terracotta manuscript border with classic royal literary poise.',
    previewKind: 'illuminated',
  },
  {
    id: 'deckle-handmade',
    nameBn: 'হাতে-বানানো খাদি কাগজ',
    nameEn: 'Handmade Khadi Deckle',
    shortLabel: 'Khadi Paper',
    description: 'Tactile unbleached artisan khadi cotton paper with stitched spine marks.',
    previewKind: 'khadi',
  },
  {
    id: 'ledger-chronicle',
    nameBn: 'আর্কাইভ খতিয়ান পাতা',
    nameEn: 'Archival Chronicle Ledger',
    shortLabel: 'Chronicle',
    description: 'Structured archival column rules and fine grid lines for daily chronicles.',
    previewKind: 'ledger',
  },
];

export interface WritingStyleMeta {
  id: WritingStyleId;
  nameBn: string;
  nameEn: string;
  shortLabel: string;
  description: string;
  fontSizeClass: string;
  lineHeightClass: string;
  alignClass: string;
  indentClass: string;
  dropCap?: boolean;
  letterSpacingClass?: string;
}

export const WRITING_STYLE_PRESETS: WritingStyleMeta[] = [
  {
    id: 'classic-book',
    nameBn: 'মুদ্রিত সাহিত্য (Classic Book)',
    nameEn: 'Classic Book Print',
    shortLabel: 'Classic',
    description: 'Balanced literary book typography with comfortable reading rhythm.',
    fontSizeClass: 'text-base sm:text-[18px]',
    lineHeightClass: 'leading-[1.95]',
    alignClass: 'text-left',
    indentClass: '',
  },
  {
    id: 'poetic-centered',
    nameBn: 'কাব্যিক ছন্দ (Centered Verse)',
    nameEn: 'Centered Poetic Stanzas',
    shortLabel: 'Poetic Center',
    description: 'Centered stanza composition with generous breathing space between verses.',
    fontSizeClass: 'text-base sm:text-[18.5px]',
    lineHeightClass: 'leading-[2.15]',
    alignClass: 'text-center',
    indentClass: '',
  },
  {
    id: 'fountain-calligraphy',
    nameBn: 'ঝর্ণাকলমের ছাঁদ (Fountain Script)',
    nameEn: 'Fountain Pen Manuscript',
    shortLabel: 'Fountain Pen',
    description: 'Expressive manuscript cadence with an illuminated first-letter drop cap.',
    fontSizeClass: 'text-[17px] sm:text-[19.5px]',
    lineHeightClass: 'leading-[2.05]',
    alignClass: 'text-left',
    indentClass: '',
    dropCap: true,
    letterSpacingClass: 'tracking-[0.012em]',
  },
  {
    id: 'epistolary-intimate',
    nameBn: 'চিঠির ঘরানা (Epistolary)',
    nameEn: 'Intimate Letter Style',
    shortLabel: 'Letter Style',
    description: 'Warm personal letter flow with gentle paragraph breathing room.',
    fontSizeClass: 'text-base sm:text-[18px]',
    lineHeightClass: 'leading-[2.0]',
    alignClass: 'text-left',
    indentClass: 'pl-2 sm:pl-4 border-l-2 border-[#C8AF8C]/45',
  },
  {
    id: 'compact-chronicle',
    nameBn: 'ঘন দিনলিপি (Compact)',
    nameEn: 'Compact Notebook',
    shortLabel: 'Compact',
    description: 'Crisp archival notebook density so long entries fit more lines per page.',
    fontSizeClass: 'text-sm sm:text-[15.5px]',
    lineHeightClass: 'leading-[1.78]',
    alignClass: 'text-left',
    indentClass: '',
  },
  {
    id: 'grand-folio',
    nameBn: 'বড় হরফের পাঠ (Grand Folio)',
    nameEn: 'Grand Folio Large',
    shortLabel: 'Large Print',
    description: 'Spacious, high-comfort large literary type for effortless reading.',
    fontSizeClass: 'text-lg sm:text-[21px]',
    lineHeightClass: 'leading-[2.05]',
    alignClass: 'text-left',
    indentClass: '',
  },
];

export interface InkColorMeta {
  id: InkColorId;
  nameBn: string;
  nameEn: string;
  shortLabel: string;
  swatchHex: string;
  lightColorHex: string;
  darkColorHex: string;
}

export const INK_COLOR_PRESETS: InkColorMeta[] = [
  {
    id: 'sepia-walnut',
    nameBn: 'প্রাচীন সেপিয়া (Walnut Sepia)',
    nameEn: 'Antique Walnut Ink',
    shortLabel: 'Walnut',
    swatchHex: '#3B281B',
    lightColorHex: '#2B1E16',
    darkColorHex: '#F2E3CC',
  },
  {
    id: 'oxford-midnight',
    nameBn: 'অক্সফোর্ড নীলচে-কালো (Blue-Black)',
    nameEn: 'Midnight Blue-Black',
    shortLabel: 'Blue-Black',
    swatchHex: '#1D354C',
    lightColorHex: '#182B3E',
    darkColorHex: '#D8E8F8',
  },
  {
    id: 'oxblood-crimson',
    nameBn: 'অক্সব্লাড খয়েরি (Writer’s Oxblood)',
    nameEn: 'Writer’s Oxblood',
    shortLabel: 'Oxblood',
    swatchHex: '#63201D',
    lightColorHex: '#4E1815',
    darkColorHex: '#F6CDC9',
  },
  {
    id: 'forest-moss',
    nameBn: 'অরণ্য সবুজ কালি (Sherwood Green)',
    nameEn: 'Sherwood Forest Ink',
    shortLabel: 'Forest',
    swatchHex: '#22422B',
    lightColorHex: '#1B3623',
    darkColorHex: '#D0ECD6',
  },
  {
    id: 'royal-amethyst',
    nameBn: 'রাজকীয় বেগুনি (Imperial Violet)',
    nameEn: 'Imperial Amethyst',
    shortLabel: 'Amethyst',
    swatchHex: '#412652',
    lightColorHex: '#341D42',
    darkColorHex: '#E6D4F5',
  },
  {
    id: 'gilded-amber',
    nameBn: 'স্বর্ণাভ তাম্র (Gilded Copper)',
    nameEn: 'Gilded Copper Ink',
    shortLabel: 'Copper',
    swatchHex: '#7A481D',
    lightColorHex: '#593312',
    darkColorHex: '#F7D79C',
  },
];

export interface DeskBackgroundMeta {
  id: DeskBackgroundId;
  nameBn: string;
  nameEn: string;
  shortLabel: string;
  descriptionBn: string;
  conceptSubtitleBn: string;
  conceptQuoteBn: string;
  conceptBadgeBn: string;
  conceptMotifSymbol: string;
  mappedAppThemeId: string;
  swatchGradient: string;
  backgroundCss: string;
  flapBackgroundCss: string;
  flapBorderHex: string;
  flapActiveNavCss: string;
  flapActiveBorderHex: string;
  pageSpreadLightCss: string;
  pageSpreadDarkCss: string;
  patternCss: string;
  ambientGlowCss: string;
  accentHex: string;
  ribbonGradient: string;
  ribbonBorder: string;
  paperEdgeGiltHex: string;
  paperStackLayer1Light: string;
  paperStackLayer1Dark: string;
  paperStackLayer2Light: string;
  paperStackLayer2Dark: string;
  cardSurfaceLightCss: string;
  cardSurfaceDarkCss: string;
  cardBorderLightHex: string;
  cardBorderDarkHex: string;
  cardSelectedLightCss: string;
  cardSelectedDarkCss: string;
  primaryButtonCss: string;
  primaryButtonBorderHex: string;
  primaryButtonTextHex: string;
  secondaryButtonLightCss: string;
  secondaryButtonDarkCss: string;
  headerArtworkTintCss: string;
  recommendedInkId: InkColorId;
  recommendedWritingStyleId: WritingStyleId;
  isDarkScene: boolean;
}

export const DESK_BACKGROUNDS: DeskBackgroundMeta[] = [
  {
    id: 'mahogany-study',
    nameBn: 'মেহগনি ও প্রাচীন পার্চমেন্ট',
    nameEn: 'Mahogany & Antique Parchment',
    shortLabel: 'Mahogany Book',
    descriptionBn: 'মেহগনি চামড়ার বাঁধাই ও উষ্ণ প্রাচীন পার্চমেন্ট পাতার ক্লাসিক ডায়েরি।',
    conceptSubtitleBn: 'উষ্ণ মোমবাতি, প্রাচীন সেপিয়া ও মেহগনি বাঁধাই',
    conceptQuoteBn: '“কিছু কথা কখনো বলা হয় না, শুধু লিখে রাখা হয়...”',
    conceptBadgeBn: 'ক্লাসিক মেহগনি সংস্করণ · Antique Archival Tome',
    conceptMotifSymbol: '✒️',
    mappedAppThemeId: 'heritage-parchment',
    swatchGradient: 'linear-gradient(135deg, #3A2214 0%, #24140B 60%, #160B06 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 18%, #3B2314 0%, #24140B 55%, #120904 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #2A170C 0%, #1E1007 50%, #120904 100%)',
    flapBorderHex: '#6E482B',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(94,62,40,0.92) 0%, rgba(68,44,28,0.88) 100%)',
    flapActiveBorderHex: '#B8895A',
    pageSpreadLightCss: 'linear-gradient(90deg, #F4E9D8 0%, #EFE0C9 50%, #F6ECDC 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #221F1B 0%, #1C1916 50%, #24201C 100%)',
    patternCss:
      'repeating-linear-gradient(90deg, rgba(255,210,160,0.025) 0px, rgba(255,210,160,0.025) 2px, transparent 2px, transparent 14px), repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 48px)',
    ambientGlowCss:
      'radial-gradient(circle at 18% 12%, rgba(235, 178, 98, 0.16) 0%, rgba(216, 146, 68, 0.05) 42%, transparent 72%)',
    accentHex: '#8C5230',
    ribbonGradient: 'linear-gradient(180deg, #8E2219 0%, #B83227 50%, #7A1B14 100%)',
    ribbonBorder: '#DFB578',
    paperEdgeGiltHex: '#BEA380',
    paperStackLayer1Light: '#D6BFA0',
    paperStackLayer1Dark: '#3A3226',
    paperStackLayer2Light: '#E6D5BA',
    paperStackLayer2Dark: '#2E2820',
    cardSurfaceLightCss: 'linear-gradient(180deg, #FAF3E6 0%, #EDE0C9 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #2B241D 0%, #211B15 100%)',
    cardBorderLightHex: '#C5AD8B',
    cardBorderDarkHex: '#4A3F32',
    cardSelectedLightCss: 'linear-gradient(90deg, #E6D3B5 0%, #EFE0C8 50%, #E6D3B5 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #382E23 0%, #31281E 50%, #2C241B 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #6C4C35 0%, #563B28 55%, #422C1D 100%)',
    primaryButtonBorderHex: '#9E7755',
    primaryButtonTextHex: '#FDF8F0',
    secondaryButtonLightCss: 'linear-gradient(180deg, #FBF5E9 0%, #EBDEC7 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #322A21 0%, #261F18 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #EFE1CA 0%, #EFE1CA 34%, rgba(239,225,202,0.75) 56%, rgba(239,225,202,0) 85%)',
    recommendedInkId: 'sepia-walnut',
    recommendedWritingStyleId: 'classic-book',
    isDarkScene: true,
  },
  {
    id: 'rainy-veranda',
    nameBn: 'বর্ষার মেঘলা নীল পাতা',
    nameEn: 'Monsoon Slate & Mist Pages',
    shortLabel: 'Monsoon Slate',
    descriptionBn: 'বৃষ্টির বিকেলের মেঘলা নীলচে বাঁধাই ও শীতল কুয়াশা-রঙা ডায়েরির পাতা।',
    conceptSubtitleBn: 'শ্রাবণের মেঘে ভেজা একলা বারান্দা ও শীতল নীলচে কুয়াশা',
    conceptQuoteBn: '“মেঘের ডাক আর ভেজা মাটির ঘ্রাণে সব পুরানো স্মৃতিরা ফিরে আসে...”',
    conceptBadgeBn: 'শ্রাবণ-মেঘ সংস্করণ · Monsoon Veranda Folio',
    conceptMotifSymbol: '🌧️',
    mappedAppThemeId: 'ocean-ink',
    swatchGradient: 'linear-gradient(135deg, #2C363B 0%, #1E262B 60%, #141A1E 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 10%, #2D3940 0%, #1C252A 58%, #101619 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #1C272C 0%, #141C20 50%, #0D1216 100%)',
    flapBorderHex: '#3E5561',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(48,74,89,0.92) 0%, rgba(33,52,64,0.88) 100%)',
    flapActiveBorderHex: '#7BA3B8',
    pageSpreadLightCss: 'linear-gradient(90deg, #E3ECEF 0%, #D8E4E8 50%, #E7F0F2 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #1B2327 0%, #161D21 50%, #1E262B 100%)',
    patternCss:
      'repeating-linear-gradient(108deg, rgba(140,185,210,0.045) 0px, rgba(140,185,210,0.045) 1px, transparent 1px, transparent 18px)',
    ambientGlowCss:
      'radial-gradient(circle at 82% 14%, rgba(136, 188, 214, 0.22) 0%, transparent 65%)',
    accentHex: '#4F6D7A',
    ribbonGradient: 'linear-gradient(180deg, #3A5364 0%, #4D6D82 50%, #2A3C49 100%)',
    ribbonBorder: '#9BB4C7',
    paperEdgeGiltHex: '#9BB1BC',
    paperStackLayer1Light: '#B8CBD4',
    paperStackLayer1Dark: '#253137',
    paperStackLayer2Light: '#CEE0E6',
    paperStackLayer2Dark: '#1E282D',
    cardSurfaceLightCss: 'linear-gradient(180deg, #EFF5F7 0%, #DCE8EC 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #212C31 0%, #192226 100%)',
    cardBorderLightHex: '#A8C0CB',
    cardBorderDarkHex: '#364954',
    cardSelectedLightCss: 'linear-gradient(90deg, #C7DBE3 0%, #D6E6EC 50%, #C7DBE3 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #2B3B42 0%, #243238 50%, #1E2A2F 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #3B5B6C 0%, #2C4654 55%, #1E323D 100%)',
    primaryButtonBorderHex: '#6E95A8',
    primaryButtonTextHex: '#F2F8FA',
    secondaryButtonLightCss: 'linear-gradient(180deg, #F2F7F9 0%, #DCE7EC 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #253238 0%, #1B252A 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #DAE6EA 0%, #DAE6EA 36%, rgba(218,230,234,0.78) 58%, rgba(218,230,234,0) 88%)',
    recommendedInkId: 'oxford-midnight',
    recommendedWritingStyleId: 'epistolary-intimate',
    isDarkScene: true,
  },
  {
    id: 'candlelight-library',
    nameBn: 'মোমবাতির সোনালি পাঠাগার',
    nameEn: 'Candlelight Amber Folio',
    shortLabel: 'Candlelight',
    descriptionBn: 'মধ্যরাতের পাঠাগারে মোমবাতির সোনালি-তাম্র আভায় রাঙানো পাতা।',
    conceptSubtitleBn: 'অন্ধকার ঘরে একাকী মোমের মৃদু কম্পন ও স্বর্ণালী মলাট',
    conceptQuoteBn: '“নিঝুম রাতে বইয়ের পাতার ওপরেই কেবল নিজের মুখোমুখি হওয়া যায়।”',
    conceptBadgeBn: 'দীপশিখা পাঠাগার সংস্করণ · Candlelight Nocturne',
    conceptMotifSymbol: '🕯️',
    mappedAppThemeId: 'desert-clay',
    swatchGradient: 'radial-gradient(circle at 30% 30%, #593818 0%, #1E130B 65%, #0F0905 100%)',
    backgroundCss: 'radial-gradient(circle at 50% 24%, #452912 0%, #1F1209 56%, #0D0704 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #331C0B 0%, #241307 50%, #160B03 100%)',
    flapBorderHex: '#8B5B24',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(122,76,26,0.92) 0%, rgba(84,50,15,0.88) 100%)',
    flapActiveBorderHex: '#E0A858',
    pageSpreadLightCss: 'linear-gradient(90deg, #F6E4C4 0%, #EDD5AC 50%, #F8E8CB 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #281D13 0%, #20170E 50%, #2A1F14 100%)',
    patternCss:
      'repeating-linear-gradient(90deg, rgba(242,190,120,0.03) 0px, rgba(242,190,120,0.03) 3px, transparent 3px, transparent 22px)',
    ambientGlowCss:
      'radial-gradient(circle at 75% 18%, rgba(255, 185, 82, 0.24) 0%, rgba(214, 128, 42, 0.08) 45%, transparent 72%)',
    accentHex: '#C98A3E',
    ribbonGradient: 'linear-gradient(180deg, #9C6721 0%, #D49337 50%, #784E15 100%)',
    ribbonBorder: '#F5D38C',
    paperEdgeGiltHex: '#CBB07E',
    paperStackLayer1Light: '#DFC28E',
    paperStackLayer1Dark: '#3E2D1B',
    paperStackLayer2Light: '#ECD5AA',
    paperStackLayer2Dark: '#322415',
    cardSurfaceLightCss: 'linear-gradient(180deg, #FCF0D8 0%, #EED6AE 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #332416 0%, #261B10 100%)',
    cardBorderLightHex: '#CCA870',
    cardBorderDarkHex: '#593F23',
    cardSelectedLightCss: 'linear-gradient(90deg, #E8C892 0%, #F2D8AA 50%, #E8C892 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #47321D 0%, #3B2917 50%, #322213 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #8F5A22 0%, #6E4316 55%, #52300D 100%)',
    primaryButtonBorderHex: '#C9924C',
    primaryButtonTextHex: '#FFF6E5',
    secondaryButtonLightCss: 'linear-gradient(180deg, #FDF2DC 0%, #ECD4AC 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #382819 0%, #2B1E12 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #F0DAB4 0%, #F0DAB4 36%, rgba(240,218,180,0.78) 58%, rgba(240,218,180,0) 88%)',
    recommendedInkId: 'gilded-amber',
    recommendedWritingStyleId: 'fountain-calligraphy',
    isDarkScene: true,
  },
  {
    id: 'botanical-conservatory',
    nameBn: 'অরণ্য-সবুজ ও জলপাই পাতা',
    nameEn: 'Botanical Sage & Herbarium',
    shortLabel: 'Botanical Sage',
    descriptionBn: 'অরণ্য-সবুজ চামড়ার মলাট ও জলপাই-রঙা ভেষজ ডায়েরির পাতা।',
    conceptSubtitleBn: 'অরণ্যের বুনো ঘ্রাণ, শুকনো ফার্ন পাতা আর গভীর স্তব্ধতা',
    conceptQuoteBn: '“গাছের ছায়ায় লেখা একটি পঙ্‌ক্তি কখনো মিথ্যে হয় না।”',
    conceptBadgeBn: 'ভেষজ অরণ্য সংস্করণ · Botanical Herbarium',
    conceptMotifSymbol: '🌿',
    mappedAppThemeId: 'botanical-journal',
    swatchGradient: 'linear-gradient(135deg, #2D3B2E 0%, #1F2A20 65%, #141C15 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #2E3D2F 0%, #1D281E 60%, #111812 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #1D2B1F 0%, #141E15 50%, #0D140E 100%)',
    flapBorderHex: '#3F5B41',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(52,82,55,0.92) 0%, rgba(36,59,39,0.88) 100%)',
    flapActiveBorderHex: '#84B087',
    pageSpreadLightCss: 'linear-gradient(90deg, #E6EFE2 0%, #DCE8D7 50%, #EAF2E6 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #1C241C 0%, #171E17 50%, #1E261E 100%)',
    patternCss:
      'repeating-linear-gradient(45deg, rgba(130,175,120,0.04) 0px, rgba(130,175,120,0.04) 2px, transparent 2px, transparent 20px)',
    ambientGlowCss:
      'radial-gradient(circle at 78% 16%, rgba(148, 204, 132, 0.2) 0%, transparent 65%)',
    accentHex: '#587A56',
    ribbonGradient: 'linear-gradient(180deg, #264A2B 0%, #376E3E 50%, #1B3820 100%)',
    ribbonBorder: '#8CC593',
    paperEdgeGiltHex: '#9FBFA1',
    paperStackLayer1Light: '#BDD1B8',
    paperStackLayer1Dark: '#263327',
    paperStackLayer2Light: '#D2E2CE',
    paperStackLayer2Dark: '#1F291F',
    cardSurfaceLightCss: 'linear-gradient(180deg, #F1F7EE 0%, #DFEBDC 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #222D22 0%, #1A231A 100%)',
    cardBorderLightHex: '#ACC4A7',
    cardBorderDarkHex: '#374B38',
    cardSelectedLightCss: 'linear-gradient(90deg, #CBE0C6 0%, #D9EAD5 50%, #CBE0C6 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #2D3D2E 0%, #253326 50%, #1F2B20 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #3D613F 0%, #2D4A2F 55%, #1E3420 100%)',
    primaryButtonBorderHex: '#739E76',
    primaryButtonTextHex: '#F2F9F1',
    secondaryButtonLightCss: 'linear-gradient(180deg, #F3F8F1 0%, #DEEBDA 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #263327 0%, #1C261D 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #DCE8D8 0%, #DCE8D8 36%, rgba(220,232,216,0.78) 58%, rgba(220,232,216,0) 88%)',
    recommendedInkId: 'forest-moss',
    recommendedWritingStyleId: 'poetic-centered',
    isDarkScene: true,
  },
  {
    id: 'royal-velvet',
    nameBn: 'রাজকীয় মখমল ও তাম্র পাতা',
    nameEn: 'Crimson Velvet & Rose Parchment',
    shortLabel: 'Crimson Velvet',
    descriptionBn: 'গাঢ় মেরুন মখমলের বাঁধাই ও গোলাপি-তাম্র আভার রাজকীয় পাতা।',
    conceptSubtitleBn: 'গাঢ় রক্তিম মখমল, গোলাপের পাপড়ি ও রাজকীয় অলংকরণ',
    conceptQuoteBn: '“হৃদয়ের প্রতিটি ক্ষতের ভেতর লুকিয়ে থাকে এক একটি অমর কবিতা।”',
    conceptBadgeBn: 'রাজকীয় মখমল সংস্করণ · Royal Velvet Manuscript',
    conceptMotifSymbol: '🌹',
    mappedAppThemeId: 'rosewood-letters',
    swatchGradient: 'linear-gradient(135deg, #421C22 0%, #281014 65%, #17080B 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 20%, #461B22 0%, #280E13 60%, #140609 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #301116 0%, #220B0F 50%, #150608 100%)',
    flapBorderHex: '#782E39',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(112,34,46,0.92) 0%, rgba(78,22,31,0.88) 100%)',
    flapActiveBorderHex: '#D9828F',
    pageSpreadLightCss: 'linear-gradient(90deg, #F5E5E3 0%, #ECD6D3 50%, #F7E8E6 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #29181B 0%, #211215 50%, #2B1A1D 100%)',
    patternCss:
      'radial-gradient(rgba(195, 120, 130, 0.06) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 25% 15%, rgba(226, 140, 128, 0.18) 0%, transparent 68%)',
    accentHex: '#8E2F3C',
    ribbonGradient: 'linear-gradient(180deg, #6B1520 0%, #992331 50%, #520D16 100%)',
    ribbonBorder: '#F6AAB5',
    paperEdgeGiltHex: '#C4989E',
    paperStackLayer1Light: '#D8B6B4',
    paperStackLayer1Dark: '#3A2125',
    paperStackLayer2Light: '#E8CECC',
    paperStackLayer2Dark: '#2E191C',
    cardSurfaceLightCss: 'linear-gradient(180deg, #FBF0EE 0%, #EEDBD8 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #321D21 0%, #261518 100%)',
    cardBorderLightHex: '#CCA5A2',
    cardBorderDarkHex: '#543036',
    cardSelectedLightCss: 'linear-gradient(90deg, #E5C6C3 0%, #F0D6D3 50%, #E5C6C3 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #45262B 0%, #381E22 50%, #2E181C 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #7A232E 0%, #5E1922 55%, #451018 100%)',
    primaryButtonBorderHex: '#B85A67',
    primaryButtonTextHex: '#FDF2F3',
    secondaryButtonLightCss: 'linear-gradient(180deg, #FCF2F1 0%, #ECDAD8 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #382024 0%, #2A171A 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #EED8D5 0%, #EED8D5 36%, rgba(238,216,213,0.78) 58%, rgba(238,216,213,0) 88%)',
    recommendedInkId: 'oxblood-crimson',
    recommendedWritingStyleId: 'fountain-calligraphy',
    isDarkScene: true,
  },
  {
    id: 'autumn-courtyard',
    nameBn: 'শরতের রোদেলা খাদি পাতা',
    nameEn: 'Sunlit Khadi & Sandstone',
    shortLabel: 'Sunlit Khadi',
    descriptionBn: 'শরতের উজ্জ্বল রোদে বোনা খাদি ও সোনালি বেলেপাথর রঙের পাতা।',
    conceptSubtitleBn: 'শিশিরভেজা শিউলি ফুল, মিষ্টি রোদ ও দেশি সুতোয় বোনা পাতা',
    conceptQuoteBn: '“শরতের কাশফুল আর রোদের ওম মনে করিয়ে দেয় ঘরের টান।”',
    conceptBadgeBn: 'শারদীয় খাদি সংস্করণ · Handspun Khadi Edition',
    conceptMotifSymbol: '🌾',
    mappedAppThemeId: 'old-library',
    swatchGradient: 'linear-gradient(135deg, #E8DAC5 0%, #D5C0A3 65%, #BFA482 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 12%, #6B4C32 0%, #4E3521 62%, #382415 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #3A2516 0%, #2B1A0E 50%, #1A0E07 100%)',
    flapBorderHex: '#7C5535',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(110,74,44,0.92) 0%, rgba(82,53,30,0.88) 100%)',
    flapActiveBorderHex: '#D8AB79',
    pageSpreadLightCss: 'linear-gradient(90deg, #FBF3E4 0%, #F4E7CF 50%, #FCF6E9 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #26211A 0%, #1F1B15 50%, #28231C 100%)',
    patternCss:
      'repeating-linear-gradient(0deg, rgba(95,68,42,0.03) 0px, rgba(95,68,42,0.03) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(95,68,42,0.025) 0px, rgba(95,68,42,0.025) 1px, transparent 1px, transparent 8px)',
    ambientGlowCss:
      'radial-gradient(circle at 80% 12%, rgba(255, 225, 165, 0.28) 0%, transparent 65%)',
    accentHex: '#C8A273',
    ribbonGradient: 'linear-gradient(180deg, #A86532 0%, #C97E42 50%, #7E461E 100%)',
    ribbonBorder: '#F5CE9E',
    paperEdgeGiltHex: '#D4BD9E',
    paperStackLayer1Light: '#DFCAA8',
    paperStackLayer1Dark: '#3A3125',
    paperStackLayer2Light: '#EDE0C7',
    paperStackLayer2Dark: '#2E271E',
    cardSurfaceLightCss: 'linear-gradient(180deg, #FDF7EB 0%, #F2E4CC 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #2E271E 0%, #231E17 100%)',
    cardBorderLightHex: '#CFB692',
    cardBorderDarkHex: '#4E4132',
    cardSelectedLightCss: 'linear-gradient(90deg, #EAD6B5 0%, #F4E4C8 50%, #EAD6B5 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #3D3326 0%, #332B20 50%, #2B241B 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #8B572A 0%, #6E421D 55%, #522F12 100%)',
    primaryButtonBorderHex: '#C48B56',
    primaryButtonTextHex: '#FFF8EE',
    secondaryButtonLightCss: 'linear-gradient(180deg, #FEF9EF 0%, #EFE2C9 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #362E23 0%, #29221A 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #F4E6CE 0%, #F4E6CE 36%, rgba(244,230,206,0.78) 58%, rgba(244,230,206,0) 88%)',
    recommendedInkId: 'gilded-amber',
    recommendedWritingStyleId: 'compact-chronicle',
    isDarkScene: false,
  },
  {
    id: 'starlit-roof',
    nameBn: 'তারার নিশুতি নীল ভেলুম',
    nameEn: 'Starlit Midnight Vellum',
    shortLabel: 'Starlit Night',
    descriptionBn: 'গভীর নীল রাতের বাঁধাই ও তারার আলোমাখা নিশুতি পাতা।',
    conceptSubtitleBn: 'গভীর নিশীথে ছাদের রেলিং আর আকাশের দূর নক্ষত্রবীথি',
    conceptQuoteBn: '“যখন পুরো শহর ঘুমিয়ে পড়ে, কেবল নক্ষত্রেরা ডায়েরির পাতা পড়ে।”',
    conceptBadgeBn: 'নক্ষত্রবীথি সংস্করণ · Celestial Midnight Vellum',
    conceptMotifSymbol: '✨',
    mappedAppThemeId: 'lavender-nocturne',
    swatchGradient: 'linear-gradient(135deg, #1B2236 0%, #111626 65%, #090C16 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #1E2740 0%, #121728 60%, #090C15 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #121828 0%, #0C111C 50%, #070A12 100%)',
    flapBorderHex: '#2F3C5E',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(44,61,102,0.92) 0%, rgba(29,42,74,0.88) 100%)',
    flapActiveBorderHex: '#7E9CE0',
    pageSpreadLightCss: 'linear-gradient(90deg, #E4E8F2 0%, #D9DFEC 50%, #E8ECF5 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #181D2B 0%, #131723 50%, #1A2030 100%)',
    patternCss:
      'radial-gradient(rgba(145, 168, 225, 0.08) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 75% 15%, rgba(142, 174, 245, 0.2) 0%, transparent 65%)',
    accentHex: '#435785',
    ribbonGradient: 'linear-gradient(180deg, #223761 0%, #335496 50%, #172747 100%)',
    ribbonBorder: '#9BBBF5',
    paperEdgeGiltHex: '#8E9EBE',
    paperStackLayer1Light: '#B8C2DA',
    paperStackLayer1Dark: '#232B40',
    paperStackLayer2Light: '#CDD5E8',
    paperStackLayer2Dark: '#1B2233',
    cardSurfaceLightCss: 'linear-gradient(180deg, #EFF2F9 0%, #DCE2F0 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #1F2638 0%, #171C2B 100%)',
    cardBorderLightHex: '#A6B4D4',
    cardBorderDarkHex: '#333F5E',
    cardSelectedLightCss: 'linear-gradient(90deg, #C6D1E8 0%, #D6DFF2 50%, #C6D1E8 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #29344F 0%, #222B42 50%, #1C2438 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #314878 0%, #233559 55%, #17243F 100%)',
    primaryButtonBorderHex: '#6886C4',
    primaryButtonTextHex: '#F0F4FC',
    secondaryButtonLightCss: 'linear-gradient(180deg, #F2F4FA 0%, #DCE2F0 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #232B40 0%, #192030 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #DCE2F0 0%, #DCE2F0 36%, rgba(220,226,240,0.78) 58%, rgba(220,226,240,0) 88%)',
    recommendedInkId: 'royal-amethyst',
    recommendedWritingStyleId: 'poetic-centered',
    isDarkScene: true,
  },
  {
    id: 'minimal-sandstone',
    nameBn: 'নীরব পাথুরে শুভ্র পাতা',
    nameEn: 'Quiet Travertine Ivory',
    shortLabel: 'Quiet Ivory',
    descriptionBn: 'ন্যূনতম অলংকরণে শান্ত ও একাগ্র পাঠের জন্য শুভ্র আইভরি পাতা।',
    conceptSubtitleBn: 'কোলাহলহীন শুভ্রতা, পাথরের শীতলতা ও খাঁটি ধ্যান',
    conceptQuoteBn: '“অতিরিক্ত শব্দের ভিড় সরিয়ে নিঃশব্দেই লুকিয়ে থাকে পূর্ণতা।”',
    conceptBadgeBn: 'শুভ্র পাথুরে সংস্করণ · Minimal Travertine Codex',
    conceptMotifSymbol: '🕊️',
    mappedAppThemeId: 'minimal-chalk',
    swatchGradient: 'linear-gradient(135deg, #DFD9CE 0%, #CBC3B5 65%, #B5AC9C 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #4A433B 0%, #332E28 65%, #221E1A 100%)',
    flapBackgroundCss: 'linear-gradient(180deg, #282420 0%, #1C1916 50%, #12100E 100%)',
    flapBorderHex: '#544D44',
    flapActiveNavCss: 'linear-gradient(90deg, rgba(78,72,64,0.92) 0%, rgba(56,51,45,0.88) 100%)',
    flapActiveBorderHex: '#B8B0A4',
    pageSpreadLightCss: 'linear-gradient(90deg, #F7F5F0 0%, #EFECE4 50%, #F9F7F3 100%)',
    pageSpreadDarkCss: 'linear-gradient(90deg, #21201E 0%, #1B1A18 50%, #232220 100%)',
    patternCss:
      'radial-gradient(rgba(70, 60, 50, 0.035) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 25% 15%, rgba(255, 252, 245, 0.25) 0%, transparent 65%)',
    accentHex: '#A69B8A',
    ribbonGradient: 'linear-gradient(180deg, #5C564E 0%, #7A7268 50%, #443E37 100%)',
    ribbonBorder: '#DDD7CE',
    paperEdgeGiltHex: '#C7C1B5',
    paperStackLayer1Light: '#D5CFC3',
    paperStackLayer1Dark: '#302E2B',
    paperStackLayer2Light: '#E5E0D6',
    paperStackLayer2Dark: '#262422',
    cardSurfaceLightCss: 'linear-gradient(180deg, #FAF9F6 0%, #ECE8DF 100%)',
    cardSurfaceDarkCss: 'linear-gradient(180deg, #282624 0%, #1F1E1C 100%)',
    cardBorderLightHex: '#C7C0B4',
    cardBorderDarkHex: '#45413C',
    cardSelectedLightCss: 'linear-gradient(90deg, #DFDAD0 0%, #EAE6DE 50%, #DFDAD0 100%)',
    cardSelectedDarkCss: 'linear-gradient(90deg, #363330 0%, #2E2B28 50%, #262421 100%)',
    primaryButtonCss: 'linear-gradient(180deg, #59534B 0%, #423D37 55%, #2E2A26 100%)',
    primaryButtonBorderHex: '#948B7F',
    primaryButtonTextHex: '#F7F5F2',
    secondaryButtonLightCss: 'linear-gradient(180deg, #FBF9F6 0%, #EAE6DD 100%)',
    secondaryButtonDarkCss: 'linear-gradient(180deg, #302E2B 0%, #242220 100%)',
    headerArtworkTintCss: 'linear-gradient(90deg, #EAE6DE 0%, #EAE6DE 36%, rgba(234,230,222,0.78) 58%, rgba(234,230,222,0) 88%)',
    recommendedInkId: 'sepia-walnut',
    recommendedWritingStyleId: 'grand-folio',
    isDarkScene: false,
  },
];

export function getBookThemeCssVars(
  bg: DeskBackgroundMeta,
  isDarkTheme = false
): Record<string, string> {
  return {
    '--vv-cover-bg': bg.backgroundCss,
    '--vv-cover-border': bg.accentHex,
    '--vv-flap-bg': bg.flapBackgroundCss,
    '--vv-flap-border': bg.flapBorderHex,
    '--vv-flap-active-bg': bg.flapActiveNavCss,
    '--vv-flap-active-border': bg.flapActiveBorderHex,
    '--vv-ribbon-bg': bg.ribbonGradient,
    '--vv-ribbon-border': bg.ribbonBorder,
    '--vv-edge-gilt': bg.paperEdgeGiltHex,
    '--vv-stack-1': isDarkTheme ? bg.paperStackLayer1Dark : bg.paperStackLayer1Light,
    '--vv-stack-2': isDarkTheme ? bg.paperStackLayer2Dark : bg.paperStackLayer2Light,
    '--vv-card-bg': isDarkTheme ? bg.cardSurfaceDarkCss : bg.cardSurfaceLightCss,
    '--vv-card-border': isDarkTheme ? bg.cardBorderDarkHex : bg.cardBorderLightHex,
    '--vv-card-selected-bg': isDarkTheme
      ? bg.cardSelectedDarkCss
      : bg.cardSelectedLightCss,
    '--vv-primary-btn-bg': bg.primaryButtonCss,
    '--vv-primary-btn-border': bg.primaryButtonBorderHex,
    '--vv-primary-btn-text': bg.primaryButtonTextHex,
    '--vv-secondary-btn-bg': isDarkTheme
      ? bg.secondaryButtonDarkCss
      : bg.secondaryButtonLightCss,
    '--vv-header-tint': bg.headerArtworkTintCss,
    '--vv-accent': bg.accentHex,
  };
}

export interface JournalTemplate {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  type: EntryType;
  pageVariation: PageVariation;
  mood: EntryMood;
  collectionId: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultContent: string;
  defaultAttribution?: string;
  tags: string[];
  isCustom?: boolean;
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'tpl-daily-reflection',
    nameBn: 'রাতের আত্মকথন (Daily Diary)',
    nameEn: 'Evening Self-Reflection',
    descriptionBn: 'দিনের শেষে না-বলা কথা, কৃতজ্ঞতা ও অনুভব লিখে রাখার ডায়েরি পাতা।',
    type: 'diary',
    pageVariation: 'ruled-notebook',
    mood: 'Reflective',
    collectionId: 'col-nirobota',
    defaultTitle: 'দিনের শেষে নিজের মুখোমুখি',
    defaultSubtitle: 'রাতের ডায়েরি',
    defaultContent: `আজ সারাদিনের কোলাহল থামার পর মনে হলো—\n\n১. আজকের সবচেয়ে গভীর অনুভব:\nএকটুখানি নীরবতা পেলেই মনের ভেতর জমে থাকা কথাগুলো স্পষ্ট হয়ে ওঠে।\n\n২. যা কাউকে বলা হয়নি:\nসব কথা মুখ ফুটে বলতে নেই, কিছু অনুভব কেবল ডায়েরির পাতাতেই নিরাপদ।\n\n৩. আগামীকালের জন্য একটি ছোট্ট আশা:\nআগামীকাল যেন আরেকটু শান্ত ও অর্থপূর্ণ হয়।`,
    tags: ['দিনলিপি', 'নৈঃশব্দ্য'],
  },
  {
    id: 'tpl-lyric-poem',
    nameBn: 'চতুর্দশপদী ও গীতিকবিতা (Poem)',
    nameEn: 'Stanza & Lyric Poem',
    descriptionBn: 'স্তবক বিন্যাস ও কাব্যিক অলংকরণসহ কবিতা লেখার বিশেষ পাতা।',
    type: 'poem',
    pageVariation: 'poetry-scroll',
    mood: 'Melancholic',
    collectionId: 'col-jibondorshon',
    defaultTitle: 'নীরবতার পঙ্‌ক্তিমালা',
    defaultSubtitle: 'একটি অসমাপ্ত কবিতা',
    defaultContent: `প্রথম স্তবকের সূচনা এখানে,\nছন্দের আড়ালে জমে থাকা কুয়াশা।\nহৃদয়ের গহীনে যে কথা বাজে নীরবে,\nতাই নিয়ে জেগে থাকে রাত্রির ভাষা।\n\n❖\n\nদ্বিতীয় স্তবকের নীরব বিস্তার,\nসময়ের স্রোতে ভেসে যাওয়া ভালোবাসা।\nযে পথে ফেরে না আর পুরনো বিকেল,\nসেই পথে আজও বাঁচে গোপন প্রত্যাশা।`,
    tags: ['কবিতা', 'জীবনদর্শন'],
  },
  {
    id: 'tpl-unsent-letter',
    nameBn: 'না-পাঠানো চিঠি (Unsent Letter)',
    nameEn: 'Epistolary Unsent Letter',
    descriptionBn: 'যে চিঠি কখনো ডাকে দেওয়া হবে না—প্রিয়জন বা নিজেকে লেখা খোলা চিঠি।',
    type: 'prose',
    pageVariation: 'epistolary-letter',
    mood: 'Nostalgic',
    collectionId: 'col-obhiman',
    defaultTitle: 'চিঠি যা পাঠানো হয়নি',
    defaultSubtitle: 'প্রাপকহীন খাম',
    defaultContent: `প্রিয়,\n\nঅনেকদিন পর তোমাকে লিখতে বসলাম। হয়তো এই চিঠি কোনোদিন তোমার হাতে পৌঁছাবে না, তবু কিছু কথা কাগজের কাছে জমা রাখা জরুরি।\n\nসময় বদলেছে, আমাদের চারপাশের শহরটাও বদলে গেছে, কিন্তু মনের ভেতর কিছু স্মৃতি এখনো ঠিক আগের মতোই অমলিন রয়ে গেছে।\n\nইতি,\nতোমারই চেনা একজন`,
    tags: ['চিঠি', 'অভিমান', 'ভালোবাসা'],
  },
  {
    id: 'tpl-dampotyo-bond',
    nameBn: 'দাম্পত্য ও সম্পর্কের অনুভব (Shared Life)',
    nameEn: 'Marriage & Intimate Reflection',
    descriptionBn: 'একই ছাদের নিচে সহাবস্থান, ভালোবাসা ও অভিমানের দিনলিপি।',
    type: 'diary',
    pageVariation: 'vintage-parchment',
    mood: 'Melancholic',
    collectionId: 'col-dampotyo',
    defaultTitle: 'একই ছাদের নিচে',
    defaultSubtitle: 'সহাবস্থান ও অনুভব',
    defaultContent: `কাছে থেকেও কখনো কখনো দূরত্ব তৈরি হয়, আবার একটি ছোট্ট স্পর্শেই সব অভিমান গলে যায়।\n\nআজকের মুহূর্তটি লিখে রাখছি—\nভালোবাসা মানে তো কেবল নিখুঁত হওয়া নয়, বরং হাজারো অসম্পূর্ণতার মাঝেও একে অপরের হাত ধরে থাকা।`,
    tags: ['দাম্পত্য', 'অভিমান', 'ভালোবাসা'],
  },
  {
    id: 'tpl-family-memory',
    nameBn: 'পিতামাতা ও শৈশবের স্মৃতি (Family Archive)',
    nameEn: 'Parents & Childhood Memory',
    descriptionBn: 'বাবা-মায়ের ছায়া, শৈশবের উঠোন ও হারিয়ে যাওয়া দিনের স্মৃতিচারণ।',
    type: 'diary',
    pageVariation: 'vintage-parchment',
    mood: 'Grateful',
    collectionId: 'col-poribar',
    defaultTitle: 'শৈশবের সেই বিকেল',
    defaultSubtitle: 'পরিবারের স্মৃতিখাতা',
    defaultContent: `চোখ বন্ধ করলেই দেখতে পাই আমাদের পুরনো ঘর, মায়ের আঁচলের ঘ্রাণ আর বাবার নীরব স্নেহ।\n\nস্মৃতির যে দৃশ্যটি আজ খুব মনে পড়ছে:\nবিকেলের রোদে উঠোনের এক কোণে বসে থাকা সেই দিনগুলো আর কখনো ফিরে আসবে না, তবু মনের মণিকোঠায় তা চিরকাল উজ্জ্বল।`,
    tags: ['পরিবার', 'স্মৃতি'],
  },
  {
    id: 'tpl-quote-commonplace',
    nameBn: 'প্রিয় উদ্ধৃতি ও পাঠ্যনোট (Commonplace Quote)',
    nameEn: 'Book Quote & Reflection',
    descriptionBn: 'বইয়ের প্রিয় উদ্ধৃতি, লেখকের নাম এবং নিজের পাঠ-প্রতিক্রিয়া।',
    type: 'quote',
    pageVariation: 'dot-commonplace',
    mood: 'Inspired',
    collectionId: 'col-kherokhata',
    defaultTitle: 'পাঠ্যনোট ও প্রিয় উদ্ধৃতি',
    defaultSubtitle: 'সাহিত্য সংকলন',
    defaultContent: `“যে কথা মানুষ মুখে বলতে পারে না, সাহিত্য তাকেই অমর করে রাখে।”\n\nপাঠ-অনুভূতি:\nকিছু পঙ্‌ক্তি পড়ার পর মনে হয় লেখক যেন আমার মনের গোপন কথাটিই বহু আগে লিখে রেখেছেন।`,
    defaultAttribution: 'রবীন্দ্রনাথ ঠাকুর · সাহিত্য নোট',
    tags: ['উদ্ধৃতি', 'জীবনদর্শন'],
  },
  {
    id: 'tpl-midnight-fragment',
    nameBn: 'মধ্যরাতের টুকরো ভাবনা (Midnight Fragment)',
    nameEn: 'Nocturnal Fragment',
    descriptionBn: 'গভীর রাতে হঠাৎ মাথায় আসা দু-এক লাইনের অসমাপ্ত ভাবনা বা পঙ্‌ক্তি।',
    type: 'fragment',
    pageVariation: 'nocturnal-vellum',
    mood: 'Peaceful',
    collectionId: 'col-nirobota',
    defaultTitle: 'রাত দুটোর নোট',
    defaultSubtitle: 'নিশীথের পাতা',
    defaultContent: `সবাই ঘুমিয়ে পড়লে জানালায় কেবল জ্যোৎস্না আর ঝিঁঝিঁর ডাক বেঁচে থাকে...\nএই নিস্তব্ধ প্রহরে নিজের সাথে কথা বলার চেয়ে বড় প্রশান্তি আর কিছু নেই।`,
    tags: ['নৈঃশব্দ্য', 'solitude'],
  },
  {
    id: 'tpl-travelogue',
    nameBn: 'পথের ডায়েরি ও ভ্রমণলিপি (Travelogue)',
    nameEn: 'Journey & Place Notes',
    descriptionBn: 'নতুন কোনো পথ, নদী, পাহাড় বা শহরের অভিজ্ঞতা লিখে রাখার পাতা।',
    type: 'prose',
    pageVariation: 'ruled-notebook',
    mood: 'Inspired',
    collectionId: 'col-kherokhata',
    defaultTitle: 'অচেনা পথের বাঁকে',
    defaultSubtitle: 'ভ্রমণ দিনলিপি',
    defaultContent: `স্থান ও পরিবেশ:\nজানালার বাইরে ছুটে চলা সবুজ প্রান্তর আর দূরের কুয়াশাচ্ছন্ন দিগন্ত।\n\nযাত্রাপথের সেরা মুহূর্ত:\nঅচেনা মানুষের মুখের হাসি আর চায়ের কাপে জমে ওঠা বিকেলের আড্ডা।`,
    tags: ['ভ্রমণ', 'জীবনের খেরোখাতা'],
  },
  {
    id: 'tpl-botanical-nature',
    nameBn: 'প্রকৃতি ও ঋতুবৈচিত্র্যের দিনলিপি (Botanical Folio)',
    nameEn: 'Nature & Seasonal Observation',
    descriptionBn: 'বর্ষার প্রথম কদম, শরতের কাশফুল বা প্রকৃতির সান্নিধ্যে লেখা পাতা।',
    type: 'diary',
    pageVariation: 'botanical-herbarium',
    mood: 'Peaceful',
    collectionId: 'col-nirobota',
    defaultTitle: 'বৃষ্টিভেজা পাতার ঘ্রাণ',
    defaultSubtitle: 'প্রকৃতির খেরোখাতা',
    defaultContent: `জানালার পাশে দাঁড়াতেই ভেজা মাটির গন্ধে মনটা শান্ত হয়ে গেল।\n\nপ্রকৃতির কাছে গেলে বোঝা যায়—জীবনের সবচেয়ে সুন্দর মুহূর্তগুলো আসলে খুব সাধারণ ও নীরব।`,
    tags: ['প্রকৃতি', 'নৈঃশব্দ্য'],
  },
  {
    id: 'tpl-royal-manuscript',
    nameBn: 'ধ্রুপদী গীতিকাব্য ও স্বর্ণপত্র (Illuminated Verse)',
    nameEn: 'Classical Illuminated Poem',
    descriptionBn: 'স্বর্ণাক্ষর অলংকৃত ফ্রেমে ধ্রুপদী কবিতা বা গানের পঙ্‌ক্তিমালা।',
    type: 'poem',
    pageVariation: 'royal-illuminated',
    mood: 'Romantic',
    collectionId: 'col-jibondorshon',
    defaultTitle: 'স্বর্ণাক্ষরের গীতিকাব্য',
    defaultSubtitle: 'ধ্রুপদী সংকলন',
    defaultContent: `আলোয় ভরা প্রদীপখানি নিভৃতে জ্বলে রয়,\nস্মৃতির পাতায় ফুটে ওঠে চিরকালের জয়।\nযুগান্তরের পথ পেরিয়ে যে সুর বাজে প্রাণে,\nসেই তো আমার নীরব রাতের অমূল্য সঞ্চয়।`,
    tags: ['কবিতা', 'ধ্রুপদী'],
  },
  {
    id: 'tpl-khadi-memoir',
    nameBn: 'হাতে-বানানো খাদি পাতার স্মৃতিকথা (Khadi Memoir)',
    nameEn: 'Artisan Khadi Memoir',
    descriptionBn: 'অমসৃণ খাদি কাগজের পাতায় পুরনো দিনের অকৃত্রিম স্মৃতিচারণ।',
    type: 'prose',
    pageVariation: 'deckle-handmade',
    mood: 'Nostalgic',
    collectionId: 'col-poribar',
    defaultTitle: 'পুরনো ট্রাঙ্কের চিঠি ও স্মৃতি',
    defaultSubtitle: 'খাদি কাগজের পাতা',
    defaultContent: `আজ পুরনো কাঠের আলমারিটা খুলতেই হলুদ হয়ে যাওয়া কিছু কাগজের ভাঁজে হারিয়ে যাওয়া একটা সময়ের দেখা পেলাম।\n\nকাগজের স্পর্শে যেন ফুটে উঠল অনেক বছর আগের এক শান্ত দুপুরের ছবি।`,
    tags: ['স্মৃতি', 'খেরোখাতা'],
  },
  {
    id: 'tpl-chronicle-ledger',
    nameBn: 'সময়রেখা ও কৃতজ্ঞতার খতিয়ান (Chronicle Ledger)',
    nameEn: 'Daily Gratitude & Milestone Ledger',
    descriptionBn: 'তারিখ ও প্রহর ধরে জীবনের বিশেষ ঘটনা ও প্রাপ্তির ধারাবাহিক লিপি।',
    type: 'diary',
    pageVariation: 'ledger-chronicle',
    mood: 'Grateful',
    collectionId: 'col-kherokhata',
    defaultTitle: 'জীবনের মাইলফলক ও কৃতজ্ঞতা',
    defaultSubtitle: 'আর্কাইভ খতিয়ান',
    defaultContent: `সকাল — নতুন একটি কাজের শুভ সূচনা ও মনের ভেতর জমে থাকা উদ্দীপনা।\n\nদুপুর — প্রিয় মানুষের সাথে সংক্ষিপ্ত কিন্তু অর্থপূর্ণ কথোপকথন।\n\nরাত — সারাদিনের ক্লান্তি শেষে ডায়েরির পাতায় এই মুহূর্তটিকে চিরস্থায়ী করে রাখা।`,
    tags: ['দিনলিপি', 'কৃতজ্ঞতা'],
  },
];

export const ALLOWED_PAGE_VARIATIONS: PageVariation[] = [
  'vintage-parchment',
  'ruled-notebook',
  'poetry-scroll',
  'epistolary-letter',
  'dot-commonplace',
  'nocturnal-vellum',
  'botanical-herbarium',
  'royal-illuminated',
  'deckle-handmade',
  'ledger-chronicle',
];

export function resolveEffectivePageVariation(
  entryType: EntryType,
  explicitVariation?: PageVariation,
  defaultVariation?: PageVariation
): PageVariation {
  if (explicitVariation && ALLOWED_PAGE_VARIATIONS.includes(explicitVariation)) {
    return explicitVariation;
  }
  if (
    defaultVariation &&
    defaultVariation !== 'vintage-parchment' &&
    ALLOWED_PAGE_VARIATIONS.includes(defaultVariation)
  ) {
    return defaultVariation;
  }
  if (entryType === 'poem') return 'poetry-scroll';
  if (entryType === 'quote') return 'dot-commonplace';
  if (entryType === 'prose') return 'epistolary-letter';
  return 'vintage-parchment';
}

export function getDeskBackground(id?: DeskBackgroundId): DeskBackgroundMeta {
  if (!id) return DESK_BACKGROUNDS[0];
  return DESK_BACKGROUNDS.find((b) => b.id === id) || DESK_BACKGROUNDS[0];
}

export function getWritingStylePreset(id?: WritingStyleId): WritingStyleMeta {
  if (!id) return WRITING_STYLE_PRESETS[0];
  return WRITING_STYLE_PRESETS.find((w) => w.id === id) || WRITING_STYLE_PRESETS[0];
}

export function getInkColorPreset(id?: InkColorId): InkColorMeta {
  if (!id) return INK_COLOR_PRESETS[0];
  return INK_COLOR_PRESETS.find((i) => i.id === id) || INK_COLOR_PRESETS[0];
}

