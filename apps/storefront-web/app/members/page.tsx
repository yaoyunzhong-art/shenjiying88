'use client';

import React, { useMemo, useState } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';

interface Member {
  id: string;
  name: string;
  phone: string;
  tier: MembershipTier;
  points: number;
  storeName: string;
  totalVisits: number;
  lastVisit: string;
  status: 'active' | 'inactive' | 'frozen';
  joinedAt: string;
}

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

const TIER_VARIANTS: Record<MembershipTier, 'danger' | 'warning' | 'default' | 'pending' | 'neutral'> = {
  diamond: 'danger',
  gold: 'warning',
  silver: 'default',
  bronze: 'pending',
  basic: 'neutral',
};

const STATUS_VARIANTS: Record<Member['status'], 'success' | 'danger' | 'warning'> = {
  active: 'success',
  inactive: 'danger',
  frozen: 'warning',
};

const STATUS_LABELS: Record<Member['status'], string> = {
  active: '活跃',
  inactive: '非活跃',
  frozen: '冻结',
};

// ---- Mock 数据 ----

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '张伟', phone: '138****1234', tier: 'diamond', points: 28500, storeName: 'Demo Store 旗舰店', totalVisits: 156, lastVisit: '2026-06-22', status: 'active', joinedAt: '2025-01-15' },
  { id: 'm2', name: '李娜', phone: '139****5678', tier: 'gold', points: 12400, storeName: 'Demo Store 旗舰店', totalVisits: 89, lastVisit: '2026-06-20', status: 'active', joinedAt: '2025-03-22' },
  { id: 'm3', name: '王芳', phone: '137****9012', tier: 'silver', points: 5600, storeName: 'Demo Store 社区店', totalVisits: 42, lastVisit: '2026-06-18', status: 'active', joinedAt: '2025-06-10' },
  { id: 'm4', name: '赵强', phone: '136****3456', tier: 'gold', points: 9800, storeName: 'Demo Store 旗舰店', totalVisits: 67, lastVisit: '2026-06-15', status: 'active', joinedAt: '2025-02-14' },
  { id: 'm5', name: '孙丽', phone: '135****7890', tier: 'bronze', points: 2100, storeName: 'Demo Store 社区店', totalVisits: 18, lastVisit: '2026-05-30', status: 'inactive', joinedAt: '2025-09-01' },
  { id: 'm6', name: '周杰', phone: '138****2345', tier: 'diamond', points: 32000, storeName: 'Demo Store 旗舰店', totalVisits: 201, lastVisit: '2026-06-23', status: 'active', joinedAt: '2024-11-20' },
  { id: 'm7', name: '吴敏', phone: '186****6789', tier: 'silver', points: 4300, storeName: 'Demo Store 社区店', totalVisits: 35, lastVisit: '2026-06-10', status: 'active', joinedAt: '2025-07-08' },
  { id: 'm8', name: '郑浩', phone: '189****0123', tier: 'basic', points: 800, storeName: 'Demo Store 旗舰店', totalVisits: 5, lastVisit: '2026-04-01', status: 'frozen', joinedAt: '2026-01-10' },
  { id: 'm9', name: '陈婷', phone: '177****4567', tier: 'gold', points: 11000, storeName: 'Demo Store 社区店', totalVisits: 73, lastVisit: '2026-06-21', status: 'active', joinedAt: '2025-04-18' },
  { id: 'm10', name: '刘洋', phone: '188****8901', tier: 'silver', points: 5100, storeName: 'Demo Store 旗舰店', totalVisits: 38, lastVisit: '2026-06-19', status: 'active', joinedAt: '2025-05-25' },
  { id: 'm11', name: '黄磊', phone: '150****2345', tier: 'bronze', points: 1500, storeName: 'Demo Store 社区店', totalVisits: 12, lastVisit: '2026-05-20', status: 'inactive', joinedAt: '2025-10-12' },
  { id: 'm12', name: '林小红', phone: '133****6789', tier: 'diamond', points: 46500, storeName: 'Demo Store 旗舰店', totalVisits: 312, lastVisit: '2026-06-22', status: 'active', joinedAt: '2024-06-01' },
  { id: 'm13', name: '何军', phone: '185****0123', tier: 'basic', points: 1200, storeName: 'Demo Store 社区店', totalVisits: 8, lastVisit: '2026-06-15', status: 'active', joinedAt: '2026-03-01' },
  { id: 'm14', name: '罗琳', phone: '152****4567', tier: 'gold', points: 13500, storeName: 'Demo Store 旗舰店', totalVisits: 94, lastVisit: '2026-06-22', status: 'active', joinedAt: '2025-02-28' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Member>[] = [
  {
    key: 'name',
    header: '会员',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.phone}
        </span>
      </div>
    ),
  },
  {
    key: 'tier',
    header: '等级',
    render: (item) => (
      <StatusBadge
        label={TIER_LABELS[item.tier]}
        variant={TIER_VARIANTS[item.tier]}
        size="sm"
      />
    ),
  },
  {
    key: 'points',
    header: '积分',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {item.points.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'totalVisits',
    header: '到店次数',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {item.totalVisits}
      </span>
    ),
  },
  {
    key: 'storeName',
    header: '所属门店',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.storeName}</span>
    ),
  },
  {
    key: 'lastVisit',
    header: '最近到店',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.lastVisit}</span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
  {
    key: 'joinedAt',
    header: '加入日期',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.joinedAt}</span>
    ),
  },
];

