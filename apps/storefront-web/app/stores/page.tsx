/**
 * 门店列表页 — Stores List Page (Next.js App Router Page)
 * 功能: 搜索、状态筛选、分页浏览门店列表
 * 类型: B-列表页 (含搜索/过滤/分页)
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type StoreStatus = 'active' | 'inactive' | 'maintenance';
type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  city: string;
  district: string;
  phone: string;
  managerName: string;
  status: StoreStatus;
  staffCount: number;
  areaSqm: number;
  monthlyRevenue: number;
  createdAt: string;
}

const TYPE_LABELS: Record<StoreType, string> = {
  flagship: '旗舰店',
  standard: '标准店',
  community: '社区店',
  popup: '快闪店',
};

const TYPE_VARIANTS: Record<StoreType, 'success' | 'default' | 'warning' | 'info'> = {
  flagship: 'success',
  standard: 'default',
  community: 'warning',
  popup: 'info',
};

const STATUS_LABELS: Record<StoreStatus, string> = {
  active: '营业中',
  inactive: '已关闭',
  maintenance: '维护中',
};

const STATUS_VARIANTS: Record<StoreStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
};

// ---- Mock 数据 ----

const MOCK_STORES: Store[] = [
  { id: 's01', name: 'Demo Store 旗舰店', code: 'DS-FLAG-001', type: 'flagship', address: '上海市浦东新区陆家嘴金融中心1层', city: '上海', district: '浦东新区', phone: '021-68888888', managerName: '张明', status: 'active', staffCount: 28, areaSqm: 580, monthlyRevenue: 358000, createdAt: '2024-01-15' },
  { id: 's02', name: 'Demo Store 社区店', code: 'DS-COMM-002', type: 'community', address: '上海市静安区南京西路1688号', city: '上海', district: '静安区', phone: '021-62880001', managerName: '李芳', status: 'active', staffCount: 12, areaSqm: 220, monthlyRevenue: 128000, createdAt: '2024-03-01' },
  { id: 's03', name: 'Demo Store 标准店', code: 'DS-STD-003', type: 'standard', address: '北京市朝阳区建国路88号', city: '北京', district: '朝阳区', phone: '010-85881234', managerName: '王强', status: 'active', staffCount: 18, areaSqm: 350, monthlyRevenue: 215000, createdAt: '2024-02-20' },
  { id: 's04', name: 'Demo Store 快闪店', code: 'DS-POP-004', type: 'popup', address: '广州市天河区天河路230号', city: '广州', district: '天河区', phone: '020-38889999', managerName: '刘洋', status: 'maintenance', staffCount: 6, areaSqm: 120, monthlyRevenue: 45000, createdAt: '2025-06-01' },
  { id: 's05', name: 'Demo Store 标准店', code: 'DS-STD-005', type: 'standard', address: '深圳市南山区科技南路18号', city: '深圳', district: '南山区', phone: '0755-86660001', managerName: '陈静', status: 'active', staffCount: 15, areaSqm: 300, monthlyRevenue: 189000, createdAt: '2024-04-10' },
  { id: 's06', name: 'Demo Store 社区店', code: 'DS-COMM-006', type: 'community', address: '成都市锦江区红星路三段1号', city: '成都', district: '锦江区', phone: '028-86780001', managerName: '赵磊', status: 'inactive', staffCount: 8, areaSqm: 180, monthlyRevenue: 0, createdAt: '2024-05-01' },
  { id: 's07', name: 'Demo Store 旗舰店', code: 'DS-FLAG-007', type: 'flagship', address: '杭州市上城区延安路98号', city: '杭州', district: '上城区', phone: '0571-87070001', managerName: '孙婷', status: 'active', staffCount: 32, areaSqm: 620, monthlyRevenue: 412000, createdAt: '2024-01-20' },
  { id: 's08', name: 'Demo Store 标准店', code: 'DS-STD-008', type: 'standard', address: '武汉市江汉区解放大道686号', city: '武汉', district: '江汉区', phone: '027-85480001', managerName: '周伟', status: 'active', staffCount: 14, areaSqm: 280, monthlyRevenue: 156000, createdAt: '2024-06-15' },
  { id: 's09', name: 'Demo Store 社区店', code: 'DS-COMM-009', type: 'community', address: '重庆市渝中区解放碑八一路177号', city: '重庆', district: '渝中区', phone: '023-63830001', managerName: '吴霞', status: 'active', staffCount: 10, areaSqm: 200, monthlyRevenue: 98000, createdAt: '2024-07-01' },
  { id: 's10', name: 'Demo Store 快闪店', code: 'DS-POP-010', type: 'popup', address: '南京市秦淮区夫子庙美食街', city: '南京', district: '秦淮区', phone: '025-52250001', managerName: '郑杰', status: 'active', staffCount: 5, areaSqm: 80, monthlyRevenue: 32000, createdAt: '2025-05-15' },
  { id: 's11', name: 'Demo Store 标准店', code: 'DS-STD-011', type: 'standard', address: '苏州市姑苏区观前街100号', city: '苏州', district: '姑苏区', phone: '0512-67280001', managerName: '黄丽', status: 'active', staffCount: 16, areaSqm: 310, monthlyRevenue: 178000, createdAt: '2024-08-10' },
  { id: 's12', name: 'Demo Store 社区店', code: 'DS-COMM-012', type: 'community', address: '西安市雁塔区小寨东路88号', city: '西安', district: '雁塔区', phone: '029-85250001', managerName: '马超', status: 'maintenance', staffCount: 7, areaSqm: 160, monthlyRevenue: 55000, createdAt: '2024-09-01' },
];

// ---- 统计卡片 ---

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
    </article>
  );
}

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Store>[] = [
  {
    key: 'name',
    header: '门店',
    render: (item) => (
      <div>
        <Link
          href={`/stores/${item.id}`}
          style={{ fontWeight: 600, fontSize: 14, color: '#60a5fa', textDecoration: 'none' }}
        >
          {item.name}
        </Link>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.code}
        </span>
      </div>
    ),
  },
  {
    key: 'type',
    header: '类型',
    render: (item) => (
      <StatusBadge label={TYPE_LABELS[item.type]} variant={TYPE_VARIANTS[item.type]} size="sm" />
    ),
  },
  {
    key: 'city',
    header: '城市',
    render: (item) => (
      <span style={{ color: '#cbd5e1', fontSize: 13 }}>
        {item.city} · {item.district}
      </span>
    ),
  },
  {
    key: 'managerName',
    header: '店长',
    render: (item) => <span style={{ fontSize: 13 }}>{item.managerName}</span>,
  },
  {
    key: 'staffCount',
    header: '员工',
    align: 'right',
    render: (item) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.staffCount}人</span>,
  },
  {
    key: 'areaSqm',
    header: '面积',
    align: 'right',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.areaSqm}m²</span>,
  },
  {
    key: 'monthlyRevenue',
    header: '月营收',
    align: 'right',
    render: (item) => (
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          color: item.monthlyRevenue > 0 ? '#4ade80' : '#64748b',
        }}
      >
        ¥{item.monthlyRevenue.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" />
    ),
  },
];

// ---- 筛选状态 tabs ----

const STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'active' as const, label: '营业中' },
  { key: 'maintenance' as const, label: '维护中' },
  { key: 'inactive' as const, label: '已关闭' },
];

// ---- 页面 ----

export default function StoresListPage() {
  // 搜索
  const searchFields = useMemo<(keyof Store)[]>(
    () => ['name', 'code', 'city', 'district', 'address', 'managerName', 'phone'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_STORES, searchFields);

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  // 分页
  const pagination = usePagination(statusFiltered.length, 10);
  const pageItems = useMemo(
    () => statusFiltered.slice((pagination.page - 1) * 10, pagination.page * 10),
    [statusFiltered, pagination.page],
  );

  // 统计
  const stats = useMemo(() => {
    const active = MOCK_STORES.filter((s) => s.status === 'active').length;
    const totalRevenue = MOCK_STORES.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const totalStaff = MOCK_STORES.reduce((sum, s) => sum + s.staffCount, 0);
    return { total: MOCK_STORES.length, active, totalRevenue, totalStaff };
  }, []);

  return (
    <PageShell
      title="门店列表"
      description="浏览所有门店信息，包括基础信息、运营状态和业绩概览。"
    >
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="总门店" value={String(stats.total)} accent="#60a5fa" />
        <StatCard label="营业中" value={String(stats.active)} accent="#4ade80" />
        <StatCard label="员工总数" value={String(stats.totalStaff)} accent="#facc15" />
        <StatCard label="月总营收" value={`¥${(stats.totalRevenue / 10000).toFixed(1)}万`} accent="#c084fc" />
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索门店名称、编号、城市、店长..."
        />
      </div>

      {/* 状态过滤栏 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={STATUS_TABS.map((tab) => ({
            key: tab.key,
            label: tab.label,
            count:
              tab.key === 'ALL'
                ? (filteredItems ?? []).length
                : (filteredItems ?? []).filter((i) => i.status === tab.key).length,
          }))}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as StoreStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable columns={COLUMNS} rows={pageItems} rowKey={(item) => item.id} />

      {/* 分页 */}
      <div style={{ marginTop: 12 }}>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={statusFiltered.length}
          onPageChange={pagination.setPage}
        />
      </div>
    </PageShell>
  );
}
