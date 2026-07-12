'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  DataTable,
  Button,
  PageShell,
  StatusBadge,
  Pagination,
  SearchFilterInput,
  usePagination,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型定义 ----

interface SafetyRecord {
  id: string;
  category: string;
  reporter: string;
  reportedDate: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

type SafetyStatusVariant = 'neutral' | 'warning' | 'success' | 'danger';

export const SAFETY_STATUS_MAP: Record<SafetyRecord['status'], { label: string; variant: SafetyStatusVariant }> = {
  open: { label: '待处理', variant: 'neutral' },
  investigating: { label: '调查中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
  closed: { label: '已关闭', variant: 'danger' },
};

const SEVERITY_VARIANT: Record<SafetyRecord['severity'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

// ---- 模拟数据 ----

const MOCK_RECORDS: SafetyRecord[] = [
  { id: 'SAF-001', category: '电气安全', reporter: '电工组', reportedDate: '2026-07-08', status: 'resolved', severity: 'high', description: '配电箱线路老化' },
  { id: 'SAF-002', category: '消防安全', reporter: '安保部', reportedDate: '2026-07-09', status: 'investigating', severity: 'medium', description: '疏散指示灯不亮' },
  { id: 'SAF-003', category: '食品安全', reporter: '厨房组', reportedDate: '2026-07-10', status: 'open', severity: 'low', description: '冰箱温度异常' },
  { id: 'SAF-004', category: '设备安全', reporter: '设备组', reportedDate: '2026-07-11', status: 'closed', severity: 'high', description: '电梯异响已检修' },
  { id: 'SAF-005', category: '环境安全', reporter: '行政部门', reportedDate: '2026-07-12', status: 'open', severity: 'critical', description: '天花板漏水有触电风险' },
];

const PAGE_SIZE = 10;

// ---- 列定义 ----

const COLUMNS: DataTableColumn<SafetyRecord>[] = [
  { header: '编号', accessorKey: 'id' },
  { header: '类别', accessorKey: 'category' },
  { header: '上报人', accessorKey: 'reporter' },
  { header: '上报日期', accessorKey: 'reportedDate' },
  {
    header: '状态',
    accessorKey: 'status',
    cell: ({ row }) => {
      const { label, variant } = SAFETY_STATUS_MAP[row.original.status] ?? { label: row.original.status, variant: 'neutral' as const };
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
  {
    header: '严重程度',
    accessorKey: 'severity',
    cell: ({ row }) => (
      <StatusBadge variant={SEVERITY_VARIANT[row.original.severity]}>
        {row.original.severity === 'critical' ? '严重' : row.original.severity === 'high' ? '高' : row.original.severity === 'medium' ? '中' : '低'}
      </StatusBadge>
    ),
  },
  { header: '描述', accessorKey: 'description', enableSorting: false },
];

// ---- 组件 ----

/**
 * 安全记录 — Safety Page
 *
 * 功能:
 * - 展示安全事件/隐患记录列表
 * - 按类别/描述搜索
 * - 支持分页
 * - 操作按钮: 新建记录、导出日志
 */
export default function SafetyPage() {
  const [records] = useState<SafetyRecord[]>(MOCK_RECORDS);

  const { searchQuery, setSearchQuery, filteredItems } = useSearchFilter(records, {
    fields: ['category', 'reporter', 'description'],
  });

  const sorted = useMemo(() => filteredItems, [filteredItems]);

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage } = usePagination(sorted, PAGE_SIZE);

  const handleNewRecord = useCallback(() => {
    // TODO: navigate to new safety record form
  }, []);

  const handleExportLog = useCallback(() => {
    // TODO: export safety log
  }, []);

  return (
    <PageShell
      title="安全记录"
      subtitle="安全事件、隐患与整改跟踪"
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput
          placeholder="搜索类别、上报人..."
          value={searchQuery}
          onChange={setSearchQuery}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button variant="primary" onClick={handleNewRecord}>新建记录</Button>
        <Button variant="outline" onClick={handleExportLog}>导出日志</Button>
      </div>

      <DataTable
        columns={COLUMNS}
        data={paginatedItems}
        getRowId={(row) => row.id}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
        onPrev={prevPage}
        onNext={nextPage}
      />
    </PageShell>
  );
}
