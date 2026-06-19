import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-config';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Documentation & API Reference | AnyFormat',
  description: 'Explore the user guide, tools reference, developer API routes, and privacy policy for AnyFormat. Self-hosted, private-first file conversion.',
  alternates: {
    canonical: `${siteUrl}/docs`,
  },
  openGraph: {
    title: 'Documentation & API Reference | AnyFormat',
    description: 'Explore the user guide, tools reference, developer API routes, and privacy policy for AnyFormat. Self-hosted, private-first file conversion.',
    url: `${siteUrl}/docs`,
    siteName: 'AnyFormat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation & API Reference | AnyFormat',
    description: 'Explore the user guide, tools reference, developer API routes, and privacy policy for AnyFormat. Self-hosted, private-first file conversion.',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
