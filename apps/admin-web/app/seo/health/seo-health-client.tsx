'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { SeoHealthIssue, SeoIssueSeverity, SeoHealthSnapshotDelivery } from './seo-health-data';

type SeoHealthIssueSeverity = SeoIssueSeverity;

function severityColor(severity: SeoHealthIssueSeverity) {
  if (severity === 'high') return '#ef4444';
  if (severity === 'medium') return '#f59e0b';
  return '#22c55e';
}

export default function SeoHealthClient({
  snapshot,
}: {
  snapshot: SeoHealthSnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [severityFilter, setSeverityFilter] = useState<SeoHealthIssueSeverity | 'all'>('all');
  const [expandedIssue, setExpandedIssue] = useState(snapshot.issues[0]?.id ?? '');

  const refreshSnapshot = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tenantId', snapshot.tenantId);
    startRefresh(() => {
      router.replace(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }, [pathname, router, searchParams, snapshot.tenantId, startRefresh]);

  const filteredIssues: SeoHealthIssue[] = useMemo(() => {
    if (severityFilter === 'all') return snapshot.issues;
    return snapshot.issues.filter((issue) => issue.severity === severityFilter);
  }, [severityFilter, snapshot.issues]);

  return (
    <div style={{ display: 'grid', gap: 16, color: '#0f172a' }}>
      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>SEO 健康报告</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              tenant {snapshot.tenantId} / generatedAt {snapshot.generatedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshSnapshot}
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
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        {[
          { label: '扫描页面', value: String(snapshot.totalPages) },
          { label: '有元数据', value: String(snapshot.pagesWithMetadata) },
          { label: '有 Sitemap', value: String(snapshot.pagesWithSitemap) },
          { label: '平均评分', value: String(snapshot.avgMetadataScore) },
          { label: '覆盖率', value: `${snapshot.coverageRate}%` },
        ].map((item) => (
          <div key={item.label} style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 14, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
            <div
              style={{
                width: `${snapshot.coverageRate}%`,
                height: '100%',
                background: snapshot.coverageRate >= 80 ? '#22c55e' : '#f59e0b',
              }}
            />
          </div>
          <strong>{snapshot.coverageRate}%</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, color: '#64748b', fontSize: 13 }}>
          <span>高风险 {snapshot.severitySummary.high}</span>
          <span>中风险 {snapshot.severitySummary.medium}</span>
          <span>低风险 {snapshot.severitySummary.low}</span>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>问题清单</h2>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as SeoHealthIssueSeverity | 'all')}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
          >
            <option value="all">全部严重级别</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
        </div>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {filteredIssues.map((issue) => (
            <div key={issue.id} style={{ borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? '' : issue.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 14,
                  border: 'none',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>
                  <strong>{issue.path}</strong>
                  <span style={{ marginLeft: 8, color: '#64748b' }}>{issue.summary}</span>
                </span>
                <span style={{ color: severityColor(issue.severity), fontWeight: 700 }}>{issue.severity}</span>
              </button>
              {expandedIssue === issue.id ? (
                <div style={{ padding: 14, background: '#fff' }}>
                  <div style={{ color: '#475569' }}>Owner: {issue.owner}</div>
                  <div style={{ marginTop: 8 }}>{issue.suggestion}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
