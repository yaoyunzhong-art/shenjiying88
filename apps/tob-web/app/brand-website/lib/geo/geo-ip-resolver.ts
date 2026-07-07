/**
 * IP地域解析服务
 * 支持基于IP地址的地域识别，用于GEO场景化内容匹配
 */

export interface GeoLocation {
  country: string;
  province: string;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

export interface RegionConfig {
  regionCode: string;
  regionName: string;
  localContent: string;
  contactPrefix: string;
  serviceAvailable: boolean;
}

export interface BusinessRegion {
  code: string;
  name: string;
  provinces: string[];
  tier: 'tier1' | 'tier2' | 'tier3';
}

// 中国省份与区域映射
const CHINA_REGION_MAP: Record<string, string> = {
  // 华北
  Beijing: 'north',
  Tianjin: 'north',
  Hebi: 'north',
  'Hebei': 'north',
  Shanxi: 'north',
  'Neimenggu': 'north',
  'Inner Mongolia': 'north',
  // 东北
  Liaoning: 'northeast',
  Jilin: 'northeast',
  Heilongjiang: 'northeast',
  // 华东
  Shanghai: 'east',
  Jiangsu: 'east',
  Zhejiang: 'east',
  Anhui: 'east',
  Fujian: 'east',
  Jiangxi: 'east',
  Shandong: 'east',
  // 华中
  Henan: 'central',
  Hubei: 'central',
  Hunan: 'central',
  // 华南
  Guangdong: 'south',
  Guangxi: 'south',
  Hainan: 'south',
  // 西南
  Chongqing: 'southwest',
  Sichuan: 'southwest',
  Guizhou: 'southwest',
  Yunnan: 'southwest',
  Xizang: 'southwest',
  Tibet: 'southwest',
  // 西北
  Shaanxi: 'northwest',
  Gansu: 'northwest',
  Qinghai: 'northwest',
  Ningxia: 'northwest',
  Xinjiang: 'northwest',
  // 港澳台
  'Hong Kong': 'other',
  'Macao': 'other',
  Taiwan: 'other',
};

// 业务覆盖区域配置
const BUSINESS_REGIONS: BusinessRegion[] = [
  {
    code: 'national',
    name: '全国',
    provinces: Object.keys(CHINA_REGION_MAP),
    tier: 'tier1',
  },
  {
    code: 'tier1',
    name: '一线城市',
    provinces: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'],
    tier: 'tier1',
  },
  {
    code: 'east',
    name: '华东地区',
    provinces: ['Shanghai', 'Jiangsu', 'Zhejiang', 'Anhui', 'Fujian', 'Jiangxi', 'Shandong'],
    tier: 'tier1',
  },
  {
    code: 'south',
    name: '华南地区',
    provinces: ['Guangdong', 'Guangxi', 'Hainan'],
    tier: 'tier2',
  },
  {
    code: 'central',
    name: '华中地区',
    provinces: ['Henan', 'Hubei', 'Hunan'],
    tier: 'tier2',
  },
  {
    code: 'north',
    name: '华北地区',
    provinces: ['Beijing', 'Tianjin', 'Hebi', 'Hebei', 'Shanxi', 'Inner Mongolia', 'Neimenggu'],
    tier: 'tier2',
  },
  {
    code: 'southwest',
    name: '西南地区',
    provinces: ['Chongqing', 'Sichuan', 'Guizhou', 'Yunnan', 'Xizang', 'Tibet'],
    tier: 'tier2',
  },
  {
    code: 'northwest',
    name: '西北地区',
    provinces: ['Shaanxi', 'Gansu', 'Qinghai', 'Ningxia', 'Xinjiang'],
    tier: 'tier3',
  },
  {
    code: 'northeast',
    name: '东北地区',
    provinces: ['Liaoning', 'Jilin', 'Heilongjiang'],
    tier: 'tier3',
  },
];

/**
 * IP地域解析器类
 */
export class GeoIPResolver {
  private cache: Map<string, { data: GeoLocation; timestamp: number }> = new Map();
  private cacheTTL: number = 3600000; // 1小时缓存
  private apiEndpoint?: string;

