'use client';

/**
 * Tenant-Config 审计日志 - 客户端过滤/分页/搜索组件
 *
 * 接收 SSR 加载的真实审计数据 (来自 tenant-config 后端 audit-logs),
 * 复用原 audit-trail UI 结构 (StatCard / Tabs / DataTable / Pagination)。
 */

import { useMemo, useState } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  SearchFilterInput,
  DataTable,
  Pagination,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import {
  AUDIT_ACTION_LABEL,
  AUDIT_MODULE_LABEL,
  AUDIT_RESULT_PRESENTATION,
  type AuditAction,
  type AuditModule,
  type AuditResult,
  type TenantConfigAuditView,
} from './tenant-config-audit-view-model';

interface Props {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  tenantId: string;
  records: TenantConfigAuditView[];
  total: number;
  error?: string;
}

function buildColumns(): DataTableColumn<TenantConfigAuditView>[] {
  return [
    { key: 'time', title: '时间', dataKey: 'time', sortable: true, render: (i) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{i.time}</span> },
    { key: 'user', title: '用户', dataKey: 'user', sortable: true },
    {
      key: 'action',
      title: '操作',
      sortable: true,
      sortValue: (i) => i.action,
      render: (i) => <span style={{ fontWeight: 600 }}>{AUDIT_ACTION_LABEL[i.action]}</span>,
    },
    {
      key: 'module',
      title: '模块',
      sortable: true,
      sortValue: (i) => i.module,
      render: (i) => <StatusBadge label={AUDIT_MODULE_LABEL[i.module]} variant="info" size="sm" />,
    },
    { key: 'target', title: '目标', dataKey: 'target', sortable: true, render: (i) => <span style={{ color: '#93c5fd', fontSize: 12 }}>{i.target}</span> },
    {
      key: 'result',
      title: '结果',
      sortable: true,
      sortValue: (i) => i.result,
      render: (i) => {
        const pres = AUDIT_RESULT_PRESENTATION[i.result];
        return <StatusBadge label={pres.label} variant={pres.variant} size="sm" />;
      },
    },
    { key: 'ip', title: 'IP', dataKey: 'ip', sortable: true, render: (i) => <span style={{ fontSize: 11, color: '#6b7280' }}>{i.ip}</span> },
  ];
}

export default function TenantConfigAuditClient({ deliveryMode, generatedAt, tenantId, records, total, error }: Props) {
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const searchFields = useMemo<(keyof TenantConfigAuditView)[]>(() => ['user', 'target', 'detail', 'role'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(records, searchFields);
  const moduleFiltered = useMemo(
    () => (moduleFilter === 'ALL' ? filteredItems : filteredItems.filter((l) => l.module === moduleFilter)),
    [filteredItems, moduleFilter]
  );
  const resultFiltered = useMemo(
    () => (resultFilter === 'ALL' ? moduleFiltered : moduleFiltered.filter((l) => l.result === resultFilter)),
    [moduleFiltered, resultFilter]
  );
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(resultFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 20 });
  const pageItems = pagination.paginate(sorted);

  const failureCount = records.filter((l) => l.result === 'failure' || l.result === 'blocked').length;
  const todayPrefix = new Date().toISOString().split('T')[0];
  const todayCount = records.filter((l) => l.time.startsWith(todayPrefix)).length;

  const isFallback = deliveryMode === 'fallback';
  const subtitle = isFallback
    ? `API 暂未返回审计数据,显示空态。${error ? ` (${error.slice(0, 80)})` : ''}`
    : `${total} 条租户配置变更记录 · ${failureCount} 条异常`;

  return (
    <PageShell title="🔒 审计日志" subtitle={subtitle}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <StatCard label="总操作数" value={total} helper={`来源 tenant-config · 租户 ${tenantId}`} />
        <StatCard label="失败/拦截" value={failureCount} helper={total > 0 ? `${((failureCount / total) * 100).toFixed(1)}% 异常率` : '无数据'} />
        <StatCard label="今日操作" value={todayCount} helper={generatedAt.slice(0, 10)} />
        <StatCard label="数据范围" value={isFallback ? '空态' : 'tenant-config'} helper={deliveryMode} />
      </div>

      <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索用户/目标/详情/IP..." />

      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部模块' },
              ...(Object.keys(AUDIT_MODULE_LABEL) as AuditModule[]).map((m) => ({ key: m, label: AUDIT_MODULE_LABEL[m] })),
            ]}
            activeKey={moduleFilter}
            onChange={setModuleFilter}
            variant="pills"
            size="sm"
          />
        </div>
        <div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部结果' },
              ...(['success', 'failure', 'blocked', 'pending'] as AuditResult[]).map((r) => ({
                key: r,
                label: AUDIT_RESULT_PRESENTATION[r].label,
              })),
            ]}
            activeKey={resultFilter}
            onChange={setResultFilter}
            variant="pills"
            size="sm"
          />
        </div>
      </div>

      {isFallback ? (
        <div
          data-testid="empty-state"
          style={{
            marginTop: 18,
            padding: 32,
            textAlign: 'center',
            color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.35)',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          暂无审计数据 — 后端 <code>GET /tenant-config/audit-logs</code> 暂未返回内容或 audit-logs
          endpoint 尚未上线。请先在 <code>/configuration/three-level</code> 触发一次配置变更以产生审计记录。
        </div>
      ) : (
        <>
          <DataTable
            title={`审计日志 (${sorted.length})`}
            columns={columns}
            items={pageItems}
            rowKey={(i) => i.id}
            sort={sortConfig}
            onSortChange={setSortConfig}
            striped
            compact
          />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={sorted.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}
    </PageShell>
  );
}
