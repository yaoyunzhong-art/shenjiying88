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

interface InspectionItem {
  id: string;
  area: string;
  inspector: string;
  scheduledDate: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

type FireStatusVariant = 'neutral' | 'warning' | 'success' | 'danger';

export const FIRE_STATUS_MAP: Record<InspectionItem['status'], { label: string; variant: FireStatusVariant }> = {
  pending: { label: '待检查', variant: 'neutral' },
  in_progress: { label: '检查中', variant: 'warning' },
  passed: { label: '通过', variant: 'success' },
  failed: { label: '未通过', variant: 'danger' },
};

const RISK_VARIANT: Record<InspectionItem['riskLevel'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

// ---- 模拟数据 ----

const MOCK_DATA: InspectionItem[] = [
  { id: 'FP-001', area: '厨房A区', inspector: '张三', scheduledDate: '2026-07-10', status: 'passed', riskLevel: 'low', notes: '灭火器正常' },
  { id: 'FP-002', area: '仓库B区', inspector: '李四', scheduledDate: '2026-07-11', status: 'in_progress', riskLevel: 'medium', notes: '疏散通道检查中' },
  { id: 'FP-003', area: '大厅C区', inspector: '王五', scheduledDate: '2026-07-12', status: 'failed', riskLevel: 'high', notes: '报警器故障需维修' },
  { id: 'FP-004', area: '办公室D区', inspector: '赵六', scheduledDate: '2026-07-13', status: 'pending', riskLevel: 'medium', notes: '待安排' },
  { id: 'FP-005', area: '停车场', inspector: '张三', scheduledDate: '2026-07-09', status: 'passed', riskLevel: 'low', notes: '灭火器压力正常' },
];

const PAGE_SIZE = 10;

// ---- 列定义 ----

const COLUMNS: DataTableColumn<InspectionItem>[] = [
  { header: '编号', accessorKey: 'id' },
  { header: '检查区域', accessorKey: 'area' },
  { header: '检查人', accessorKey: 'inspector' },
  { header: '计划日期', accessorKey: 'scheduledDate' },
  {
    header: '状态',
    accessorKey: 'status',
    cell: ({ row }) => {
      const { label, variant } = FIRE_STATUS_MAP[row.original.status] ?? { label: row.original.status, variant: 'neutral' as const };
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
  {
    header: '风险等级',
    accessorKey: 'riskLevel',
    cell: ({ row }) => (
      <StatusBadge variant={RISK_VARIANT[row.original.riskLevel]}>
        {row.original.riskLevel === 'high' ? '高风险' : row.original.riskLevel === 'medium' ? '中风险' : '低风险'}
      </StatusBadge>
    ),
  },
  { header: '备注', accessorKey: 'notes', enableSorting: false },
];

// ---- 组件 ----

/**
 * 消防管理 — Fire Prevention Page
 *
 * 功能:
 * - 展示消防检查列表
 * - 按区域/状态搜索
 * - 支持分页
 * - 操作按钮: 新建检查、导出报告
 */
export default function FirePreventionPage() {
  const [items] = useState<InspectionItem[]>(MOCK_DATA);

  const { searchQuery, setSearchQuery, filteredItems } = useSearchFilter(items, {
    fields: ['area', 'inspector', 'notes'],
  });

  const sorted = useMemo(() => filteredItems, [filteredItems]);

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage } = usePagination(sorted, PAGE_SIZE);

  const handleNewInspection = useCallback(() => {
    // TODO: navigate to new inspection form
  }, []);

  const handleExportReport = useCallback(() => {
    // TODO: export inspection report
  }, []);

  return (
    <PageShell
      title="消防管理"
      subtitle="消防安全检查记录与风险管理"
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput
          placeholder="搜索区域、检查人..."
          value={searchQuery}
          onChange={setSearchQuery}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button variant="primary" onClick={handleNewInspection}>新建检查</Button>
        <Button variant="outline" onClick={handleExportReport}>导出报告</Button>
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
