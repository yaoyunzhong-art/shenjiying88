'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 库存核心指标 */
export interface InventoryMetrics {
  /** 总库存金额 (元) */
  totalStockValue: number;
  /** SKU 总数 */
  totalSku: number;
  /** 库存周转天数 */
  turnoverDays: number;
  /** 缺货率 (0-1) */
  stockoutRate: number;
  /** 环比变化 */
  valueTrend: number;
  skuTrend: number;
  turnoverTrend: number;
  stockoutTrend: number;
}

/** 滞销 / 积压商品条目 */
export interface SlowMovingItem {
  id: string;
  sku: string;
  name: string;
  /** 当前库存 */
  currentQty: number;
  /** 近 30 天销量 */
  sales30d: number;
  /** 库存天数 */
  daysInStock: number;
  /** 占用资金 (元) */
  capitalLocked: number;
  /** 建议动作 */
  suggestion: 'promote' | 'transfer' | 'return' | 'writeoff';
}

/** 供应商绩效 */
export interface SupplierPerformance {
  id: string;
  name: string;
  /** 准时交付率 (0-1) */
  onTimeRate: number;
  /** 品质合格率 (0-1) */
  qualityRate: number;
  /** 平均到货天数 */
  avgLeadDays: number;
  /** 本月采购额 (元) */
  monthlyPurchase: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

/** 品类占比 */
export interface CategoryBreakdown {
  category: string;
  skuCount: number;
  totalValue: number;
  percentage: number;
}

/** 库存经理工作台 Props */
export interface InventoryManagerDashboardProps {
  /** 库存核心指标 */
  metrics?: InventoryMetrics;
  /** 滞销商品列表 */
  slowMovingItems?: SlowMovingItem[];
  /** 供应商绩效列表 */
  supplierPerformances?: SupplierPerformance[];
  /** 品类分布 */
  categoryBreakdown?: CategoryBreakdown[];
  /** 标题 */
  title?: string;
  /** 最后更新 */
  lastUpdatedAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 样式常量 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
};

const CATEGORY_BAR_CONTAINER: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const CATEGORY_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 0',
};

const CATEGORY_BAR_TRACK: React.CSSProperties = {
  flex: 1,
  height: 8,
  borderRadius: 4,
  background: 'rgba(148,163,184,0.12)',
  overflow: 'hidden',
};

const CATEGORY_BAR_FILL: React.CSSProperties = {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.4s ease',
};

const CATEGORY_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  minWidth: 60,
};

const CATEGORY_VALUE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#e2e8f0',
  minWidth: 60,
  textAlign: 'right',
};

const CATEGORY_PCT_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  minWidth: 40,
  textAlign: 'right',
};

// ---- 工具函数 ----

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString('zh-CN');
}

function fmtTrend(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function suggestionLabel(s: SlowMovingItem['suggestion']): string {
  const map: Record<string, string> = {
    promote: '促销',
    transfer: '调拨',
    return: '退货',
    writeoff: '报废',
  };
  return map[s] ?? s;
}

function suggestionVariant(s: SlowMovingItem['suggestion']): 'warning' | 'neutral' | 'error' | 'success' {
  const map: Record<string, 'warning' | 'neutral' | 'error' | 'success'> = {
    promote: 'warning',
    transfer: 'neutral',
    return: 'error',
    writeoff: 'error',
  };
  return map[s] ?? 'neutral';
}

function gradeColor(grade: SupplierPerformance['grade']): string {
  const map: Record<string, string> = {
    A: '#4ade80',
    B: '#60a5fa',
    C: '#fbbf24',
    D: '#f87171',
  };
  return map[grade] ?? '#94a3b8';
}

const CATEGORY_COLORS = [
  '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa',
  '#34d399', '#f472b6', '#fb923c', '#22d3ee', '#e879f9',
];

// ---- 列配置 ----

const SLOW_COLUMNS: DataTableColumn<SlowMovingItem>[] = [
  { key: 'sku', header: 'SKU', width: '100px', render: (r) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.sku}</span> },
  { key: 'name', header: '商品名', width: '160px', render: (r) => <span style={{ fontSize: 13, color: '#e2e8f0' }}>{r.name}</span> },
  { key: 'currentQty', header: '库存', width: '60px', render: (r) => <span style={{ fontSize: 12, color: '#cbd5e1' }}>{r.currentQty}</span> },
  { key: 'sales30d', header: '近30天销量', width: '80px', render: (r) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.sales30d}</span> },
  { key: 'daysInStock', header: '库存天数', width: '70px', render: (r) => <span style={{ fontSize: 12, color: r.daysInStock > 90 ? '#f87171' : '#fbbf24' }}>{r.daysInStock}d</span> },
  {
    key: 'capitalLocked',
    header: '占用资金',
    width: '90px',
    render: (r) => <span style={{ fontSize: 12, color: '#cbd5e1' }}>¥{fmtCurrency(r.capitalLocked)}</span>,
  },
  {
    key: 'suggestion',
    header: '建议',
    width: '70px',
    render: (r) => <StatusBadge label={suggestionLabel(r.suggestion)} variant={suggestionVariant(r.suggestion)} size="sm" />,
  },
];

