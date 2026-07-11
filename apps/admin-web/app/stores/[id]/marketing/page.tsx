'use client';

/**
 * 门店营销活动管理 - Store Marketing Page
 * 角色: 📢营销运营 / 👔店长
 * 功能: 活动列表、创建活动、活动数据、优惠券管理、推送管理
 */

import { useState, useMemo, useCallback, use } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  WorkspaceBreadcrumb,
  useSortedItems,
  InfoRow,
  StatCard,
  CopyToClipboard,
  DetailClosureBar,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

// ---- 类型定义 ----

type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'cancelled';
type CampaignType = 'discount' | 'coupon' | 'points_multiply' | 'referral' | 'event' | 'seasonal' | 'new_member' | 'flash_sale';
type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled';
type PushStatus = 'sent' | 'pending' | 'failed' | 'scheduled' | 'draft_push';

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  revenue: number;
  roi: number;
  participants: number;
  newMembers: number;
  description: string;
  targetAudience: string;
  channels: string[];
  createdBy: string;
  approvedBy: string;
}

interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'fixed' | 'percentage' | 'free_shipping';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  totalIssued: number;
  totalUsed: number;
  usageRate: number;
  status: CouponStatus;
  startDate?: string;
  endDate?: string;
  applicableProducts: string[];
  perUserLimit: number;
  description: string;
}

interface PushMessage {
  id: string;
  title: string;
  content: string;
  type: 'sms' | 'app_push' | 'wechat' | 'announcement';
  status: PushStatus;
  targetAudience: string;
  targetCount: number;
  deliveredCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  scheduledAt: string;
  sentAt: string;
  createdBy: string;
}

// ---- 常量 ----

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  discount: '折扣活动',
  coupon: '优惠券发放',
  points_multiply: '积分翻倍',
  referral: '老带新',
  event: '现场活动',
  seasonal: '季节性活动',
  new_member: '新会员礼包',
  flash_sale: '限时抢购',
};

const CAMPAIGN_TYPE_ICONS: Record<CampaignType, string> = {
  discount: '🏷️',
  coupon: '🎫',
  points_multiply: '⭐',
  referral: '👥',
  event: '🎪',
  seasonal: '🎄',
  new_member: '🆕',
  flash_sale: '⚡',
};

const CAMPAIGN_STATUS_MAP: Record<CampaignStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  ended: { label: '已结束', variant: 'info' },
  cancelled: { label: '已取消', variant: 'danger' },
};

const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  active: { label: '进行中', variant: 'success' },
  expired: { label: '已过期', variant: 'danger' },
  exhausted: { label: '已领完', variant: 'neutral' },
  disabled: { label: '已停用', variant: 'warning' },
};

const PUSH_STATUS_MAP: Record<PushStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' | 'info' }> = {
  sent: { label: '已发送', variant: 'success' },
  pending: { label: '发送中', variant: 'warning' },
  failed: { label: '失败', variant: 'danger' },
  scheduled: { label: '已计划', variant: 'info' },
  draft_push: { label: '草稿', variant: 'neutral' },
};

// ---- Mock 数据 ----

