import type { Metadata } from 'next';
import { AVAILABLE_TOOLS, CATEGORIES, getCategoryInfo } from '@/lib/tools-registry';
import ToolsListClient from '@/components/conversion/ToolsListClient';

interface ToolsPageProps {
  searchParams: {
    category?: string;
  };
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const activeCategory = searchParams.category;
  const categoryInfo = activeCategory ? getCategoryInfo(activeCategory) : null;

  const title = categoryInfo
    ? `${categoryInfo.name} Online - Free & Secure Tools | AnyFormat`
    : 'All File Conversion Tools - PDF, Video, Image, Audio | AnyFormat';

  const description = categoryInfo
    ? `${categoryInfo.description}. Access professional, self-hosted, secure, and fast tools for ${categoryInfo.name.toLowerCase()} with zero logs.`
    : `Access ${AVAILABLE_TOOLS.length} free, secure, and self-hosted file conversion tools. Compress, convert, merge, split, and edit files with complete privacy.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anyformat.in';
  const canonicalUrl = activeCategory
    ? `${siteUrl}/tools?category=${activeCategory}`
    : `${siteUrl}/tools`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'AnyFormat',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ToolsPage({ searchParams }: ToolsPageProps) {
  const activeCategory = searchParams.category || 'all';

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            All Conversion Tools
          </h1>
          <p className="text-text-secondary text-lg">
            {AVAILABLE_TOOLS.length} tools across {CATEGORIES.filter(c => AVAILABLE_TOOLS.some(t => t.category === c.slug)).length} categories
          </p>
        </div>

        {/* Dynamic Category Tabs & Live Search */}
        <ToolsListClient initialCategory={activeCategory} />
      </div>
    </div>
  );
}
