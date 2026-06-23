'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  Select,
  StatusBadge,
  type DataTableColumn
} from '@m5/ui';
import type {
  IntegrationEventEnvelopeContract,
  IntegrationWebhookSourceContract
} from '@m5/types';
import {
  buildIntegrationOrchestrationEventDetailHref,
  buildIntegrationOrchestrationSourceDetailHref,
  buildIntegrationOrchestrationIdempotencyDetailHref
} from '@m5/types';
import {
  summarizeIntegrationEvent
} from '../../integration-orchestration-view-model';
import { useDetailActions } from '../../components/use-detail-actions';

interface IntegrationOrchestrationEventsClientProps {
  events: IntegrationEventEnvelopeContract[];
  sources: IntegrationWebhookSourceContract[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export default function IntegrationOrchestrationEventsClient({
  events,
  sources
}: IntegrationOrchestrationEventsClientProps) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const { actions } = useDetailActions({
    workspace: 'integration-orchestration',
    detailId: 'events-list',
    record: { eventCount: events.length, filteredAt: new Date().toISOString() },
    shareTitle: '事件信封列表',
    shareText: `共 ${events.length} 条事件记录`
  });

  const sourceOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const event of events) {
      seen.add(event.source);
    }
    return [{ value: 'ALL', label: '全部来源' }, ...Array.from(seen).map((s) => ({ value: s, label: s }))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (sourceFilter !== 'ALL') {
      result = result.filter((e) => e.source === sourceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(q)
      );
    }
    return result;
  }, [events, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedEvents = filteredEvents.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sourceSeverityMap = useMemo(() => {
    const map: Record<string, 'success' | 'warning' | 'info'> = {};
    for (const source of sources) {
      map[source.source] = source.algorithm === 'HMAC_SHA256_HIGH_SENSITIVITY' ? 'warning' : 'info';
    }
    return map;
  }, [sources]);

  const columns: DataTableColumn<IntegrationEventEnvelopeContract>[] = useMemo(
    () => [
      {
        key: 'eventName',
        title: '事件类型',
        sortable: true,
        dataKey: 'eventName',
        render: (item) => (
          <div>
            <Link
              href={buildIntegrationOrchestrationEventDetailHref(item.envelopeId)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.eventName}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeIntegrationEvent(item)}</div>
          </div>
        )
      },
      {
        key: 'source',
        title: '来源',
        sortable: true,
        dataKey: 'source',
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusBadge
              label={item.source}
              variant={sourceSeverityMap[item.source] ?? 'info'}
              dot
              size="sm"
            />
            <Link
              href={buildIntegrationOrchestrationSourceDetailHref(item.source)}
              style={{ fontSize: 11, color: '#64748b', textDecoration: 'none' }}
            >
              查看来源
            </Link>
          </div>
        )
      },
      {
        key: 'aggregateId',
        title: '聚合 ID',
        dataKey: 'aggregateId',
        render: (item) => (
          <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {item.aggregateId ?? '—'}
          </span>
        )
      },
      {
        key: 'idempotencyKey',
        title: '幂等键',
        dataKey: 'idempotencyKey',
        render: (item) => (
          <Link
            href={buildIntegrationOrchestrationIdempotencyDetailHref(item.idempotencyKey)}
            style={{ fontFamily: 'monospace', fontSize: 11, color: '#fbbf24', textDecoration: 'none' }}
          >
            {item.idempotencyKey}
          </Link>
        )
      },
      {
        key: 'occurredAt',
        title: '发生时间',
        dataKey: 'occurredAt',
        sortable: true,
        render: (item) => (
          <span style={{ fontSize: 12 }}>
            {new Date(item.occurredAt).toLocaleString('zh-CN')}
          </span>
        )
      }
    ],
    [sourceSeverityMap]
  );

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SearchFilterInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setCurrentPage(1);
          }}
          placeholder="搜索事件名 / 来源 / 聚合ID / 幂等键..."
        />
        <Select
          value={sourceFilter}
          onChange={(v) => {
            setSourceFilter(v);
            setCurrentPage(1);
          }}
          options={sourceOptions}
        />
      </div>

      <div>
        <DataTable
          title={`事件信封（${filteredEvents.length}）`}
          columns={columns}
          items={pagedEvents}
          rowKey={(item) => item.envelopeId}
          striped
          compact
        />
      </div>

      {filteredEvents.length > pageSize ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pagination
            page={safePage}
            total={filteredEvents.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <Select
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setCurrentPage(1);
            }}
            options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `每页 ${n} 条` }))}
          />
        </div>
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="事件列表操作"
        caption="复制 / 导出 / 分享当前事件列表"
      />
    </div>
  );
}
