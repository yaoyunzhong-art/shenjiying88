'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnomalyFrequencyTimeline } from '@m5/ui';
import type { AnomalyTimeBucket } from '@m5/ui';
import type {
  AnomalyFrequencySnapshot,
  AnomalySeverityFilter,
  AnomalyTimeRange,
} from './anomaly-frequency-data';

// ==================== 类型 ====================

interface AnomalyFrequencyClientProps {
  snapshot: AnomalyFrequencySnapshot;
}
import SnapshotRefreshCard from '../components/snapshot-refresh-card'

const TIME_RANGE_LABELS: Record<AnomalyTimeRange, string> = {
  '6h': '近6小时',
  '24h': '近24小时',
  '7d': '近7天',
  '30d': '近30天',
};

const SEVERITY_LABELS: Record<AnomalySeverityFilter, string> = {
  all: '全部',
  critical: '关键',
  high: '高',
  medium: '中',
  low: '低',
};

function projectBucketsBySeverity(
  buckets: AnomalyTimeBucket[],
  severityFilter: AnomalySeverityFilter,
) {
  if (severityFilter === 'all') {
    return buckets;
  }

  return buckets.map((bucket) => {
    const selectedValue = bucket.bySeverity[severityFilter];

    return {
      ...bucket,
      total: selectedValue,
      bySeverity: {
        critical: severityFilter === 'critical' ? selectedValue : 0,
        high: severityFilter === 'high' ? selectedValue : 0,
        medium: severityFilter === 'medium' ? selectedValue : 0,
        low: severityFilter === 'low' ? selectedValue : 0,
      },
    };
  });
}

// ==================== 样式常量 ====================

const STYLES: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 960,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20,
    marginBottom: 20,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
  },
  statTrend: {
    fontSize: 12,
    fontWeight: 500,
  },
  alert: {
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
};

function getFilterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    border: active ? '1px solid #6366f1' : '1px solid #e2e8f0',
    borderRadius: 8,
    background: active ? '#eef2ff' : '#fff',
    color: active ? '#6366f1' : '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };
}

// ==================== 组件 ====================

export function AnomalyFrequencyClient({ snapshot }: AnomalyFrequencyClientProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [severityFilter, setSeverityFilter] = useState<AnomalySeverityFilter>('all');
  const [timeRange, setTimeRange] = useState<AnomalyTimeRange>('24h');

  const filteredBuckets = useMemo(() => {
    const buckets = snapshot.bucketsByRange[timeRange] ?? [];
    return projectBucketsBySeverity(buckets, severityFilter);
  }, [severityFilter, snapshot.bucketsByRange, timeRange]);

  const visibleTotal = useMemo(
    () => filteredBuckets.reduce((sum, bucket) => sum + bucket.total, 0),
    [filteredBuckets],
  );

  const currentRangeAverage = useMemo(
    () => (filteredBuckets.length > 0 ? Math.round(visibleTotal / filteredBuckets.length) : 0),
    [filteredBuckets, visibleTotal],
  );

  const isFallback = snapshot.deliveryMode === 'fallback';
  const hasVisibleData = visibleTotal > 0;

  function handleRefresh() {
    startRefresh(() => router.refresh());
  }

  return (
    <div style={STYLES.container}>
      <div style={STYLES.header}>
        <div>
          <h1 style={STYLES.title}>异常时序频率</h1>
          <p style={STYLES.subtitle}>
            监控各时段异常分布趋势，及时发现高频异常时段
            {isFallback && ' (离线模式)'}
          </p>
        </div>
        <div style={STYLES.controls}>
          {(['6h', '24h', '7d', '30d'] as AnomalyTimeRange[]).map((range) => (
            <button
              key={range}
              style={getFilterBtnStyle(timeRange === range)}
              onClick={() => setTimeRange(range)}
            >
              {TIME_RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          ...STYLES.card,
          padding: 16,
          marginBottom: 16,
          background: '#f8fafc',
        }}
      >
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div style={{ marginTop: 6, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
          Delivery {snapshot.deliveryMode} · 业务数据: {snapshot.businessDataSource}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          generatedAt: {snapshot.generatedAt} · {snapshot.note}
        </div>
      </div>

      <div style={STYLES.statsRow}>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>总异常数</span>
          <span style={STYLES.statValue}>{snapshot.stats.totalAlerts}</span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>关键异常</span>
          <span style={{ ...STYLES.statValue, color: '#ef4444' }}>
            {snapshot.stats.criticalAlerts}
          </span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>已处理</span>
          <span style={{ ...STYLES.statValue, color: '#10b981' }}>
            {snapshot.stats.handledAlerts}
          </span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>处理率</span>
          <span style={STYLES.statValue}>{snapshot.stats.responseRate}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'critical', 'high', 'medium', 'low'] as AnomalySeverityFilter[]).map((sev) => (
          <button
            key={sev}
            style={{
              ...getFilterBtnStyle(severityFilter === sev),
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={() => setSeverityFilter(sev)}
          >
            {SEVERITY_LABELS[sev]}
          </button>
        ))}
      </div>

      <div style={STYLES.card}>
        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>
          当前范围: {TIME_RANGE_LABELS[timeRange]} · 当前筛选: {SEVERITY_LABELS[severityFilter]} ·
          桶均值: {currentRangeAverage}
        </div>
        {hasVisibleData ? (
          <AnomalyFrequencyTimeline
            buckets={filteredBuckets}
            title="异常时序分布"
            height={240}
            maxBuckets={
              timeRange === '6h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 14 : 30
            }
            emptyText="该时段暂无异常数据"
            data-testid="anomaly-frequency-timeline-page"
          />
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
              padding: '32px 20px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            暂无可展示的异常频率数据，请切换时间范围或刷新快照后重试。
          </div>
        )}
      </div>

      <div
        style={{
          padding: '14px 16px',
          background: '#fafafa',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
        }}
      >
        <strong>说明：</strong>
        异常时序图展示各时段内不同严重级别异常的分布。当前快照来自治理读模型聚合结果，
        服务端会将 overview alerts 与高风险汇总项投影为时序桶，点击筛选按钮可按级别查看。
      </div>
    </div>
  );
}

export default AnomalyFrequencyClient;
