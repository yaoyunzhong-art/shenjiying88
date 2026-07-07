'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { StatusBadge } from './StatusBadge';

// ---- 类型定义 ----

/** 营销活动快照 */
export interface CampaignSnapshot {
  id: string;
  name: string;
  /** 活动类型 */
  type: 'promotion' | 'member' | 'seasonal' | 'new_product' | 'cross_sell';
  /** 活动状态 */
  status: 'draft' | 'active' | 'paused' | 'ended' | 'cancelled';
  /** 预算金额 */
  budget: number;
  /** 已花费 */
  spent: number;
  /** 触达人数 */
  reachCount: number;
  /** 参与人数 */
  participantCount: number;
  /** 转化率 (0-100) */
  conversionRate: number;
  /** ROI (百分比, 如 150 = 150%) */
  roi: number;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate?: string;
  /** 负责人 */
  owner?: string;
}

/** 营销增长指标 */
export interface MarketingGrowthMetrics {
  /** 新增会员数 (今日/本周/本月) */
  newMembers: number;
  /** 新增会员环比 (%) */
  newMembersQoQ: number;
  /** 活跃会员数 */
  activeMembers: number;
  /** 活跃会员环比 */
  activeMembersQoQ: number;
  /** 会员复购率 (0-100) */
  repurchaseRate: number;
  /** 复购率环比 */
  repurchaseRateQoQ: number;
  /** 客单价 */
  avgOrderValue: number;
  /** 客单价环比 */
  avgOrderValueQoQ: number;
  /** 活动ROI均值 */
  avgCampaignRoi: number;
  /** ROI环比 */
  avgCampaignRoiQoQ: number;
}

/** 渠道效果 */
export interface ChannelEffectiveness {
  channel: string;
  /** 触达人次 */
  impressions: number;
  /** 点击次数 */
  clicks: number;
  /** 点击率 (0-100) */
  ctr: number;
  /** 转化数 */
  conversions: number;
  /** 花费 */
  cost: number;
  /** 获客成本 */
  customerAcquisitionCost: number;
}

/** 营销经理快速操作 */
export interface MarketingQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
}

/** 营销经理工作台属性 */
export interface MarketingManagerDashboardProps {
  /** 营销经理姓名 */
  managerName?: string;
  /** 上次同步时间 */
  lastSyncAt?: string;
  /** 增长指标 */
  growthMetrics?: MarketingGrowthMetrics;
  /** 活动列表 */
  campaigns?: CampaignSnapshot[];
  /** 渠道效果 */
  channels?: ChannelEffectiveness[];
  /** 快速操作 */
  quickActions?: MarketingQuickAction[];
  /** 月度预算 */
  monthlyBudget?: number;
  /** 已用预算占比 (0-100) */
  budgetUsedPercent?: number;
  /** 加载态 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
}

// ---- 工具函数 ----

function fmtCurrency(val: number): string {
  if (val >= 10000) {
    return (val / 10000).toFixed(1) + '万';
  }
  if (val >= 1000) {
    return (val / 1000).toFixed(1) + 'k';
  }
  return val.toLocaleString('zh-CN');
}

function fmtTrend(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

const STATUS_VARIANT_MAP: Record<string, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  ended: 'info',
  cancelled: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
  cancelled: '已取消',
};

/** 状态类型到 StatusBadge variant 中允许的安全值 */
function toBadgeVariant(v: string): string {
  if (v === 'success' || v === 'info' || v === 'warning' || v === 'error') return v;
  if (v === 'default' || v === 'neutral' || v === 'pending' || v === 'danger') return v;
  return 'default';
}

const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
  promotion: '促销活动',
  member: '会员活动',
  seasonal: '节日活动',
  new_product: '新品推广',
  cross_sell: '交叉销售',
};

// ---- 主组件 ----

