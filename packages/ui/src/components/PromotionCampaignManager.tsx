/**
 * PromotionCampaignManager — 促销活动管理面板（店长/运营角色）
 *
 * 功能:
 * - 展示当前和即将开始的促销活动列表
 * - 每个活动展示状态、预算、已用预算、ROI
 * - 支持启用/停用、编辑、查看详情等操作
 * - 快速创建新促销活动入口
 *
 * 使用场景:
 * - 店长工作台 → 促销管理
 * - 运营经理活动面板
 * - 活动列表页嵌入
 */
'use client';

import React from 'react';
import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';

// ---- 类型定义 ----

export type CampaignStatus = 'active' | 'scheduled' | 'paused' | 'ended' | 'draft';

export interface CampaignItem {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  /** 总预算（元） */
  budget: number;
  /** 已用预算（元） */
  spent: number;
  /** ROI（百分比，如 320 表示 3.2倍） */
  roi?: number;
  startDate: string; // ISO
  endDate?: string;  // ISO
  channel?: string;
  targetMetric?: string;
  /** 参与门店数 */
  storeCount?: number;
}

export interface PromotionCampaignManagerProps {
  /** 活动列表 */
  campaigns: CampaignItem[];
  /** 标题 */
  title?: string;
  /** 点击单个活动 */
  onCampaignClick?: (campaignId: string) => void;
  /** 启用/停用 */
  onToggle?: (campaignId: string, newStatus: CampaignStatus) => void;
  /** 创建新活动 */
  onCreateCampaign?: () => void;
  /** 筛选器标签 */
  activeFilter?: CampaignStatus | 'all';
  onFilterChange?: (filter: CampaignStatus | 'all') => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 常量 ----

const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: BadgeVariant; color: string }> = {
  active: { label: '进行中', variant: 'success', color: '#22c55e' },
  scheduled: { label: '已排期', variant: 'info', color: '#3b82f6' },
  paused: { label: '已暂停', variant: 'warning', color: '#f59e0b' },
  ended: { label: '已结束', variant: 'default', color: '#94a3b8' },
  draft: { label: '草稿', variant: 'default', color: '#64748b' },
};

const FILTER_OPTIONS: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'scheduled', label: '已排期' },
  { value: 'paused', label: '已暂停' },
  { value: 'draft', label: '草稿' },
  { value: 'ended', label: '已结束' },
];

