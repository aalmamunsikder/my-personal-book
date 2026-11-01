import { EntryMood, EntryType, PageVariation } from '../types/entry';

export interface PageVariationMeta {
  id: PageVariation;
  nameBn: string;
  nameEn: string;
  shortLabel: string;
  description: string;
  previewKind: 'parchment' | 'ruled' | 'poetry' | 'letter' | 'dot' | 'nocturnal';
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
];

export const ALLOWED_PAGE_VARIATIONS: PageVariation[] = [
  'vintage-parchment',
  'ruled-notebook',
  'poetry-scroll',
  'epistolary-letter',
  'dot-commonplace',
  'nocturnal-vellum',
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