const SUPPLIER_COLUMNS: DataTableColumn<SupplierPerformance>[] = [
  { key: 'name', header: '供应商', width: '120px', render: (r) => <span style={{ fontSize: 13, color: '#e2e8f0' }}>{r.name}</span> },
  {
    key: 'onTimeRate',
    header: '准时交付率',
    width: '90px',
    render: (r) => {
      const color = r.onTimeRate >= 0.95 ? '#4ade80' : r.onTimeRate >= 0.85 ? '#fbbf24' : '#f87171';
      return <span style={{ fontSize: 12, color }}>{(r.onTimeRate * 100).toFixed(0)}%</span>;
    },
  },
  {
    key: 'qualityRate',
    header: '合格率',
    width: '80px',
    render: (r) => {
      const color = r.qualityRate >= 0.98 ? '#4ade80' : r.qualityRate >= 0.92 ? '#fbbf24' : '#f87171';
      return <span style={{ fontSize: 12, color }}>{(r.qualityRate * 100).toFixed(0)}%</span>;
    },
  },
  { key: 'avgLeadDays', header: '平均到货天数', width: '90px', render: (r) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.avgLeadDays}d</span> },
  {
    key: 'monthlyPurchase',
    header: '月采购额',
    width: '90px',
    render: (r) => <span style={{ fontSize: 12, color: '#cbd5e1' }}>¥{fmtCurrency(r.monthlyPurchase)}</span>,
  },
  {
    key: 'grade',
    header: '评级',
    width: '50px',
    render: (r) => (
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: gradeColor(r.grade),
        }}
      >
        {r.grade}
      </span>
    ),
  },
];

// ---- 主组件 ----

/**
 * InventoryManagerDashboard — 库存经理工作台
 *
 * 聚焦库存全局视角：核心指标、滞销积压分析、供应商绩效、品类分布。
 * 适合仓库管理 / 零售 / 电商库存经理角色。
 *
 * @example
 * <InventoryManagerDashboard
 *   metrics={{ totalStockValue: 3240000, totalSku: 2156, turnoverDays: 28, stockoutRate: 0.032, valueTrend: -1.2, skuTrend: 3.5, turnoverTrend: -2.1, stockoutTrend: 0.5 }}
 *   slowMovingItems={[{ id: '1', sku: 'SKU-089', name: 'XX冬季棉服', currentQty: 320, sales30d: 12, daysInStock: 98, capitalLocked: 38400, suggestion: 'promote' }]}
 *   supplierPerformances={[{ id: 's1', name: '杭州纺织科技有限公司', onTimeRate: 0.96, qualityRate: 0.99, avgLeadDays: 4, monthlyPurchase: 450000, grade: 'A' }]}
 *   categoryBreakdown={[{ category: '服装', skuCount: 680, totalValue: 1080000, percentage: 33.3 }]}
 * />
 */
