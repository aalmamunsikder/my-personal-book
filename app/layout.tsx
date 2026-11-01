import { Metadata } from 'next';
import { Hind_Siliguri, Literata, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fontUi = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const fontLiterary = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-literary',
  display: 'swap',
});

const fontBangla = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VerseVault — Personal Diary & Literary Archive',
  description:
    'A private, single-owner digital diary and literary archive for daily entries, poems, quotes, fragments, and prose in Bangla and English.',
  openGraph: {
    title: 'VerseVault — Personal Diary & Literary Archive',
    description:
      'A private, single-owner digital diary and literary archive for daily entries, poems, quotes, fragments, and prose in Bangla and English.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VerseVault — Personal Diary & Literary Archive',
    description:
      'A private, single-owner digital diary and literary archive for daily entries, poems, quotes, fragments, and prose in Bangla and English.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontUi.variable} ${fontLiterary.variable} ${fontBangla.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-screen bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--accent-soft)] selection:text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
