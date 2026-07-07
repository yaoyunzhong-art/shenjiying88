/**
 * Robots.txt 配置
 * Robots.txt for sports-ants
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/console/',
          '/login/',
          '/register/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
    ],
    sitemap: 'https://www.bigants.net/sitemap.xml',
    host: 'https://www.bigants.net',
  };
}
