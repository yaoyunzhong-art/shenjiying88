'use client'

/**
 * 折扣规则 — Discount Rules
 *
 * 管理商品折扣策略：
 * - 支持：百分比折扣、固定金额、买赠、免邮、阶梯折扣
 * - 范围：全场/分类/商品/客户标签/最低消费
 * - 状态：生效/停用/定时/过期
 */

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  DataTable,
  StatCard,
  Tabs,
  StatusBadge,
  SearchFilterInput,
  useSearchFilter,
  usePagination,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

type DiscountType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping' | 'tiered';
type DiscountScope = 'all' | 'category' | 'product' | 'customer_tag' | 'min_purchase';
type DiscountStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  scope: DiscountScope;
  value: number;
  minPurchaseCents: number;
  maxDiscountCents: number;
  status: DiscountStatus;
  priority: number;
  startDate: string;
  endDate: string | null;
  usageCount: number;
  maxUsage: number;
}

// ============================================================
// 常量
// ============================================================

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: '百分比折扣',
  fixed_amount: '固定金额',
  buy_x_get_y: '买赠',
  free_shipping: '免运费',
  tiered: '阶梯折扣',
};

const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  all: '全场',
  category: '分类',
  product: '商品',
  customer_tag: '客户标签',
  min_purchase: '最低消费',
};

// ============================================================
// Mock 数据
// ============================================================

const MOCK_DISCOUNT_RULES: DiscountRule[] = [
  { id: 'DR-001', name: '新客首单9折', type: 'percentage', scope: 'all', value: 10, minPurchaseCents: 100, maxDiscountCents: 5000, status: 'active', priority: 1, startDate: '2026-01-01', endDate: '2026-12-31', usageCount: 1248, maxUsage: 5000 },
  { id: 'DR-002', name: '满200减30', type: 'fixed_amount', scope: 'min_purchase', value: 3000, minPurchaseCents: 20000, maxDiscountCents: 3000, status: 'active', priority: 2, startDate: '2026-01-01', endDate: null, usageCount: 8756, maxUsage: 99999 },
  { id: 'DR-003', name: '买2送1', type: 'buy_x_get_y', scope: 'product', value: 100, minPurchaseCents: 0, maxDiscountCents: 99999, status: 'active', priority: 3, startDate: '2026-02-01', endDate: '2026-08-31', usageCount: 3456, maxUsage: 10000 },
  { id: 'DR-004', name: 'VIP免邮', type: 'free_shipping', scope: 'customer_tag', value: 0, minPurchaseCents: 0, maxDiscountCents: 0, status: 'active', priority: 4, startDate: '2026-01-01', endDate: null, usageCount: 2458, maxUsage: 50000 },
  { id: 'DR-005', name: '夏季满减阶梯', type: 'tiered', scope: 'category', value: 20, minPurchaseCents: 5000, maxDiscountCents: 20000, status: 'active', priority: 5, startDate: '2026-06-01', endDate: '2026-09-30', usageCount: 654, maxUsage: 3000 },
  { id: 'DR-006', name: '老客户8折(停用)', type: 'percentage', scope: 'customer_tag', value: 20, minPurchaseCents: 0, maxDiscountCents: 8000, status: 'inactive', priority: 6, startDate: '2025-06-01', endDate: '2026-03-31', usageCount: 4567, maxUsage: 8000 },
  { id: 'DR-007', name: '周年庆9折', type: 'percentage', scope: 'all', value: 10, minPurchaseCents: 0, maxDiscountCents: 10000, status: 'scheduled', priority: 7, startDate: '2026-08-01', endDate: '2026-08-15', usageCount: 0, maxUsage: 99999 },
  { id: 'DR-008', name: '满1000减150', type: 'fixed_amount', scope: 'min_purchase', value: 15000, minPurchaseCents: 100000, maxDiscountCents: 15000, status: 'active', priority: 8, startDate: '2026-03-01', endDate: null, usageCount: 1234, maxUsage: 5000 },
  { id: 'DR-009', name: '老客复购5折(已过期)', type: 'percentage', scope: 'customer_tag', value: 50, minPurchaseCents: 0, maxDiscountCents: 30000, status: 'expired', priority: 9, startDate: '2025-01-01', endDate: '2025-12-31', usageCount: 12546, maxUsage: 50000 },
  { id: 'DR-010', name: '电子券满300减50', type: 'fixed_amount', scope: 'min_purchase', value: 5000, minPurchaseCents: 30000, maxDiscountCents: 5000, status: 'active', priority: 10, startDate: '2026-01-15', endDate: null, usageCount: 3210, maxUsage: 10000 },
];

// ============================================================
// CSS 常量
// ============================================================

const CARD_STYLE: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 20,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 16px',
  color: '#f1f5f9',
};

