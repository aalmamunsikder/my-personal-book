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
  swatchGradient: string;
  backgroundCss: string;
  patternCss: string;
  ambientGlowCss: string;
  accentHex: string;
  isDarkScene: boolean;
}

export const DESK_BACKGROUNDS: DeskBackgroundMeta[] = [
  {
    id: 'mahogany-study',
    nameBn: 'মেহগনি কাঠের টেবিল',
    nameEn: 'Mahogany Writer’s Desk',
    shortLabel: 'Mahogany Desk',
    descriptionBn: 'উষ্ণ পিতলের টেবিল ল্যাম্প ও প্রাচীন মেহগনি কাঠের লেখার টেবিল।',
    swatchGradient: 'linear-gradient(135deg, #3A2214 0%, #24140B 60%, #160B06 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 18%, #3B2314 0%, #24140B 55%, #120904 100%)',
    patternCss:
      'repeating-linear-gradient(90deg, rgba(255,210,160,0.025) 0px, rgba(255,210,160,0.025) 2px, transparent 2px, transparent 14px), repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 48px)',
    ambientGlowCss:
      'radial-gradient(circle at 18% 12%, rgba(235, 178, 98, 0.22) 0%, rgba(216, 146, 68, 0.06) 42%, transparent 72%)',
    accentHex: '#8C5230',
    isDarkScene: true,
  },
  {
    id: 'rainy-veranda',
    nameBn: 'বর্ষার জানালার ধার',
    nameEn: 'Monsoon Teak Veranda',
    shortLabel: 'Monsoon Window',
    descriptionBn: 'বৃষ্টির বিকেলের মেঘলা আলো ও সেগুন কাঠের টেবিলের নীরব আবহ।',
    swatchGradient: 'linear-gradient(135deg, #2C363B 0%, #1E262B 60%, #141A1E 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 10%, #2D3940 0%, #1C252A 58%, #101619 100%)',
    patternCss:
      'repeating-linear-gradient(108deg, rgba(190,220,235,0.03) 0px, rgba(190,220,235,0.03) 1px, transparent 1px, transparent 18px)',
    ambientGlowCss:
      'radial-gradient(circle at 82% 14%, rgba(156, 198, 218, 0.18) 0%, transparent 65%)',
    accentHex: '#4F6D7A',
    isDarkScene: true,
  },
  {
    id: 'candlelight-library',
    nameBn: 'মোমবাতির নিশুতি পাঠাগার',
    nameEn: 'Candlelight Library',
    shortLabel: 'Candlelight',
    descriptionBn: 'মধ্যরাতের নিস্তব্ধ পাঠাগারে মোমবাতির সোনালি আলোয় ডায়েরির পাতা।',
    swatchGradient: 'radial-gradient(circle at 30% 30%, #593818 0%, #1E130B 65%, #0F0905 100%)',
    backgroundCss: 'radial-gradient(circle at 50% 24%, #452912 0%, #1F1209 56%, #0D0704 100%)',
    patternCss:
      'repeating-linear-gradient(90deg, rgba(242,190,120,0.02) 0px, rgba(242,190,120,0.02) 3px, transparent 3px, transparent 22px)',
    ambientGlowCss:
      'radial-gradient(circle at 22% 20%, rgba(255, 185, 82, 0.26) 0%, rgba(214, 128, 42, 0.08) 45%, transparent 72%)',
    accentHex: '#C98A3E',
    isDarkScene: true,
  },
  {
    id: 'botanical-conservatory',
    nameBn: 'সবুজ বাগান ও কাঠের টেবিল',
    nameEn: 'Botanical Conservatory',
    shortLabel: 'Botanical Desk',
    descriptionBn: 'পাতার ফাঁক গলে আসা নরম রোদ ও জলপাই-কাঠের শান্ত পরিবেশ।',
    swatchGradient: 'linear-gradient(135deg, #2D3B2E 0%, #1F2A20 65%, #141C15 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #2E3D2F 0%, #1D281E 60%, #111812 100%)',
    patternCss:
      'repeating-linear-gradient(45deg, rgba(180,215,170,0.025) 0px, rgba(180,215,170,0.025) 2px, transparent 2px, transparent 20px)',
    ambientGlowCss:
      'radial-gradient(circle at 78% 16%, rgba(168, 214, 152, 0.18) 0%, transparent 65%)',
    accentHex: '#587A56',
    isDarkScene: true,
  },
  {
    id: 'royal-velvet',
    nameBn: 'রাজকীয় মখমল ও তামা',
    nameEn: 'Crimson Velvet Salon',
    shortLabel: 'Crimson Velvet',
    descriptionBn: 'গাঢ় মেরুন মখমলের টেবিলক্লথ ও প্রাচীন সোনালি কারুকাজের আবহ।',
    swatchGradient: 'linear-gradient(135deg, #421C22 0%, #281014 65%, #17080B 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 20%, #461B22 0%, #280E13 60%, #140609 100%)',
    patternCss:
      'radial-gradient(rgba(235, 190, 130, 0.045) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 25% 15%, rgba(226, 160, 108, 0.2) 0%, transparent 68%)',
    accentHex: '#8E2F3C',
    isDarkScene: true,
  },
  {
    id: 'autumn-courtyard',
    nameBn: 'শরতের রোদেলা উঠোন',
    nameEn: 'Sunlit Linen & Sandstone',
    shortLabel: 'Sunlit Linen',
    descriptionBn: 'দিনের উজ্জ্বল আলোয় বোনা লিনেন ও বেলেপাথরের স্নিগ্ধ টেবিল।',
    swatchGradient: 'linear-gradient(135deg, #E8DAC5 0%, #D5C0A3 65%, #BFA482 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 12%, #EFE3D0 0%, #DECBB0 62%, #C9B190 100%)',
    patternCss:
      'repeating-linear-gradient(0deg, rgba(95,68,42,0.03) 0px, rgba(95,68,42,0.03) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(95,68,42,0.025) 0px, rgba(95,68,42,0.025) 1px, transparent 1px, transparent 8px)',
    ambientGlowCss:
      'radial-gradient(circle at 80% 12%, rgba(255, 245, 220, 0.55) 0%, transparent 65%)',
    accentHex: '#C8A273',
    isDarkScene: false,
  },
  {
    id: 'starlit-roof',
    nameBn: 'তারার নিচে ছাদের কোণ',
    nameEn: 'Starlit Midnight Terrace',
    shortLabel: 'Starlit Night',
    descriptionBn: 'গভীর নীল রাতের আকাশ ও তারার আলোয় একাকী লেখার প্রহর।',
    swatchGradient: 'linear-gradient(135deg, #1B2236 0%, #111626 65%, #090C16 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #1E2740 0%, #121728 60%, #090C15 100%)',
    patternCss:
      'radial-gradient(rgba(235, 242, 255, 0.08) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 75% 15%, rgba(162, 188, 245, 0.18) 0%, transparent 65%)',
    accentHex: '#435785',
    isDarkScene: true,
  },
  {
    id: 'minimal-sandstone',
    nameBn: 'নীরব পাথুরে টেবিল',
    nameEn: 'Quiet Travertine Stone',
    shortLabel: 'Quiet Stone',
    descriptionBn: 'ন্যূনতম অলংকরণে শান্ত ও একাগ্র পাঠের জন্য পাথুরে ডেস্ক।',
    swatchGradient: 'linear-gradient(135deg, #DFD9CE 0%, #CBC3B5 65%, #B5AC9C 100%)',
    backgroundCss: 'radial-gradient(ellipse at 50% 15%, #E5DFD5 0%, #D2C9BA 65%, #BFB5A4 100%)',
    patternCss:
      'radial-gradient(rgba(70, 60, 50, 0.04) 1px, transparent 1px)',
    ambientGlowCss:
      'radial-gradient(circle at 25% 15%, rgba(255, 252, 245, 0.45) 0%, transparent 65%)',
    accentHex: '#A69B8A',
    isDarkScene: false,
  },
];

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

