// favorites-service.ts · 收藏服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  storeName: string;
  addedAt: string;
}

export interface FavoriteStore {
  id: string;
  name: string;
  address: string;
  district: string;
  features: string[];
  addedAt: string;
}

export interface FavoritesResponse {
  success: boolean;
  data?: {
    products: FavoriteProduct[];
    stores: FavoriteStore[];
    total: number;
  };
  error?: { code: string; message: string };
}

const MOCK_PRODUCTS: FavoriteProduct[] = [
  { id: 'p1', name: '夏季运动T恤', price: 199, originalPrice: 299, storeName: '神机营旗舰店', addedAt: '2026-06-28' },
  { id: 'p2', name: '透气运动短裤', price: 129, storeName: '神机营旗舰店', addedAt: '2026-06-25' },
  { id: 'p3', name: '轻便运动背包', price: 299, originalPrice: 399, storeName: '神机营社区店', addedAt: '2026-06-20' },
];

const MOCK_STORES: FavoriteStore[] = [
  { id: 's1', name: '神机营旗舰店', address: '科技南路88号', district: '南山区', features: ['新品首发', '会员专享'], addedAt: '2026-05-15' },
  { id: 's2', name: '神机营福田店', address: '华强北路100号', district: '福田区', features: ['24小时营业'], addedAt: '2026-06-01' },
];

export class FavoritesService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('member_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * 获取收藏列表
   * GET /favorites
   */
  async getFavorites(): Promise<FavoritesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取收藏列表失败' } };
      }

      return { success: true, data: data.data ?? { products: MOCK_PRODUCTS, stores: MOCK_STORES, total: MOCK_PRODUCTS.length + MOCK_STORES.length } };
    } catch (error) {
      console.error('Get favorites error:', error);
      return { success: true, data: { products: MOCK_PRODUCTS, stores: MOCK_STORES, total: MOCK_PRODUCTS.length + MOCK_STORES.length } };
    }
  }

  /**
   * 添加商品收藏
   * POST /favorites/products
   */
  async addProductFavorite(productId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'ADD_ERROR', message: data.message ?? '添加收藏失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Add product favorite error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 移除商品收藏
   * DELETE /favorites/products/{productId}
   */
  async removeProductFavorite(productId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'REMOVE_ERROR', message: data.message ?? '移除收藏失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Remove product favorite error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 添加门店收藏
   * POST /favorites/stores
   */
  async addStoreFavorite(storeId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ storeId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'ADD_ERROR', message: data.message ?? '添加收藏失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Add store favorite error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 移除门店收藏
   * DELETE /favorites/stores/{storeId}
   */
  async removeStoreFavorite(storeId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/favorites/stores/${storeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'REMOVE_ERROR', message: data.message ?? '移除收藏失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Remove store favorite error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }
}

export const favoritesService = new FavoritesService();