export function MarketingManagerDashboard({
  managerName,
  lastSyncAt,
  growthMetrics,
  campaigns,
  channels,
  quickActions,
  monthlyBudget,
  budgetUsedPercent,
  loading = false,
  compact = false,
}: MarketingManagerDashboardProps) {
  if (loading) {
    return (
      <div data-testid="marketing-dashboard-loading" style={{ padding: 24 }}>
        <div
          style={{
            height: 24,
            width: 180,
            background: '#e5e7eb',
            borderRadius: 4,
            marginBottom: 16,
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                background: '#e5e7eb',
                borderRadius: 8,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
        <div
          style={{
            height: 200,
            background: '#e5e7eb',
            borderRadius: 8,
          }}
        />
        <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>正在加载营销数据...</p>
      </div>
    );
  }

  const statItems: QuickStatItem[] = growthMetrics
    ? [
        {
          label: '新增会员',
          value: String(growthMetrics.newMembers),
          helper: `环比 ${fmtTrend(growthMetrics.newMembersQoQ)}`,
          valueColor: growthMetrics.newMembersQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '活跃会员',
          value: String(growthMetrics.activeMembers),
          helper: `环比 ${fmtTrend(growthMetrics.activeMembersQoQ)}`,
          valueColor: growthMetrics.activeMembersQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '复购率',
          value: `${growthMetrics.repurchaseRate}%`,
          helper: `环比 ${fmtTrend(growthMetrics.repurchaseRateQoQ)}`,
          valueColor: growthMetrics.repurchaseRateQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '客单价',
          value: `¥${growthMetrics.avgOrderValue}`,
          helper: `环比 ${fmtTrend(growthMetrics.avgOrderValueQoQ)}`,
          valueColor: growthMetrics.avgOrderValueQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '活动ROI',
          value: `${growthMetrics.avgCampaignRoi}%`,
          helper: `环比 ${fmtTrend(growthMetrics.avgCampaignRoiQoQ)}`,
          valueColor: growthMetrics.avgCampaignRoiQoQ >= 0 ? '#4ade80' : '#f87171',
        },
      ]
    : [];

  const campaignColumns: DataTableColumn<CampaignSnapshot>[] = [
    {
      key: 'name',
      header: '活动名称',
      render: (row: CampaignSnapshot) => (
        <span style={{ fontWeight: 500, fontSize: 14, color: '#1f2937' }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (row: CampaignSnapshot) => (
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {CAMPAIGN_TYPE_LABEL[row.type] || row.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: CampaignSnapshot) => (
        <StatusBadge
          label={STATUS_LABEL[row.status] || row.status}
          variant={toBadgeVariant(STATUS_VARIANT_MAP[row.status] || 'default') as 'default' | 'neutral' | 'pending' | 'danger' | 'info' | 'warning' | 'error' | 'success'}
        />
      ),
    },
    {
      key: 'reachCount',
      header: '触达',
      render: (row: CampaignSnapshot) => (
        <span style={{ fontSize: 13, color: '#374151' }}>{fmtCurrency(row.reachCount)}</span>
      ),
    },
    {
      key: 'conversionRate',
      header: '转化率',
      render: (row: CampaignSnapshot) => (
        <span style={{ fontSize: 13, color: '#374151' }}>{row.conversionRate.toFixed(1)}%</span>
      ),
    },
    {
      key: 'roi',
      header: 'ROI',
      render: (row: CampaignSnapshot) => {
        const color = row.roi >= 100 ? '#16a34a' : row.roi >= 50 ? '#ca8a04' : '#dc2626';
        return (
          <span style={{ fontWeight: 600, fontSize: 13, color }}>
            {row.roi > 0 ? '+' : ''}{row.roi.toFixed(0)}%
          </span>
        );
      },
    },
  ];

  const channelColumns: DataTableColumn<ChannelEffectiveness>[] = [
    { key: 'channel', header: '渠道' },
    {
      key: 'impressions',
      header: '触达',
      render: (row: ChannelEffectiveness) => (
        <span style={{ fontSize: 13 }}>{row.impressions.toLocaleString('zh-CN')}</span>
      ),
    },
    {
      key: 'ctr',
      header: '点击率',
      render: (row: ChannelEffectiveness) => (
        <span style={{ fontSize: 13 }}>{row.ctr.toFixed(1)}%</span>
      ),
    },
    {
      key: 'conversions',
      header: '转化',
      render: (row: ChannelEffectiveness) => (
        <span style={{ fontSize: 13 }}>{row.conversions.toLocaleString('zh-CN')}</span>
      ),
    },
    {
      key: 'cost',
      header: '花费',
      render: (row: ChannelEffectiveness) => (
        <span style={{ fontSize: 13 }}>¥{fmtCurrency(row.cost)}</span>
      ),
    },
    {
      key: 'customerAcquisitionCost',
      header: '获客成本',
      render: (row: ChannelEffectiveness) => (
        <span style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>
          ¥{row.customerAcquisitionCost.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div
      data-testid="marketing-manager-dashboard"
      style={{
        padding: compact ? 16 : 24,
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h2
            data-testid="dashboard-title"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}
          >
            营销经理工作台
            {managerName && (
              <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                — {managerName}
              </span>
            )}
          </h2>
        </div>
        {lastSyncAt && (
          <span
            data-testid="last-sync"
            style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}
          >
            更新于 {lastSyncAt}
          </span>
        )}
      </div>

      {/* 月度预算概览 */}
      {monthlyBudget !== undefined && budgetUsedPercent !== undefined && (
        <div
          data-testid="budget-bar"
          style={{
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: 8,
            marginBottom: 20,
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
              本月预算
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              ¥{fmtCurrency(monthlyBudget)} · 已使用 {budgetUsedPercent.toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              data-testid="budget-fill"
              style={{
                width: `${Math.min(budgetUsedPercent, 100)}%`,
                height: '100%',
                background:
                  budgetUsedPercent > 90
                    ? '#dc2626'
                    : budgetUsedPercent > 75
                      ? '#ca8a04'
                      : '#3b82f6',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 增长指标 */}
      {statItems.length > 0 && (
        <div data-testid="growth-metrics" style={{ marginBottom: 20 }}>
          <QuickStats items={statItems} columns={5} />
        </div>
      )}

      {/* 营销活动 */}
      <div data-testid="campaigns-section" style={{ marginBottom: 20 }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 16,
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          营销活动
          {campaigns && campaigns.length > 0 && (
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 13 }}>
              ({campaigns.length})
            </span>
          )}
        </h3>
        {campaigns && campaigns.length > 0 ? (
          <DataTable
            columns={campaignColumns}
            data={campaigns}
            rowKey={(c: CampaignSnapshot) => c.id}
          />
        ) : (
          <p style={{ color: '#9ca3af', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
            暂无营销活动数据
          </p>
        )}
      </div>

      {/* 渠道效果 */}
      {channels && channels.length > 0 && (
        <div data-testid="channels-section" style={{ marginBottom: 20 }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 16,
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            渠道效果
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 13 }}>
              ({channels.length})
            </span>
          </h3>
          <DataTable
            columns={channelColumns}
            data={channels}
            rowKey={(c: ChannelEffectiveness) => c.channel}
          />
        </div>
      )}

      {/* 快速操作 */}
      {quickActions && quickActions.length > 0 && (
        <div data-testid="quick-actions" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickActions.map((action) => (
              <button
                key={action.key}
                data-testid={`qa-${action.key}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: action.primary ? '8px 20px' : '6px 14px',
                  fontSize: 14,
                  fontWeight: action.primary ? 600 : 400,
                  color: action.primary ? '#fff' : '#374151',
                  background: action.primary ? '#3b82f6' : '#f3f4f6',
                  border: action.primary ? 'none' : '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {action.icon && <span style={{ fontSize: 16 }}>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