function generateCampaigns(): Campaign[] {
  const types: CampaignType[] = ['discount', 'coupon', 'points_multiply', 'referral', 'event', 'seasonal', 'new_member', 'flash_sale'];
  const names = [
    '618年中大促', '夏日清凉季', '会员积分翻倍周', '老带新送游戏币',
    '周末亲子派对', '元旦跨年狂欢', '新人注册礼包', '整点限时抢购',
    '七夕情侣活动', '开学季特惠', '会员生日专属', '万圣节化妆派对',
    '双11狂欢', '圣诞嘉年华', '季度大促', '店庆周年活动',
  ];
  const audiences = ['全部会员', '新注册会员', '高活跃会员', '沉睡会员', '钻石会员', '全部用户'];
  const channelsSets = [
    ['APP推送', '短信'], ['APP推送'], ['短信', '公众号'], ['APP推送', '短信', '公众号'],
    ['门店海报', 'APP推送'], ['短信', '门店海报'], ['公众号'], ['APP推送', '公众号'],
  ];

  return names.map((name, idx) => {
    const type = types[idx % types.length];
    const startOffset = idx * 15 - 30;
    const endOffset = startOffset + 14 + Math.floor(Math.random() * 15);
    const budget = 500 + Math.floor(Math.random() * 9500);
    const spent = Math.round(budget * (0.2 + Math.random() * 0.7));
    const revenue = Math.round(spent * (1.5 + Math.random() * 4));
    const status: CampaignStatus = endOffset < 0 ? 'ended' : startOffset > 0 ? (Math.random() > 0.2 ? 'draft' : 'active') : 'active';

    return {
      id: `CAMP-${String(idx + 1).padStart(3, '0')}`,
      name,
      type,
      status,
      startDate: new Date(Date.now() + startOffset * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + endOffset * 86400000).toISOString().split('T')[0],
      budget,
      spent,
      revenue,
      roi: revenue > 0 ? Math.round(((revenue - spent) / spent) * 100) : 0,
      participants: 50 + Math.floor(Math.random() * 1950),
      newMembers: Math.floor(Math.random() * 200),
      description: `${name} - 通过多元化渠道触达目标用户群，提升门店营收与会员活跃度`,
      targetAudience: audiences[Math.floor(Math.random() * audiences.length)]!!,
      channels: channelsSets[Math.floor(Math.random() * channelsSets.length)]!!,
      createdBy: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)]!,
      approvedBy: ['店长', '市场总监'][Math.floor(Math.random() * 2)]!,
    };
  });
}

