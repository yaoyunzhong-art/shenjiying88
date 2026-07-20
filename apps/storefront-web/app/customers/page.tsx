'use client';

import React, { useMemo, useState, useEffect } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

// ---- 类型 ----

type CustomerStatus = 'active' | 'inactive' | 'churned';
type CustomerSource = 'direct' | 'referral' | 'online' | 'event';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  registeredDate: string;
  status: CustomerStatus;
  source: CustomerSource;
  storeName: string;
}

const STATUS_VARIANTS: Record<CustomerStatus, 'success' | 'warning' | 'neutral' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  churned: 'error',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: '活跃',
  inactive: '静默',
  churned: '流失',
};

const SOURCE_LABELS: Record<CustomerSource, string> = {
  direct: '到店',
  referral: '推荐',
  online: '线上',
  event: '活动',
};

const TAB_KEYS = ['all', 'active', 'inactive', 'churned'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABELS: Record<TabKey, string> = {
  all: '全部客户',
  active: '活跃客户',
  inactive: '静默客户',
  churned: '流失客户',
};

// ---- Mock 数据 ----

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c001', name: '张伟', phone: '138****1234', email: 'zhangwei@example.com', totalOrders: 24, totalSpent: 6800, lastOrderDate: '2026-06-20', registeredDate: '2025-03-10', status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店' },
  { id: 'c002', name: '李娜', phone: '139****5678', email: 'lina@example.com', totalOrders: 42, totalSpent: 15200, lastOrderDate: '2026-06-22', registeredDate: '2024-11-05', status: 'active', source: 'referral', storeName: 'Demo Store 旗舰店' },
  { id: 'c003', name: '王磊', phone: '136****9012', email: 'wanglei@example.com', totalOrders: 8, totalSpent: 2100, lastOrderDate: '2026-05-15', registeredDate: '2025-08-20', status: 'inactive', source: 'online', storeName: 'Demo Store 社区店' },
  { id: 'c004', name: '赵芳', phone: '137****3456', email: 'zhaofang@example.com', totalOrders: 56, totalSpent: 28000, lastOrderDate: '2026-06-21', registeredDate: '2024-06-01', status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店' },
  { id: 'c005', name: '陈强', phone: '150****7890', email: 'chenqiang@example.com', totalOrders: 3, totalSpent: 450, lastOrderDate: '2026-03-28', registeredDate: '2025-12-15', status: 'churned', source: 'event', storeName: 'Demo Store 社区店' },
  { id: 'c006', name: '刘洋', phone: '151****2345', email: 'liuyang@example.com', totalOrders: 18, totalSpent: 5400, lastOrderDate: '2026-06-18', registeredDate: '2025-05-22', status: 'active', source: 'online', storeName: 'Demo Store 旗舰店' },
  { id: 'c007', name: '黄丽', phone: '152****6789', email: 'huangli@example.com', totalOrders: 12, totalSpent: 3200, lastOrderDate: '2026-06-10', registeredDate: '2025-09-08', status: 'active', source: 'referral', storeName: 'Demo Store 社区店' },
  { id: 'c008', name: '周明', phone: '153****0123', email: 'zhouming@example.com', totalOrders: 6, totalSpent: 1800, lastOrderDate: '2026-04-02', registeredDate: '2025-07-30', status: 'inactive', source: 'direct', storeName: 'Demo Store 旗舰店' },
  { id: 'c009', name: '吴霞', phone: '155****4567', email: 'wuxia@example.com', totalOrders: 31, totalSpent: 9800, lastOrderDate: '2026-06-19', registeredDate: '2024-12-12', status: 'active', source: 'event', storeName: 'Demo Store 社区店' },
  { id: 'c010', name: '孙浩', phone: '156****8901', email: 'sunhao@example.com', totalOrders: 1, totalSpent: 120, lastOrderDate: '2026-01-05', registeredDate: '2026-01-05', status: 'churned', source: 'online', storeName: 'Demo Store 旗舰店' },
  { id: 'c011', name: '马婷', phone: '157****2345', email: 'mating@example.com', totalOrders: 15, totalSpent: 4600, lastOrderDate: '2026-06-15', registeredDate: '2025-04-18', status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店' },
  { id: 'c012', name: '胡军', phone: '158****6789', email: 'hujun@example.com', totalOrders: 9, totalSpent: 2700, lastOrderDate: '2026-05-30', registeredDate: '2025-10-25', status: 'inactive', source: 'referral', storeName: 'Demo Store 社区店' },
  { id: 'c013', name: '林静', phone: '159****0123', email: 'linjing@example.com', totalOrders: 22, totalSpent: 7700, lastOrderDate: '2026-06-23', registeredDate: '2025-02-14', status: 'active', source: 'online', storeName: 'Demo Store 旗舰店' },
  { id: 'c014', name: '何涛', phone: '176****4567', email: 'hetao@example.com', totalOrders: 4, totalSpent: 980, lastOrderDate: '2026-04-20', registeredDate: '2025-11-10', status: 'churned', source: 'event', storeName: 'Demo Store 社区店' },
  { id: 'c015', name: '高雪', phone: '177****8901', email: 'gaoxue@example.com', totalOrders: 37, totalSpent: 11300, lastOrderDate: '2026-06-22', registeredDate: '2024-08-05', status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店' },
];

// ---- 列定义 ----

const COLUMNS: Array<DataTableColumn<Customer>> = [
  { key: 'name', header: '姓名', sortable: true, render: (c) => (
    <div>
      <div style={{ fontWeight: 600 }}>{c.name}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.phone}</div>
    </div>
  )},
  { key: 'totalOrders', header: '订单数', sortable: true, align: 'right', render: (c) => c.totalOrders.toString() },
  { key: 'totalSpent', header: '消费总额', sortable: true, align: 'right', render: (c) => `¥${c.totalSpent.toLocaleString()}` },
  { key: 'lastOrderDate', header: '最近订单', sortable: true },
  { key: 'source', header: '来源', render: (c) => SOURCE_LABELS[c.source] },
  {
    key: 'status',
    header: '状态',
    render: (c) => <StatusBadge label={STATUS_LABELS[c.status]} variant={STATUS_VARIANTS[c.status]} />,
  },
];

// ---- 页面组件 ----

export default function CustomersPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<Customer[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<Customer[]>((resolve) => {
        setTimeout(() => resolve(MOCK_CUSTOMERS), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'totalSpent', direction: 'desc' });

  // --- 数据 ---
  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return pageData;
    return pageData.filter((c) => c.status === activeTab);
  }, [activeTab, pageData]);

  const searched = useMemo(() => {
    if (!searchTerm.trim()) return tabFiltered;
    const term = searchTerm.toLowerCase();
    return tabFiltered.filter((c) =>
      [c.name, c.phone, c.email, c.storeName].some((v) => v.toLowerCase().includes(term))
    );
  }, [tabFiltered, searchTerm]);

  const sorted = useSortedItems(searched, COLUMNS, sortConfig);

  const { page, pageSize, totalPages, setPage, setPageSize, paginate } = usePagination(sorted.length, 10);
  const pagedItems = paginate(sorted);

  // --- 统计 ---
  const stats = useMemo(() => {
    const total = pageData.length;
    const active = pageData.filter((c) => c.status === 'active').length;
    const totalSpent = pageData.reduce((s, c) => s + c.totalSpent, 0);
    return { total, active, totalSpent };
  }, [pageData]);

  return (
    <PageShell title="客户管理">
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<Customer[]>((resolve) => {
              setTimeout(() => resolve(MOCK_CUSTOMERS), 300);
            }),
          ).then((data) => {
            if (data) setPageData(data);
            setPageReady(true);
          })
        }
      >
      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            padding: '18px 20px',
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 13, color: '#94a3b8' }}>总客户数</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.total}</div>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            padding: '18px 20px',
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 13, color: '#94a3b8' }}>活跃客户</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.active}</div>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            padding: '18px 20px',
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 13, color: '#94a3b8' }}>总消费金额</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>¥{stats.totalSpent.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={TAB_KEYS.map((k) => ({ key: k, label: TAB_LABELS[k] }))}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* 搜索栏 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
        <div style={{ width: 320 }}>
          <SearchFilterInput
            placeholder="搜索客户姓名 / 手机号 / 邮箱…"
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>

      {/* 表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pagedItems}
        rowKey={(c) => c.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
        emptyText="暂无客户数据"
      />

      {/* 分页 */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      </TriStateRenderer>
    </PageShell>
  );
}