const STATUS_MAP: Record<DiscountStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  active: { label: '生效', variant: 'success' },
  inactive: { label: '停用', variant: 'neutral' },
  scheduled: { label: '定时', variant: 'info' },
  expired: { label: '过期', variant: 'danger' },
};

// ============================================================
// 主页面
// ============================================================

export default function DiscountRulesPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'inactive' | 'all'>('active');

  // 统计
  const stats = useMemo(() => {
    const active = MOCK_DISCOUNT_RULES.filter(r => r.status === 'active').length;
    const scheduled = MOCK_DISCOUNT_RULES.filter(r => r.status === 'scheduled').length;
    const expired = MOCK_DISCOUNT_RULES.filter(r => r.status === 'expired').length;
    const totalUsage = MOCK_DISCOUNT_RULES.reduce((s, r) => s + r.usageCount, 0);
    return { active, scheduled, expired, total: MOCK_DISCOUNT_RULES.length, totalUsage, activeUsage: MOCK_DISCOUNT_RULES.filter(r => r.status === 'active').reduce((s, r) => s + r.usageCount, 0) };
  }, []);

  // 筛选
  const filteredRules = useMemo(() => {
    if (activeTab === 'all') return MOCK_DISCOUNT_RULES;
    return MOCK_DISCOUNT_RULES.filter(r => r.status === activeTab);
  }, [activeTab]);

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(filteredRules, ['name', 'type']);

  // 分页
  const { page, setPage, totalPages, pageItems } = usePagination(filteredItems, 10);

  // 计算折扣说明
  function getDiscountDescription(rule: DiscountRule): string {
    switch (rule.type) {
      case 'percentage':
        return `${rule.value}% 折扣`;
      case 'fixed_amount':
        return `满 ¥${(rule.minPurchaseCents / 100).toFixed(0)} 减 ¥${(rule.value / 100).toFixed(0)}`;
      case 'buy_x_get_y':
        return `买 ${Math.floor(rule.value / 100)} 送 1`;
      case 'free_shipping':
        return '免运费';
      case 'tiered':
        return `阶梯折扣 (8折/8.5折/9折)`;
      default:
        return '';
    }
  }

  const columns: DataTableColumn<DiscountRule>[] = [
    { key: 'name', title: '规则名称', sortable: true, render: r => <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.name}</span> },
    { key: 'type', title: '折扣类型', sortable: true, render: r => DISCOUNT_TYPE_LABELS[r.type] },
    { key: 'scope', title: '适用范围', sortable: true, render: r => DISCOUNT_SCOPE_LABELS[r.scope] },
    { key: 'value', title: '折扣说明', render: r => <span style={{ color: '#22c55e' }}>{getDiscountDescription(r)}</span> },
    { key: 'status', title: '状态', sortable: true, render: r => <StatusBadge {...STATUS_MAP[r.status]} size="sm" dot /> },
    { key: 'priority', title: '优先级', sortable: true },
    { key: 'usageCount', title: '使用次数', sortable: true, render: r => `${r.usageCount}/${r.maxUsage === 99999 ? '∞' : r.maxUsage}` },
    { key: 'startDate', title: '有效期', render: r => `${r.startDate}${r.endDate ? ` ~ ${r.endDate}` : ''}` },
  ];

  return (
    <PageShell title="折扣规则" subtitle="管理商品折扣策略与规则">
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="生效中" value={stats.active.toString()} variant="success" />
        <StatCard label="待生效" value={stats.scheduled.toString()} variant="info" />
        <StatCard label="已过期" value={stats.expired.toString()} variant="danger" />
        <StatCard label="总使用" value={stats.totalUsage.toLocaleString()} helper="累计折扣次数" variant="default" />
      </div>

      {/* 表格区域 */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'active', label: '生效中' },
              { key: 'scheduled', label: '待生效' },
              { key: 'inactive', label: '已停用' },
              { key: 'all', label: '全部' },
            ]}
            activeKey={activeTab}
            onChange={t => { setActiveTab(t as typeof activeTab); setPage(1); }}
            variant="pills"
          />
          <div style={{ width: 250 }}>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索规则名称/类型..." />
          </div>
        </div>

        <DataTable
          data={pageItems}
          columns={columns}
          sortable
          emptyText="暂无可用的折扣规则"
        />

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: page === i + 1 ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: page === i + 1 ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        <strong style={{ color: '#94a3b8' }}>💡 说明</strong><br />
        折扣规则按优先级（数值越低越优先）依次匹配。当多个规则同时适用时，取最优惠的折扣。
        百分比折扣金额 = 商品原价 × 折扣率，固定金额折扣直接减免。
        规则的适用范围决定了哪些商品/客户可以享受此折扣。
      </div>
    </PageShell>
  );
}
