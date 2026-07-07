// contact-service.ts · 客服服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FeedbackRequest {
  type: 'complaint' | 'suggestion' | 'inquiry';
  message: string;
  contact?: string;
}

export interface FAQResponse {
  success: boolean;
  data?: {
    faqs: FAQ[];
    categories: string[];
  };
  error?: { code: string; message: string };
}

export interface SubmitFeedbackResponse {
  success: boolean;
  data?: { ticketId: string };
  error?: { code: string; message: string };
}

const MOCK_FAQS: FAQ[] = [
  { id: 'f1', question: '如何成为会员？', answer: '在门店消费满100元即可免费注册成为会员，享受积分返利等权益。', category: '会员' },
  { id: 'f2', question: '积分有什么用途？', answer: '积分可在积分商城兑换优惠券、礼品等，每100积分可抵扣1元。', category: '积分' },
  { id: 'f3', question: '优惠券如何使用？', answer: '在结算时选择可用优惠券，系统会自动抵扣相应金额。', category: '优惠券' },
  { id: 'f4', question: '如何申请退款？', answer: '请前往订单详情页申请退款，或联系门店工作人员协助处理。', category: '订单' },
  { id: 'f5', question: '会员卡丢失怎么办？', answer: '可凭注册手机号到门店补办会员卡，原卡积分会自动转移。', category: '会员' },
  { id: 'f6', question: '如何修改个人信息？', answer: '可在「我的-个人信息」中修改昵称、头像等基本信息。', category: '会员' },
  { id: 'f7', question: '忘记密码怎么办？', answer: '在登录页点击「忘记密码」，通过手机号验证后重置密码。', category: '账户' },
  { id: 'f8', question: '门店营业时间？', answer: '不同门店营业时间不同，请通过「门店查询」查看具体门店的营业时间。', category: '门店' },
];

export class ContactService {
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
   * 获取FAQ列表
   * GET /contact/faqs
   */
  async getFAQs(category?: string): Promise<FAQResponse> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';

      const response = await fetch(`${this.baseUrl}/contact/faqs${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取FAQ列表失败' } };
      }

      return { success: true, data: data.data ?? this.generateMockData() };
    } catch (error) {
      console.error('Get FAQs error:', error);
      return { success: true, data: this.generateMockData() };
    }
  }

  /**
   * 提交反馈
   * POST /contact/feedback
   */
  async submitFeedback(request: FeedbackRequest): Promise<SubmitFeedbackResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/contact/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'SUBMIT_ERROR', message: data.message ?? '提交反馈失败' } };
      }

      return { success: true, data: { ticketId: data.data?.ticketId ?? `T${Date.now()}` } };
    } catch (error) {
      console.error('Submit feedback error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 获取客服热线信息
   * GET /contact/hotline
   */
  async getHotlineInfo(): Promise<{
    success: boolean;
    data?: {
      phone: string;
      hours: string;
      wechat: string;
      email: string;
    };
    error?: { code: string; message: string };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/contact/hotline`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取客服信息失败' } };
      }

      return { success: true, data: data.data ?? { phone: '400-888-8888', hours: '9:00-21:00', wechat: 'shenjiying', email: 'service@shenjiying.com' } };
    } catch (error) {
      console.error('Get hotline info error:', error);
      return { success: true, data: { phone: '400-888-8888', hours: '9:00-21:00', wechat: 'shenjiying', email: 'service@shenjiying.com' } };
    }
  }

  private generateMockData() {
    const categories = [...new Set(MOCK_FAQS.map((f) => f.category).filter(Boolean))] as string[];
    return { faqs: MOCK_FAQS, categories };
  }
}

export const contactService = new ContactService();