export function InventoryManagerDashboard({
  metrics,
  slowMovingItems,
  supplierPerformances,
  categoryBreakdown,
  title,
  lastUpdatedAt,
  loading = false,
  className,
}: InventoryManagerDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }} data-testid="inventory-mgr-loading">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 88,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.3)',
                border: '1px solid rgba(148,163,184,0.08)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          正在加载库存分析数据...
        </div>
      </div>
    );
  }

  // ---- 构建核心指标 ----

  const metricItems: QuickStatItem[] = metrics
    ? [
        {
          label: '总库存金额',
          value: `¥${fmtCurrency(metrics.totalStockValue)}`,
          helper: `环比 ${fmtTrend(metrics.valueTrend)}`,
          valueColor: metrics.valueTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: 'SKU 总数',
          value: metrics.totalSku.toLocaleString(),
          helper: `环比 ${fmtTrend(metrics.skuTrend)}`,
          valueColor: metrics.skuTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '库存周转天数',
          value: `${metrics.turnoverDays}d`,
          helper: `环比 ${fmtTrend(metrics.turnoverTrend)}`,
          valueColor: metrics.turnoverTrend <= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '缺货率',
          value: `${(metrics.stockoutRate * 100).toFixed(1)}%`,
          helper: `环比 ${fmtTrend(metrics.stockoutTrend)}`,
          valueColor: metrics.stockoutTrend <= 0 ? '#4ade80' : '#f87171',
        },
      ]
    : [
        { label: '库存金额', value: '--' },
        { label: 'SKU 数', value: '--' },
        { label: '周转天数', value: '--' },
        { label: '缺货率', value: '--' },
      ];

  // ---- 品类分布 ----

  const renderCategoryBreakdown = () => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) return null;
    return (
      <div style={CATEGORY_BAR_CONTAINER}>
        {categoryBreakdown.map((cat, index) => (
          <div key={cat.category} style={CATEGORY_ROW_STYLE}>
            <span style={CATEGORY_LABEL_STYLE}>{cat.category}</span>
            <div style={CATEGORY_BAR_TRACK}>
              <div
                style={{
                  ...CATEGORY_BAR_FILL,
                  width: `${cat.percentage}%`,
                  background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                }}
              />
            </div>
            <span style={CATEGORY_VALUE_STYLE}>
              ¥{fmtCurrency(cat.totalValue)}
            </span>
            <span style={CATEGORY_PCT_STYLE}>
              {cat.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={className}
      style={{ padding: 24, color: '#f8fafc' }}
      data-testid="inventory-mgr-root"
    >
      {/* ---- 头部 ---- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f8fafc',
            }}
            data-testid="inventory-mgr-title"
          >
            {title ?? '库存经理工作台'}
          </h2>
          {lastUpdatedAt && (
            <span
              style={{
                fontSize: 11,
                color: '#475569',
                marginTop: 4,
                display: 'inline-block',
              }}
            >
              数据更新: {lastUpdatedAt}
            </span>
          )}
        </div>
      </div>

      {/* ---- 核心指标 ---- */}
      <div style={SECTION_STYLE}>
        <QuickStats items={metricItems} columns={4} gap={14} padding={18} />
      </div>

      {/* ---- 品类分布 ---- */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <div style={SECTION_STYLE} data-testid="inventory-mgr-category">
          <div style={SECTION_HEADER_STYLE}>
            <span style={SECTION_TITLE_STYLE}>品类库存分布</span>
          </div>
          {renderCategoryBreakdown()}
        </div>
      )}

      {/* ---- 滞销商品分析 ---- */}
      {slowMovingItems && slowMovingItems.length > 0 && (
        <div style={SECTION_STYLE} data-testid="inventory-mgr-slow">
          <div style={SECTION_HEADER_STYLE}>
            <span style={SECTION_TITLE_STYLE}>
              滞销 / 积压商品
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                ({slowMovingItems.length})
              </span>
            </span>
          </div>
          <DataTable
            columns={SLOW_COLUMNS}
            rows={slowMovingItems}
            rowKey={(r: SlowMovingItem) => r.id}
            compact
            emptyText="暂无滞销商品"
          />
        </div>
      )}

      {/* ---- 供应商绩效 ---- */}
      {supplierPerformances && supplierPerformances.length > 0 && (
        <div style={SECTION_STYLE} data-testid="inventory-mgr-suppliers">
          <div style={SECTION_HEADER_STYLE}>
            <span style={SECTION_TITLE_STYLE}>供应商绩效</span>
          </div>
          <DataTable
            columns={SUPPLIER_COLUMNS}
            rows={supplierPerformances}
            rowKey={(r: SupplierPerformance) => r.id}
            compact
            emptyText="暂无供应商数据"
          />
        </div>
      )}
    </div>
  );
}
