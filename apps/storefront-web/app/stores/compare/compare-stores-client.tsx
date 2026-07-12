'use client';

import React, { useMemo, useState, useEffect } from 'react';

import {
  StoreComparisonPanel,
  type StoreComparisonItem,
  type StoreComparisonMetric,
} from '@m5/ui';

// ============================================================
// Mock 门店对比数据
// ============================================================

const MOCK_ALL_STORES: StoreComparisonItem[] = [
  {
    id: 'store-bj-1',
    name: '朝阳旗舰店',
    region: '北京',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 520000,
      orderCount: 1860,
      avgOrderValue: 279.57,
      activeMembers: 3420,
      deviceUtilization: 87,
      customerSatisfaction: 92,
    },
  },
  {
    id: 'store-bj-2',
    name: '海淀中关村店',
    region: '北京',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 380000,
      orderCount: 1420,
      avgOrderValue: 267.61,
      activeMembers: 2150,
      deviceUtilization: 79,
      customerSatisfaction: 85,
    },
  },
  {
    id: 'store-sh-1',
    name: '浦东新区店',
    region: '上海',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 485000,
      orderCount: 1720,
      avgOrderValue: 281.98,
      activeMembers: 3100,
      deviceUtilization: 82,
      customerSatisfaction: 88,
    },
  },
  {
    id: 'store-sh-2',
    name: '静安寺店',
    region: '上海',
    status: 'online',
    trend: 'stable',
    metrics: {
      revenue: 335000,
      orderCount: 1240,
      avgOrderValue: 270.16,
      activeMembers: 1800,
      deviceUtilization: 76,
      customerSatisfaction: 84,
    },
  },
  {
    id: 'store-gz-1',
    name: '天河区店',
    region: '广州',
    status: 'maintenance',
    trend: 'down',
    metrics: {
      revenue: 210000,
      orderCount: 890,
      avgOrderValue: 235.96,
      activeMembers: 1500,
      deviceUtilization: 45,
      customerSatisfaction: 72,
    },
  },
  {
    id: 'store-gz-2',
    name: '番禺区店',
    region: '广州',
    status: 'online',
    trend: 'stable',
    metrics: {
      revenue: 268000,
      orderCount: 1050,
      avgOrderValue: 255.24,
      activeMembers: 1680,
      deviceUtilization: 68,
      customerSatisfaction: 79,
    },
  },
  {
    id: 'store-sz-1',
    name: '南山区店',
    region: '深圳',
    status: 'online',
    trend: 'up',
    metrics: {
      revenue: 410000,
      orderCount: 1580,
      avgOrderValue: 259.49,
      activeMembers: 2480,
      deviceUtilization: 84,
      customerSatisfaction: 90,
    },
  },
  {
    id: 'store-sz-2',
    name: '福田区店',
    region: '深圳',
    status: 'offline',
    trend: 'down',
    metrics: {
      revenue: 185000,
      orderCount: 720,
      avgOrderValue: 256.94,
      activeMembers: 1100,
      deviceUtilization: 32,
      customerSatisfaction: 65,
    },
  },
];

// ============================================================
// 类型辅助
// ============================================================

type RegionFilter = 'all' | '北京' | '上海' | '广州' | '深圳';
type StatusFilter = 'all' | 'online' | 'offline' | 'maintenance';
type SortKey = 'revenue' | 'orderCount' | 'customerSatisfaction' | 'deviceUtilization';

const REGIONS: RegionFilter[] = ['all', '北京', '上海', '广州', '深圳'];
const STATUSES: StatusFilter[] = ['all', 'online', 'offline', 'maintenance'];

function regionLabel(r: RegionFilter): string {
  return r === 'all' ? '全部区域' : r;
}
function statusLabel(s: StatusFilter): string {
  const map: Record<string, string> = { all: '全部状态', online: '营业中', offline: '已关闭', maintenance: '维护中' };
  return map[s] ?? s;
}

// ============================================================
// 比较门店客户组件
// ============================================================

