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

// ---- 列定义 ----

function buildColumns(): DataTableColumn<InspectionItem>[] {
  return [
    { key: 'id', title: '编号', dataKey: 'id' },
    { key: 'area', title: '检查区域', dataKey: 'area' },
    { key: 'inspector', title: '检查人', dataKey: 'inspector' },
    { key: 'scheduledDate', title: '计划日期', dataKey: 'scheduledDate' },
    {
      key: 'status',
      title: '状态',
      sortValue: (item: InspectionItem) => item.status,
      render: (item: InspectionItem) => {
        const s = FIRE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      sortValue: (item: InspectionItem) => item.riskLevel,
      render: (item: InspectionItem) => {
        const label = item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险';
        return <StatusBadge label={label} variant={RISK_VARIANT[item.riskLevel]} size="sm" />;
      },
    },
    { key: 'notes', title: '备注', dataKey: 'notes' },
  ];
}

// ---- 组件 ----

/**
 * 消防管理 — Fire Prevention Page
 *
 * 功能:
 * - 展示消防检查列表
 * - 按区域/检查人搜索
 * - 支持分页
 * - 操作按钮: 新建检查、导出报告
 */
export default function FirePreventionPage() {
  const [items] = useState<InspectionItem[]>(MOCK_DATA);

  const { searchTerm: searchQuery, setSearchTerm: setSearchQuery, filteredItems } = useSearchFilter(items, ['area', 'inspector', 'notes']);

  const columns = useMemo(() => buildColumns(), []);

  const pagination = usePagination(filteredItems.length, 10);
  const pageItems = pagination.paginate(filteredItems);

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
          width="100%"
        />
        <Button variant="primary" onClick={handleNewInspection}>新建检查</Button>
        <Button variant="outline" onClick={handleExportReport}>导出报告</Button>
      </div>

      <DataTable
        columns={columns}
        items={pageItems}
        rowKey={(item) => item.id}
        striped
        compact
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={filteredItems.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </PageShell>
  );
}
