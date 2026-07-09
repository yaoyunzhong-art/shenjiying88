'use client';

import React, { useMemo, useState } from 'react';
import {
  PageShell,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  DataTable,
  Pagination,
  Tabs,
  usePagination,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';
import type { StaffPerformanceRecord } from './page';

// ============================================================
// 绩效等级配置
// ============================================================

const GRADE_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' }> = {
  A: { label: '优秀', variant: 'success' },
  B: { label: '良好', variant: 'info' },
  C: { label: '一般', variant: 'warning' },
  D: { label: '待改进', variant: 'danger' },
};

// ============================================================
// 统计汇总
// ============================================================

interface StaffStats {
  total: number;
  totalSales: number;
  avgServiceScore: number;
  topPerformer: string;
  aGradeCount: number;
  belowTargetCount: number;
}

function computeStats(records: StaffPerformanceRecord[]): StaffStats {
  const total = records.length;
  const totalSales = records.reduce((s, r) => s + r.salesAmount, 0);
  const avgServiceScore = total > 0
    ? Math.round((records.reduce((s, r) => s + r.serviceScore, 0) / total) * 10) / 10
    : 0;
  const top = [...records].sort((a, b) => b.salesAmount - a.salesAmount)[0];
  return {
    total,
    totalSales,
    avgServiceScore,
    topPerformer: top?.name ?? '-',
    aGradeCount: records.filter(r => r.grade === 'A').length,
    belowTargetCount: records.filter(r => r.salesTargetRate < 100).length,
  };
}

// ============================================================
// 表格列定义
// ============================================================

const COLUMNS: DataTableColumn<StaffPerformanceRecord>[] = [
  { key: 'name', header: '姓名', dataKey: 'name', sortable: true },
  { key: 'role', header: '岗位', dataKey: 'role', sortable: true },
  {
    key: 'salesAmount',
    header: '销售额 (元)',
    sortable: true,
    render: (r: StaffPerformanceRecord) => r.salesAmount.toLocaleString(),
  },
  {
    key: 'salesTargetRate',
    header: '完成率',
    sortable: true,
    render: (r: StaffPerformanceRecord) => {
      const color = r.salesTargetRate >= 100 ? '#22c55e' : r.salesTargetRate >= 80 ? '#eab308' : '#ef4444';
      return <span style={{ color, fontWeight: 600 }}>{r.salesTargetRate}%</span>;
    },
  },
  {
    key: 'serviceScore',
    header: '服务评分',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.serviceScore.toFixed(1)} ⭐`,
  },
  {
    key: 'attendanceDays',
    header: '出勤 / 应出勤',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.attendanceDays}/${r.requiredDays}`,
  },
  {
    key: 'conversionRate',
    header: '转化率',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.conversionRate}%`,
  },
  {
    key: 'newMembers',
    header: '新增会员',
    sortable: true,
    dataKey: 'newMembers',
  },
  {
    key: 'grade',
    header: '绩效等级',
    sortable: true,
    render: (r: StaffPerformanceRecord) => {
      const cfg = GRADE_CONFIG[r.grade] ?? { variant: 'neutral' as const, label: r.grade };
      return <StatusBadge variant={cfg.variant} label={cfg.label} />;
    },
  },
];

// ============================================================
// 筛选 Tabs
// ============================================================

type FilterTab = 'all' | 'A' | 'B' | 'C' | 'D' | 'below_target';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'A', label: '优秀' },
  { key: 'B', label: '良好' },
  { key: 'C', label: '一般' },
  { key: 'D', label: '待改进' },
  { key: 'below_target', label: '未达标' },
];

// ============================================================
// 客户端组件
// ============================================================

interface StaffPerformanceClientProps {
  records: StaffPerformanceRecord[];
}

export function StaffPerformanceClient({ records }: StaffPerformanceClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { searchTerm: search, setSearchTerm: setSearch, filteredItems: searchedItems } = useSearchFilter(
    records,
    ['name', 'role', 'remark'],
  );

  const statusFiltered = useMemo(() => {
    if (activeTab === 'all') return searchedItems;
    if (activeTab === 'below_target') return searchedItems.filter(r => r.salesTargetRate < 100);
    return searchedItems.filter(r => r.grade === activeTab);
  }, [searchedItems, activeTab]);

  const pagination = usePagination({ initialPageSize: 6 });
  const { page, pageSize, setPage, setPageSize, totalPages } = pagination;
  const pageItems = pagination.paginate(statusFiltered);

  const stats = useMemo(() => computeStats(records), [records]);

  return (
    <PageShell title="员工绩效看板" subtitle="查看门店员工月度绩效数据，支持搜索、排序与等级筛选">
      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="员工总人数" value={stats.total} />
        <StatCard label="总销售额 (元)" value={stats.totalSales.toLocaleString()} variant="info" />
        <StatCard label="平均服务评分" value={`${stats.avgServiceScore.toFixed(1)} ⭐`} variant="success" />
        <StatCard label="优秀 (A级)" value={stats.aGradeCount} variant="warning" />
        <StatCard label="未达标" value={stats.belowTargetCount} variant="error" />
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder="搜索员工姓名/岗位..."
          width={360}
        />
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          本月最佳员工: <strong style={{ color: '#22c55e' }}>{stats.topPerformer}</strong>
        </div>
      </div>

      {/* 筛选 Tabs */}
      <Tabs
        items={FILTER_TABS.map(t => ({
          key: t.key,
          label: `${t.label} (${
            t.key === 'all' ? records.length
              : t.key === 'below_target' ? records.filter(r => r.salesTargetRate < 100).length
              : records.filter(r => r.grade === t.key).length
          })`,
        }))}
        activeKey={activeTab}
        onChange={k => { setActiveTab(k as FilterTab); setPage(1); }}
      />

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(r: StaffPerformanceRecord) => r.id}
      />

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ color: '#94a3b8', fontSize: 14 }}>
          共 {statusFiltered.length} 条记录，当前第 {page}/{totalPages} 页
        </span>
        <Pagination
          page={page}
          total={statusFiltered.length}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 12, 24]}
        />
      </div>
    </PageShell>
  );
}
