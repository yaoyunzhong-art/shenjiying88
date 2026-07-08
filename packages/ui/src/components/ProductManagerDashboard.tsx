'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { StatusBadge } from './StatusBadge';

// ---- 类型定义 ----

/** 产品快照 */
export interface ProductSnapshot {
  id: string;
  /** 产品名称 */
  name: string;
  /** SKU */
  sku: string;
  /** 品类 */
  category: string;
  /** 品牌 */
  brand?: string;
  /** 售价 */
  price: number;
  /** 成本价 */
  costPrice?: number;
  /** 库存数量 */
  stock: number;
  /** 已售数量 */
  soldCount: number;
  /** 产品状态 */
  status: 'online' | 'offline' | 'pending_review' | 'out_of_stock' | 'discontinued';
  /** 创建日期 */
  createdAt: string;
  /** 最后更新 */
  updatedAt?: string;
  /** 评分 */
  rating?: number;
}

/** 品类统计 */
export interface CategoryStat {
  category: string;
  productCount: number;
  /** 该品类销售占比 (0-100) */
  salesPercent: number;
  /** 平均售价 */
  avgPrice: number;
}

/** 产品增长指标 */
export interface ProductGrowthMetrics {
  /** 产品总数 */
  totalProducts: number;
  /** 环比产品数量变化 (%) */
  totalProductsQoQ: number;
  /** 在线产品数 */
  onlineProducts: number;
  /** 在线产品环比 */
  onlineProductsQoQ: number;
  /** 待审核产品数 */
  pendingReview: number;
  /** 待审核变化 */
  pendingReviewQoQ: number;
  /** 缺货产品数 */
  outOfStockCount: number;
  /** 缺货环比 */
  outOfStockQoQ: number;
  /** 本月新品数 */
  newProductsThisMonth: number;
  /** 月销售总量 */
  totalSoldThisMonth: number;
  /** 平均评分 */
  avgRating: number;
  /** 平均评分环比 */
  avgRatingQoQ: number;
}

/** 产品经理快速操作 */
export interface ProductQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
}

