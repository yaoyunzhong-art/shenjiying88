/**
 * 站点地图生成器
 * Sitemap Generator for sports-ants
 */

import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.bigants.net';

const routes = [
  { url: '', changefreq: 'weekly', priority: 1.0 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/solutions', changefreq: 'weekly', priority: 0.9 },
  { url: '/products', changefreq: 'weekly', priority: 0.9 },
  { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
  { url: '/franchise', changefreq: 'monthly', priority: 0.7 },
  { url: '/epc', changefreq: 'monthly', priority: 0.7 },
  { url: '/cases', changefreq: 'weekly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.9 },
  { url: '/resources', changefreq: 'weekly', priority: 0.7 },
  { url: '/help', changefreq: 'monthly', priority: 0.6 },
  { url: '/news', changefreq: 'daily', priority: 0.8 },
  { url: '/ai', changefreq: 'weekly', priority: 0.9 },
  { url: '/console', changefreq: 'weekly', priority: 0.7 },
  { url: '/login', changefreq: 'yearly', priority: 0.5 },
  { url: '/register', changefreq: 'yearly', priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  return routes.map((route) => ({
    url: `${BASE_URL}${route.url}`,
    lastModified: currentDate,
    changeFrequency: route.changefreq as 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
    priority: route.priority,
  }));
}