// ---- 统计子组件 ----

function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
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

// ---- 页面 ----

export default function MembersListPage() {
  // 搜索
  const searchFields = useMemo<(keyof Member)[]>(
    () => ['name', 'phone', 'tier', 'storeName'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_MEMBERS,
    searchFields,
  );

  // 等级过滤
  const [tierFilter, setTierFilter] = useState<MembershipTier | 'ALL'>('ALL');
  const tierFiltered = useMemo(
    () =>
      tierFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.tier === tierFilter),
    [filteredItems, tierFilter],
  );

  // 状态过滤（叠加）
  const [statusFilter, setStatusFilter] = useState<Member['status'] | 'ALL'>('ALL');
  const finalFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? tierFiltered
        : tierFiltered.filter((item) => item.status === statusFilter),
    [tierFiltered, statusFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  // 统计
  const stats = useMemo(() => {
    const active = MOCK_MEMBERS.filter((m) => m.status === 'active').length;
    const diamond = MOCK_MEMBERS.filter((m) => m.tier === 'diamond').length;
    const totalPoints = MOCK_MEMBERS.reduce((sum, m) => sum + m.points, 0);
    return {
      total: MOCK_MEMBERS.length,
      active,
      diamond,
      avgPoints: Math.round(totalPoints / MOCK_MEMBERS.length),
    };
  }, []);

  return (
    <PageShell
      title="会员管理"
      description="管理门店会员信息，查看等级分布、积分情况及活跃度。"
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
        <StatBadge label="总会员" value={String(stats.total)} accent="#60a5fa" />
        <StatBadge label="活跃会员" value={String(stats.active)} accent="#4ade80" />
        <StatBadge label="钻石会员" value={String(stats.diamond)} accent="#a78bfa" />
        <StatBadge label="平均积分" value={stats.avgPoints.toLocaleString()} accent="#facc15" />
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索姓名、手机号、等级或门店..."
        />
      </div>

      {/* 等级过滤 */}
      <div style={{ marginBottom: 8 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
            ...(['diamond', 'gold', 'silver', 'bronze', 'basic'] as const).map(
              (tier) => ({
                key: tier,
                label: TIER_LABELS[tier],
                count: (filteredItems ?? []).filter(
                  (item) => item.tier === tier,
                ).length,
              }),
            ),
          ]}
          activeKey={tierFilter}
          onChange={(key) =>
            setTierFilter(key as MembershipTier | 'ALL')
          }
          variant="pills"
          size="sm"
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部状态', count: tierFiltered.length },
            { key: 'active', label: '活跃', count: tierFiltered.filter((m) => m.status === 'active').length },
            { key: 'inactive', label: '非活跃', count: tierFiltered.filter((m) => m.status === 'inactive').length },
            { key: 'frozen', label: '冻结', count: tierFiltered.filter((m) => m.status === 'frozen').length },
          ]}
          activeKey={statusFilter}
          onChange={(key) =>
            setStatusFilter(key as Member['status'] | 'ALL')
          }
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
      />

      {/* 空状态 */}
      {finalFiltered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: '#64748b',
            fontSize: 14,
            borderRadius: 12,
            border: '1px dashed rgba(148,163,184,0.18)',
            marginTop: 16,
          }}
        >
          未找到匹配的会员记录
        </div>
      )}

      {/* 分页 */}
      {finalFiltered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </PageShell>
  );
}