  constructor(apiEndpoint?: string) {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * 解析IP地址获取地域信息
   */
  async resolve(ip: string): Promise<GeoLocation | null> {
    // 跳过本地IP
    if (this.isPrivateIP(ip)) {
      return this.getDefaultLocation();
    }

    // 检查缓存
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const data = await this.fetchGeoData(ip);
      this.cache.set(ip, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[GeoIPResolver] Failed to resolve IP:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * 从API获取地域数据
   */
  private async fetchGeoData(ip: string): Promise<GeoLocation> {
    // 使用 ip-api.com 免费API (限制每分钟45次请求)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone,isp,org,as`);
    const result = await response.json();

    if (result.status === 'fail') {
      throw new Error('IP lookup failed');
    }

    return {
      country: result.country || 'China',
      province: result.regionName || '',
      city: result.city || '',
      latitude: result.lat,
      longitude: result.lon,
      timezone: result.timezone,
      isp: result.isp,
      org: result.org,
      as: result.as,
    };
  }

  /**
   * 判断是否为私有IP
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;

    // 127.0.0.0 - 127.255.255.255 (loopback)
    if (parts[0] === 127) return true;

    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;

    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && (parts[1] ?? 0) >= 16 && (parts[1] ?? 0) <= 31) return true;

    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  /**
   * 获取默认地域（中国大陆）
   */
  private getDefaultLocation(): GeoLocation {
    return {
      country: 'China',
      province: 'Beijing',
      city: 'Beijing',
      latitude: 39.9042,
      longitude: 116.4074,
      timezone: 'Asia/Shanghai',
    };
  }

  /**
   * 根据城市名获取所属大区
   */
  getRegionByCity(city: string): string {
    return CHINA_REGION_MAP[city] || 'other';
  }

  /**
   * 根据省份获取所属大区
   */
  getRegionByProvince(province: string): string {
    return CHINA_REGION_MAP[province] || 'other';
  }

  /**
   * 获取匹配的业务区域
   */
  matchBusinessRegion(geo: GeoLocation): BusinessRegion | null {
    // 优先匹配城市
    const city = geo.city;
    const province = geo.province;

    for (const region of BUSINESS_REGIONS) {
      if (region.provinces.includes(city) || region.provinces.includes(province)) {
        return region;
      }
    }

    // 返回全国
    return BUSINESS_REGIONS[0] ?? null;
  }

  /**
   * 获取地域化内容配置
   */
  getRegionContent(geo: GeoLocation): RegionConfig {
    const region = this.matchBusinessRegion(geo);

    const contentMap: Record<string, Omit<RegionConfig, 'regionCode' | 'regionName'>> = {
      tier1: {
        localContent: '一线城市专属服务',
        contactPrefix: '400',
        serviceAvailable: true,
      },
      tier2: {
        localContent: '重点城市服务覆盖',
        contactPrefix: '400',
        serviceAvailable: true,
      },
      tier3: {
        localContent: '全国服务网络',
        contactPrefix: '400',
        serviceAvailable: true,
      },
    };

    return {
      regionCode: region?.code || 'national',
      regionName: region?.name || '全国',
      ...(contentMap[region?.tier || 'tier1'] || contentMap.tier1)!,
    };
  }

  /**
   * 获取客户端IP地址（从请求头或直接获取）
   */
  getClientIP(headers?: Headers): string {
    // 优先从代理头获取
    if (headers) {
      const forwarded = headers.get('x-forwarded-for');
      if (forwarded) {
        return forwarded.split(',')[0]?.trim() ?? forwarded;
      }
      const realIP = headers.get('x-real-ip');
      if (realIP) {
        return realIP;
      }
    }
    return '';
  }

  /**
   * 获取所有业务区域
   */
  getAllBusinessRegions(): BusinessRegion[] {
    return BUSINESS_REGIONS;
  }
}

// ---- Next.js API Route 集成 ----

export const geoIPResolver = new GeoIPResolver();

/**
 * 地域信息响应格式
 */
export interface GeoResponse {
  ip: string;
  location: GeoLocation;
  region: BusinessRegion;
  regionContent: RegionConfig;
  timestamp: number;
}
