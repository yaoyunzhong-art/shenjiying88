'use client';
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ReportCatalogItem, ReportCatalogStatus, ReportsSnapshotDelivery } from './reports-data';

const CARD_STYLE: CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: 16,
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.08)',
};

const STATUS_TEXT: Record<ReportCatalogStatus, string> = {
  ready: '可用',
  draft: '草稿',
  scheduled: '定时',
};

function copyExportCommand(item: ReportCatalogItem, format: 'csv' | 'json' | 'html') {
  return `export ${item.id} --format=${format} --tenant=${item.tenantId}`;
}

export default function ReportsClient({
  snapshot,
}: {
  snapshot: ReportsSnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportCatalogStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState(snapshot.catalog[0]?.id ?? '');
  const [copiedCommand, setCopiedCommand] = useState('');

  const typeOptions = useMemo(() => {
    return Array.from(new Set(snapshot.catalog.map((item) => item.type)));
  }, [snapshot.catalog]);

  const refreshSnapshot = useCallback(
    (tenantId = snapshot.tenantId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tenantId', tenantId);
      router.replace(`${pathname}?${params.toString()}`); handleRefresh();
    },
    [pathname, router, searchParams, snapshot.tenantId],
  );

  const filteredCatalog = useMemo(() => {
    return snapshot.catalog.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.includes(keyword) ||
        item.id.includes(keyword) ||
        item.owner.includes(keyword);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [keyword, snapshot.catalog, statusFilter, typeFilter]);

  const selectedReport: ReportCatalogItem | null =
    filteredCatalog.find((item) => item.id === selectedId) ??
    snapshot.catalog.find((item) => item.id === selectedId) ??
    filteredCatalog[0] ??
    snapshot.catalog[0] ??
    null;

  const handleCopy = useCallback(async (item: ReportCatalogItem, format: 'csv' | 'json' | 'html') => {
    const command = copyExportCommand(item, format);
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
    } catch {
      setCopiedCommand(command);
    }
  }, []);

  return (
    <div style={{ display: 'grid', gap: 16, color: '#0f172a' }}>
      <div style={{ ...CARD_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>报表中心</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            统一查看报表目录、缓存状态、导出格式与报表生成周期。
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshSnapshot()}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        {[
          { label: '今日新增', value: String(snapshot.stats.todayNew) },
          { label: '待审核', value: String(snapshot.stats.pendingReview) },
          { label: '已发布', value: String(snapshot.stats.published) },
          { label: '总报表', value: String(snapshot.stats.total) },
          { label: '缓存命中', value: String(snapshot.stats.cachedReports) },
        ].map((item) => (
          <div key={item.label} style={CARD_STYLE}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={CARD_STYLE}>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(160px, 180px) minmax(180px, 220px)',
          }}
        >
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题 / 报表 ID / 负责人"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReportCatalogStatus | 'all')}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
          >
            <option value="all">全部状态</option>
            <option value="ready">可用</option>
            <option value="draft">草稿</option>
            <option value="scheduled">定时</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
          >
            <option value="all">全部类型</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 0.9fr', marginTop: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                style={{ borderRadius: 14, border: '1px solid #e2e8f0', padding: 14, background: '#f8fafc' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
                      {item.id} / {item.owner} / {item.tenantId}
                    </div>
                  </div>
                  <span style={{ color: item.cached ? '#f59e0b' : '#2563eb', fontWeight: 600 }}>
                    {STATUS_TEXT[item.status]} {item.cached ? '/ Cached' : '/ Fresh'}
                  </span>
                </div>
                <p style={{ margin: '10px 0 0', color: '#475569', fontSize: 14 }}>{item.summary}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    查看摘要
                  </button>
                  <a
                    href={`/reports/${item.id}?tenantId=${snapshot.tenantId}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#0f172a',
                      color: '#fff',
                      textDecoration: 'none',
                    }}
                  >
                    打开详情
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...CARD_STYLE, background: '#0f172a', color: '#e2e8f0' }}>
            <h2 style={{ marginTop: 0, color: '#f8fafc' }}>当前选中报表</h2>
            {selectedReport ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.title}</div>
                <div style={{ marginTop: 8, color: '#94a3b8' }}>
                  最近生成 {selectedReport.lastGenerated} / 行数 {selectedReport.rowCount}
                </div>
                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>导出格式</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {snapshot.exportFormats.map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => void handleCopy(selectedReport, format)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid #334155',
                            background: '#111827',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                          }}
                        >
                          复制 {format.toUpperCase()} 导出命令
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>摘要</div>
                    <div style={{ marginTop: 8 }}>{selectedReport.summary}</div>
                  </div>
                  <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>周期</div>
                    <div style={{ marginTop: 8 }}>
                      {snapshot.activePeriod.from} 至 {snapshot.activePeriod.to}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>暂无报表。</div>
            )}
            {copiedCommand ? (
              <div style={{ marginTop: 16, color: '#38bdf8', fontSize: 13 }}>最近复制: {copiedCommand}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
