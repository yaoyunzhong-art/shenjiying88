'use client';
import React, { useMemo, useState } from 'react';
import { type DataTableColumn } from './DataTable';
import { DetailShell } from './DetailShell';
import { EmptyState } from './EmptyState';
import { InfoRow } from './InfoRow';
import { listPageStatCardStyle, useListPageSectionState } from './ListPageScaffold';
import { SearchFilterInput, type DataTableSortConfig } from './LinkedOverviewStubs';
import { PaginatedDataTableCard } from './PaginatedDataTableCard';
import { PageShell } from './PageShell';
import { StatusBadge } from './StatusBadge';
import { Tabs } from './Tabs';

export interface RuntimeOperationRecord {
  id: string;
  type: string;
  targetId: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
}

export interface RuntimeOperationReceiptRecord {
  code: string;
  message: string;
  status: string;
  timestamp: string;
}

export const runtimeOperationStatusVariants: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'default',
  running: 'warning',
  completed: 'success',
  failed: 'error',
};

export const runtimeOperationStatusLabels: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export interface CreateRuntimeOperationMockRecordsOptions {
  count?: number;
  idPrefix?: string;
  typeOrder: readonly string[];
  statusOrder: readonly string[];
  targetPrefix?: string;
  targetModulo?: number;
  createdAtStepMs?: number;
  finishedAtStepMs?: number;
}

export function createRuntimeOperationMockRecords({
  count = 50,
  idPrefix = 'op',
  typeOrder,
  statusOrder,
  targetPrefix = 'service',
  targetModulo = 5,
  createdAtStepMs = 1800000,
  finishedAtStepMs = 900000,
}: CreateRuntimeOperationMockRecordsOptions): RuntimeOperationRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const type = typeOrder[index % typeOrder.length]!;
    const status = statusOrder[index % statusOrder.length]!;

    return {
      id: `${idPrefix}-${String(index + 1).padStart(4, '0')}`,
      type,
      targetId: `${targetPrefix}-${(index % targetModulo) + 1}`,
      status,
      createdAt: new Date(Date.now() - index * createdAtStepMs).toISOString(),
      finishedAt:
        status === 'pending' || status === 'running'
          ? undefined
          : new Date(Date.now() - index * finishedAtStepMs).toISOString(),
    };
  });
}

export interface RuntimeOperationDetailMockEntry {
  operation: RuntimeOperationRecord;
  receipts?: RuntimeOperationReceiptRecord[];
}

export function createRuntimeOperationDetailMockMap(
  entries: RuntimeOperationDetailMockEntry[]
): Record<string, { op: RuntimeOperationRecord; receipts: RuntimeOperationReceiptRecord[] }> {
  return Object.fromEntries(
    entries.map((entry) => [
      entry.operation.id,
      {
        op: entry.operation,
        receipts: entry.receipts ?? [],
      },
    ])
  );
}

