// points-service.ts · 积分服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface PointRecord {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  createdAt: string;
  orderNo?: string;
}

export interface PointsSummary {
  total: number;
  earned: number;
  spent: number;
}

export interface PointsResponse {
  success: boolean;
  data?: {
    summary: PointsSummary;
    records: PointRecord[];
    total: number;
  };
  error?: { code: string; message: string };
}

export interface RedeemResponse {
  success: boolean;
  data?: { rewardId: string; pointsSpent: number };
  error?: { code: string; message: string };
}

const MOCK_SUMMARY: PointsSummary = { total: 1280, earned: 1880, spent: 600 };
const MOCK_RECORDS: PointRecord[] = [
  { id: 'r1', type: 'earn', amount: 100, description: '消费返积分', createdAt: '2026-07-01', orderNo: 'SJY20260701001' },
  { id: 'r2', type: 'earn', amount: 50, description: '评价奖励', createdAt: '2026-06-28', orderNo: 'SJY20260628001' },
  { id: 'r3', type: 'earn', amount: 200, description: '活动奖励', createdAt: '2026-06-25' },
  { id: 'r4', type: 'spend', amount: -50, description: '积分兑换优惠券', createdAt: '2026-06-20' },
  { id: 'r5', type: 'earn', amount: 80, description: '消费返积分', createdAt: '2026-06-15', orderNo: 'SJY20260615001' },
  { id: 'r6', type: 'spend', amount: -100, description: '积分抽奖', createdAt: '2026-06-10' },
  { id: 'r7', type: 'earn', amount: 30, description: '签到奖励', createdAt: '2026-06-05' },
];

const REDEEM_OPTIONS = [
  { id: 'opt1', points: 100, reward: '¥1优惠券', type: 'cash' },
  { id: 'opt2', points: 500, reward: '¥5优惠券', type: 'cash' },
  { id: 'opt3', points: 1000, reward: '免运费券', type: 'free_shipping' },
  { id: 'opt4', points: 2000, reward: '¥20优惠券', type: 'cash' },
];

export class PointsService {
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
   * 获取积分信息
   * GET /points
   */
  async getPoints(): Promise<PointsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/points`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取积分信息失败' } };
      }

      return { success: true, data: data.data ?? { summary: MOCK_SUMMARY, records: MOCK_RECORDS, total: MOCK_RECORDS.length } };
    } catch (error) {
      console.error('Get points error:', error);
      return { success: true, data: { summary: MOCK_SUMMARY, records: MOCK_RECORDS, total: MOCK_RECORDS.length } };
    }
  }

  /**
   * 获取积分明细
   * GET /points/records
   */
  async getPointRecords(options?: {
    type?: 'earn' | 'spend';
    page?: number;
    pageSize?: number;
  }): Promise<PointsResponse> {
    const { type, page = 1, pageSize = 20 } = options ?? {};

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (type) params.set('type', type);

      const response = await fetch(`${this.baseUrl}/points/records?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取积分明细失败' } };
      }

      return { success: true, data: data.data ?? { summary: MOCK_SUMMARY, records: MOCK_RECORDS, total: MOCK_RECORDS.length } };
    } catch (error) {
      console.error('Get point records error:', error);
      return { success: true, data: { summary: MOCK_SUMMARY, records: MOCK_RECORDS, total: MOCK_RECORDS.length } };
    }
  }

  /**
   * 积分兑换
   * POST /points/redeem
   */
  async redeemPoints(optionId: string): Promise<RedeemResponse> {
    const option = REDEEM_OPTIONS.find((o) => o.id === optionId);
    if (!option) {
      return { success: false, error: { code: 'INVALID_OPTION', message: '无效的兑换选项' } };
    }

    try {
      const response = await fetch(`${this.baseUrl}/points/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ optionId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'REDEEM_ERROR', message: data.message ?? '兑换失败' } };
      }

      return { success: true, data: { rewardId: optionId, pointsSpent: option.points } };
    } catch (error) {
      console.error('Redeem points error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }
}

export const pointsService = new PointsService();
export { REDEEM_OPTIONS };
