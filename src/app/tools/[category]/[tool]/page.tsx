import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool, getCategoryInfo } from '@/lib/tools-registry';
import { getToolSeoMetadata } from '@/lib/seo-metadata';
import ToolClientPage from '@/components/conversion/ToolClientPage';

interface RouteProps {
  params: {
    category: string;
    tool: string;
  };
}

// ─── Dynamic SEO Metadata Generation ───
export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const tool = getTool(params.category, params.tool);
  const categoryInfo = getCategoryInfo(params.category);

  if (!tool || !categoryInfo) {
    return {
      title: 'Tool Not Found — AnyFormat',
    };
  }

  const seoInfo = getToolSeoMetadata(params.category, params.tool);

  const title = seoInfo ? seoInfo.title : `${tool.name} Online - Free & Secure ${categoryInfo.name} | AnyFormat`;
  const description = seoInfo ? seoInfo.description : `${tool.description}. Convert files safely with AnyFormat, the ultimate self-hosted file conversion suite. No limits, zero data tracking.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anyformat.in';
  const canonicalUrl = `${siteUrl}/tools/${params.category}/${params.tool}`;

  const customKeywords = seoInfo ? seoInfo.keywords : [];
  const baseKeywords = [
    tool.slug,
    tool.name.toLowerCase(),
    `${tool.name.toLowerCase()} online`,
    `free ${tool.name.toLowerCase()}`,
    params.category,
    categoryInfo.name.toLowerCase(),
    'file converter',
    'self-hosted conversion',
    'exif tool',
    'privacy tools',
  ];

  const keywords = Array.from(new Set([...customKeywords, ...baseKeywords]));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords,
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

export default function ConversionPage({ params }: RouteProps) {
  const tool = getTool(params.category, params.tool);
  const categoryInfo = getCategoryInfo(params.category);

  if (!tool || !categoryInfo) {
    notFound();
  }

  return <ToolClientPage />;
}
