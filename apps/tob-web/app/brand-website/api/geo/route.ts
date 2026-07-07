/**
 * IP地域解析API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { geoIPResolver, type GeoResponse } from '../../lib/geo/geo-ip-resolver';

export async function GET(request: NextRequest) {
  try {
    // 获取客户端IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? (forwarded.split(',')[0] ?? '').trim() : request.headers.get('x-real-ip') || '';

    // 解析IP
    const location = await geoIPResolver.resolve(ip);

    if (!location) {
      return NextResponse.json<GeoResponse>(
        {
          ip,
          location: {
            country: 'Unknown',
            province: '',
            city: '',
          },
          region: {
            code: 'unknown',
            name: '未知',
            provinces: [],
            tier: 'tier3',
          },
          regionContent: {
            regionCode: 'unknown',
            regionName: '未知',
            localContent: '服务区域信息获取失败',
            contactPrefix: '400',
            serviceAvailable: false,
          },
          timestamp: Date.now(),
        },
        { status: 200 }
      );
    }

    // 获取匹配的区域
    const region = geoIPResolver.matchBusinessRegion(location);
    const regionContent = geoIPResolver.getRegionContent(location);

    const response: GeoResponse = {
      ip,
      location,
      region: region || {
        code: 'national',
        name: '全国',
        provinces: [],
        tier: 'tier1',
      },
      regionContent,
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Geo API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve geo location' },
      { status: 500 }
    );
  }
}
