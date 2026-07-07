'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

export interface RevenueSnapshot {
  /** 当前营收 */
  currentRevenue: number;
  /** 目标营收 */
  targetRevenue: number;
  /** 完成百分比 */
  completionPercent: number;
  /** 同比变化百分比 */
  yoyPercent: number;
  /** 环比变化百分比 */
  momPercent: number;
  /** 交易笔数 */
  transactionCount: number;
  /** 客单价 */
  avgOrderValue: number;
  /** 在线订单数 */
  onlineOrders: number;
  /** 线下订单数 */
  offlineOrders: number;
  /** 峰值并发 */
  peakConcurrent: number;
  /** 当前收银台在线数 */
  activeRegisters: number;
}

export interface RevenueTrendPoint {
  /** 标签（"10:00" / "06-27"） */
  label: string;
  /** 营收额 */
  revenue: number;
  /** 订单量 */
  orders: number;
}

export interface RevenueByCategory {
  category: string;
  amount: number;
  percent: number;
  color?: string;
}

export interface RealTimeRevenueDisplayProps {
  /** 快照数据 */
  snapshot: RevenueSnapshot;
  /** 时段趋势（最近 24 小时或今日逐时） */
  hourlyTrend: RevenueTrendPoint[];
  /** 品类分布 */
  categoryRevenue: RevenueByCategory[];
  /** 门店名称 */
  storeName?: string;
  /** 最后更新时间 */
  lastUpdate?: string;
  /** 刷新间隔标记 */
  isLive?: boolean;
  className?: string;
}

// ==================== 常量样式 ====================

const S_CONTAINER: React.CSSProperties = {
  background: 'rgba(15,23,42,0.35)',
  borderRadius: 16,
  border: '1px solid rgba(148,163,184,0.12)',
  padding: 24,
  width: '100%',
};

const S_HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
};

const S_TITLE_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const S_TITLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: 0,
};

const S_LIVE_DOT: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#22c55e',
};

const S_SUBTEXT: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const S_REVENUE_MAIN: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 16,
};

const S_REVENUE_VALUE: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  color: '#f8fafc',
  fontVariantNumeric: 'tabular-nums',
};

const S_REVENUE_TARGET: React.CSSProperties = {
  fontSize: 14,
  color: '#94a3b8',
};

const S_BAR_OUTER: React.CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 4,
  background: 'rgba(148,163,184,0.15)',
  marginBottom: 20,
  overflow: 'hidden',
};

const S_METRICS_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
  marginBottom: 20,
};

const S_METRIC_CARD: React.CSSProperties = {
  background: 'rgba(15,23,42,0.3)',
  borderRadius: 10,
  padding: '12px 14px',
  border: '1px solid rgba(148,163,184,0.06)',
};

const S_METRIC_LABEL: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  marginBottom: 4,
};

const S_METRIC_VALUE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#e2e8f0',
};

const S_SECTION_TITLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: 12,
  marginTop: 8,
};

const S_TREND_CHART: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 3,
  height: 80,
  marginBottom: 20,
  padding: '4px 0',
};

const S_TREND_LABELS: React.CSSProperties = {
  display: 'flex',
  gap: 3,
  marginBottom: 16,
};

const S_TREND_LABEL: React.CSSProperties = {
  flex: 1,
  fontSize: 9,
  color: '#475569',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const S_CATEGORY_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 8,
};

const S_CATEGORY_ITEM: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(15,23,42,0.2)',
};

const S_CATEGORY_INFO: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const S_CATEGORY_NAME: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
};

const S_CATEGORY_AMOUNT: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#e2e8f0',
};

const S_CATEGORY_PERCENT: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
};

const CATEGORY_COLORS = [
  '#4ade80', '#60a5fa', '#facc15', '#f87171',
  '#a78bfa', '#fb923c', '#22d3ee', '#e879f9',
];

// ==================== 工具函数 ====================

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toLocaleString('zh-CN');
}

function getBarStyle(pct: number): React.CSSProperties {
  return {
    height: '100%',
    borderRadius: 4,
    width: `${Math.min(pct, 100)}%`,
    background: pct >= 100
      ? 'linear-gradient(90deg, #4ade80, #22c55e)'
      : pct >= 80
        ? 'linear-gradient(90deg, #facc15, #eab308)'
        : 'linear-gradient(90deg, #f87171, #ef4444)',
    transition: 'width 0.6s ease',
  };
}

function getMetricTrendStyle(up: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    color: up ? '#4ade80' : '#f87171',
    marginTop: 2,
  };
}

function getTrendBarStyle(h: number, isHigh: boolean): React.CSSProperties {
  return {
    flex: 1,
    height: `${Math.max(h, 4)}%`,
    borderRadius: '3px 3px 0 0',
    background: isHigh
      ? 'linear-gradient(180deg, #4ade80, #22c55e)'
      : 'linear-gradient(180deg, #60a5fa, #3b82f6)',
    minHeight: 4,
    transition: 'height 0.3s ease',
  };
}

