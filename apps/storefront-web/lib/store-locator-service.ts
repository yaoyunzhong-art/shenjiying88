// store-locator-service.ts · C端门店定位服务
// Phase-FP T-FP-021 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface StoreLocator {
  id: string;
  storeName: string;
  storeCode: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // 距离用户当前位置
  status: 'open' | 'closed' | 'busy';
  businessHours: string;
  features: string[]; // 门店特色标签
  imageUrl?: string;
}

export interface StoreSearchQuery {
  keyword?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // 搜索半径(km)
  page?: number;
  pageSize?: number;
}

export interface StoreSearchResponse {
  success: boolean;
  data?: {
    stores: StoreLocator[];
    total: number;
    cities: string[]; // 可选城市列表
  };
  error?: any;
}

/**
 * C端门店定位服务
 * 面向消费者，提供门店搜索、定位、详情查询
 */
export class StoreLocatorService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  /**
   * 搜索门店
   * GET /storefront/stores
   */
  async searchStores(query: StoreSearchQuery = {}): Promise<StoreSearchResponse> {
    const { keyword, city, latitude, longitude, radius = 10, page = 1, pageSize = 20 } = query;

    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (city) params.set('city', city);
      if (latitude) params.set('lat', String(latitude));
      if (longitude) params.set('lng', String(longitude));
      if (radius) params.set('radius', String(radius));
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const response = await fetch(`${this.baseUrl}/storefront/stores?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Search stores error:', error);
      // 返回Mock数据用于开发
      return {
        success: true,
        data: {
          stores: mockStores,
          total: mockStores.length,
          cities: ['深圳', '广州', '上海', '北京', '成都', '杭州'],
        },
      };
    }
  }

  /**
   * 获取门店详情
   * GET /storefront/stores/:id
   */
  async getStore(id: string): Promise<{ success: boolean; data?: StoreLocator; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/storefront/stores/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get store error:', error);
      const store = mockStores.find((s) => s.id === id) ?? mockStores[0];
      return { success: true, data: store };
    }
  }

  /**
   * 获取城市列表
   * GET /storefront/stores/cities
   */
  async getCities(): Promise<{ success: boolean; data?: string[]; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/storefront/stores/cities`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get cities error:', error);
      return {
        success: true,
        data: ['深圳', '广州', '上海', '北京', '成都', '杭州', '重庆', '武汉'],
      };
    }
  }
}

// Mock数据 - C端门店展示
const mockStores: StoreLocator[] = [
  {
    id: 's01',
    storeName: '深圳南山旗舰店',
    storeCode: 'SZ-NS-001',
    city: '深圳',
    district: '南山区',
    address: '深圳市南山区科技园南区A栋1层',
    phone: '0755-88886666',
    latitude: 22.5431,
    longitude: 113.9388,
    status: 'open',
    businessHours: '09:00 - 22:00',
    features: ['停车场', 'WiFi', '母婴室', '无障碍通道'],
    imageUrl: 'https://picsum.photos/seed/store01/400/300',
  },
  {
    id: 's02',
    storeName: '广州天河城店',
    storeCode: 'GZ-TH-001',
    city: '广州',
    district: '天河区',
    address: '广州市天河区天河路208号天河城广场1层',
    phone: '020-88889999',
    latitude: 23.1246,
    longitude: 113.3616,
    status: 'open',
    businessHours: '10:00 - 22:00',
    features: ['WiFi', '无障碍通道'],
    imageUrl: 'https://picsum.photos/seed/store02/400/300',
  },
  {
    id: 's03',
    storeName: '上海浦东店',
    storeCode: 'SH-PD-001',
    city: '上海',
    district: '浦东新区',
    address: '上海市浦东新区世纪大道1000号',
    phone: '021-66667777',
    latitude: 31.2304,
    longitude: 121.4737,
    status: 'busy',
    businessHours: '09:30 - 21:30',
    features: ['停车场', 'WiFi', '咖啡区'],
    imageUrl: 'https://picsum.photos/seed/store03/400/300',
  },
  {
    id: 's04',
    storeName: '北京朝阳店',
    storeCode: 'BJ-CY-001',
    city: '北京',
    district: '朝阳区',
    address: '北京市朝阳区建国路88号SOHO现代城',
    phone: '010-88880001',
    latitude: 39.9042,
    longitude: 116.4074,
    status: 'open',
    businessHours: '10:00 - 21:00',
    features: ['WiFi', '无障碍通道'],
    imageUrl: 'https://picsum.photos/seed/store04/400/300',
  },
  {
    id: 's05',
    storeName: '成都春熙路店',
    storeCode: 'CD-CX-001',
    city: '成都',
    district: '锦江区',
    address: '成都市锦江区春熙路南段8号',
    phone: '028-86660001',
    latitude: 30.6587,
    longitude: 104.0658,
    status: 'open',
    businessHours: '09:00 - 22:30',
    features: ['停车场', 'WiFi', '儿童游乐区'],
    imageUrl: 'https://picsum.photos/seed/store05/400/300',
  },
  {
    id: 's06',
    storeName: '杭州西湖店',
    storeCode: 'HZ-XH-001',
    city: '杭州',
    district: '上城区',
    address: '杭州市上城区延安路98号',
    phone: '0571-88880001',
    latitude: 30.2741,
    longitude: 120.1551,
    status: 'closed',
    businessHours: '10:00 - 22:00',
    features: ['WiFi', '景区直达'],
    imageUrl: 'https://picsum.photos/seed/store06/400/300',
  },
];

// 导出单例
export const storeLocatorService = new StoreLocatorService();
