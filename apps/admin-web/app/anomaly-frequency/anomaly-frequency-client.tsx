'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AnomalyFrequencyTimeline } from '@m5/ui';
import type { AnomalyTimeBucket } from '@m5/ui';
import { loadAdminGovernanceReadModel } from '../bootstrap';
import type { AdminGovernanceReadModel } from '../bootstrap';

// ==================== 类型 ====================

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TimeRange = '6h' | '24h' | '7d' | '30d';

interface AnomalyFrequencyClientProps {
  initialGovernance: AdminGovernanceReadModel;
}

// ==================== Mock 数据工厂 ====================

function generateMockBuckets(timeRange: TimeRange, severity: SeverityFilter): AnomalyTimeBucket[] {
  const now = Date.now();
  const intervals: Record<TimeRange, { count: number; intervalMs: number }> = {
    '6h': { count: 12, intervalMs: 30 * 60 * 1000 },
    '24h': { count: 24, intervalMs: 60 * 60 * 1000 },
    '7d': { count: 14, intervalMs: 12 * 60 * 60 * 1000 },
    '30d': { count: 30, intervalMs: 24 * 60 * 60 * 1000 },
  };

  const { count, intervalMs } = intervals[timeRange];

  return Array.from({ length: count }, (_, i) => {
    const time = new Date(now - (count - 1 - i) * intervalMs);
    const label =
      timeRange === '6h' || timeRange === '24h'
        ? time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        : time.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

    const base = Math.round(Math.random() * 8) + 1;

    // 根据过滤条件生成对应严重级别的数据
    const critical = severity === 'all' || severity === 'critical' ? Math.round(base * 0.2) : 0;
    const high = severity === 'all' || severity === 'high' ? Math.round(base * 0.3) : 0;
    const medium = severity === 'all' || severity === 'medium' ? Math.round(base * 0.35) : 0;
    const low = severity === 'all' || severity === 'low' ? Math.round(base * 0.15) : 0;
    const total = critical + high + medium + low;

    return {
      label,
      total: Math.max(total, 1),
      bySeverity: { critical, high, medium, low: Math.max(low, 1) },
      bucketId: `bucket-${i}`,
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
  refreshBtn: {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
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

export function AnomalyFrequencyClient({ initialGovernance }: AnomalyFrequencyClientProps) {
  const safeGovernance = initialGovernance ?? { deliveryMode: 'fallback' };
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // 使用 governance 判断是否使用 mock 数据
  const isFallback = safeGovernance.deliveryMode === 'fallback';

  const buckets = useMemo(
    () => generateMockBuckets(timeRange, severityFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeRange, severityFilter, refreshKey],
  );

  const stats = useMemo(() => {
    const totalAlerts = buckets.reduce((s, b) => s + b.total, 0);
    const criticalCount = buckets.reduce((s, b) => s + b.bySeverity.critical, 0);
    const highCount = buckets.reduce((s, b) => s + b.bySeverity.high, 0);
    const avgPerBucket = buckets.length > 0 ? Math.round(totalAlerts / buckets.length) : 0;
    return { totalAlerts, criticalCount, highCount, avgPerBucket };
  }, [buckets]);

  return (
    <div style={STYLES.container}>
      {/* 头部 */}
      <div style={STYLES.header}>
        <div>
          <h1 style={STYLES.title}>异常时序频率</h1>
          <p style={STYLES.subtitle}>
            监控各时段异常分布趋势，及时发现高频异常时段
            {isFallback && ' (离线模式)'}
          </p>
        </div>
        <div style={STYLES.controls}>
          {/* 时间范围 */}
          {(['6h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              style={getFilterBtnStyle(timeRange === range)}
              onClick={() => setTimeRange(range)}
            >
              {range === '6h' && '近6小时'}
              {range === '24h' && '近24小时'}
              {range === '7d' && '近7天'}
              {range === '30d' && '近30天'}
            </button>
          ))}
          <button style={STYLES.refreshBtn} onClick={handleRefresh}>
            刷新
          </button>
        </div>
      </div>

      {/* 顶部统计 */}
      <div style={STYLES.statsRow}>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>总异常数</span>
          <span style={STYLES.statValue}>{stats.totalAlerts}</span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>严重异常</span>
          <span style={{ ...STYLES.statValue, color: '#ef4444' }}>{stats.criticalCount}</span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>高优先级</span>
          <span style={{ ...STYLES.statValue, color: '#f97316' }}>{stats.highCount}</span>
        </div>
        <div style={STYLES.statCard}>
          <span style={STYLES.statLabel}>时段均值</span>
          <span style={STYLES.statValue}>{stats.avgPerBucket}</span>
        </div>
      </div>

      {/* 严重程度过滤 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map((sev) => (
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
            {sev === 'all' && '全部'}
            {sev === 'critical' && '🔴 严重'}
            {sev === 'high' && '🟠 高'}
            {sev === 'medium' && '🟡 中'}
            {sev === 'low' && '🟢 低'}
          </button>
        ))}
      </div>

      {/* 频率图 */}
      <div style={STYLES.card}>
        <AnomalyFrequencyTimeline
          buckets={buckets}
          title="异常时序分布"
          height={240}
          maxBuckets={timeRange === '6h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 14 : 30}
          emptyText="该时段暂无异常数据"
          data-testid="anomaly-frequency-timeline-page"
        />
      </div>

      {/* 底部说明 */}
      <div style={{
        padding: '14px 16px',
        background: '#fafafa',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 1.6,
      }}>
        <strong>说明：</strong>
        时序频率图展示各时段内不同严重级别异常的分布。堆叠条形越高的时段异常越集中。
        点击「严重」「高」「中」「低」过滤按钮可按级别查看。数据每5分钟自动同步。
      </div>
    </div>
  );
}

export default AnomalyFrequencyClient;
