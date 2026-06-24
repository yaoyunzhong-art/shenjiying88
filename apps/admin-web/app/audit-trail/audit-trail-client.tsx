'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DataTable,
  DetailActionBar,
  FilterChips,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip
} from '@m5/ui';
import {
  type AuditRecordContract,
  type AuditRiskLevel,
  type AuditTrailQuery,
  buildAuditTrailRecordDetailHref
} from '@m5/types';
import { RISK_LEVEL_LABEL, RISK_LEVEL_VARIANT, summarizeRecordSummary } from '../audit-trail-view-model';
import { useDetailActions } from '../components/use-detail-actions';

interface AuditTrailClientProps {
  records: AuditRecordContract[];
  total: number;
  query: AuditTrailQuery;
}

const RISK_FILTER_OPTIONS: ReadonlyArray<AuditRiskLevel | 'ALL'> = ['ALL', 'low', 'medium', 'high'];

export default function AuditTrailClient({ records, total, query }: AuditTrailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [riskFilter, setRiskFilter] = useState<AuditRiskLevel | 'ALL'>(query.riskLevel ?? 'ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>(query.source ?? 'ALL');

  const { actions } = useDetailActions({
    workspace: 'audit-trail',
    detailId: 'overview',
    record: { records, total, query },
    shareTitle: '审计工作台',
    shareText: '查看审计记录 / 风险级别 / 来源筛选结果'
  });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (riskFilter !== 'ALL' && record.riskLevel !== riskFilter) {
        return false;
      }
      if (sourceFilter !== 'ALL' && record.source !== sourceFilter) {
        return false;
      }
      if (searchTerm.trim().length > 0) {
        const needle = searchTerm.trim().toLowerCase();
        const haystack = `${record.eventType} ${record.actorId ?? ''} ${record.source ?? ''} ${JSON.stringify(record.details)}`.toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [records, riskFilter, sourceFilter, searchTerm]);

  const sources = useMemo(
    () => Array.from(new Set(records.map((record) => record.source).filter((value): value is string => Boolean(value)))),
    [records]
  );

  const counts = useMemo(() => {
    const byLevel: Record<AuditRiskLevel | 'ALL', number> = {
      ALL: records.length,
      low: 0,
      medium: 0,
      high: 0
    };
    for (const record of records) {
      byLevel[record.riskLevel] += 1;
    }
    return byLevel;
  }, [records]);

  const columns: DataTableColumn<AuditRecordContract>[] = useMemo(
    () => [
      {
        key: 'riskLevel',
        title: '级别',
        sortable: true,
        render: (item) => (
          <StatusBadge
            label={RISK_LEVEL_LABEL[item.riskLevel]}
            variant={RISK_LEVEL_VARIANT[item.riskLevel]}
            size="sm"
            dot
          />
        )
      },
      {
        key: 'eventType',
        title: '事件',
        dataKey: 'eventType',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildAuditTrailRecordDetailHref(item.auditId)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.eventType}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{item.auditId}</div>
          </div>
        )
      },
      {
        key: 'actorId',
        title: '操作人',
        dataKey: 'actorId',
        sortable: true,
        render: (item) => (
          <div>
            <div style={{ fontSize: 13, color: '#e2e8f0' }}>{item.actorId ?? 'system'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{item.tenantId ?? ''}</div>
          </div>
        )
      },
      {
        key: 'source',
        title: '来源',
        dataKey: 'source',
        sortable: true,
        render: (item) => item.source ?? '—'
      },
      {
        key: 'details',
        title: '摘要',
        sortable: false,
        render: (item) => (
          <span style={{ fontSize: 12, color: '#cbd5f5' }}>{summarizeRecordSummary(item)}</span>
        )
      },
      {
        key: 'occurredAt',
        title: '时间',
        dataKey: 'occurredAt',
        sortable: true,
        render: (item) => new Date(item.occurredAt).toLocaleString('zh-CN')
      }
    ],
    []
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'occurredAt',
    direction: 'desc'
  });
  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return filteredRecords;
    }
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    return [...filteredRecords].sort((a, b) => {
      const valueA = (a as unknown as Record<string, unknown>)[sortConfig.key];
      const valueB = (b as unknown as Record<string, unknown>)[sortConfig.key];
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * direction;
      }
      return String(valueA ?? '').localeCompare(String(valueB ?? '')) * direction;
    });
  }, [filteredRecords, sortConfig]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  function updateQuery(next: Partial<AuditTrailQuery>) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    for (const [key, value] of Object.entries(next)) {
      if (typeof value === 'string' && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const queryString = params.toString();
    router.push(`/audit-trail${queryString ? `?${queryString}` : ''}`);
  }

  return (
    <div>
      <SearchFilterInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="搜索事件类型 / 操作人 / 摘要..."
      />

      <div style={{ marginTop: 14, marginBottom: 12 }}>
        <Tabs
          items={RISK_FILTER_OPTIONS.map((level) => ({
            key: level,
            label: level === 'ALL' ? '全部' : RISK_LEVEL_LABEL[level],
            count: counts[level]
          }))}
          activeKey={riskFilter}
          onChange={(key) => {
            const next = key as AuditRiskLevel | 'ALL';
            setRiskFilter(next);
            updateQuery({ riskLevel: next === 'ALL' ? undefined : next });
          }}
          variant="pills"
          size="sm"
        />
      </div>

      {sources.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>来源</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: records.length },
              ...sources.map((source) => ({
                key: source,
                label: source,
                count: records.filter((record) => record.source === source).length
              }))
            ]}
            activeKey={sourceFilter}
            onChange={(key) => {
              setSourceFilter(key);
              updateQuery({ source: key === 'ALL' ? undefined : key });
            }}
            variant="pills"
            size="sm"
          />
        </div>
      ) : null}

      <FilterChips
        hint="已筛选："
        chips={[
          ...(riskFilter !== 'ALL'
            ? [
                {
                  key: 'riskLevel',
                  label: RISK_LEVEL_LABEL[riskFilter],
                  tone: (RISK_LEVEL_VARIANT[riskFilter] === 'danger'
                    ? 'danger'
                    : RISK_LEVEL_VARIANT[riskFilter] === 'warning'
                      ? 'warning'
                      : 'neutral') as FilterChip['tone'],
                  count: counts[riskFilter]
                }
              ]
            : []),
          ...(sourceFilter !== 'ALL'
            ? [
                {
                  key: 'source',
                  label: sourceFilter,
                  tone: 'neutral' as FilterChip['tone'],
                  count: records.filter((record) => record.source === sourceFilter).length
                }
              ]
            : [])
        ]}
        onRemove={(key) => {
          if (key === 'riskLevel') {
            setRiskFilter('ALL');
            updateQuery({ riskLevel: undefined });
          } else if (key === 'source') {
            setSourceFilter('ALL');
            updateQuery({ source: undefined });
          }
        }}
        onClearAll={() => {
          setRiskFilter('ALL');
          setSourceFilter('ALL');
          updateQuery({ riskLevel: undefined, source: undefined });
        }}
        size="sm"
        style={{ marginBottom: 12 }}
      />

      <DataTable
        title={`审计记录（匹配 ${sortedItems.length} / 总计 ${total}）`}
        columns={columns}
        items={pageItems}
        rowKey={(item) => item.auditId}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={sortedItems.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前审计工作台筛选快照"
      />
    </div>
  );
}
