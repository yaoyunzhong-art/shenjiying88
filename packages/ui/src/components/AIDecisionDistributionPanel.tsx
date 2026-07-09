/**
 * AIDecisionDistributionPanel — AI 决策分布统计面板
 *
 * 功能:
 * - 展示不同 AI 决策类别/类型的执行分布情况
 * - 带百分比进度条和统计卡片
 * - 支持决策决策者/引擎过滤
 * - 决策通过率/拒绝率/待审率统计
 * - 轻量级纯 CSS 实现，无外部图表依赖
 *
 * 使用场景:
 * - AI 决策面板顶部统计概览
 * - 运营/管理后台 AI 决策分布分析
 * - 规则引擎效果看板
 */
'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';

// ---- 类型定义 ----

export type DecisionCategory =
  | 'pricing'
  | 'inventory'
  | 'promotion'
  | 'staff_scheduling'
  | 'customer_service'
  | 'content_generation'
  | 'member_retention'
  | 'anomaly_response';

export interface DecisionDistributionItem {
  /** 决策类别 */
  category: DecisionCategory;
  /** 显示名称 */
  label: string;
  /** 执行总数 */
  total: number;
  /** 通过数 */
  approved: number;
  /** 拒绝数 */
  rejected: number;
  /** 待审数 */
  pending: number;
  /** 平均置信度 0-1 */
  avgConfidence: number;
  /** 图标字符(emoji) */
  icon?: string;
}

export interface AIDecisionDistributionPanelProps {
  /** 分布数据 */
  items: DecisionDistributionItem[];
  /** 面板标题 */
  title?: string;
  /** 加载态 */
  loading?: boolean;
  /** 空态文本 */
  emptyText?: string;
  /** 筛选器: 决策类别 */
  filterCategory?: DecisionCategory | 'all';
  /** 筛选回调 */
  onCategoryFilter?: (category: DecisionCategory | 'all') => void;
  /** 点击某项 */
  onItemClick?: (category: DecisionCategory) => void;
  /** 自定义类 */
  className?: string;
  'data-testid'?: string;
}

// ---- 常量 ----

const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  pricing: '定价决策',
  inventory: '库存决策',
  promotion: '促销决策',
  staff_scheduling: '排班决策',
  customer_service: '客服决策',
  content_generation: '内容生成',
  member_retention: '会员留存',
  anomaly_response: '异常响应',
};

const CATEGORY_ICONS: Record<DecisionCategory, string> = {
  pricing: '💰',
  inventory: '📦',
  promotion: '🎯',
  staff_scheduling: '📅',
  customer_service: '💬',
  content_generation: '✍️',
  member_retention: '👤',
  anomaly_response: '⚠️',
};

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  pricing: '#4f46e5',
  inventory: '#0891b2',
  promotion: '#d97706',
  staff_scheduling: '#7c3aed',
  customer_service: '#059669',
  content_generation: '#dc2626',
  member_retention: '#2563eb',
  anomaly_response: '#ca8a04',
};

const DEFAULT_EMPTY = '暂无决策分布数据';

// ---- 辅助函数 ----

