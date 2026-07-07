/**
 * marketing/detail-utils.ts — Shared utilities for the campaign detail page.
 * Separated from the page component to avoid Next.js page export restrictions.
 * Exports pure functions for status/channel labels, state transitions, form validation,
 * and mock data lookup.
 */

import type { MarketingCampaign } from '../marketing-view-model';

// ---- 类型 ----

export type CampaignStatus = MarketingCampaign['status'];
export type CampaignChannel = MarketingCampaign['channel'];

// ---- 常量 ----

export const CHANNEL_OPTIONS: { value: CampaignChannel; label: string }[] = [
  { value: 'wechat', label: '微信' },
  { value: 'app_push', label: 'App推送' },
  { value: 'sms', label: '短信' },
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
];

export const STATUS_VARIANT: Record<CampaignStatus, 'success' | 'neutral' | 'warning' | 'info'> = {
  running: 'success',
  ended: 'neutral',
  scheduled: 'info',
  draft: 'warning',
};

// ---- 状态流转图 ----
// draft ───→ scheduled ───→ running ───→ ended
const STATUS_TRANSITIONS: Partial<Record<CampaignStatus, CampaignStatus>> = {
  draft: 'scheduled',
  scheduled: 'running',
  running: 'ended',
};

export function canTransition(status: CampaignStatus): CampaignStatus | null {
  return STATUS_TRANSITIONS[status] ?? null;
}

export function getNextTransitionLabel(status: CampaignStatus): string {
  switch (status) {
    case 'draft': return '发布排期';
    case 'scheduled': return '开始执行';
    case 'running': return '结束活动';
    default: return '';
  }
}

// ---- 活动详情数据 ----

export function getMarketingCampaignById(id: string): MarketingCampaign | null {
  const lookup: Record<string, MarketingCampaign> = {
    c1: {
      id: 'c1',
      name: '年中促销活动',
      channel: 'wechat',
      status: 'running',
      targetSegment: '活跃会员',
      reachCount: 28000,
      conversionRate: 6.8,
      cost: 35000,
      roi: 4.2,
      startAt: '2026-06-01',
      endAt: '2026-06-20',
    },
    c2: {
      id: 'c2',
      name: '新注册福利券',
      channel: 'app_push',
      status: 'ended',
      targetSegment: '新用户',
      reachCount: 5200,
      conversionRate: 18.3,
      cost: 8000,
      roi: 3.5,
      startAt: '2026-05-15',
      endAt: '2026-05-31',
    },
    c3: {
      id: 'c3',
      name: '会员日双倍积分',
      channel: 'sms',
      status: 'scheduled',
      targetSegment: '全部会员',
      reachCount: 18420,
      conversionRate: 0,
      cost: 1200,
      roi: 0,
      startAt: '2026-07-05',
      endAt: undefined,
    },
    c4: {
      id: 'c4',
      name: '端午节抖音直播',
      channel: 'douyin',
      status: 'draft',
      targetSegment: '新用户',
      reachCount: 0,
      conversionRate: 0,
      cost: 50000,
      roi: 0,
      startAt: '2026-06-22',
      endAt: undefined,
    },
    c5: {
      id: 'c5',
      name: '小红书种草计划',
      channel: 'xiaohongshu',
      status: 'draft',
      targetSegment: '活跃会员',
      reachCount: 0,
      conversionRate: 0,
      cost: 15000,
      roi: 0,
      startAt: '2026-07-01',
      endAt: undefined,
    },
  };
  return lookup[id] ?? null;
}

// ---- 表单验证 ----

export interface EditFormData {
  name: string;
  targetSegment: string;
  channel: CampaignChannel;
}

export interface EditFormErrors {
  name?: string;
  targetSegment?: string;
  channel?: string;
}

export function validateCampaignForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '活动名称不能为空';
  if (data.name.trim().length > 100) errors.name = '活动名称不能超过100个字符';
  if (!data.targetSegment.trim()) errors.targetSegment = '目标人群不能为空';
  if (!CHANNEL_OPTIONS.some((opt) => opt.value === data.channel)) {
    errors.channel = '请选择有效的渠道';
  }
  return errors;
}

// ---- Mock API ----

export async function submitCampaignEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

export async function submitStatusUpdate(
  campaign: MarketingCampaign,
  nextStatus: CampaignStatus
): Promise<{ success: boolean }> {
  void campaign;
  void nextStatus;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}
