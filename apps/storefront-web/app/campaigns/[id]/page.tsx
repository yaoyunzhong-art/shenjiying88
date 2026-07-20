'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  CampaignPerformancePanel,
  PageShell,
  StatusBadge,
  DetailShell,
  type CampaignMetric,
  type CampaignDataPoint,
  type CampaignInsight,
} from '@m5/ui';

// ---- 类型 ----

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'paused' | 'draft';
type CampaignChannel = '小程序' | 'H5' | 'App推送' | '短信' | '企微' | '全渠道';

interface CampaignDetail {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  roi: number;
  conversions: number;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
}

type BadgeVariant = 'success' | 'info' | 'neutral' | 'warning' | 'default';

const STATUS_MAP: Record<CampaignStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: '投放中', variant: 'success' },
  scheduled: { label: '已排期', variant: 'info' },
  ended: { label: '已结束', variant: 'neutral' },
  paused: { label: '已暂停', variant: 'warning' },
  draft: { label: '草稿', variant: 'default' },
};

const CHANNEL_LABELS: Record<string, string> = {
  '小程序': '小程序',
  'H5': 'H5 页面',
  'App推送': 'App 推送',
  '短信': '短信',
  '企微': '企业微信',
  '全渠道': '全渠道',
};

// ---- Mock 数据 ----

const MOCK_DATA: Record<string, CampaignDetail> = {
  'cmp-001': { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active', budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618 年中大促全场折扣 + 满减活动，覆盖线上线下全渠道，预计触达 50 万会员。' },
  'cmp-002': { id: 'cmp-002', name: '新会员专享礼包', channel: '小程序', status: 'active', budget: 80000, spent: 45200, roi: 5.2, conversions: 3400, startAt: '2026-06-10', endAt: '2026-07-10', targetAudience: '新注册会员', description: '新人首单立减 20 元 + 赠品，仅限通过小程序注册的新用户。' },
  'cmp-004': { id: 'cmp-004', name: '会员积分双倍', channel: 'App推送', status: 'active', budget: 30000, spent: 18200, roi: 8.1, conversions: 5200, startAt: '2026-06-15', endAt: '2026-07-15', targetAudience: '银卡及以上会员', description: '积分双倍活动期间消费翻倍积分，仅限银卡及以上等级会员参与。' },
  'cmp-007': { id: 'cmp-007', name: '拼团裂变活动', channel: '全渠道', status: 'active', budget: 100000, spent: 67100, roi: 4.6, conversions: 8900, startAt: '2026-06-08', endAt: '2026-06-28', targetAudience: '社交活跃用户', description: '三人成团享 7 折优惠，配合分享奖励机制实现社交裂变传播。' },
  'cmp-011': { id: 'cmp-011', name: '社群签到有礼', channel: '企微', status: 'active', budget: 15000, spent: 8900, roi: 6.8, conversions: 4200, startAt: '2026-06-01', endAt: '2026-07-01', targetAudience: '企微社群成员', description: '每日签到领积分，连续 7 天得优惠券，提升社群活跃度与粘性。' },
  'cmp-014': { id: 'cmp-014', name: '推荐有礼', channel: '全渠道', status: 'active', budget: 60000, spent: 32100, roi: 7.2, conversions: 6100, startAt: '2026-06-01', endAt: '2026-12-31', targetAudience: '全部会员', description: '邀请好友注册得 30 元券，老带新裂变增长渠道长期有效。' },
};

// ---- Mock 性能数据 (为每个活动生成 AI 洞察关联数据) ----

function mockPerformanceMetrics(c: CampaignDetail): CampaignMetric[] {
  const remaining = c.budget - c.spent;
  const spentPct = c.budget > 0 ? ((c.spent / c.budget) * 100).toFixed(1) : '0.0';
  const cpa = c.conversions > 0 ? Math.round(c.spent / c.conversions) : 0;
  return [
    { label: 'ROI', value: c.roi.toFixed(1), unit: 'x', trend: c.roi >= 3 ? 'up' : c.roi > 1 ? 'flat' : 'down', delta: c.roi >= 3 ? '+20%' : c.roi > 1 ? '持平' : '-15%', color: '#3b82f6' },
    { label: 'CPA (单次转化成本)', value: String(cpa), unit: '元', trend: cpa <= 50 ? 'up' : 'down', delta: cpa <= 50 ? '优良' : '偏高', color: '#8b5cf6' },
    { label: '预算消耗', value: spentPct, unit: '%', trend: parseFloat(spentPct) > 80 ? 'down' : 'flat', delta: `${formatCurrency(remaining)} 剩余`, color: '#f59e0b' },
    { label: '转化数', value: c.conversions.toLocaleString(), unit: '人', trend: c.conversions > 5000 ? 'up' : 'flat', delta: `目标 ${(c.conversions * 1.3).toFixed(0)}`, color: '#10b981' },
  ];
}