function generateCoupons(): Coupon[] {
  const names = ['全场9折券', '满100减20', '新人专享8折', '游戏币买一送一', '娃娃机免费夹', '积分10倍券', '满200减50', '免费饮品券'];
  return names.map((name, idx) => {
    const isPercent = idx % 3 === 0;
    const total = 500 + Math.floor(Math.random() * 4500);
    const used = Math.floor(Math.random() * total);
    const daysAgo = Math.floor(Math.random() * 60);
    return {
      id: `CPN-${String(idx + 1).padStart(3, '0')}`,
      name,
      code: `M5${String(1000 + idx)}${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      type: isPercent ? 'percentage' : idx % 3 === 1 ? 'fixed' : 'free_shipping',
      value: isPercent ? 10 + Math.floor(Math.random() * 30) : 10 + Math.floor(Math.random() * 50),
      minOrderAmount: idx === 1 ? 100 : idx === 5 ? 200 : 0,
      maxDiscount: isPercent ? 50 + Math.floor(Math.random() * 100) : 0,
      totalIssued: total,
      totalUsed: used,
      usageRate: Math.round((used / total) * 100 * 10) / 10,
      status: used >= total ? 'exhausted' : daysAgo > 30 ? 'expired' : 'active',
      startDate: new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + (30 - daysAgo) * 86400000).toISOString().split('T')[0],
      applicableProducts: [],
      perUserLimit: 1 + Math.floor(Math.random() * 3),
      description: name,
    };
  });
}

function generatePushes(): PushMessage[] {
  const titles = [
    '周末狂欢·充值送游戏币', '新会员注册即送大礼包', '积分即将过期提醒',
    '618大促今日开启', '门店活动邀请函', '会员生日特权',
    '新设备上线通知', '优惠券到账提醒', '积分翻倍活动',
    '限时抢购今晚截止', '老带新奖励提升', '夏季营业时间调整',
  ];
  return titles.map((title, idx) => {
    const target = 500 + Math.floor(Math.random() * 4500);
    const delivered = Math.floor(target * (0.8 + Math.random() * 0.2));
    const daysAgo = Math.floor(Math.random() * 30);
    const statuses: PushStatus[] = ['sent', 'sent', 'scheduled', 'draft_push', 'failed', 'sent'];
    return {
      id: `PSH-${String(idx + 1).padStart(3, '0')}`,
      title,
      content: `${title} - 到店消费享更多优惠，快来参与吧！`,
      type: ['sms', 'app_push', 'wechat', 'announcement'][Math.floor(Math.random() * 4)] as PushMessage['type'],
      status: statuses[Math.floor(Math.random() * statuses.length)]!!,
      targetAudience: ['全部会员', '活跃会员', '新注册会员', '沉睡会员'][Math.floor(Math.random() * 4)]!,
      targetCount: target,
      deliveredCount: delivered,
      openRate: Math.round((5 + Math.random() * 25) * 10) / 10,
      clickRate: Math.round((1 + Math.random() * 8) * 10) / 10,
      conversionRate: Math.round((0.2 + Math.random() * 3) * 10) / 10,
      scheduledAt: daysAgo > 0 ? new Date(Date.now() - daysAgo * 86400000).toISOString() : '',
      sentAt: daysAgo > 0 ? new Date(Date.now() - daysAgo * 86400000).toISOString() : '',
      createdBy: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)]!,
    };
  });
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let campaignCache: Campaign[] | null = null;
let couponCache: Coupon[] | null = null;
let pushCache: PushMessage[] | null = null;

function getCampaigns(): Campaign[] {
  if (!campaignCache) campaignCache = generateCampaigns();
  return campaignCache;
}

function getCoupons(): Coupon[] {
  if (!couponCache) couponCache = generateCoupons();
  return couponCache;
}

function getPushes(): PushMessage[] {
  if (!pushCache) pushCache = generatePushes();
  return pushCache;
}

// ---- 主页面 ----

export default function StoreMarketingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaigns = useMemo(() => getCampaigns(), []);
  const coupons = useMemo(() => getCoupons(), []);
  const pushes = useMemo(() => getPushes(), []);
  const [tab, setTab] = useState<'campaigns' | 'coupons' | 'push'>('campaigns');

  const campaignStats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    ended: campaigns.filter(c => c.status === 'ended').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalRevenue: campaigns.reduce((s, c) => s + c.revenue, 0),
    totalSpent: campaigns.reduce((s, c) => s + c.spent, 0),
    avgRoi: campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length) : 0,
  }), [campaigns]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '营销管理' })} />
      <PageShell title="营销管理" subtitle="活动策划 · 优惠券 · 推送通知 · ROI分析">
        {tab === 'campaigns' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>活动总数</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{campaignStats.total}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>进行中: {campaignStats.active}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总营收</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{formatMoney(campaignStats.totalRevenue)}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>总花费: {formatMoney(campaignStats.totalSpent)}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均ROI</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: campaignStats.avgRoi > 100 ? '#22c55e' : campaignStats.avgRoi > 50 ? '#eab308' : '#ef4444' }}>
                  {campaignStats.avgRoi}%
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>草稿箱</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#94a3b8' }}>{campaignStats.draft}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#eab308' }}>待发布</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 24 }}>{CAMPAIGN_TYPE_ICONS[c.type]}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{CAMPAIGN_TYPE_LABELS[c.type]} · {c.startDate} ~ {c.endDate}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge label={CAMPAIGN_STATUS_MAP[c.status].label} variant={CAMPAIGN_STATUS_MAP[c.status].variant} size="sm" dot />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 12 }}>
                    <StatCard label="预算" value={formatMoney(c.budget)} />
                    <StatCard label="花费" value={formatMoney(c.spent)} />
                    <StatCard label="营收" value={formatMoney(c.revenue)} />
                    <StatCard label="ROI" value={`${c.roi}%`} helper={c.roi > 100 ? '优秀' : c.roi > 50 ? '良好' : '待优化'} />
                    <StatCard label="参与人数" value={c.participants.toLocaleString()} helper={`新会员: ${c.newMembers}`} />
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={tagStyle}>{c.targetAudience}</span>
                    {c.channels.map(ch => <span key={ch} style={{ ...tagStyle, background: 'rgba(139,92,246,0.12)', color: '#c4b5fd' }}>{ch}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'coupons' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>优惠券总数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{coupons.length}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总发放量</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {coupons.reduce((s, c) => s + c.totalIssued, 0).toLocaleString()}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总使用量</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {coupons.reduce((s, c) => s + c.totalUsed, 0).toLocaleString()}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均使用率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
                  {coupons.length > 0 ? (coupons.reduce((s, c) => s + c.usageRate, 0) / coupons.length).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {coupons.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>码: {c.code} · {c.startDate} ~ {c.endDate}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.type === 'percentage' ? '#8b5cf6' : c.type === 'fixed' ? '#22c55e' : '#3b82f6' }}>
                    {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatMoney(c.value) : '免邮'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{c.totalUsed}/{c.totalIssued}</div>
                    <div style={{
                      height: 4, width: 80, borderRadius: 2,
                      background: 'rgba(148,163,184,0.15)', overflow: 'hidden',
                      marginTop: 4, marginLeft: 'auto',
                    }}>
                      <div style={{ height: '100%', width: `${c.usageRate}%`, borderRadius: 2,
                        background: c.usageRate > 80 ? '#ef4444' : c.usageRate > 50 ? '#eab308' : '#22c55e' }} />
                    </div>
                  </div>
                  <StatusBadge label={COUPON_STATUS_MAP[c.status].label} variant={COUPON_STATUS_MAP[c.status].variant} size="sm" dot />
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'push' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>推送总数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{pushes.length}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>已发送</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {pushes.filter(p => p.status === 'sent').length}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均打开率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {pushes.length > 0 ? (pushes.filter(p => p.status === 'sent').reduce((s, p) => s + p.openRate, 0) / Math.max(pushes.filter(p => p.status === 'sent').length, 1)).toFixed(1) : 0}%
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均转化率</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {pushes.length > 0 ? (pushes.filter(p => p.status === 'sent').reduce((s, p) => s + p.conversionRate, 0) / Math.max(pushes.filter(p => p.status === 'sent').length, 1)).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {pushes.map(p => (
                <div key={p.id} style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</div>
                    <StatusBadge label={PUSH_STATUS_MAP[p.status].label} variant={PUSH_STATUS_MAP[p.status].variant} size="sm" dot />
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{p.content}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#cbd5e1' }}>
                    <span>目标: {p.targetAudience} ({p.targetCount.toLocaleString()})</span>
                    <span>送达: {p.deliveredCount.toLocaleString()}</span>
                    <span>打开: {p.openRate}%</span>
                    <span>点击: {p.clickRate}%</span>
                    <span>转化: {p.conversionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'campaigns', label: `🎯 活动管理 (${campaigns.length})` },
              { key: 'coupons', label: `🎫 优惠券 (${coupons.length})` },
              { key: 'push', label: `📨 推送通知 (${pushes.length})` },
            ]}
            activeKey={tab} onChange={(t) => setTab(t as typeof tab)}
            variant="pills"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnStyle}>➕ 创建活动</button>
          <button style={{ ...btnStyle, background: 'rgba(139,92,246,0.14)', color: '#c4b5fd' }}>🎫 生成优惠券</button>
          <button style={{ ...btnStyle, background: 'rgba(245,158,11,0.14)', color: '#fbbf24' }}>📨 新建推送</button>
        </div>
      </PageShell>
    </main>
  );
}

const statCardStyle: React.CSSProperties = {
  borderRadius: 16, padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const tagStyle: React.CSSProperties = {
  padding: '3px 10px', borderRadius: 6,
  background: 'rgba(59,130,246,0.12)', color: '#93c5fd',
  fontSize: 11, fontWeight: 600,
};

const btnStyle: React.CSSProperties = {
  borderRadius: 10, padding: '10px 18px',
  background: 'rgba(59,130,246,0.14)', color: '#93c5fd',
  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};