export function CompareStoresClient({
  preselectedIds = [],
  baselineId: defaultBaselineId,
}: {
  preselectedIds?: string[];
  baselineId?: string;
} = {}) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [baselineStoreId, setBaselineStoreId] = useState<string | undefined>(
    defaultBaselineId ?? 'store-bj-1',
  );

  // 如果通过 searchParams 传入了预选门店，默认选中这些门店的区域
  useEffect(() => {
    if (preselectedIds.length > 0) {
      const preSelected = MOCK_ALL_STORES.filter((s) => preselectedIds.includes(s.id));
      if (preSelected.length > 0) {
        // 如果所有预选门店在同一区域，自动筛选到该区域
        const regions = [...new Set(preSelected.map((s) => s.region))];
        if (regions.length === 1) {
          setRegionFilter(regions[0] as RegionFilter);
        }
      }
    }
  }, [preselectedIds]);

  const stores = useMemo(() => {
    let filtered = [...MOCK_ALL_STORES];

    // 区域筛选
    if (regionFilter !== 'all') {
      filtered = filtered.filter((s) => s.region === regionFilter);
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // 排序
    filtered.sort((a, b) => b.metrics[sortKey] - a.metrics[sortKey]);

    return filtered;
  }, [regionFilter, statusFilter, sortKey]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of MOCK_ALL_STORES) {
      counts[s.region] = (counts[s.region] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div style={pageStyles.container}>
      {/* 页面标题 */}
      <div style={pageStyles.header}>
        <div>
          <h1 style={pageStyles.title}>📊 门店对比</h1>
          <p style={pageStyles.subtitle}>
            多维度门店KPI横向对比 · 选定标杆门店查看差异
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={pageStyles.filterBar}>
        {/* 区域筛选 */}
        <div style={pageStyles.filterGroup}>
          <span style={pageStyles.filterLabel}>区域</span>
          <div style={pageStyles.filterChips}>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                style={{
                  ...pageStyles.chip,
                  ...(regionFilter === r ? pageStyles.chipActive : {}),
                }}
              >
                {regionLabel(r)}
                {r !== 'all' && (
                  <span style={pageStyles.chipCount}>({regionCounts[r] ?? 0})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 状态筛选 */}
        <div style={pageStyles.filterGroup}>
          <span style={pageStyles.filterLabel}>状态</span>
          <div style={pageStyles.filterChips}>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  ...pageStyles.chip,
                  ...(statusFilter === s ? pageStyles.chipActive : {}),
                }}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div style={pageStyles.filterGroup}>
          <span style={pageStyles.filterLabel}>排序</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={pageStyles.select}
          >
            <option value="revenue">营收</option>
            <option value="orderCount">订单数</option>
            <option value="customerSatisfaction">满意度</option>
            <option value="deviceUtilization">设备利用率</option>
          </select>
        </div>

        {/* 标杆门店选择 */}
        <div style={pageStyles.filterGroup}>
          <span style={pageStyles.filterLabel}>标杆</span>
          <select
            value={baselineStoreId ?? ''}
            onChange={(e) => setBaselineStoreId(e.target.value || undefined)}
            style={pageStyles.select}
          >
            <option value="">无标杆</option>
            {MOCK_ALL_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 对比面板 */}
      <StoreComparisonPanel
        stores={stores}
        loading={false}
        baselineStoreId={baselineStoreId}
        data-testid="store-comparison-panel"
      />

      {/* 底部说明 */}
      <div style={pageStyles.footer}>
        <p>💡 数据为模拟展示 · 标杆门店在表格中以黄色背景高亮</p>
      </div>
    </div>
  );
}

// ============================================================
// 样式
// ============================================================

const pageStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 10,
    background: 'rgba(15, 23, 42, 0.28)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  filterChips: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(15, 23, 42, 0.2)',
    color: '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
    color: '#60a5fa',
  },
  chipCount: {
    fontSize: 11,
    color: '#475569',
  },
  select: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(15, 23, 42, 0.2)',
    color: '#cbd5e1',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#475569',
    padding: '32px 0 16px',
  },
};