export const runtimeOperationDetailDemoPresets = {
  storefront: createRuntimeOperationDetailMockMap(
    ['op-1', 'op-2', 'op-3'].map((id, index) => ({
      operation: {
        id,
        type: (['deploy', 'rollback', 'scale'] as const)[index]!,
        targetId: `service-${index + 1}`,
        status: (['completed', 'running', 'failed'] as const)[index]!,
        createdAt: new Date(Date.now() - (index + 1) * 1800000).toISOString(),
        finishedAt: index === 1 ? undefined : new Date(Date.now() - index * 900000).toISOString(),
      },
      receipts: [
        {
          code: 'STARTED',
          message: 'Operation started',
          status: 'ok',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          code: index === 2 ? 'ERROR' : 'COMPLETED',
          message: index === 2 ? 'Connection timeout' : 'Completed successfully',
          status: index === 2 ? 'error' : 'ok',
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  ),
  tob: createRuntimeOperationDetailMockMap(
    ['op-1', 'op-2', 'op-3'].map((id, index) => ({
      operation: {
        id,
        type: (['deploy', 'rollback', 'scale'] as const)[index]!,
        targetId: `service-${index + 1}`,
        status: (['completed', 'running', 'failed'] as const)[index]!,
        createdAt: new Date(Date.now() - (index + 1) * 1800000).toISOString(),
        finishedAt: index === 1 ? undefined : new Date(Date.now() - index * 900000).toISOString(),
      },
      receipts: [
        {
          code: 'STARTED',
          message: 'Operation started',
          status: 'ok',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          code: index === 2 ? 'ERROR' : 'COMPLETED',
          message: index === 2 ? 'Connection timeout' : 'Completed',
          status: index === 2 ? 'error' : 'ok',
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  ),
  admin: createRuntimeOperationDetailMockMap(
    ['op-1', 'op-2', 'op-3'].map((id, index) => ({
      operation: {
        id,
        type: (['runtime-replay', 'secret-rotation', 'approval-execution'] as const)[index]!,
        targetId: (['runtime-governance', 'vault-tenant-demo', 'approval-pipeline'] as const)[index]!,
        status: (['running', 'completed', 'failed'] as const)[index]!,
        createdAt: new Date(Date.now() - (index + 1) * 1200000).toISOString(),
        finishedAt: index === 0 ? undefined : new Date(Date.now() - index * 600000).toISOString(),
      },
      receipts: [
        {
          code: 'SUBMITTED',
          message: 'High-risk action submitted to governance runtime',
          status: 'ok',
          timestamp: new Date(Date.now() - 1500000).toISOString(),
        },
        {
          code: index === 2 ? 'BLOCKED' : 'SYNCED',
          message: index === 2 ? 'Callback blocked pending manual escalation' : 'Handler sync acknowledged',
          status: index === 2 ? 'error' : 'ok',
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  ),
} satisfies Record<string, Record<string, { op: RuntimeOperationRecord; receipts: RuntimeOperationReceiptRecord[] }>>;

export interface RuntimeOperationListPreset {
  typeOrder: readonly string[];
  statusOrder: readonly string[];
  searchFields?: Array<keyof RuntimeOperationRecord | string>;
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  labels?: RuntimeOperationListLabels;
  statsCopy?: RuntimeOperationListStatsCopy;
  emptyTitle?: string;
  emptyDescription?: string;
  columnLabels?: RuntimeOperationTableColumnLabels;
  includeColumns?: RuntimeOperationTableColumnKey[];
  omitColumns?: RuntimeOperationTableColumnKey[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  detailLabels?: RuntimeOperationDetailLabels;
}

interface RuntimeOperationDemoListPageProps {
  title: string;
  description?: string;
  preset: RuntimeOperationListPreset;
  count?: number;
  detailHrefBase?: string;
  recordOptions?: Omit<CreateRuntimeOperationMockRecordsOptions, 'typeOrder' | 'statusOrder' | 'count'>;
  mapRecords?: (records: RuntimeOperationRecord[]) => RuntimeOperationRecord[];
}

export const runtimeOperationListDemoPresets = {
  storefront: {
    typeOrder: ['deploy', 'rollback', 'scale', 'restart', 'config-update'],
    statusOrder: ['pending', 'running', 'completed', 'failed'],
    searchFields: ['id', 'type', 'targetId'],
    typeLabels: {
      deploy: 'Deploy',
      rollback: 'Rollback',
      scale: 'Scale',
      restart: 'Restart',
      'config-update': 'Config',
    },
    statusLabels: {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
    },
    labels: {
      all: 'All',
      searchPlaceholder: 'Search by ID / type / target...',
      statusSectionTitle: 'Status',
      typeSectionTitle: 'Type',
      tableTitle: (matched: number) => `Operations (${matched} matched)`,
    },
    statsCopy: {
      totalLabel: 'Total Ops',
      totalHint: (matched: number) => `${matched} matched`,
      runningLabel: 'Running',
      runningHint: 'In progress',
      failedLabel: 'Failed',
      failedHint: 'Needs attention',
      typeLabel: 'Op Types',
      typeHint: 'Deploy / Rollback / Scale / etc.',
    },
    emptyTitle: 'No operations found',
    emptyDescription: 'No runtime operations match your current filters.',
    columnLabels: {
      id: 'ID',
      type: 'Type',
      targetId: 'Target',
      status: 'Status',
      createdAt: 'Created',
      finishedAt: 'Finished',
    },
    includeColumns: ['id', 'type', 'status', 'createdAt'],
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    detailLabels: {
      titlePrefix: 'Operation',
      overviewTitle: 'Overview',
      timelineTitle: 'Timeline',
      receiptsTitle: 'Receipts',
      id: 'ID',
      type: 'Type',
      status: 'Status',
      target: 'Target',
      createdAt: 'Created',
      finishedAt: 'Finished',
      inProgress: 'In progress...',
      noReceipts: 'No receipts',
      receiptOk: 'OK',
      receiptError: 'ERROR',
    },
  },
  tob: {
    typeOrder: ['deploy', 'rollback', 'scale', 'restart', 'config-update'],
    statusOrder: ['pending', 'running', 'completed', 'failed'],
    searchFields: ['id', 'type', 'targetId'],
    typeLabels: {
      deploy: '部署',
      rollback: '回滚',
      scale: '扩缩容',
      restart: '重启',
      'config-update': '配置更新',
    },
    statusLabels: {
      pending: '等待中',
      running: '执行中',
      completed: '已完成',
      failed: '已失败',
    },
    labels: {
      all: '全部',
      searchPlaceholder: '搜索操作 ID / 类型 / 目标...',
      statusSectionTitle: '执行状态',
      typeSectionTitle: '操作类型',
      tableTitle: (matched: number) => `操作列表（匹配 ${matched} 条）`,
    },
    statsCopy: {
      totalLabel: '操作总数',
      totalHint: (matched: number) => `匹配 ${matched} 条`,
      runningLabel: '执行中',
      runningHint: '正在运行',
      failedLabel: '失败',
      failedHint: '需关注',
      typeLabel: '操作类型',
      typeHint: '部署 / 回滚 / 扩缩容 等',
    },
    emptyTitle: '暂无操作记录',
    emptyDescription: '当前筛选条件下没有匹配的运维操作。',
    columnLabels: {
      id: 'ID',
      type: '类型',
      targetId: '目标',
      status: '状态',
      createdAt: '创建时间',
      finishedAt: '完成时间',
    },
    detailLabels: {
      titlePrefix: '操作',
      overviewTitle: '概览',
      timelineTitle: '时间线',
      receiptsTitle: '回执',
      id: 'ID',
      type: '类型',
      status: '状态',
      target: '目标',
      createdAt: '创建时间',
      finishedAt: '完成时间',
      inProgress: '执行中...',
      noReceipts: '暂无回执',
      receiptOk: '成功',
      receiptError: '失败',
    },
  },
  admin: {
    typeOrder: ['runtime-replay', 'secret-rotation', 'approval-execution', 'deploy', 'rollback'],
    statusOrder: ['running', 'pending', 'failed', 'completed'],
    searchFields: ['id', 'type', 'targetId', 'status'],
    typeLabels: {
      'runtime-replay': '运行时重放',
      'secret-rotation': '密钥轮换',
      'approval-execution': '审批执行',
      deploy: '部署',
      rollback: '回滚',
    },
    statusLabels: {
      pending: '等待中',
      running: '执行中',
      completed: '已完成',
      failed: '已失败',
    },
    labels: {
      all: '全部',
      searchPlaceholder: '搜索操作 ID / 类型 / 目标 / 状态...',
      statusSectionTitle: '治理状态',
      typeSectionTitle: '高风险动作',
      tableTitle: (matched: number) => `治理操作（匹配 ${matched} 条）`,
    },
    statsCopy: {
      totalLabel: '治理操作总数',
      totalHint: (matched: number) => `匹配 ${matched} 条`,
      runningLabel: '处理中',
      runningHint: '等待 callback / replay',
      failedLabel: '阻塞',
      failedHint: '需人工介入',
      typeLabel: '动作类型',
      typeHint: '审批 / 密钥 / 运行时',
    },
    emptyTitle: '暂无治理操作',
    emptyDescription: '当前筛选条件下没有匹配的高风险治理动作。',
    columnLabels: {
      id: '回执编号',
      type: '动作类型',
      targetId: '治理目标',
      status: '治理状态',
      createdAt: '提交时间',
      finishedAt: '完成时间',
    },
    includeColumns: ['id', 'type', 'targetId', 'status', 'createdAt'],
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    detailLabels: {
      titlePrefix: '治理操作',
      overviewTitle: '操作概览',
      timelineTitle: '治理时间线',
      receiptsTitle: '治理回执',
      id: '回执编号',
      type: '动作类型',
      status: '治理状态',
      target: '治理目标',
      createdAt: '提交时间',
      finishedAt: '完成时间',
      inProgress: '等待完成...',
      noReceipts: '暂无治理回执',
      receiptOk: '成功',
      receiptError: '阻塞',
    },
  },
} satisfies Record<string, RuntimeOperationListPreset>;

export function RuntimeOperationDemoListPage({
  title,
  description,
  preset,
  count = 50,
  detailHrefBase = '/operations',
  recordOptions,
  mapRecords,
}: RuntimeOperationDemoListPageProps) {
  const [operations] = useState<RuntimeOperationRecord[]>(() => {
    const records = createRuntimeOperationMockRecords({
      count,
      typeOrder: preset.typeOrder,
      statusOrder: preset.statusOrder,
      ...recordOptions,
    });

    return mapRecords ? mapRecords(records) : records;
  });

  return (
    <RuntimeOperationsListPageSection
      title={title}
      description={description}
      operations={operations}
      preset={preset}
      detailHrefBase={detailHrefBase}
    />
  );
}

interface RuntimeOperationTableColumnLabels {
  id?: string;
  type?: string;
  targetId?: string;
  status?: string;
  createdAt?: string;
  finishedAt?: string;
}

type RuntimeOperationTableColumnKey = 'id' | 'type' | 'targetId' | 'status' | 'createdAt' | 'finishedAt';

interface CreateRuntimeOperationTableColumnsOptions {
  detailHrefBase?: string;
  detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
  columnLabels?: RuntimeOperationTableColumnLabels;
  includeColumns?: RuntimeOperationTableColumnKey[];
  omitColumns?: RuntimeOperationTableColumnKey[];
}

interface RuntimeOperationsTableCardProps {
  operations: RuntimeOperationRecord[];
  detailHrefBase?: string;
  detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
  title?: React.ReactNode;
  sort?: DataTableSortConfig | null;
  onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
  striped?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
  columnLabels?: RuntimeOperationTableColumnLabels;
  includeColumns?: RuntimeOperationTableColumnKey[];
  omitColumns?: RuntimeOperationTableColumnKey[];
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function RuntimeOperationsTableCard({
  operations,
  detailHrefBase = '/operations',
  detailHrefBuilder,
  title,
  sort,
  onSortChange,
  striped = false,
  compact = false,
  emptyTitle = 'No operations',
  emptyDescription = 'No runtime operations recorded yet.',
  typeLabels,
  statusLabels = runtimeOperationStatusLabels,
  statusVariants = runtimeOperationStatusVariants,
  columnLabels,
  includeColumns,
  omitColumns,
  pagination,
}: RuntimeOperationsTableCardProps) {
  const columns = useMemo<DataTableColumn<RuntimeOperationRecord>[]>(
    () =>
      createRuntimeOperationTableColumns({
        detailHrefBase,
        detailHrefBuilder,
        typeLabels,
        statusLabels,
        statusVariants,
        columnLabels,
        includeColumns,
        omitColumns,
      }),
    [columnLabels, detailHrefBase, detailHrefBuilder, includeColumns, omitColumns, statusLabels, statusVariants, typeLabels]
  );

  return (
    <PaginatedDataTableCard
      title={title}
      columns={columns}
      rows={operations}
      rowKey={(row) => row.id}
      sort={sort}
      onSortChange={onSortChange}
      striped={striped}
      compact={compact}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      pagination={pagination}
    />
  );
}

interface RuntimeOperationDetailViewProps {
  operation?: RuntimeOperationRecord | null;
  receipts?: RuntimeOperationReceiptRecord[];
  preset?: RuntimeOperationListPreset;
  backHref?: string;
  backLabel?: string;
  notFoundTitle?: string;
  notFoundMessage?: string;
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  formatDateTime?: (value: string) => string;
}

interface RuntimeOperationPresetDetailRouteProps {
  operationId: string;
  operations: Record<string, { op: RuntimeOperationRecord; receipts: RuntimeOperationReceiptRecord[] }>;
  preset?: RuntimeOperationListPreset;
  backHref?: string;
  backLabel?: string;
  notFoundTitle?: string;
  notFoundMessage?: string | ((operationId: string) => string);
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  formatDateTime?: (value: string) => string;
}

export interface RuntimeOperationDetailLabels {
  titlePrefix?: string;
  overviewTitle?: string;
  timelineTitle?: string;
  receiptsTitle?: string;
  id?: string;
  type?: string;
  status?: string;
  target?: string;
  createdAt?: string;
  finishedAt?: string;
  inProgress?: string;
  noReceipts?: string;
  receiptOk?: string;
  receiptError?: string;
}

interface RuntimeOperationReceiptListReadoutProps {
  receipts?: RuntimeOperationReceiptRecord[];
  detailLabels?: RuntimeOperationDetailLabels;
  formatDateTime?: (value: string) => string;
}

interface RuntimeOperationOverviewReadoutProps {
  operation: RuntimeOperationRecord;
  detailLabels?: RuntimeOperationDetailLabels;
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
}

interface RuntimeOperationTimelineReadoutProps {
  operation: RuntimeOperationRecord;
  detailLabels?: RuntimeOperationDetailLabels;
  formatDateTime?: (value: string) => string;
}

interface RuntimeOperationTypeReadoutProps {
  type: string;
  typeLabels?: Record<string, string>;
}

interface RuntimeOperationIdReadoutProps {
  id: string;
  href?: string;
}

interface RuntimeOperationTargetReadoutProps {
  targetId: string;
}

interface RuntimeOperationStatusReadoutProps {
  status: string;
  statusLabels?: Record<string, string>;
  statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
  size?: 'sm' | 'md';
}

interface RuntimeOperationDateTimeReadoutProps {
  value?: string;
  fallback?: React.ReactNode;
  color?: string;
  fontSize?: number;
  formatDateTime?: (value: string) => string;
}

const defaultRuntimeOperationDetailLabels: RuntimeOperationDetailLabels = {
  titlePrefix: 'Operation',
  overviewTitle: 'Overview',
  timelineTitle: 'Timeline',
  receiptsTitle: 'Receipts',
  id: 'ID',
  type: 'Type',
  status: 'Status',
  target: 'Target',
  createdAt: 'Created',
  finishedAt: 'Finished',
  inProgress: 'In progress...',
  noReceipts: 'No receipts',
  receiptOk: 'OK',
  receiptError: 'ERROR',
};

const defaultRuntimeOperationFormatDateTime = (value: string) => new Date(value).toLocaleString();

export function RuntimeOperationTypeReadout({ type, typeLabels }: RuntimeOperationTypeReadoutProps) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        background: 'rgba(59,130,246,0.12)',
        color: '#93c5fd',
        textTransform: 'capitalize',
      }}
    >
      {typeLabels?.[type] ?? type}
    </span>
  );
}

export function RuntimeOperationIdReadout({ id, href }: RuntimeOperationIdReadoutProps) {
  if (!href) {
    return <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>{id}</span>;
  }

  return (
    <a href={href} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 13, fontFamily: 'monospace' }}>
      {id}
    </a>
  );
}

export function RuntimeOperationTargetReadout({ targetId }: RuntimeOperationTargetReadoutProps) {
  return <span style={{ color: '#94a3b8', fontSize: 13 }}>{targetId}</span>;
}

export function RuntimeOperationStatusReadout({
  status,
  statusLabels,
  statusVariants,
  size = 'sm',
}: RuntimeOperationStatusReadoutProps) {
  const resolvedStatusLabels = statusLabels ?? runtimeOperationStatusLabels;
  const resolvedStatusVariants = statusVariants ?? runtimeOperationStatusVariants;

  return (
    <StatusBadge
      label={resolvedStatusLabels[status] ?? status}
      variant={resolvedStatusVariants[status] ?? 'default'}
      size={size}
    />
  );
}

export function RuntimeOperationDateTimeReadout({
  value,
  fallback = '—',
  color = '#94a3b8',
  fontSize = 13,
  formatDateTime,
}: RuntimeOperationDateTimeReadoutProps) {
  const resolvedFormatDateTime = formatDateTime ?? defaultRuntimeOperationFormatDateTime;

  return <span style={{ color, fontSize }}>{value ? resolvedFormatDateTime(value) : fallback}</span>;
}

export function createRuntimeOperationTableColumns({
  detailHrefBase = '/operations',
  detailHrefBuilder,
  typeLabels,
  statusLabels = runtimeOperationStatusLabels,
  statusVariants = runtimeOperationStatusVariants,
  columnLabels,
  includeColumns,
  omitColumns = [],
}: CreateRuntimeOperationTableColumnsOptions = {}): DataTableColumn<RuntimeOperationRecord>[] {
  const columns: Array<DataTableColumn<RuntimeOperationRecord> & { key: RuntimeOperationTableColumnKey }> = [
    {
      key: 'id',
      header: columnLabels?.id ?? 'ID',
      width: '120px',
      sortable: true,
      render: (row) => (
        <RuntimeOperationIdReadout
          id={row.id}
          href={detailHrefBuilder ? detailHrefBuilder(row) : `${detailHrefBase}/${row.id}`}
        />
      ),
    },
    {
      key: 'type',
      header: columnLabels?.type ?? 'Type',
      width: '140px',
      sortable: true,
      render: (row) => <RuntimeOperationTypeReadout type={row.type} typeLabels={typeLabels} />,
    },
    {
      key: 'targetId',
      header: columnLabels?.targetId ?? 'Target',
      width: '140px',
      sortable: true,
      render: (row) => <RuntimeOperationTargetReadout targetId={row.targetId} />,
    },
    {
      key: 'status',
      header: columnLabels?.status ?? 'Status',
      width: '140px',
      sortable: true,
      render: (row) => (
        <RuntimeOperationStatusReadout
          status={row.status}
          statusLabels={statusLabels}
          statusVariants={statusVariants}
        />
      ),
    },
    {
      key: 'createdAt',
      header: columnLabels?.createdAt ?? 'Created',
      width: '160px',
      sortable: true,
      render: (row) => <RuntimeOperationDateTimeReadout value={row.createdAt} />,
    },
    {
      key: 'finishedAt',
      header: columnLabels?.finishedAt ?? 'Finished',
      width: '160px',
      sortable: true,
      render: (row) => <RuntimeOperationDateTimeReadout value={row.finishedAt} color="#64748b" />,
    },
  ];

  const allowedKeys = includeColumns ?? columns.map((column) => column.key);

  return columns.filter((column) => allowedKeys.includes(column.key) && !omitColumns.includes(column.key));
}

export function RuntimeOperationReceiptListReadout({
  receipts = [],
  detailLabels,
  formatDateTime,
}: RuntimeOperationReceiptListReadoutProps) {
  const resolvedDetailLabels = detailLabels ?? defaultRuntimeOperationDetailLabels;
  const resolvedFormatDateTime = formatDateTime ?? defaultRuntimeOperationFormatDateTime;

  if (receipts.length === 0) {
    return <EmptyState title={resolvedDetailLabels.noReceipts ?? defaultRuntimeOperationDetailLabels.noReceipts!} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {receipts.map((receipt, index) => (
        <div
          key={`${receipt.code}-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: receipt.status === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(15,23,42,0.3)',
            border:
              receipt.status === 'error'
                ? '1px solid rgba(239,68,68,0.15)'
                : '1px solid rgba(148,163,184,0.06)',
          }}
        >
          <StatusBadge
            label={
              receipt.status === 'ok'
                ? resolvedDetailLabels.receiptOk ?? defaultRuntimeOperationDetailLabels.receiptOk!
                : resolvedDetailLabels.receiptError ?? defaultRuntimeOperationDetailLabels.receiptError!
            }
            variant={receipt.status === 'ok' ? 'success' : 'error'}
            size="sm"
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', fontFamily: 'monospace' }}>{receipt.code}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{receipt.message}</div>
          </div>
          <RuntimeOperationDateTimeReadout
            value={receipt.timestamp}
            color="#64748b"
            fontSize={11}
            formatDateTime={resolvedFormatDateTime}
          />
        </div>
      ))}
    </div>
  );
}

export function RuntimeOperationOverviewReadout({
  operation,
  detailLabels,
  typeLabels,
  statusLabels,
}: RuntimeOperationOverviewReadoutProps) {
  const resolvedDetailLabels = detailLabels ?? defaultRuntimeOperationDetailLabels;
  const resolvedTypeLabels = typeLabels;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      <InfoRow
        label={resolvedDetailLabels.id ?? defaultRuntimeOperationDetailLabels.id!}
        value={<RuntimeOperationIdReadout id={`#${operation.id}`} />}
      />
      <InfoRow
        label={resolvedDetailLabels.type ?? defaultRuntimeOperationDetailLabels.type!}
        value={<RuntimeOperationTypeReadout type={operation.type} typeLabels={resolvedTypeLabels} />}
      />
      <InfoRow
        label={resolvedDetailLabels.status ?? defaultRuntimeOperationDetailLabels.status!}
        value={
          <RuntimeOperationStatusReadout
            status={operation.status}
            statusLabels={statusLabels}
            statusVariants={runtimeOperationStatusVariants}
          />
        }
      />
      <InfoRow
        label={resolvedDetailLabels.target ?? defaultRuntimeOperationDetailLabels.target!}
        value={<RuntimeOperationTargetReadout targetId={operation.targetId} />}
      />
    </div>
  );
}

export function RuntimeOperationTimelineReadout({
  operation,
  detailLabels,
  formatDateTime,
}: RuntimeOperationTimelineReadoutProps) {
  const resolvedDetailLabels = detailLabels ?? defaultRuntimeOperationDetailLabels;
  const resolvedFormatDateTime = formatDateTime ?? defaultRuntimeOperationFormatDateTime;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InfoRow
        label={resolvedDetailLabels.createdAt ?? defaultRuntimeOperationDetailLabels.createdAt!}
        value={<RuntimeOperationDateTimeReadout value={operation.createdAt} formatDateTime={resolvedFormatDateTime} />}
      />
      <InfoRow
        label={resolvedDetailLabels.finishedAt ?? defaultRuntimeOperationDetailLabels.finishedAt!}
        value={
          <RuntimeOperationDateTimeReadout
            value={operation.finishedAt}
            fallback={resolvedDetailLabels.inProgress ?? defaultRuntimeOperationDetailLabels.inProgress!}
            color={operation.finishedAt ? '#94a3b8' : '#fcd34d'}
            formatDateTime={resolvedFormatDateTime}
          />
        }
      />
    </div>
  );
}

export function RuntimeOperationDetailView({
  operation,
  receipts = [],
  preset,
  backHref = '/operations',
  backLabel,
  notFoundTitle = 'Not Found',
  notFoundMessage,
  typeLabels,
  statusLabels,
  formatDateTime,
}: RuntimeOperationDetailViewProps) {
  const resolvedTypeLabels = typeLabels ?? preset?.typeLabels;
  const resolvedStatusLabels = statusLabels ?? preset?.statusLabels ?? runtimeOperationStatusLabels;
  const resolvedDetailLabels = preset?.detailLabels ?? defaultRuntimeOperationDetailLabels;
  const resolvedFormatDateTime = formatDateTime ?? defaultRuntimeOperationFormatDateTime;

  if (!operation) {
    return (
      <DetailShell
        title={notFoundTitle}
        backHref={backHref}
        backLabel={backLabel}
        sections={[]}
        error={notFoundMessage ?? 'Operation not found'}
      />
    );
  }

  return (
    <DetailShell
      title={`${resolvedDetailLabels.titlePrefix ?? defaultRuntimeOperationDetailLabels.titlePrefix!}: ${
        resolvedTypeLabels?.[operation.type] ?? operation.type
      }`}
      backHref={backHref}
      backLabel={backLabel}
      sections={[
        {
          title: resolvedDetailLabels.overviewTitle ?? defaultRuntimeOperationDetailLabels.overviewTitle!,
          content: (
            <RuntimeOperationOverviewReadout
              operation={operation}
              detailLabels={resolvedDetailLabels}
              typeLabels={resolvedTypeLabels}
              statusLabels={resolvedStatusLabels}
            />
          ),
        },
        {
          title: resolvedDetailLabels.timelineTitle ?? defaultRuntimeOperationDetailLabels.timelineTitle!,
          content: (
            <RuntimeOperationTimelineReadout
              operation={operation}
              detailLabels={resolvedDetailLabels}
              formatDateTime={resolvedFormatDateTime}
            />
          ),
        },
        {
          title: `${resolvedDetailLabels.receiptsTitle ?? defaultRuntimeOperationDetailLabels.receiptsTitle!} (${receipts.length})`,
          content: (
            <RuntimeOperationReceiptListReadout
              receipts={receipts}
              detailLabels={resolvedDetailLabels}
              formatDateTime={resolvedFormatDateTime}
            />
          ),
        },
      ]}
    />
  );
}

export function RuntimeOperationPresetDetailRoute({
  operationId,
  operations,
  preset,
  backHref = '/operations',
  backLabel,
  notFoundTitle = 'Not Found',
  notFoundMessage,
  typeLabels,
  statusLabels,
  formatDateTime,
}: RuntimeOperationPresetDetailRouteProps) {
  const data = operations[operationId];

  return (
    <RuntimeOperationDetailView
      operation={data?.op}
      receipts={data?.receipts ?? []}
      preset={preset}
      backHref={backHref}
      backLabel={backLabel}
      typeLabels={typeLabels}
      statusLabels={statusLabels}
      formatDateTime={formatDateTime}
      notFoundTitle={notFoundTitle}
      notFoundMessage={
        typeof notFoundMessage === 'function'
          ? notFoundMessage(operationId)
          : notFoundMessage ?? `Operation ${operationId} not found`
      }
    />
  );
}

interface RuntimeOperationListStatsCopy {
  totalLabel?: string;
  totalHint?: (matched: number) => string;
  runningLabel?: string;
  runningHint?: string;
  failedLabel?: string;
  failedHint?: string;
  typeLabel?: string;
  typeHint?: string;
}

interface RuntimeOperationListLabels {
  all?: string;
  searchPlaceholder?: string;
  statusSectionTitle?: string;
  typeSectionTitle?: string;
  tableTitle?: (matched: number) => React.ReactNode;
}

interface RuntimeOperationsListPageSectionProps {
  title: string;
  description?: string;
  operations: RuntimeOperationRecord[];
  preset?: RuntimeOperationListPreset;
  detailHrefBase?: string;
  detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
  searchFields?: Array<keyof RuntimeOperationRecord | string>;
  statusOrder?: string[];
  typeOrder?: string[];
  typeLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
  statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
  labels?: RuntimeOperationListLabels;
  statsCopy?: RuntimeOperationListStatsCopy;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  columnLabels?: RuntimeOperationTableColumnLabels;
  includeColumns?: RuntimeOperationTableColumnKey[];
  omitColumns?: RuntimeOperationTableColumnKey[];
}

export function RuntimeOperationsListPageSection({
  title,
  description,
  operations,
  preset,
  detailHrefBase = '/operations',
  detailHrefBuilder,
  searchFields,
  statusOrder,
  typeOrder,
  typeLabels,
  statusLabels,
  statusVariants = runtimeOperationStatusVariants,
  labels,
  statsCopy,
  emptyTitle,
  emptyDescription,
  defaultPageSize,
  pageSizeOptions,
  columnLabels,
  includeColumns,
  omitColumns,
}: RuntimeOperationsListPageSectionProps) {
  const resolvedStatusOrder = statusOrder ?? [...(preset?.statusOrder ?? [])];
  const resolvedTypeOrder = typeOrder ?? [...(preset?.typeOrder ?? [])];
  const resolvedTypeLabels = typeLabels ?? preset?.typeLabels;
  const resolvedStatusLabels = statusLabels ?? preset?.statusLabels ?? runtimeOperationStatusLabels;
  const resolvedLabels = labels ?? preset?.labels;
  const resolvedStatsCopy = statsCopy ?? preset?.statsCopy;
  const resolvedEmptyTitle = emptyTitle ?? preset?.emptyTitle;
  const resolvedEmptyDescription = emptyDescription ?? preset?.emptyDescription;
  const resolvedColumnLabels = columnLabels ?? preset?.columnLabels;
  const resolvedIncludeColumns = includeColumns ?? preset?.includeColumns;
  const resolvedOmitColumns = omitColumns ?? preset?.omitColumns;
  const resolvedSearchFields = searchFields ?? preset?.searchFields ?? ['id', 'type', 'targetId'];
  const resolvedDefaultPageSize = defaultPageSize ?? preset?.defaultPageSize ?? 10;
  const resolvedPageSizeOptions = pageSizeOptions ?? preset?.pageSizeOptions ?? [5, 10, 20, 50];

  const listState = useListPageSectionState({
    items: operations,
    searchFields: resolvedSearchFields,
    defaultPageSize: resolvedDefaultPageSize,
    pageSizeOptions: resolvedPageSizeOptions,
    facets: [
      {
        key: 'status',
        order: resolvedStatusOrder,
        getValue: (operation) => operation.status,
      },
      {
        key: 'type',
        order: resolvedTypeOrder,
        getValue: (operation) => operation.type,
      },
    ],
  });
  const statusFacet = listState.facets[0];
  const typeFacet = listState.facets[1];
  const stats = useMemo(
    () => ({
      total: operations.length,
      running: operations.filter((operation) => operation.status === 'running').length,
      failed: operations.filter((operation) => operation.status === 'failed').length,
      matched: listState.sortedItems.length,
      types: typeFacet?.order.length ?? 0,
    }),
    [listState.sortedItems.length, operations, typeFacet?.order.length]
  );

  return (
    <PageShell title={title} description={description}>
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 20,
        }}
      >
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.totalLabel ?? 'Total Ops'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            {resolvedStatsCopy?.totalHint?.(stats.matched) ?? `${stats.matched} matched`}
          </div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.runningLabel ?? 'Running'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#facc15' }}>{stats.running}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{resolvedStatsCopy?.runningHint ?? 'In progress'}</div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.failedLabel ?? 'Failed'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.failed}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{resolvedStatsCopy?.failedHint ?? 'Needs attention'}</div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.typeLabel ?? 'Op Types'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#93c5fd' }}>{stats.types}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{resolvedStatsCopy?.typeHint ?? 'Deploy / rollback / scale'}</div>
        </article>
      </div>

      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={listState.searchTerm}
          onChange={listState.setSearchTerm}
          placeholder={resolvedLabels?.searchPlaceholder ?? 'Search by ID / type / target...'}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          {resolvedLabels?.statusSectionTitle ?? 'Status'}
        </div>
        <Tabs
          items={[
            { key: 'ALL', label: resolvedLabels?.all ?? 'All', count: listState.searchFilteredItems.length },
            ...(statusFacet?.order ?? []).map((status) => ({
              key: status,
              label: resolvedStatusLabels[status] ?? status,
              count: statusFacet?.baseItems.filter((operation) => operation.status === status).length ?? 0,
            })),
          ]}
          activeKey={statusFacet?.value ?? 'ALL'}
          onChange={(value) => listState.setFacetValue('status', value)}
          variant="pills"
          size="sm"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          {resolvedLabels?.typeSectionTitle ?? 'Type'}
        </div>
        <Tabs
          items={[
            { key: 'ALL', label: resolvedLabels?.all ?? 'All', count: typeFacet?.baseItems.length ?? 0 },
            ...(typeFacet?.order ?? []).map((type) => ({
              key: type,
              label: resolvedTypeLabels?.[type] ?? type,
              count: typeFacet?.baseItems.filter((operation) => operation.type === type).length ?? 0,
            })),
          ]}
          activeKey={typeFacet?.value ?? 'ALL'}
          onChange={(value) => listState.setFacetValue('type', value)}
          variant="pills"
          size="sm"
        />
      </div>

      <RuntimeOperationsTableCard
        operations={listState.pagedItems}
        detailHrefBase={detailHrefBase}
        detailHrefBuilder={detailHrefBuilder}
        title={resolvedLabels?.tableTitle?.(listState.sortedItems.length)}
        sort={listState.sortConfig}
        onSortChange={listState.setSortConfig}
        striped
        compact
        emptyTitle={resolvedEmptyTitle}
        emptyDescription={resolvedEmptyDescription}
        typeLabels={resolvedTypeLabels}
        statusLabels={resolvedStatusLabels}
        statusVariants={statusVariants}
        columnLabels={resolvedColumnLabels}
        includeColumns={resolvedIncludeColumns}
        omitColumns={resolvedOmitColumns}
        pagination={{
          page: listState.pagination.page,
          totalPages: listState.totalPages,
          total: listState.sortedItems.length,
          onPageChange: listState.pagination.setPage,
        }}
      />
    </PageShell>
  );
}
