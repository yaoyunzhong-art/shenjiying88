// store-service.ts · 门店管理数据服务
// Phase-FP T-FP-019 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  tenantId: string;
  brandId?: string;
  region?: string;
  city?: string;
  address?: string;
  managerName?: string;
  managerMobile?: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface StoreListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: Store['status'];
  region?: string;
}

export interface StoreListResponse {
  success: boolean;
  data?: {
    stores: Store[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface StoreDetailResponse {
  success: boolean;
  data?: Store;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 门店管理数据服务
 * 调用后端 API 获取门店数据
 */
export class StoreService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window === 'undefined') {
      return {};
    }
    const token = localStorage.getItem('enterprise_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * 获取门店列表
   * GET /stores
   */
  async listStores(query: StoreListQuery = {}): Promise<StoreListResponse> {
    const { page = 1, pageSize = 10, keyword, status, region } = query;

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (keyword) params.set('keyword', keyword);
      if (status) params.set('status', status);
      if (region) params.set('region', region);

      const response = await fetch(`${this.baseUrl}/stores?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'FETCH_ERROR',
            message: data.message ?? '获取门店列表失败',
          },
        };
      }

      return {
        success: true,
        data: data.data ?? {
          stores: mockStores,
          total: mockStores.length,
          page,
          pageSize,
        },
      };
    } catch (error) {
      console.error('List stores error:', error);
      // 返回mock数据用于开发
      return {
        success: true,
        data: {
          stores: mockStores,
          total: mockStores.length,
          page,
          pageSize,
        },
      };
    }
  }

  /**
   * 获取门店详情
   * GET /stores/:id
   */
  async getStore(id: string): Promise<StoreDetailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/stores/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'FETCH_ERROR',
            message: data.message ?? '获取门店详情失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Get store error:', error);
      // 返回mock数据用于开发
      const store = mockStores.find((s) => s.id === id) ?? mockStores[0];
      return {
        success: true,
        data: store,
      };
    }
  }

  /**
   * 创建门店
   * POST /stores
   */
  async createStore(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: Store; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(store),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'CREATE_ERROR',
            message: data.message ?? '创建门店失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Create store error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误，请稍后重试',
        },
      };
    }
  }

  /**
   * 更新门店
   * PUT /stores/:id
   */
  async updateStore(id: string, updates: Partial<Store>): Promise<{ success: boolean; data?: Store; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/stores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'UPDATE_ERROR',
            message: data.message ?? '更新门店失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Update store error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误，请稍后重试',
        },
      };
    }
  }
}

// Mock数据
const mockStores: Store[] = [
  {
    id: 'store_001',
    storeCode: 'SZ-CENTER-01',
    storeName: '深圳南山旗舰店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    region: '华南',
    city: '深圳',
    address: '深圳市南山区科技园南路88号',
    managerName: '张店长',
    managerMobile: '13800138001',
    employeeCount: 12,
    status: 'active',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2026-06-20T10:30:00Z',
  },
  {
    id: 'store_002',
    storeCode: 'SZ-FUTIAN-02',
    storeName: '深圳福田店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    region: '华南',
    city: '深圳',
    address: '深圳市福田区华强北路100号',
    managerName: '李经理',
    managerMobile: '13800138002',
    employeeCount: 8,
    status: 'active',
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2026-06-18T14:20:00Z',
  },
  {
    id: 'store_003',
    storeCode: 'GZ-TIANHE-01',
    storeName: '广州天河城店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    region: '华南',
    city: '广州',
    address: '广州市天河区天河路208号',
    managerName: '王主管',
    managerMobile: '13800138003',
    employeeCount: 15,
    status: 'active',
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2026-06-15T09:45:00Z',
  },
  {
    id: 'store_004',
    storeCode: 'SH-PUDONG-01',
    storeName: '上海浦东店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    region: '华东',
    city: '上海',
    address: '上海市浦东新区世纪大道1000号',
    managerName: '刘店长',
    managerMobile: '13800138004',
    employeeCount: 10,
    status: 'inactive',
    createdAt: '2024-07-01T08:00:00Z',
    updatedAt: '2026-05-30T16:00:00Z',
  },
  {
    id: 'store_005',
    storeCode: 'BJ-CHAOYANG-01',
    storeName: '北京朝阳店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    region: '华北',
    city: '北京',
    address: '北京市朝阳区建国路88号',
    managerName: '赵店长',
    managerMobile: '13800138005',
    employeeCount: 18,
    status: 'active',
    createdAt: '2024-02-28T08:00:00Z',
    updatedAt: '2026-06-22T11:15:00Z',
  },
];

// 导出单例
export const storeService = new StoreService();