function mockTrendData(c: CampaignDetail): CampaignDataPoint[] {
  // 模拟近14天转化趋势
  const start = new Date(c.startAt);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const baseConv = Math.round(c.conversions / 14);
    const jitter = Math.round(baseConv * (0.5 + Math.random() * 0.8));
    return {
      date: d.toISOString().slice(0, 10),
      impressions: jitter * 12,
      clicks: jitter * 3,
      conversions: jitter,
      revenue: jitter * 38,
    };
  });
}

function mockInsights(c: CampaignDetail): CampaignInsight[] {
  const insights: CampaignInsight[] = [];
  const spentPct = c.budget > 0 ? c.spent / c.budget : 0;
  if (c.roi >= 4) {
    insights.push({ type: 'positive', message: 'ROI 表现优秀', recommendation: '建议增加预算 20%，扩大受众覆盖面以获取更多转化。' });
  } else if (c.roi < 2) {
    insights.push({ type: 'negative', message: 'ROI 偏低需关注', recommendation: '建议优化投放人群定向，排除低转化渠道。' });
  } else {
    insights.push({ type: 'info', message: 'ROI 处于行业平均水平', recommendation: '可尝试 A/B 测试不同素材，寻找提升空间。' });
  }
  if (spentPct > 0.8) {
    insights.push({ type: 'warning', message: '预算消耗超过 80%', recommendation: `仅剩 ${formatCurrency(c.budget - c.spent)}，建议评估是否需要追加预算。` });
  }
  if (c.conversions > 8000) {
    insights.push({ type: 'positive', message: '转化量突破 8000', recommendation: '本次活动表现亮眼，建议沉淀为案例经验并复用到后续活动。' });
  }
  if (c.targetAudience.includes('新')) {
    insights.push({ type: 'info', message: '新客获取效果可追踪', recommendation: '建议结合新客复购率评估活动长期价值，而非仅关注首单转化。' });
  }
  insights.push({ type: 'info', message: `渠道: ${c.channel}`, recommendation: `当前通过 ${c.channel} 触达，建议同步评估各子渠道的转化贡献差异。` });
  return insights;
}

function formatCurrency(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = MOCK_DATA[id] ?? null;
      if (!found) {
        setError('活动不存在或已被删除');
      } else {
        setCampaign(found);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!campaign) return <div>暂无数据</div>;

  // 性能面板数据 (mock)
  const perfMetrics = useMemo<CampaignMetric[]>(() => campaign ? mockPerformanceMetrics(campaign) : [], [campaign]);
  const trendData = useMemo<CampaignDataPoint[]>(() => campaign ? mockTrendData(campaign) : [], [campaign]);
  const insights = useMemo<CampaignInsight[]>(() => campaign ? mockInsights(campaign) : [], [campaign]);

  // 映射 CampaignStatus -> 面板允许的 status ('paused' 不在面板类型中)
  const panelStatus = campaign && campaign.status === 'paused' ? 'draft' : (campaign?.status ?? 'draft');

  const info = STATUS_MAP[campaign.status];

  return (
    <PageShell
      title={`${campaign.name} - ${info.label}`}
      description={`${campaign.channel} · 预算 ¥${campaign.budget.toLocaleString()}`}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <DetailShell
          title={campaign.name}
          actions={[
            {
              key: 'back-to-list',
              label: '← 返回列表',
              variant: 'primary',
              onClick: () => router.push('/campaigns'),
            },
          ]}
        >
          {/* AI 增强型活动效果分析面板 */}
          <CampaignPerformancePanel
            campaignName={campaign.name}
            status={panelStatus as 'active' | 'scheduled' | 'ended' | 'draft'}
            metrics={perfMetrics}
            trendData={trendData}
            insights={insights}
            data-testid="campaign-perf-panel"
          />

          <div style={{ marginTop: 20, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              基本信息
            </div>
            <InfoRow label="活动 ID" value={campaign.id} />
            <InfoRow label="渠道" value={campaign.channel} />
            <InfoRow label="状态" value={<StatusBadge label={info.label} variant={info.variant} />} />
            <InfoRow label="目标人群" value={campaign.targetAudience} />
            <InfoRow label="描述" value={campaign.description} />
          </div>

          <div style={{ marginTop: 16, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              投放数据
            </div>
            <InfoRow label="预算 (元)" value={String(campaign.budget.toLocaleString())} />
            <InfoRow label="已花费 (元)" value={String(campaign.spent.toLocaleString())} />
            <InfoRow label="剩余 (元)" value={String((campaign.budget - campaign.spent).toLocaleString())} />
            <InfoRow label="ROI" value={`${campaign.roi.toFixed(1)}x`} />
            <InfoRow label="转化数" value={`${campaign.conversions.toLocaleString()} 人`} />
            <InfoRow label="开始日期" value={campaign.startAt} />
            <InfoRow label="结束日期" value={campaign.endAt} />
          </div>
        </DetailShell>
      </div>
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', gap: 16 }}>
      <div style={{ width: 120, fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e2e8f0' }}>{value}</div>
    </div>
  );
}
