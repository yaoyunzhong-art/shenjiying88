/**
 * AnalyticsClient — 数据分析客户端组件
 * 功能: 营收看板、客流分布、商品排行、时段分析、品类占比、留存率
 * 支持分析分类筛选: 概览/趋势/对比/明细
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, StatusBadge, Tabs } from '@m5/ui';
import type { AnalysisFilter } from './page';

interface AnalyticsSnapshot {
  periodRevenue: { current: number; previous: number; growth: number };
  totalCustomers: number;
  avgOrderValue: number;
  topSellingProducts: { name: string; sales: number; revenue: number; growth: number }[];
  hourlyDistribution: { hour: string; customers: number; revenue: number }[];
  categoryBreakdown: { category: string; revenue: number; percentage: number }[];
  customerRetentionRate: number;
  newCustomerRate: number;
}

export default function AnalyticsClient({
  data,
  filter = 'overview',
}: {
  data: AnalyticsSnapshot;
  filter?: AnalysisFilter;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'hourly' | 'categories'>('overview');

  const summaryCards = useMemo(() => [
    { label: '本期营收', value: `¥${data.periodRevenue.current.toLocaleString()}`, detail: `较上期 ${data.periodRevenue.growth > 0 ? '+' : ''}${data.periodRevenue.growth}%`, isPositive: data.periodRevenue.growth > 0 },
    { label: '客流量', value: data.totalCustomers.toString(), detail: `人均 ¥${data.avgOrderValue}`, isPositive: true },
    { label: '留存率', value: `${data.customerRetentionRate}%`, detail: `新客占比 ${data.newCustomerRate}%`, isPositive: data.customerRetentionRate > 50 },
    { label: '最大品类', value: data.categoryBreakdown[0].category, detail: `占营收 ${data.categoryBreakdown[0].percentage}%`, isPositive: true },
  ], [data]);

  const maxHourlyCustomers = Math.max(...data.hourlyDistribution.map(h => h.customers));

  const showSummaryCards = filter === 'overview' || filter === 'detail';
  const showRevenueSection = filter === 'overview' || filter === 'trend';
  const showCustomerProfile = filter === 'overview' || filter === 'compare';
  const showProductsSection = filter === 'overview' || filter === 'detail';
  const showHourlySection = filter === 'overview' || filter === 'trend';
  const showCategoriesSection = filter === 'overview' || filter === 'detail';

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 统计摘要 */}
      {showSummaryCards && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} data-testid="summary-cards">
          {summaryCards.map(card => (
            <Card key={card.label} style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, margin: '8px 0', color: card.isPositive ? '#22c55e' : '#ef4444' }}>{card.value}</div>
              <div style={{ fontSize: 12, color: card.isPositive ? '#22c55e' : '#ef4444' }}>{card.detail}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 导航 */}
      <Tabs
        items={[
          { key: 'overview', label: '📊 总览' },
          { key: 'products', label: '🏷️ 商品排行', count: data.topSellingProducts.length },
          { key: 'hourly', label: '🕐 时段分析' },
          { key: 'categories', label: '📁 品类占比' },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        variant="pills"
      />

      {/* 总览 */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} data-testid="overview-section">
          {showRevenueSection && (
            <Card title="营收趋势" style={{ padding: 16 }} data-testid="revenue-card">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e', margin: '12px 0' }}>
                ¥{data.periodRevenue.current.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                上期: ¥{data.periodRevenue.previous.toLocaleString()} ·
                增长: <span style={{ color: data.periodRevenue.growth > 0 ? '#22c55e' : '#ef4444' }}>
                  {data.periodRevenue.growth > 0 ? '+' : ''}{data.periodRevenue.growth}%
                </span>
              </div>
            </Card>
          )}
          {showCustomerProfile && (
            <Card title="客户画像" style={{ padding: 16 }} data-testid="customer-profile-card">
              <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>留存率</span>
                  <span style={{ fontWeight: 700, color: data.customerRetentionRate > 50 ? '#22c55e' : '#eab308' }}>{data.customerRetentionRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>新客占比</span>
                  <span style={{ fontWeight: 700 }}>{data.newCustomerRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>客单价</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>¥{data.avgOrderValue}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 商品排行 */}
      {activeTab === 'products' && showProductsSection && (
        <Card title="热销商品 Top 5" style={{ padding: 16 }} data-testid="products-section">
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {data.topSellingProducts.map((product, i) => (
              <div key={product.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, color: '#64748b' }}>{'🥇🥈🥉🏅🏅'[i]}</span>
                  <span style={{ fontWeight: 600 }}>{product.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{product.sales} 单</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>¥{product.revenue.toLocaleString()}</span>
                  <StatusBadge
                    label={product.growth > 0 ? `+${product.growth}%` : `${product.growth}%`}
                    variant={product.growth > 0 ? 'success' : 'danger'}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 时段分析 */}
      {activeTab === 'hourly' && showHourlySection && (
        <Card title="客流时段分布" style={{ padding: 16 }} data-testid="hourly-section">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 12 }}>
            {data.hourlyDistribution.map(slot => {
              const heightPercent = (slot.customers / maxHourlyCustomers) * 100;
              return (
                <div key={slot.hour} style={{ textAlign: 'center' }}>
                  <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{
                      width: '80%',
                      height: `${heightPercent}%`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 8,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{slot.hour}</div>
                  <div style={{ fontSize: 11, color: '#e2e8f0' }}>{slot.customers}人</div>
                  <div style={{ fontSize: 10, color: '#22c55e' }}>¥{slot.revenue.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 品类占比 */}
      {activeTab === 'categories' && showCategoriesSection && (
        <div style={{ display: 'grid', gap: 8 }} data-testid="categories-section">
          {data.categoryBreakdown.map(cat => (
            <div key={cat.category} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{cat.category}</span>
                <span style={{ color: '#22c55e' }}>¥{cat.revenue.toLocaleString()} ({cat.percentage}%)</span>
              </div>
              <div style={{ height: 6, background: 'rgba(148,163,184,0.2)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${cat.percentage}%`, background: '#3b82f6', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