/** 产品经理工作台属性 */
export interface ProductManagerDashboardProps {
  /** 产品经理姓名 */
  managerName?: string;
  /** 上次同步时间 */
  lastSyncAt?: string;
  /** 增长指标 */
  metrics?: ProductGrowthMetrics;
  /** 产品列表 */
  products?: ProductSnapshot[];
  /** 品类统计 */
  categoryStats?: CategoryStat[];
  /** 快速操作 */
  quickActions?: ProductQuickAction[];
  /** 月度上新目标 */
  monthlyGoal?: number;
  /** 已上新数量 */
  launchedThisMonth?: number;
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

const STATUS_LABEL: Record<string, string> = {
  online: '在线',
  offline: '已下架',
  pending_review: '待审核',
  out_of_stock: '缺货',
  discontinued: '已停产',
};

const STATUS_VARIANT_MAP: Record<string, string> = {
  online: 'success',
  offline: 'default',
  pending_review: 'warning',
  out_of_stock: 'danger',
  discontinued: 'error',
};

/** 状态类型到 StatusBadge variant 中允许的安全值 */
function toBadgeVariant(v: string): string {
  if (v === 'success' || v === 'info' || v === 'warning' || v === 'error') return v;
  if (v === 'default' || v === 'neutral' || v === 'pending' || v === 'danger') return v;
  return 'default';
}

// ---- 主组件 ----

export function ProductManagerDashboard({
  managerName,
  lastSyncAt,
  metrics,
  products,
  categoryStats,
  quickActions,
  monthlyGoal,
  launchedThisMonth,
  loading = false,
  compact = false,
}: ProductManagerDashboardProps) {
  if (loading) {
    return (
      <div data-testid="product-dashboard-loading" style={{ padding: 24 }}>
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
        <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>正在加载产品数据...</p>
      </div>
    );
  }

  const statItems: QuickStatItem[] = metrics
    ? [
        {
          label: '产品总数',
          value: String(metrics.totalProducts),
          helper: `环比 ${fmtTrend(metrics.totalProductsQoQ)}`,
          valueColor: metrics.totalProductsQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '在线产品',
          value: String(metrics.onlineProducts),
          helper: `环比 ${fmtTrend(metrics.onlineProductsQoQ)}`,
          valueColor: metrics.onlineProductsQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '待审核',
          value: String(metrics.pendingReview),
          helper: metrics.pendingReviewQoQ > 0 ? `↑ ${fmtTrend(metrics.pendingReviewQoQ)}` : `↓ ${Math.abs(metrics.pendingReviewQoQ).toFixed(1)}%`,
          valueColor: metrics.pendingReview > 0 ? '#f59e0b' : '#4ade80',
        },
        {
          label: '缺货产品',
          value: String(metrics.outOfStockCount),
          helper: `环比 ${fmtTrend(metrics.outOfStockQoQ)}`,
          valueColor: metrics.outOfStockCount > 0 ? '#f87171' : '#4ade80',
        },
        {
          label: '本月销售',
          value: fmtCurrency(metrics.totalSoldThisMonth),
          helper: `新品 ${metrics.newProductsThisMonth} 件`,
          valueColor: '#3b82f6',
        },
      ]
    : [];

  const productColumns: DataTableColumn<ProductSnapshot>[] = [
    {
      key: 'name',
      header: '产品名称',
      render: (row: ProductSnapshot) => (
        <span style={{ fontWeight: 500, fontSize: 14, color: '#1f2937' }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (row: ProductSnapshot) => (
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
          {row.sku}
        </span>
      ),
    },
    {
      key: 'category',
      header: '品类',
      render: (row: ProductSnapshot) => (
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {row.category}
        </span>
      ),
    },
    {
      key: 'price',
      header: '售价',
      align: 'right',
      render: (row: ProductSnapshot) => (
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
          ¥{row.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: '库存',
      align: 'right',
      render: (row: ProductSnapshot) => {
        const color = row.stock <= 0 ? '#dc2626' : row.stock < 10 ? '#ca8a04' : '#374151';
        return (
          <span style={{ fontSize: 13, color, fontWeight: row.stock <= 0 ? 600 : 400 }}>
            {row.stock}
          </span>
        );
      },
    },
    {
      key: 'soldCount',
      header: '已售',
      align: 'right',
      render: (row: ProductSnapshot) => (
        <span style={{ fontSize: 13, color: '#374151' }}>
          {row.soldCount.toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ProductSnapshot) => (
        <StatusBadge
          label={STATUS_LABEL[row.status] || row.status}
          variant={toBadgeVariant(STATUS_VARIANT_MAP[row.status] || 'default') as 'default' | 'neutral' | 'pending' | 'danger' | 'info' | 'warning' | 'error' | 'success'}
        />
      ),
    },
  ];

  const categoryColumns: DataTableColumn<CategoryStat>[] = [
    { key: 'category', header: '品类' },
    {
      key: 'productCount',
      header: '产品数',
      align: 'right',
      render: (row: CategoryStat) => (
        <span style={{ fontSize: 13, color: '#374151' }}>{row.productCount}</span>
      ),
    },
    {
      key: 'salesPercent',
      header: '销售占比',
      render: (row: CategoryStat) => (
        <span style={{ fontSize: 13, color: '#374151' }}>
          {row.salesPercent.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'avgPrice',
      header: '均价',
      align: 'right',
      render: (row: CategoryStat) => (
        <span style={{ fontSize: 13, color: '#374151' }}>
          ¥{row.avgPrice.toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div
      data-testid="product-manager-dashboard"
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
            产品经理工作台
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

      {/* 月度上新进度 */}
      {monthlyGoal !== undefined && launchedThisMonth !== undefined && (
        <div
          data-testid="launch-progress"
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
              本月上新进度
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {launchedThisMonth} / {monthlyGoal} 件
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
              data-testid="launch-fill"
              style={{
                width: `${Math.min((launchedThisMonth / Math.max(monthlyGoal, 1)) * 100, 100)}%`,
                height: '100%',
                background: launchedThisMonth >= monthlyGoal ? '#16a34a' : '#3b82f6',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 增长指标 */}
      {statItems.length > 0 && (
        <div data-testid="metrics" style={{ marginBottom: 20 }}>
          <QuickStats items={statItems} columns={5} />
        </div>
      )}

      {/* 产品列表 */}
      <div data-testid="products-section" style={{ marginBottom: 20 }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 16,
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          产品列表
          {products && products.length > 0 && (
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 13 }}>
              ({products.length})
            </span>
          )}
        </h3>
        {products && products.length > 0 ? (
          <DataTable
            columns={productColumns}
            data={products}
            rowKey={(p: ProductSnapshot) => p.id}
          />
        ) : (
          <p style={{ color: '#9ca3af', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
            暂无产品数据
          </p>
        )}
      </div>

      {/* 品类分布 */}
      {categoryStats && categoryStats.length > 0 && (
        <div data-testid="categories-section" style={{ marginBottom: 20 }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 16,
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            品类分布
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 13 }}>
              ({categoryStats.length})
            </span>
          </h3>
          <DataTable
            columns={categoryColumns}
            data={categoryStats}
            rowKey={(c: CategoryStat) => c.category}
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
