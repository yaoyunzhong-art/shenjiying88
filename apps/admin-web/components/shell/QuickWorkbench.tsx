'use client';

/**
 * 🎨 QuickWorkbench — 首页快捷工作台
 * KPI卡片 + 快速操作 + 最近活动
 */
import React from 'react';
import Link from 'next/link';
import { useCrudFeedback } from './FeedbackProvider';

interface QuickWorkbenchStats {
  orderCount: number;
  storeCount: number;
  roleCount: number;
  deliveryMode: string;
}

interface KpiData {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: string;
}

function buildKpis(stats: QuickWorkbenchStats): KpiData[] {
  const deliveryLabel = stats.deliveryMode === 'api' ? '实时模式' : '降级模式';
  const deliveryTrend: KpiData['trend'] = stats.deliveryMode === 'api' ? 'up' : 'down';
  const deliveryTrendValue = stats.deliveryMode === 'api' ? 'API' : 'fallback';
  return [
    { label: '角色工作台', value: String(stats.roleCount), trend: 'flat', trendValue: `${stats.roleCount} 个角色`, icon: '�️' },
    { label: '交付模式', value: deliveryLabel, trend: deliveryTrend, trendValue: deliveryTrendValue, icon: '⚡' },
    { label: '工作台数量', value: String(stats.orderCount), trend: 'up', trendValue: `${stats.orderCount} 个`, icon: '📦' },
    { label: '治理告警', value: String(stats.storeCount), trend: 'down', trendValue: `${stats.storeCount} 条`, icon: '📋' },
  ];
}

const QUICK_ACTIONS = [
  { label: '新建订单', href: '/orders/new', icon: '📝', color: '#3b82f6' },
  { label: '添加商品', href: '/products/new', icon: '🛍️', color: '#8b5cf6' },
  { label: '发放优惠券', href: '/coupons/new', icon: '🎫', color: '#f59e0b' },
  { label: '查看报表', href: '/reports', icon: '📊', color: '#10b981' },
  { label: '审核审批', href: '/approvals', icon: '✅', color: '#ef4444' },
  { label: '操作日志', href: '/audit-logs', icon: '📜', color: '#6366f1' },
];

export default function QuickWorkbench({ stats }: { stats: QuickWorkbenchStats }) {
  const feedback = useCrudFeedback();

  const handleQuickAction = (label: string) => {
    feedback.info(`正在跳转到 ${label}...`);
  };

  const kpis = buildKpis(stats);

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* KPI 卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              borderRadius: 16,
              padding: '20px 24px',
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{kpi.label}</span>
              <span style={{ fontSize: 20 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.5 }}>
              {kpi.value}
            </div>
            {kpi.trendValue && (
              <div
                style={{
                  fontSize: 12,
                  color: kpi.trend === 'up' ? '#4ade80' : kpi.trend === 'down' ? '#f87171' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}</span>
                <span>{kpi.trendValue} vs 昨日</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div
        style={{
          borderRadius: 16,
          padding: '20px 24px',
          background: 'rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
          ⚡ 快速操作
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => handleQuickAction(action.label)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 10,
                padding: '10px 18px',
                background: `${action.color}18`,
                border: `1px solid ${action.color}30`,
                color: action.color,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
