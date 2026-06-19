import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools-registry';
import { getSiteUrl } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  // Base routes
  const routes = [
    '',
    '/tools',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic tool detail routes
  const toolRoutes = TOOLS.map((tool) => ({
    url: `${baseUrl}/tools/${tool.category}/${tool.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...routes, ...toolRoutes];
}
