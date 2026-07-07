'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';

// ---- 类型定义 ----

/** 顾客画像 */
export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  memberTier: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  preferences: string[];
  tags: string[];
}

/** 推荐商品 */
export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  reason: string;
  stock: number;
}

/** 今日业绩 */
export interface DailyPerformance {
  customersServed: number;
  totalSales: number;
  conversionRate: number;
  avgSpend: number;
}

/** 导购提醒 */
export interface GuideAlert {
  id: string;
  type: 'birthday' | 'follow_up' | 'restock' | 'vip_visit';
  message: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface SalesGuideToolProps {
  /** 导购员姓名 */
  guideName: string;
  /** 今日业绩 */
  performance?: DailyPerformance;
  /** 当前顾客画像 */
  currentCustomer?: CustomerProfile | null;
  /** 推荐商品列表 */
  recommendations?: RecommendedProduct[];
  /** 提醒列表 */
  alerts?: GuideAlert[];
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 选择顾客回调 */
  onSelectCustomer?: (customerId: string) => void;
  /** 推荐商品点击回调 */
  onRecommendProduct?: (productId: string) => void;
  /** 提醒点击回调 */
  onAlertClick?: (alertId: string) => void;
}

// ---- 子组件 ----

function PerformanceSection({ data }: { data: DailyPerformance }) {
  const items: QuickStatItem[] = [
    {
      label: '接待顾客',
      value: data.customersServed.toString(),
      trend: undefined,
    },
    {
      label: '今日销售额',
      value: `¥${data.totalSales.toLocaleString()}`,
      trend: undefined,
    },
    {
      label: '转化率',
      value: `${(data.conversionRate * 100).toFixed(1)}%`,
      trend: undefined,
    },
    {
      label: '客单价',
      value: `¥${data.avgSpend.toLocaleString()}`,
      trend: undefined,
    },
  ];
  return <QuickStats items={items} columns={4} />;
}

function CustomerCard({ customer, onSelect }: {
  customer: CustomerProfile;
  onSelect?: (id: string) => void;
}) {
  const tierColor = (() => {
    switch (customer.memberTier) {
      case 'DIAMOND': return '#f5222d';
      case 'PLATINUM': return '#722ed1';
      case 'GOLD': return '#faad14';
      case 'SILVER': return '#8c8c8c';
      default: return '#d9d9d9';
    }
  })();

  return (
    <div
      data-testid={`customer-card-${customer.id}`}
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e8e8e8',
        background: '#fff',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={() => onSelect?.(customer.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(customer.id); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>{customer.name}</strong>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            background: tierColor,
          }}
        >
          {customer.memberTier}
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#595959', marginBottom: 6 }}>
        📞 {customer.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
      </div>
      <div style={{ fontSize: 13, color: '#595959' }}>
        累计消费 ¥{customer.totalSpent.toLocaleString()} · 到访 {customer.visitCount} 次
      </div>
      {customer.preferences.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {customer.preferences.map((p, i) => (
            <span
              key={i}
              style={{
                padding: '1px 6px',
                fontSize: 11,
                borderRadius: 8,
                background: '#e6f7ff',
                color: '#1890ff',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendList({ items, onSelect }: {
  items: RecommendedProduct[];
  onSelect?: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div style={{ color: '#8c8c8c', padding: 12, textAlign: 'center' }}>暂无推荐商品</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p) => (
        <div
          key={p.id}
          data-testid={`recommend-${p.id}`}
          style={{
            padding: 12,
            borderRadius: 6,
            border: '1px solid #f0f0f0',
            background: '#fafafa',
            cursor: onSelect ? 'pointer' : 'default',
          }}
          onClick={() => onSelect?.(p.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(p.id); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>{p.name}</strong>
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f5222d' }}>
                ¥{p.price.toLocaleString()}
              </span>
              {p.originalPrice && p.originalPrice > p.price && (
                <span style={{ fontSize: 12, color: '#8c8c8c', textDecoration: 'line-through', marginLeft: 6 }}>
                  ¥{p.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#595959' }}>💡 {p.reason}</div>
          <div style={{ marginTop: 4, fontSize: 11, color: p.stock > 10 ? '#52c41a' : '#faad14' }}>
            库存: {p.stock}
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertList({ items, onSelect }: {
  items: GuideAlert[];
  onSelect?: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div style={{ color: '#8c8c8c', padding: 12, textAlign: 'center' }}>暂无提醒</div>;
  }
  const priorityColors: Record<string, string> = {
    high: '#f5222d',
    medium: '#faad14',
    low: '#8c8c8c',
  };
  const typeLabels: Record<string, string> = {
    birthday: '🎂 生日',
    follow_up: '📞 跟进',
    restock: '📦 补货',
    vip_visit: '⭐ VIP到店',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((a) => (
        <div
          key={a.id}
          data-testid={`alert-${a.id}`}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${priorityColors[a.priority]}40`,
            borderLeft: `3px solid ${priorityColors[a.priority]}`,
            background: '#fff',
            cursor: onSelect ? 'pointer' : 'default',
          }}
          onClick={() => onSelect?.(a.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(a.id); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {typeLabels[a.type] || a.type}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 8,
                background: priorityColors[a.priority] + '20',
                color: priorityColors[a.priority],
              }}
            >
              {a.priority}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{a.message}</div>
        </div>
      ))}
    </div>
  );
}

// ---- 主组件 ----

export function SalesGuideTool({
  guideName,
  performance,
  currentCustomer,
  recommendations = [],
  alerts = [],
  loading = false,
  error = null,
  onSelectCustomer,
  onRecommendProduct,
  onAlertClick,
}: SalesGuideToolProps) {
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#f5222d',
          background: '#fff2f0',
          borderRadius: 8,
          border: '1px solid #ffccc7',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div
      data-testid="sales-guide-tool"
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          marginBottom: 16,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>导购助手 - {guideName}</h2>
        <span style={{ fontSize: 13, color: '#8c8c8c' }}>销售辅助工具</span>
      </div>

      {/* 今日业绩 */}
      {performance && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, margin: '0 0 8px', color: '#262626' }}>📊 今日业绩</h3>
          <PerformanceSection data={performance} />
        </section>
      )}

      {/* 两列布局: 左 = 顾客 + 推荐, 右 = 提醒 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 左列 */}
        <div>
          {/* 当前顾客 */}
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, margin: '0 0 8px', color: '#262626' }}>
              {currentCustomer ? '👤 当前顾客' : '👤 暂无服务顾客'}
            </h3>
            {currentCustomer && (
              <CustomerCard customer={currentCustomer} onSelect={onSelectCustomer} />
            )}
            {!currentCustomer && (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: '#8c8c8c',
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                }}
              >
                暂无顾客信息，扫码或搜索添加
              </div>
            )}
          </section>

          {/* 推荐商品 */}
          <section>
            <h3 style={{ fontSize: 15, margin: '0 0 8px', color: '#262626' }}>
              🎯 智能推荐 ({recommendations.length})
            </h3>
            <RecommendList items={recommendations} onSelect={onRecommendProduct} />
          </section>
        </div>

        {/* 右列: 提醒 */}
        <section>
          <h3 style={{ fontSize: 15, margin: '0 0 8px', color: '#262626' }}>
            🔔 提醒 ({alerts.length})
          </h3>
          <AlertList items={alerts} onSelect={onAlertClick} />
        </section>
      </div>
    </div>
  );
}
