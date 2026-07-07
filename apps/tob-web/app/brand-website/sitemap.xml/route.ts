/**
 * 动态站点地图API路由
 */

import { NextResponse } from 'next/server';
import { createBrandWebsiteSitemap } from '../lib/seo/sitemap-generator';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.shenjiying.com';

export async function GET() {
  try {
    const sitemap = createBrandWebsiteSitemap(BASE_URL);
    const xml = sitemap.generate();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[Sitemap API] Error:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>', {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