const isActive = (s: CampaignStatus) => s === 'active';

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  if (amount >= 1000) return `¥${(amount / 1000).toFixed(1)}k`;
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatDateRange(start: string, end?: string): string {
  const s = new Date(start);
  if (!end) return s.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + '起';
  const e = new Date(end);
  return `${s.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
}

function spentPercentage(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

// ---- 样式 ----

const S: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 },
  createBtn: {
    border: 'none', borderRadius: 8, padding: '8px 18px',
    background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  filterRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap' as const,
  },
  filterChip: {
    border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 14px',
    fontSize: 12, fontWeight: 500, color: '#64748b', background: '#fff',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  filterChipActive: {
    border: '1px solid #6366f1', background: '#eef2ff', color: '#6366f1',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  card: {
    border: '1px solid #f1f5f9', borderRadius: 10, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
    cursor: 'pointer', transition: 'all 0.15s',
    background: '#fff',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
  },
  cardName: { fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8',
    flexWrap: 'wrap' as const, marginTop: 4,
  },
  budgetRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    flexWrap: 'wrap' as const,
  },
  budgetText: { fontSize: 12, color: '#64748b' },
  budgetBarOuter: {
    flex: 1, minWidth: 80, height: 6, borderRadius: 3, background: '#f1f5f9',
    overflow: 'hidden',
  },
  budgetBarInner: {
    height: '100%', borderRadius: 3, transition: 'width 0.3s',
  },
  metricRow: {
    display: 'flex', gap: 20, fontSize: 12, color: '#64748b',
    flexWrap: 'wrap' as const,
  },
  metricItem: { display: 'flex', alignItems: 'center', gap: 4 },
  actionsRow: {
    display: 'flex', gap: 8, marginTop: 4,
  },
  actionBtn: {
    border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 12px',
    fontSize: 12, fontWeight: 500, color: '#475569', background: '#fff',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  toggleBtn: {
    border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '4px 12px', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  emptyText: { fontSize: 13, color: '#94a3b8', padding: '20px 0', textAlign: 'center' as const },
  divider: { height: 1, background: '#f1f5f9', margin: 0 },
};

// ---- 组件 ----

export function PromotionCampaignManager({
  campaigns,
  title = '促销活动管理',
  onCampaignClick,
  onToggle,
  onCreateCampaign,
  activeFilter = 'all',
  onFilterChange,
  className,
}: PromotionCampaignManagerProps) {
  const filtered = activeFilter === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === activeFilter);

  return (
    <div className={className} style={S.container} role="region" aria-label={title}>
      {/* 标题 + 创建按钮 */}
      <div style={S.headerRow}>
        <h2 style={S.title}>{title}</h2>
        {onCreateCampaign && (
          <button
            style={S.createBtn}
            onClick={onCreateCampaign}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
            aria-label="创建新活动"
          >
            + 创建活动
          </button>
        )}
      </div>

      {/* 筛选 */}
      {onFilterChange && (
        <div style={S.filterRow}>
          {FILTER_OPTIONS.map((opt) => {
            const isActiveFilter = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                style={{
                  ...S.filterChip,
                  ...(isActiveFilter ? S.filterChipActive : {}),
                }}
                onClick={() => onFilterChange(opt.value)}
                aria-pressed={isActiveFilter}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>
                    ({campaigns.filter((c) => c.status === opt.value).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 活动列表 */}
      {filtered.length === 0 ? (
        <p style={S.emptyText}>
          {activeFilter === 'all' ? '暂无促销活动，点击上方按钮创建' : '该状态下暂无活动'}
        </p>
      ) : (
        <div style={S.list} role="list" aria-label="活动列表">
          {filtered.map((campaign) => {
            const stCfg = STATUS_CONFIG[campaign.status];
            const usedPct = spentPercentage(campaign.spent, campaign.budget);
            const barColor = usedPct > 85 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : '#6366f1';
            const toggleTarget: CampaignStatus = campaign.status === 'active' ? 'paused' : 'active';
            const canToggle = campaign.status === 'active' || campaign.status === 'paused';

            return (
              <div
                key={campaign.id}
                style={S.card}
                onClick={() => onCampaignClick?.(campaign.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onCampaignClick?.(campaign.id); }}
                aria-label={`活动: ${campaign.name}`}
              >
                {/* 头部信息 */}
                <div style={S.cardHeader}>
                  <div>
                    <h4 style={S.cardName}>{campaign.name}</h4>
                    <div style={S.cardMeta}>
                      <Badge variant={stCfg.variant}>{stCfg.label}</Badge>
                      <span>{formatDateRange(campaign.startDate, campaign.endDate)}</span>
                      {campaign.channel && <span>📢 {campaign.channel}</span>}
                      {campaign.storeCount && <span>🏪 {campaign.storeCount}店</span>}
                    </div>
                  </div>
                </div>

                {/* 描述 */}
                {campaign.description && (
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{campaign.description}</p>
                )}

                {/* 预算进度 */}
                <div style={S.budgetRow}>
                  <span style={S.budgetText}>
                    预算: {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                  </span>
                  <span style={{ ...S.budgetText, fontWeight: 600, color: barColor }}>
                    {usedPct}%
                  </span>
                  <div style={S.budgetBarOuter}>
                    <div style={{ ...S.budgetBarInner, width: `${usedPct}%`, background: barColor }} />
                  </div>
                </div>

                {/* 指标 */}
                <div style={S.metricRow}>
                  {campaign.roi !== undefined && (
                    <span style={S.metricItem}>
                      📈 ROI <strong style={{ color: campaign.roi >= 100 ? '#22c55e' : '#ef4444' }}>{campaign.roi}%</strong>
                    </span>
                  )}
                  {campaign.targetMetric && (
                    <span style={S.metricItem}>🎯 {campaign.targetMetric}</span>
                  )}
                </div>

                {/* 操作按钮 */}
                {(onToggle || onCampaignClick) && (
                  <div style={S.actionsRow} onClick={(e) => e.stopPropagation()}>
                    {canToggle && onToggle && (
                      <button
                        style={{
                          ...S.toggleBtn,
                          color: isActive(campaign.status) ? '#f59e0b' : '#22c55e',
                          borderColor: isActive(campaign.status) ? '#fde68a' : '#bbf7d0',
                          background: isActive(campaign.status) ? '#fffbeb' : '#f0fdf4',
                        }}
                        onClick={() => onToggle(campaign.id, toggleTarget)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = '1';
                        }}
                        aria-label={isActive(campaign.status) ? '暂停活动' : '启用活动'}
                      >
                        {isActive(campaign.status) ? '⏸ 暂停' : '▶ 启用'}
                      </button>
                    )}
                    {onCampaignClick && (
                      <button
                        style={S.actionBtn}
                        onClick={() => onCampaignClick(campaign.id)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe';
                          (e.currentTarget as HTMLElement).style.color = '#6366f1';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                          (e.currentTarget as HTMLElement).style.color = '#475569';
                        }}
                      >
                        查看详情
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PromotionCampaignManager;