function getCategoryDot(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  };
}

// ==================== 实时营收展示面板 ====================

export function RealTimeRevenueDisplay({
  snapshot,
  hourlyTrend,
  categoryRevenue,
  storeName = '未知门店',
  lastUpdate,
  isLive = true,
  className = '',
}: RealTimeRevenueDisplayProps) {
  const maxRevenue = useMemo(
    () => Math.max(...hourlyTrend.map((p) => p.revenue), 1),
    [hourlyTrend],
  );

  const sortedCategories = useMemo(
    () => [...categoryRevenue].sort((a, b) => b.amount - a.amount),
    [categoryRevenue],
  );

  return (
    <div style={S_CONTAINER} className={className}>
      {/* 表头 */}
      <div style={S_HEADER}>
        <div style={S_TITLE_ROW}>
          <h3 style={S_TITLE}>📊 实时营收</h3>
          {isLive && (
            <>
              <div style={S_LIVE_DOT} />
              <span style={{ ...S_SUBTEXT, color: '#22c55e', fontSize: 11 }}>LIVE</span>
            </>
          )}
        </div>
        <span style={S_SUBTEXT}>
          {storeName} · {lastUpdate ?? '-'}
        </span>
      </div>

      {/* 主营收数字 */}
      <div style={S_REVENUE_MAIN}>
        <span style={S_REVENUE_VALUE}>{formatCurrency(snapshot.currentRevenue)}</span>
        <span style={S_REVENUE_TARGET}>
          / {formatCurrency(snapshot.targetRevenue)} ({snapshot.completionPercent.toFixed(1)}%)
        </span>
      </div>

      {/* 进度条 */}
      <div style={S_BAR_OUTER}>
        <div style={getBarStyle(snapshot.completionPercent)} />
      </div>

      {/* 指标网格 */}
      <div style={S_METRICS_GRID}>
        <div style={S_METRIC_CARD}>
          <div style={S_METRIC_LABEL}>交易笔数</div>
          <div style={S_METRIC_VALUE}>{snapshot.transactionCount}</div>
          <div style={getMetricTrendStyle(snapshot.yoyPercent >= 0)}>
            {snapshot.yoyPercent >= 0 ? '↑' : '↓'} 同比 {Math.abs(snapshot.yoyPercent).toFixed(1)}%
          </div>
        </div>
        <div style={S_METRIC_CARD}>
          <div style={S_METRIC_LABEL}>客单价</div>
          <div style={S_METRIC_VALUE}>¥{snapshot.avgOrderValue.toFixed(1)}</div>
          <div style={getMetricTrendStyle(snapshot.momPercent >= 0)}>
            {snapshot.momPercent >= 0 ? '↑' : '↓'} 环比 {Math.abs(snapshot.momPercent).toFixed(1)}%
          </div>
        </div>
        <div style={S_METRIC_CARD}>
          <div style={S_METRIC_LABEL}>线上/线下</div>
          <div style={S_METRIC_VALUE}>{snapshot.onlineOrders}/{snapshot.offlineOrders}</div>
        </div>
        <div style={S_METRIC_CARD}>
          <div style={S_METRIC_LABEL}>峰值并发</div>
          <div style={S_METRIC_VALUE}>{snapshot.peakConcurrent}</div>
          <div style={{ ...getMetricTrendStyle(true), color: '#64748b' }}>
            收银台 {snapshot.activeRegisters} 台在线
          </div>
        </div>
      </div>

      {/* 时段趋势 */}
      <div style={S_SECTION_TITLE}>📈 时段营收趋势</div>
      <div style={{ position: 'relative' }}>
        <div style={S_TREND_CHART}>
          {hourlyTrend.map((point, i) => {
            const h = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
            const isHigh = point.revenue >= maxRevenue * 0.85;
            return (
              <div
                key={i}
                style={getTrendBarStyle(h, isHigh)}
                title={`${point.label}: ${formatCurrency(point.revenue)}`}
              />
            );
          })}
        </div>
        <div style={S_TREND_LABELS}>
          {hourlyTrend.map((point, i) => (
            <span key={i} style={S_TREND_LABEL}>{point.label}</span>
          ))}
        </div>
      </div>

      {/* 品类分布 */}
      <div style={S_SECTION_TITLE}>📦 品类营收分布</div>
      <div style={S_CATEGORY_GRID}>
        {sortedCategories.map((cat, i) => (
          <div key={cat.category} style={S_CATEGORY_ITEM}>
            <div style={getCategoryDot(cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length]!)} />
            <div style={S_CATEGORY_INFO}>
              <div style={S_CATEGORY_NAME}>{cat.category}</div>
              <div style={S_CATEGORY_AMOUNT}>{formatCompact(cat.amount)}</div>
            </div>
            <span style={S_CATEGORY_PERCENT}>{cat.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RealTimeRevenueDisplay;
