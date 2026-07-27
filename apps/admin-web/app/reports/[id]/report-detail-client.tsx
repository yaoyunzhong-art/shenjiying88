'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ReportDetailSnapshotDelivery } from './report-detail-data';

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportDetailClient({
  snapshot,
}: {
  snapshot: ReportDetailSnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [message, setMessage] = useState('');

  const refreshSnapshot = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tenantId', snapshot.tenantId);
    startRefresh(() => {
      router.replace(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }, [pathname, router, searchParams, snapshot.tenantId, startRefresh]);

  const metricSummary = useMemo(() => {
    if (!snapshot.report) return [] as Array<{ label: string; value: string }>;
    return snapshot.report.columns
      .filter((column) => column.type === 'metric')
      .map((column) => ({
        label: column.alias,
        value: String(snapshot.report?.totals?.[column.field] ?? snapshot.report?.rows[0]?.[column.field] ?? '-'),
      }));
  }, [snapshot.report]);

  const exportCsv = useCallback(() => {
    if (!snapshot.report) return;
    const header = snapshot.report.columns.map((column) => column.alias).join(',');
    const rows = snapshot.report.rows.map((row) =>
      snapshot.report?.columns.map((column) => JSON.stringify(String(row[column.field] ?? ''))).join(','),
    );
    downloadCsv(`${snapshot.reportId}.csv`, [header, ...rows].join('\n'));
    setMessage(`已导出 ${snapshot.reportId}.csv`);
  }, [snapshot.report, snapshot.reportId]);

  if (!snapshot.report) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>报表详情</h1>
          <p style={{ color: '#64748b' }}>{snapshot.error ?? '暂无可用报表数据。'}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => router.push('/reports')}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}
            >
              返回列表
            </button>
            <button
              type="button"
              onClick={refreshSnapshot}
              style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff' }}
            >
              {isRefreshing ? '刷新中...' : '重新加载'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16, color: '#0f172a' }}>
      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>{snapshot.title}</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              {snapshot.reportId} / tenant {snapshot.tenantId} / 生成于 {snapshot.report.generatedAt}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => router.push('/reports')}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              返回列表
            </button>
            <button
              type="button"
              onClick={refreshSnapshot}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              导出 CSV
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {metricSummary.map((item) => (
          <div key={item.label} style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13, marginBottom: 12 }}>
          <span>
            周期: {snapshot.report.period.from} 至 {snapshot.report.period.to}
          </span>
          <span>rows: {snapshot.report.rows.length}</span>
          <span>tab: {snapshot.reportTab}</span>
          <span>{snapshot.report.cached ? 'Cached' : 'Fresh'}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b', fontSize: 13 }}>
              {snapshot.report.columns.map((column) => (
                <th key={column.field} style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>
                  {column.alias}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.report.rows.map((row, index) => (
              <tr key={`${snapshot.reportId}-${index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {snapshot.report?.columns.map((column) => (
                  <td key={column.field} style={{ padding: '10px 8px' }}>
                    {String(row[column.field] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {snapshot.report.totals ? (
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                {snapshot.report.columns.map((column) => (
                  <td key={column.field} style={{ padding: '10px 8px', borderTop: '1px solid #e2e8f0' }}>
                    {String(snapshot.report?.totals?.[column.field] ?? '-')}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {message ? <div style={{ color: '#2563eb', fontSize: 13 }}>{message}</div> : null}
    </div>
  );
}
