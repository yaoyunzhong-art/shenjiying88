'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { Chart } from './Chart';

// ==================== 类型定义 ====================

/** 营销活动摘要 */
export interface CampaignSnapshot {
  /** 活动 ID */
  id: string;
  /** 活动名称 */
  name: string;
  /** 活动渠道 */
  channel: 'sms' | 'email' | 'wechat' | 'app_push' | 'in_store';
  /** 活动状态 */
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'ended' | 'archived';
  /** 目标受众 */
  targetSegment: string;
  /** 发送量/触达量 */
  reachCount: number;
  /** 转化率 (0-100) */
  conversionRate: number;
  /** 花费 (元) */
  cost: number;
  /** ROI */
  roi: number;
  /** 开始时间 */
  startAt: string;
  /** 结束时间(可选) */
  endAt?: string;
}

/** 会员增长指标 */
export interface MemberGrowthMetrics {
  /** 总会员数 */
  totalMembers: number;
  /** 今日新增 */
  newToday: number;
  /** 本周新增 */
  newThisWeek: number;
  /** 本月新增 */
  newThisMonth: number;
  /** 月同比增长率 (%) */
  monthYoY: number;
  /** 活跃会员数 (30天有互动) */
  activeMembers: number;
  /** 活跃率 */
  activeRate: number;
  /** 流失会员数 (近90天无互动) */
  churnedMembers: number;
  /** 流失率 */
  churnRate: number;
}

/** 营销指标 */
export interface MarketingKpi {
  /** 营销总花费 */
  totalSpend: number;
  /** 平均获客成本 */
  cac: number;
  /** 客户生命周期价值 */
  ltv: number;
  /** LTV/CAC 比值 */
  ltvCacRatio: number;
  /** 平均复购率 */
  repurchaseRate: number;
  /** 本月目标完成率 */
  monthlyTargetRate: number;
}

/** 快速操作项 */
export interface MarketerQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 渠道分布统计 */
export interface ChannelDistribution {
  /** 渠道代码 */
  channel: CampaignSnapshot['channel'];
  /** 活动数量 */
  count: number;
  /** 总花费 (元) */
  totalCost: number;
}

/** 月度趋势点 */
export interface MonthlyTrendPoint {
  /** 月份, 如 '2026-01' */
  month: string;
  /** 新增会员数 */
  newMembers: number;
  /** 活动花费 (元) */
  campaignCost: number;
  /** 活动触达数 */
  reachCount: number;
}

/** 营销经理工作台 Props */
export interface MemberMarketerDashboardProps {
  /** 会员增长指标 */
  growthMetrics?: MemberGrowthMetrics;
  /** 营销指标概览 */
  marketingKpi?: MarketingKpi;
  /** 近期活动列表 */
  recentCampaigns?: CampaignSnapshot[];
  /** 快速操作 */
  quickActions?: MarketerQuickAction[];
  /** 经理姓名 */
  managerName?: string;
  /** 渠道分布 (不传则从 recentCampaigns 自动统计) */
  channelDistribution?: ChannelDistribution[];
  /** 月度趋势数据 */
  monthlyTrend?: MonthlyTrendPoint[];
}

// ==================== 内联样式 ====================

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: 14,
  letterSpacing: 0.3,
};

const SECTION_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(15,23,42,0.35)',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.12)',
  padding: 20,
  marginBottom: 20,
};

const ACTIONS_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 20,
};

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.38)',
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

const PRIMARY_ACTION_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_STYLE,
  background: 'rgba(99,102,241,0.2)',
  borderColor: 'rgba(99,102,241,0.4)',
  color: '#a5b4fc',
};

const METRIC_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid rgba(148,163,184,0.08)',
};

const METRIC_LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
};

const METRIC_VALUE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
  fontVariantNumeric: 'tabular-nums',
};

const POSITIVE_TREND: React.CSSProperties = { color: '#34d399' };
const NEGATIVE_TREND: React.CSSProperties = { color: '#f87171' };

// ==================== 组件 ====================