function getDecisionRateColor(rate: number): BadgeVariant {
  if (rate >= 0.8) return 'success';
  if (rate >= 0.5) return 'warning';
  return 'danger';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ---- 子组件: 分布条 ----

function DistributionBar({
  label,
  approved,
  rejected,
  pending,
  total,
  color,
  icon,
  maxTotal,
  onClick,
}: {
  label: string;
  approved: number;
  rejected: number;
  pending: number;
  total: number;
  color: string;
  icon: string;
  maxTotal: number;
  onClick?: () => void;
}) {
  const approveRate = total > 0 ? approved / total : 0;
  const rejectRate = total > 0 ? rejected / total : 0;
  const pendingRate = total > 0 ? pending / total : 0;
  const ratio = maxTotal > 0 ? total / maxTotal : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className="aidist-item"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-testid={`aidist-item-${label}`}
    >
      <div className="aidist-item-header">
        <span className="aidist-item-icon" data-testid={`aidist-icon-${label}`}>
          {icon}
        </span>
        <span className="aidist-item-label" data-testid={`aidist-label-${label}`}>
          {label}
        </span>
        <Badge variant={getDecisionRateColor(approveRate)} size="sm">
          {formatPercent(approveRate)} 通过
        </Badge>
        <span className="aidist-item-total" data-testid={`aidist-total-${label}`}>
          {total} 次
        </span>
      </div>

      <div className="aidist-bar-track" data-testid={`aidist-bar-${label}`}>
        <div
          className="aidist-bar-segment aidist-bar-approved"
          style={{ width: `${approveRate * 100}%`, backgroundColor: color }}
          title={`通过: ${approved}`}
        />
        <div
          className="aidist-bar-segment aidist-bar-rejected"
          style={{ width: `${rejectRate * 100}%`, backgroundColor: '#f87171' }}
          title={`拒绝: ${rejected}`}
        />
        <div
          className="aidist-bar-segment aidist-bar-pending"
          style={{ width: `${pendingRate * 100}%`, backgroundColor: '#d1d5db' }}
          title={`待审: ${pending}`}
        />
      </div>

      <div className="aidist-bar-footer">
        <span className="aidist-bar-metrics" data-testid={`aidist-metrics-${label}`}>
          <span style={{ color }}>✓ {approved}</span>
          {' · '}
          <span style={{ color: '#f87171' }}>✗ {rejected}</span>
          {' · '}
          <span style={{ color: '#9ca3af' }}>◎ {pending}</span>
        </span>
        <span
          className="aidist-bar-scale"
          style={{ width: `${ratio * 100}%`, opacity: 0.15, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---- 主组件 ----

export function AIDecisionDistributionPanel({
  items,
  title = 'AI 决策分布统计',
  loading = false,
  emptyText = DEFAULT_EMPTY,
  filterCategory = 'all',
  onCategoryFilter,
  onItemClick,
  className = '',
  'data-testid': dataTestId = 'aidist-panel',
}: AIDecisionDistributionPanelProps) {
  const filtered = useMemo(() => {
    if (filterCategory === 'all') return items;
    return items.filter((i) => i.category === filterCategory);
  }, [items, filterCategory]);

  const maxTotal = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map((i) => i.total));
  }, [filtered]);

  const summary = useMemo(() => {
    const total = items.reduce((s, i) => s + i.total, 0);
    const totalApproved = items.reduce((s, i) => s + i.approved, 0);
    const totalRejected = items.reduce((s, i) => s + i.rejected, 0);
    const totalPending = items.reduce((s, i) => s + i.pending, 0);
    const avgConf =
      total > 0
        ? items.reduce((s, i) => s + i.avgConfidence * i.total, 0) / total
        : 0;
    return { total, totalApproved, totalRejected, totalPending, avgConf };
  }, [items]);

  if (loading) {
    return (
      <Card className={`aidist-panel ${className}`} data-testid={`${dataTestId}-loading`}>
        <div className="aidist-header">
          <h3 className="aidist-title">{title}</h3>
        </div>
        <div className="aidist-loading" data-testid="aidist-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aidist-skeleton" data-testid={`aidist-skeleton-${i}`}>
              <div className="aidist-skeleton-line" style={{ width: `${60 + i * 10}%` }} />
              <div className="aidist-skeleton-bar" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className={`aidist-panel ${className}`} data-testid={`${dataTestId}-empty`}>
        <div className="aidist-header">
          <h3 className="aidist-title">{title}</h3>
        </div>
        <div className="aidist-empty" data-testid="aidist-empty-text">
          {emptyText}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`aidist-panel ${className}`} data-testid={dataTestId}>
      <div className="aidist-header">
        <h3 className="aidist-title">{title}</h3>
        {onCategoryFilter && (
          <select
            className="aidist-filter"
            value={filterCategory}
            onChange={(e) => onCategoryFilter(e.target.value as DecisionCategory | 'all')}
            data-testid="aidist-category-filter"
          >
            <option value="all">全部分类</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 统计概览卡片 */}
      <div className="aidist-summary" data-testid="aidist-summary">
        <div className="aidist-stat" data-testid="aidist-stat-total">
          <span className="aidist-stat-value">{summary.total}</span>
          <span className="aidist-stat-label">总决策数</span>
        </div>
        <div className="aidist-stat" data-testid="aidist-stat-approved">
          <span className="aidist-stat-value" style={{ color: '#16a34a' }}>
            {summary.totalApproved}
          </span>
          <span className="aidist-stat-label">已通过</span>
        </div>
        <div className="aidist-stat" data-testid="aidist-stat-rejected">
          <span className="aidist-stat-value" style={{ color: '#dc2626' }}>
            {summary.totalRejected}
          </span>
          <span className="aidist-stat-label">已拒绝</span>
        </div>
        <div className="aidist-stat" data-testid="aidist-stat-pending">
          <span className="aidist-stat-value" style={{ color: '#ca8a04' }}>
            {summary.totalPending}
          </span>
          <span className="aidist-stat-label">待审核</span>
        </div>
        <div className="aidist-stat" data-testid="aidist-stat-confidence">
          <span className="aidist-stat-value">{formatPercent(summary.avgConf)}</span>
          <span className="aidist-stat-label">平均置信度</span>
        </div>
      </div>

      {/* 分布列表 */}
      <div className="aidist-list" data-testid="aidist-list">
        {filtered.length === 0 && filterCategory !== 'all' ? (
          <div className="aidist-empty" data-testid="aidist-filter-empty">
            该分类暂无数据
          </div>
        ) : (
          filtered.map((item) => (
            <DistributionBar
              key={item.category}
              label={item.label || CATEGORY_LABELS[item.category]}
              approved={item.approved}
              rejected={item.rejected}
              pending={item.pending}
              total={item.total}
              color={CATEGORY_COLORS[item.category]}
              icon={item.icon || CATEGORY_ICONS[item.category]}
              maxTotal={maxTotal}
              onClick={onItemClick ? () => onItemClick(item.category) : undefined}
            />
          ))
        )}
      </div>

      <style>{`
        .aidist-panel { padding: 16px; font-size: 14px; line-height: 1.5; }
        .aidist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .aidist-title { margin: 0; font-size: 16px; font-weight: 600; }
        .aidist-filter { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; cursor: pointer; }
        .aidist-filter:focus { outline: 2px solid #3b82f6; outline-offset: 1px; }

        .aidist-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
        .aidist-stat { background: #f9fafb; border-radius: 8px; padding: 12px 8px; text-align: center; }
        .aidist-stat-value { display: block; font-size: 20px; font-weight: 700; line-height: 1.2; }
        .aidist-stat-label { display: block; font-size: 12px; color: #6b7280; margin-top: 2px; }

        .aidist-list { display: flex; flex-direction: column; gap: 12px; }
        .aidist-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .aidist-item:last-child { border-bottom: none; }
        .aidist-item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .aidist-item-icon { font-size: 16px; width: 24px; text-align: center; }
        .aidist-item-label { flex: 1; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .aidist-item-total { font-size: 13px; color: #6b7280; white-space: nowrap; }

        .aidist-bar-track { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #f3f4f6; }
        .aidist-bar-segment { transition: width 0.3s ease; height: 100%; }
        .aidist-bar-approved { border-radius: 4px 0 0 4px; }
        .aidist-bar-rejected { }
        .aidist-bar-pending { border-radius: 0 4px 4px 0; }

        .aidist-bar-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; position: relative; }
        .aidist-bar-metrics { font-size: 12px; color: #6b7280; }
        .aidist-bar-scale { position: absolute; bottom: 0; left: 0; height: 2px; border-radius: 1px; }

        .aidist-loading { display: flex; flex-direction: column; gap: 16px; }
        .aidist-skeleton { display: flex; flex-direction: column; gap: 6px; }
        .aidist-skeleton-line { height: 12px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: aidist-shimmer 1.5s infinite; border-radius: 4px; }
        .aidist-skeleton-bar { height: 8px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: aidist-shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes aidist-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .aidist-empty { color: #9ca3af; text-align: center; padding: 32px 16px; font-size: 14px; }
      `}</style>
    </Card>
  );
}
