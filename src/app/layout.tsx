import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

import type { Viewport } from 'next';
import { getSiteUrl } from '@/lib/site-config';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'AnyFormat — Free Self-Hosted File Converter',
    template: '%s | AnyFormat',
  },
  description:
    'Convert files for free. PDF, images, video, audio, documents, and archives. Self-hosted, no tracking, no limits. Your files never leave your server.',
  keywords: [
    'file converter',
    'pdf converter',
    'image converter',
    'video converter',
    'audio converter',
    'document converter',
    'archive creator',
    'online ocr',
    'exif purger',
    'social video downloader',
    'latex converter',
    'self-hosted',
    'free converter',
    'privacy first file tool',
    'jpg to png converter',
    'png to jpg converter',
    'pdf to word converter',
    'word to pdf converter',
    'mp4 to mp3 converter',
    'compress pdf online',
    'compress image online',
    'merge pdf online',
    'split pdf online',
    'pdf to jpg converter',
    'image to pdf converter',
    'webp to png converter',
    'mp4 to gif converter',
    'ocr pdf to text',
    'remove background online',
    'resize image online',
    'convert docx to pdf',
    'extract audio from video',
    'zip file extractor',
    'free online file converter',
    'no watermark converter',
    'no signup file converter',
    'offline file converter',
    'private file converter',
    'secure pdf converter',
    'cloudconvert alternative',
    'ilovepdf alternative',
    'smallpdf alternative',
  ],
  authors: [{ name: 'AnyFormat' }],
  creator: 'AnyFormat',
  publisher: 'AnyFormat',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AnyFormat — Convert Any File Free Forever',
    description:
      'Convert files for free. PDF, images, video, audio, documents, and archives. Self-hosted, no tracking, no limits. Your files never leave your server.',
    url: getSiteUrl(),
    siteName: 'AnyFormat',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnyFormat — Convert Any File Free Forever',
    description:
      'Convert files for free. PDF, images, video, audio, documents, and archives. Self-hosted, no tracking, no limits. Your files never leave your server.',
    creator: '@anyformat',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AnyFormat',
  url: getSiteUrl(),
  description: 'Free self-hosted file conversion platform. Convert PDF, images, video, audio, documents, and archives with complete privacy.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'PDF conversion and editing',
    'Image format conversion',
    'Video conversion and compression',
    'Audio format conversion',
    'URL shortening with analytics',
    'Document conversion',
    'Archive creation and extraction',
    'OCR text recognition',
    'EXIF metadata removal',
    'QR code generation',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-background text-text-primary min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