export function MemberMarketerDashboard({
  growthMetrics,
  marketingKpi,
  recentCampaigns = [],
  quickActions = [],
  managerName,
  channelDistribution,
  monthlyTrend,
}: MemberMarketerDashboardProps) {
  const stats: QuickStatItem[] = React.useMemo(() => {
    const items: QuickStatItem[] = [];
    if (marketingKpi) {
      items.push(
        { label: '营销花费', value: `¥${marketingKpi.totalSpend.toLocaleString()}` },
        { label: '获客成本', value: `¥${marketingKpi.cac}` },
        { label: 'LTV/CAC', value: marketingKpi.ltvCacRatio.toFixed(2) },
        { label: '复购率', value: `${marketingKpi.repurchaseRate.toFixed(1)}%` },
      );
    }
    if (growthMetrics) {
      items.push(
        { label: '总会员', value: growthMetrics.totalMembers.toLocaleString() },
        { label: '月新增', value: `+${growthMetrics.newThisMonth}` },
        { label: '活跃率', value: `${growthMetrics.activeRate.toFixed(1)}%` },
        { label: '流失率', value: `${growthMetrics.churnRate.toFixed(1)}%` },
      );
    }
    return items;
  }, [growthMetrics, marketingKpi]);

  const columns: DataTableColumn<CampaignSnapshot>[] = [
    { key: 'name', header: '活动名称', render: (c) => c.name },
    {
      key: 'channel',
      header: '渠道',
      render: (c) => channelLabel(c.channel),
    },
    {
      key: 'status',
      header: '状态',
      render: (c) => (
        <StatusBadge variant={statusVariant(c.status)} label={statusLabel(c.status)} />
      ),
    },
    { key: 'reachCount', header: '触达', render: (c) => c.reachCount.toLocaleString() },
    { key: 'conversionRate', header: '转化率', render: (c) => `${c.conversionRate.toFixed(1)}%` },
    { key: 'roi', header: 'ROI', render: (c) => c.roi.toFixed(2) },
  ];

  // ===== 渠道分布自动统计 =====
  const distData = React.useMemo(() => {
    if (channelDistribution) return channelDistribution;
    const map = new Map<CampaignSnapshot['channel'], { count: number; cost: number }>();
    for (const c of recentCampaigns) {
      const prev = map.get(c.channel) ?? { count: 0, cost: 0 };
      map.set(c.channel, { count: prev.count + 1, cost: prev.cost + c.cost });
    }
    return Array.from(map.entries()).map(([ch, v]) => ({
      channel: ch,
      count: v.count,
      totalCost: v.cost,
    }));
  }, [recentCampaigns, channelDistribution]);

  // ===== 频道分布图表数据 =====
  const channelChartData = distData.map((d) => ({
    label: channelLabel(d.channel),
    value: d.count,
  }));

  return (
    <div style={{ padding: 16 }}>
      {/* 欢迎标题 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          {managerName ? `${managerName}，欢迎回来` : '营销经理工作台'}
        </div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          查看会员增长趋势与营销活动效果
        </div>
      </div>

      {/* 快速操作 */}
      {quickActions.length > 0 && (
        <div style={ACTIONS_WRAPPER_STYLE}>
          {quickActions.map((action) => (
            <button
              key={action.key}
              style={action.primary ? PRIMARY_ACTION_STYLE : ACTION_BUTTON_STYLE}
              onClick={action.onClick}
            >
              {action.icon ? `${action.icon} ` : ''}{action.label}
            </button>
          ))}
        </div>
      )}

      {/* 核心指标 */}
      {stats.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <QuickStats items={stats} columns={4} />
        </div>
      )}

      {/* 营销KPI明细 */}
      {marketingKpi && (
        <div style={SECTION_CARD_STYLE}>
          <div style={SECTION_TITLE_STYLE}>📊 营销效率概览</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {[
              { label: '总花费 (元)', value: marketingKpi.totalSpend.toLocaleString() },
              { label: '平均获客成本 (CAC)', value: `¥${marketingKpi.cac}` },
              { label: '客户生命周期价值 (LTV)', value: `¥${marketingKpi.ltv}` },
              { label: 'LTV / CAC', value: marketingKpi.ltvCacRatio.toFixed(2), highlight: marketingKpi.ltvCacRatio >= 3 ? 'positive' : marketingKpi.ltvCacRatio < 1 ? 'negative' : undefined },
              { label: '平均复购率', value: `${marketingKpi.repurchaseRate.toFixed(1)}%` },
              { label: '本月目标完成率', value: `${marketingKpi.monthlyTargetRate.toFixed(1)}%` },
            ].map((item) => (
              <div key={item.label} style={METRIC_ROW_STYLE}>
                <span style={METRIC_LABEL_STYLE}>{item.label}</span>
                <span
                  style={{
                    ...METRIC_VALUE_STYLE,
                    ...(item.highlight === 'positive' ? POSITIVE_TREND : {}),
                    ...(item.highlight === 'negative' ? NEGATIVE_TREND : {}),
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 渠道分布 + 月度趋势双栏布局 */}
      {(channelChartData.length > 0 || monthlyTrend) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* 渠道分布环形图 */}
          {channelChartData.length > 0 && (
            <div style={SECTION_CARD_STYLE}>
              <div style={SECTION_TITLE_STYLE}>📡 渠道分布</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Chart
                  type="donut"
                  data={channelChartData}
                  width={240}
                  height={200}
                />
              </div>
              {distData.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {distData.map((d) => (
                    <div key={d.channel} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)',
                    }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{channelLabel(d.channel)}</span>
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                        {d.count} 个活动 · ¥{d.totalCost.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 月度新增会员趋势 */}
          {monthlyTrend && monthlyTrend.length > 0 && (
            <div style={SECTION_CARD_STYLE}>
              <div style={SECTION_TITLE_STYLE}>📈 月度新增趋势</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Chart
                  type="bar"
                  data={monthlyTrend.map((m) => ({ label: m.month.slice(-2) + '月', value: m.newMembers }))}
                  width={280}
                  height={200}
                  showValues
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                {monthlyTrend.slice(-2).map((m) => (
                  <div key={m.month} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{m.month}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                      新增 {m.newMembers}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      花费 ¥{(m.campaignCost / 1000).toFixed(1)}k
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 近期活动 */}
      {recentCampaigns.length > 0 && (
        <div style={SECTION_CARD_STYLE}>
          <div style={SECTION_TITLE_STYLE}>📋 近期营销活动</div>
          <DataTable
            items={recentCampaigns}
            columns={columns}
            rowKey={(c) => c.id}
            compact
          />
        </div>
      )}
    </div>
  );
}

// ==================== 工具函数 ====================

function channelLabel(channel: CampaignSnapshot['channel']): string {
  const map: Record<string, string> = {
    sms: '短信', email: '邮件', wechat: '微信公众号',
    app_push: 'App推送', in_store: '门店',
  };
  return map[channel] ?? channel;
}

function statusLabel(status: CampaignSnapshot['status']): string {
  const map: Record<string, string> = {
    draft: '草稿', scheduled: '已排期', running: '进行中',
    paused: '已暂停', ended: '已结束', archived: '已归档',
  };
  return map[status] ?? status;
}

function statusVariant(status: CampaignSnapshot['status']): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  switch (status) {
    case 'running': return 'success';
    case 'scheduled': return 'info';
    case 'paused': return 'warning';
    case 'ended': return 'neutral';
    case 'archived': return 'neutral';
    case 'draft': return 'warning';
  }
}
