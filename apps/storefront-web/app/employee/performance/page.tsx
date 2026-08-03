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
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';

// ---- 类型 ----

type PerformanceStatus = 'excellent' | 'good' | 'average' | 'below';

interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  department: string;
  salesAmount: number;
  salesTarget: number;
  completionRate: number;
  serviceScore: number;
  attendanceDays: number;
  requiredDays: number;
  status: PerformanceStatus;
}

const STATUS_LABELS: Record<PerformanceStatus, string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  below: '待提升',
};

const STATUS_VARIANTS: Record<PerformanceStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'info',
  average: 'warning',
  below: 'danger',
};

// ---- Mock 数据 ----

const MOCK_PERFORMANCE: EmployeePerformance[] = [
  { id: 'e1', name: '张三', role: '高级销售', department: '旗舰店', salesAmount: 185000, salesTarget: 150000, completionRate: 123.3, serviceScore: 4.9, attendanceDays: 26, requiredDays: 26, status: 'excellent' },
  { id: 'e2', name: '李四', role: '销售顾问', department: '旗舰店', salesAmount: 142000, salesTarget: 120000, completionRate: 118.3, serviceScore: 4.7, attendanceDays: 25, requiredDays: 26, status: 'good' },
  { id: 'e3', name: '王五', role: '销售顾问', department: '社区店', salesAmount: 98000, salesTarget: 100000, completionRate: 98.0, serviceScore: 4.5, attendanceDays: 24, requiredDays: 26, status: 'average' },
  { id: 'e4', name: '赵六', role: '初级销售', department: '社区店', salesAmount: 65000, salesTarget: 80000, completionRate: 81.3, serviceScore: 4.2, attendanceDays: 22, requiredDays: 26, status: 'below' },
  { id: 'e5', name: '陈七', role: '高级销售', department: '旗舰店', salesAmount: 210000, salesTarget: 150000, completionRate: 140.0, serviceScore: 5.0, attendanceDays: 26, requiredDays: 26, status: 'excellent' },
  { id: 'e6', name: '刘八', role: '销售顾问', department: '社区店', salesAmount: 115000, salesTarget: 100000, completionRate: 115.0, serviceScore: 4.6, attendanceDays: 25, requiredDays: 26, status: 'good' },
  { id: 'e7', name: '孙九', role: '初级销售', department: '旗舰店', salesAmount: 72000, salesTarget: 80000, completionRate: 90.0, serviceScore: 4.3, attendanceDays: 23, requiredDays: 26, status: 'average' },
  { id: 'e8', name: '周十', role: '高级销售', department: '社区店', salesAmount: 168000, salesTarget: 130000, completionRate: 129.2, serviceScore: 4.8, attendanceDays: 26, requiredDays: 26, status: 'excellent' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<EmployeePerformance>[] = [
  {
    key: 'name',
    header: '员工',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.role}
        </span>
      </div>
    ),
  },
  {
    key: 'department',
    header: '所属部门',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.department}</span>
    ),
  },
  {
    key: 'salesAmount',
    header: '销售额',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        ¥{item.salesAmount.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'completionRate',
    header: '完成率',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', color: item.completionRate >= 100 ? '#4ade80' : '#facc15' }}>
        {item.completionRate.toFixed(1)}%
      </span>
    ),
  },
  {
    key: 'serviceScore',
    header: '服务评分',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {item.serviceScore.toFixed(1)}
      </span>
    ),
  },
  {
    key: 'attendanceDays',
    header: '出勤',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {item.attendanceDays}/{item.requiredDays}天
      </span>
    ),
  },
  {
    key: 'status',
    header: '评级',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
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

export default function EmployeePerformancePage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<EmployeePerformance[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<EmployeePerformance[]>((resolve) => {
        setTimeout(() => resolve(MOCK_PERFORMANCE), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  // 搜索
  const searchFields = useMemo<(keyof EmployeePerformance)[]>(
    () => ['name', 'role', 'department'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    pageData.length > 0 ? pageData : MOCK_PERFORMANCE,
    searchFields,
  );

  // 部门过滤
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const deptFiltered = useMemo(
    () =>
      deptFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.department === deptFilter),
    [filteredItems, deptFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(deptFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  // 统计
  const stats = useMemo(() => {
    const totalSales = pageData.reduce((sum, m) => sum + m.salesAmount, 0);
    const excellent = pageData.filter((m) => m.status === 'excellent').length;
    const avgScore = pageData.length > 0
      ? (pageData.reduce((sum, m) => sum + m.serviceScore, 0) / pageData.length).toFixed(1)
      : '0.0';
    const avgCompletion = pageData.length > 0
      ? (pageData.reduce((sum, m) => sum + m.completionRate, 0) / pageData.length).toFixed(1)
      : '0.0';
    return {
      total: pageData.length,
      totalSales,
      excellent,
      avgScore,
      avgCompletion,
    };
  }, [pageData]);

  return (
    <PageShell
      title="员工绩效"
      description="查看员工销售业绩、服务评分与出勤数据。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<EmployeePerformance[]>((resolve) => {
              setTimeout(() => resolve(MOCK_PERFORMANCE), 300);
            }),
          ).then((data) => {
            if (data) setPageData(data);
            setPageReady(true);
          })
        }
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
          <StatBadge label="总员工" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="总销售额" value={`¥${stats.totalSales.toLocaleString()}`} accent="#4ade80" />
          <StatBadge label="优秀人数" value={String(stats.excellent)} accent="#a78bfa" />
          <StatBadge label="平均完成率" value={`${stats.avgCompletion}%`} accent="#facc15" />
        </div>

        {/* 搜索与过滤 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索员工姓名、角色或部门..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
              { key: '旗舰店', label: '旗舰店', count: (filteredItems ?? []).filter((i) => i.department === '旗舰店').length },
              { key: '社区店', label: '社区店', count: (filteredItems ?? []).filter((i) => i.department === '社区店').length },
            ]}
            activeKey={deptFilter}
            onChange={(key) => setDeptFilter(key)}
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
        {deptFiltered.length === 0 && (
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
            未找到匹配的员工绩效记录
          </div>
        )}

        {/* 分页 */}
        {deptFiltered.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
            />
          </div>
        )}
      </TriStateRenderer>
    </PageShell>
  );
}
