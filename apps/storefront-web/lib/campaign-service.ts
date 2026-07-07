// campaign-service.ts · 活动服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type CampaignType = 'flash' | 'discount' | 'gift' | 'member';
export type CampaignStatus = 'upcoming' | 'ongoing' | 'ended';

export interface CampaignProduct {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  image?: string;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  type: CampaignType;
  typeName: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  banner?: string;
  tags: string[];
  description?: string;
  rules?: string[];
  benefits?: string[];
  products?: CampaignProduct[];
}

export interface CampaignListResponse {
  success: boolean;
  data?: {
    campaigns: Campaign[];
    total: number;
  };
  error?: { code: string; message: string };
}

export interface CampaignDetailResponse {
  success: boolean;
  data?: Campaign;
  error?: { code: string; message: string };
}

const TYPE_CONFIG: Record<CampaignType, { label: string; color: string }> = {
  flash: { label: '秒杀', color: '#ef4444' },
  discount: { label: '折扣', color: '#3b82f6' },
  gift: { label: '礼包', color: '#8b5cf6' },
  member: { label: '会员', color: '#f59e0b' },
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg?: string }> = {
  upcoming: { label: '即将开始', color: '#f59e0b', bg: '#f59e0b20' },
  ongoing: { label: '进行中', color: '#10b981', bg: '#10b98120' },
  ended: { label: '已结束', color: '#64748b', bg: '#64748b20' },
};

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: '夏季清凉节', subtitle: '指定商品5折起', type: 'discount', typeName: '折扣', startDate: '2026-07-01', endDate: '2026-07-31', status: 'ongoing', tags: ['夏季', '清凉', '折扣'] },
  { id: 'c2', title: '会员专享日', subtitle: '全场双倍积分', type: 'member', typeName: '会员', startDate: '2026-07-05', endDate: '2026-07-05', status: 'ongoing', tags: ['会员', '积分'] },
  { id: 'c3', title: '新人礼包', subtitle: '注册即送100元优惠券', type: 'gift', typeName: '礼包', startDate: '2026-06-01', endDate: '2026-12-31', status: 'ongoing', tags: ['新人', '礼包'] },
  { id: 'c4', title: '限时秒杀', subtitle: '每日10点准时开抢', type: 'flash', typeName: '秒杀', startDate: '2026-07-01', endDate: '2026-07-03', status: 'upcoming', tags: ['限时', '秒杀'] },
  { id: 'c5', title: '端午特惠', subtitle: '满200减50', type: 'discount', typeName: '折扣', startDate: '2026-06-01', endDate: '2026-06-15', status: 'ended', tags: ['端午', '特惠'] },
];

const MOCK_DETAILS: Record<string, Campaign> = {
  'c1': {
    id: 'c1', title: '夏季清凉节', subtitle: '指定商品5折起', type: 'discount', typeName: '折扣',
    startDate: '2026-07-01', endDate: '2026-07-31', status: 'ongoing', tags: ['夏季', '清凉', '折扣'],
    description: '炎炎夏日，神机营为您带来清凉特惠！指定商品低至5折，会员更可享受折上9折优惠。',
    rules: ['活动时间：2026年7月1日-7月31日', '指定商品享受5-8折优惠', '会员可享受折上9折优惠', '优惠不与其他活动同享'],
    benefits: ['夏季单品低至5折', '会员专享额外9折', '购物满299元包邮'],
    products: [
      { id: 'p1', name: '夏季运动T恤', originalPrice: 299, salePrice: 149 },
      { id: 'p2', name: '透气运动短裤', originalPrice: 199, salePrice: 99 },
      { id: 'p3', name: '轻便运动背包', originalPrice: 399, salePrice: 199 },
    ],
  },
  'c2': {
    id: 'c2', title: '会员专享日', subtitle: '全场双倍积分', type: 'member', typeName: '会员',
    startDate: '2026-07-05', endDate: '2026-07-05', status: 'ongoing', tags: ['会员', '积分'],
    description: '每月5日为神机营会员专享日，当天消费可获得双倍积分，积分可在积分商城兑换丰富礼品！',
    rules: ['活动时间：每月5日 00:00-23:59', '当日消费获得双倍积分', '积分将于活动结束后7个工作日内到账'],
    benefits: ['消费双倍积分', '积分商城专享兑换', '会员专属礼品'],
    products: [],
  },
  'c3': {
    id: 'c3', title: '新人礼包', subtitle: '注册即送100元优惠券', type: 'gift', typeName: '礼包',
    startDate: '2026-06-01', endDate: '2026-12-31', status: 'ongoing', tags: ['新人', '礼包'],
    description: '新用户注册即送价值100元新人礼包，包含多张优惠券和积分，快来领取吧！',
    rules: ['活动时间：长期有效', '仅限新用户首次领取', '礼包包含：20元无门槛券、50元满减券、30元折扣券'],
    benefits: ['20元无门槛券', '50元满200减50券', '30元商品折扣券', '注册即送100积分'],
    products: [],
  },
};

export class CampaignService {
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
   * 获取活动列表
   * GET /campaigns
   */
  async getCampaigns(options?: {
    status?: CampaignStatus;
    page?: number;
    pageSize?: number;
  }): Promise<CampaignListResponse> {
    const { status, page = 1, pageSize = 20 } = options ?? {};

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status) params.set('status', status);

      const response = await fetch(`${this.baseUrl}/campaigns?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取活动列表失败' } };
      }

      return { success: true, data: data.data ?? { campaigns: MOCK_CAMPAIGNS, total: MOCK_CAMPAIGNS.length } };
    } catch (error) {
      console.error('Get campaigns error:', error);
      return { success: true, data: { campaigns: MOCK_CAMPAIGNS, total: MOCK_CAMPAIGNS.length } };
    }
  }

  /**
   * 获取活动详情
   * GET /campaigns/{campaignId}
   */
  async getCampaignDetail(campaignId: string): Promise<CampaignDetailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取活动详情失败' } };
      }

      return { success: true, data: data.data ?? MOCK_DETAILS[campaignId] ?? MOCK_CAMPAIGNS[0] };
    } catch (error) {
      console.error('Get campaign detail error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 参与活动
   * POST /campaigns/{campaignId}/join
   */
  async joinCampaign(campaignId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'JOIN_ERROR', message: data.message ?? '参与活动失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Join campaign error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }
}

export const campaignService = new CampaignService();
export { TYPE_CONFIG, STATUS_CONFIG };
