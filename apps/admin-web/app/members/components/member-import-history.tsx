'use client';

import React, { useState, useMemo, useCallback } from 'react';

import {
  DataTable,
  SearchFilterInput,
  Pagination,
  StatusBadge,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MOCK_IMPORT_RECORDS,
  type MemberImportRecord,
} from '../../members-data';

// ---- 导入状态标签 ----

const IMPORT_STATUS_MAP: Record<MemberImportRecord['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  completed: { label: '导入完成', variant: 'success' },
  partial: { label: '部分成功', variant: 'warning' },
  failed: { label: '导入失败', variant: 'danger' },
  processing: { label: '处理中', variant: 'neutral' },
};

// ---- 导入历史表格组件 ----

export function ImportHistoryTable({
  records,
  compact,
}: {
  records?: MemberImportRecord[];
  compact?: boolean;
}) {
  const data = records ?? MOCK_IMPORT_RECORDS;
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [expandedImport, setExpandedImport] = useState<string | null>(null);
  const searchFields = useMemo<(keyof MemberImportRecord)[]>(
    () => ['fileName', 'importedBy', 'importId'] as (keyof MemberImportRecord)[],
    []
  );

  const { filteredItems, searchTerm, setSearchTerm } = useSearchFilter(data, searchFields);

  const columns: DataTableColumn<MemberImportRecord>[] = useMemo(
    () => [
      {
        key: 'importId',
        title: '导入ID',
        dataKey: 'importId',
        sortable: true,
        render: (item) => (
          <code style={{ color: '#93c5fd', fontSize: 12 }}>{item.importId}</code>
        ),
      },
      {
        key: 'fileName',
        title: '文件名',
        dataKey: 'fileName',
        sortable: true,
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <span style={{ color: '#e2e8f0' }}>{item.fileName}</span>
          </div>
        ),
      },
      {
        key: 'totalRecords',
        title: '总记录',
        dataKey: 'totalRecords',
        sortable: true,
        align: 'right',
      },
      {
        key: 'successRecords',
        title: '成功',
        dataKey: 'successRecords',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: '#86efac', fontWeight: 600 }}>
            {item.successRecords}
          </span>
        ),
      },
      {
        key: 'failedRecords',
        title: '失败',
        dataKey: 'failedRecords',
        sortable: true,
        align: 'right',
        render: (item) =>
          item.failedRecords > 0 ? (
            <span style={{ color: '#fca5a5', fontWeight: 600 }}>
              {item.failedRecords}
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>0</span>
          ),
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (item) => item.status,
        render: (item) => {
          const s = IMPORT_STATUS_MAP[item.status];
          return (
            <StatusBadge
              label={s.label}
              variant={s.variant as 'success' | 'warning' | 'danger' | 'neutral'}
              size="sm"
            />
          );
        },
      },
      {
        key: 'importedBy',
        title: '操作人',
        dataKey: 'importedBy',
        sortable: true,
      },
      {
        key: 'importedAt',
        title: '导入时间',
        dataKey: 'importedAt',
        sortable: true,
        render: (item) => formatDateForDisplay(item.importedAt),
      },
      ...(!compact
        ? [
            {
              key: 'actions',
              title: '操作',
              width: '100px',
              render: (item: MemberImportRecord) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedImport(
                      expandedImport === item.importId ? null : item.importId
                    );
                  }}
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(96,165,250,0.25)',
                    background: 'rgba(59,130,246,0.12)',
                    color: '#dbeafe',
                    cursor: 'pointer',
                  }}
                >
                  {expandedImport === item.importId ? '收起' : '详情'}
                </button>
              ),
            } as DataTableColumn<MemberImportRecord>,
          ]
        : []),
    ],
    [compact, expandedImport]
  );

  const pagination = usePagination({
    initialPageSize: compact ? 5 : 10,
    pageSizeOptions: [5, 10, 20],
  });

  const sortedItems = useSortedItems(filteredItems, columns, sortConfig);
  const pageItems = pagination.paginate(sortedItems);

  // 重置分页
  useMemo(() => {
    pagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <div>
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索文件名、导入ID、操作人..."
          />
        </div>
      )}

      <DataTable
        title={`导入记录（共 ${filteredItems.length} 条）`}
        columns={columns}
        items={pageItems}
        rowKey={(item) => item.importId}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact={compact}
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={sortedItems.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* 展开详情 */}
      {expandedImport && (
        <ImportErrorDetail
          record={data.find((r) => r.importId === expandedImport)!}
          onClose={() => setExpandedImport(null)}
        />
      )}
    </div>
  );
}

// ---- 导入错误详情组件 ----

function ImportErrorDetail({
  record,
  onClose,
}: {
  record: MemberImportRecord;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        background: 'rgba(30, 41, 59, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          导入详情 · {record.fileName}
        </h4>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '2px 10px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(148,163,184,0.1)',
            color: '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          关闭
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          总记录
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
            {record.totalRecords}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          成功
          <div style={{ fontSize: 18, fontWeight: 700, color: '#86efac' }}>
            {record.successRecords}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          失败
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fca5a5' }}>
            {record.failedRecords}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          操作人
          <div style={{ fontSize: 14, fontWeight: 600, color: '#93c5fd' }}>
            {record.importedBy}
          </div>
        </div>
      </div>

      {record.errors.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 6 }}>
            错误详情：
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {record.errors.map((err, index) => (
              <li
                key={index}
                style={{
                  fontSize: 12,
                  color: '#fecaca',
                  lineHeight: 1.6,
                  marginBottom: 4,
                }}
              >
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.errors.length === 0 && record.successRecords === record.totalRecords && (
        <div style={{ fontSize: 13, color: '#86efac', padding: '8px 0' }}>
          ✓ 全部 {record.totalRecords} 条记录导入成功，无异常。
        </div>
      )}
    </div>
  );
}

// ---- 导入历史统计卡片 ----

export function ImportHistoryStats({ records }: { records?: MemberImportRecord[] }) {
  const data = records ?? MOCK_IMPORT_RECORDS;

  const stats = useMemo(
    () => ({
      totalImports: data.length,
      totalRecords: data.reduce((s, r) => s + r.totalRecords, 0),
      totalSuccess: data.reduce((s, r) => s + r.successRecords, 0),
      totalFailed: data.reduce((s, r) => s + r.failedRecords, 0),
      successRate:
        data.reduce((s, r) => s + r.totalRecords, 0) > 0
          ? (
              (data.reduce((s, r) => s + r.successRecords, 0) /
                data.reduce((s, r) => s + r.totalRecords, 0)) *
              100
            ).toFixed(1)
          : '100.0',
    }),
    [data]
  );

  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>导入次数</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
          {stats.totalImports}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>次</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>处理总记录</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
          {stats.totalRecords}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>条</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>成功</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#86efac' }}>
          {stats.totalSuccess}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>条</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>失败</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fca5a5' }}>
          {stats.totalFailed}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>条</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(129, 140, 248, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>成功率</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#a5b4fc' }}>
          {stats.successRate}%
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>通过率</div>
      </div>
    </div>
  );
}

// ---- 辅助函数 ----

function formatDateForDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
