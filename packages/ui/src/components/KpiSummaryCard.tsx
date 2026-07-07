/**
 * KpiSummaryCard — 关键指标摘要卡片组件
 * 组合多个 StatCard 为一个带标题的分组卡片, 支持横向/纵向排列
 *
 * 使用场景:
 * - Dashboard 顶部关键指标概览
 * - 详情页的汇总统计区域
 * - 报表页的数据概览
 */
'use client';

import React from 'react';
import { StatCard } from './StatCard';

export interface KpiCardItem {
  /** 指标标签 */
  label: string;
  /** 指标值 */
  value: string | number;
  /** 趋势 (可选, StatCard 的 trend 格式) */
  trend?: { value: string; positive: boolean };
  /** 辅助描述 (可选) */
  helper?: string;
  /** 卡片变体 (可选) */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface KpiSummaryCardProps {
  /** 卡片标题 */
  title: string;
  /** KPI 指标数组 */
  items: KpiCardItem[];
  /** 列数 (1-4, 默认 3) */
  columns?: 1 | 2 | 3 | 4;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义容器样式 */
  style?: React.CSSProperties;
  /** 自定义容器类名 */
  className?: string;
}

const COLUMN_MAP: Record<number, string> = {
  1: 'repeat(1, minmax(0, 1fr))',
  2: 'repeat(2, minmax(0, 1fr))',
  3: 'repeat(3, minmax(0, 1fr))',
  4: 'repeat(4, minmax(0, 1fr))',
};

/**
 * KpiSummaryCard — 关键指标摘要卡片
 */
export function KpiSummaryCard({
  title,
  items,
  columns = 3,
  compact = false,
  style,
  className,
}: KpiSummaryCardProps) {
  const safeColumns = Math.min(Math.max(columns, 1), 4) as 1 | 2 | 3 | 4;

  return (
    <div
      data-testid="kpi-summary-card"
      className={className}
      style={{
        borderRadius: 12,
        padding: compact ? 12 : 16,
        background: 'rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#e2e8f0',
          marginBottom: compact ? 8 : 12,
          paddingBottom: compact ? 6 : 8,
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'grid',
          gap: compact ? 8 : 12,
          gridTemplateColumns: COLUMN_MAP[safeColumns],
        }}
      >
        {items.map((item: KpiCardItem, index) => (
          <StatCard
            key={`${item.label}-${index}`}
            label={item.label}
            value={item.value}
            trend={item.trend}
            helper={item.helper}
            variant={item.variant as any}
          />
        ))}
      </div>
    </div>
  );
}

export default KpiSummaryCard;
