/**
 * AnomalyFrequencyPage — 门店异常时序频率监控页面 (storefront-web)
 *
 * 功能:
 * - 使用 AnomalyFrequencyTimeline 组件展示门店异常的时间分布
 * - 提供筛选维度（严重程度/时间范围）
 * - 门店角色相关统计数据
 * - 异常详情面板、异常类型分布、操作记录
 *
 * 使用场景:
 * - 店长/前台查看各时段门店异常趋势
 * - 导购员查看最近异常告警频率
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AnomalyFrequencyTimeline, StatusBadge, PageShell, Modal } from '@m5/ui';
import type { AnomalyTimeBucket } from '@m5/ui';

// ==================== 类型 ====================

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TimeRange = '6h' | '24h' | '7d' | '30d';

interface AnomalyIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  time: string;
  description: string;
  handled: boolean;
  handler?: string;
  handledAt?: string;
  duration: string;
}

interface AnomalyDistribution {
  type: string;
  count: number;
  color: string;
}

interface OperationRecord {
  id: string;
  action: string;
  operator: string;
  time: string;
  detail: string;
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

// ==================== 异常事件详情 ====================

const MOCK_INCIDENTS: AnomalyIncident[] = [
  { id: 'AI-001', title: '收银台 POS-01 网络闪断', severity: 'high', source: '网络设备', time: '10:23', description: 'POS-01 收银台网络连接中断 3 秒后自动恢复，可能存在网线接触不良。', handled: true, handler: '张工', handledAt: '10:28', duration: '3s' },
  { id: 'AI-002', title: '厨房打印机打印头温度异常', severity: 'medium', source: '设备', time: '09:45', description: '厨房打印机打印头温度达 68°C，超出安全范围。需清洁散热片。', handled: true, handler: '李技', handledAt: '09:55', duration: '10min' },
  { id: 'AI-003', title: '冷库湿度超标', severity: 'high', source: '传感器', time: '08:30', description: '冷库湿度监测值为 88%，超过 85% 阈值。开门次频繁导致湿气进入。', handled: false, duration: '持续中' },
  { id: 'AI-004', title: '收银台通讯超时', severity: 'critical', source: '网络', time: '07:15', description: '收银台区域 3 台 POS 机同时出现通讯超时，持续 30 秒后恢复。疑似核心交换机重启。', handled: true, handler: '王工', handledAt: '07:20', duration: '30s' },
  { id: 'AI-005', title: '广告显示屏断连', severity: 'low', source: '设备', time: '06:00', description: '入口广告显示屏离线，最后一次心跳 06:00。可能为电源问题。', handled: false, duration: '持续中' },
  { id: 'AI-006', title: '烟雾探测器误报', severity: 'low', source: '传感器', time: '05:20', description: '大厅烟雾探测器触发告警，现场确认无火情，为装修灰尘导致。', handled: true, handler: '赵工', handledAt: '05:35', duration: '15min' },
  { id: 'AI-007', title: 'UPS 电池电压偏低', severity: 'high', source: '电力', time: '03:00', description: '机房 UPS 电池组电压降至 22.8V，低于 24V 安全阈值。建议尽快更换。', handled: false, duration: '持续中' },
  { id: 'AI-008', title: '监控摄像头画面丢失', severity: 'medium', source: '摄像头', time: '02:10', description: '后门监控摄像头画面无信号输出，检查线路连接。', handled: true, handler: '张工', handledAt: '03:30', duration: '1h20min' },
];

// ==================== 异常分布数据 ====================

const ANOMALY_DISTRIBUTION: AnomalyDistribution[] = [
  { type: '网络异常', count: 3, color: '#ef4444' },
  { type: '设备故障', count: 2, color: '#f97316' },
  { type: '传感器告警', count: 2, color: '#f59e0b' },
  { type: '电力问题', count: 1, color: '#eab308' },
  { type: '摄像头故障', count: 1, color: '#84cc16' },
  { type: '其他', count: 1, color: '#22d3ee' },
];

// ==================== 操作记录 ====================

const OPERATION_RECORDS: OperationRecord[] = [
  { id: 'OP-001', action: '重启打印服务', operator: '李技', time: '09:55', detail: '厨房打印机软件服务重启后温度恢复正常' },
  { id: 'OP-002', action: '检查网络线路', operator: '张工', time: '10:28', detail: 'POS-01 网线重新插拔后确认连通' },
  { id: 'OP-003', action: '排除误报', operator: '赵工', time: '05:35', detail: '现场确认无火情，重置烟雾探测器' },
  { id: 'OP-004', action: '摄像头线路检修', operator: '张工', time: '03:30', detail: '后门摄像头信号线松动，重新固定' },
  { id: 'OP-005', action: '核心交换机重启', operator: '王工', time: '07:20', detail: '核心交换机重启后 POS 通讯恢复正常' },
];

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

// ==================== 子组件: 严重程度标签 ====================

function SeverityBadge({ severity }: { severity: AnomalyIncident['severity'] }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: '严重', color: '#991b1b', bg: '#fef2f2' },
    high: { label: '高', color: '#9a3412', bg: '#fff7ed' },
    medium: { label: '中', color: '#854d0e', bg: '#fefce8' },
    low: { label: '低', color: '#166534', bg: '#f0fdf4' },
  };
  const c = config[severity] ?? { label: '未知', color: '#475569', bg: '#f8fafc' };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 6,
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

// ==================== 子组件: 异常详情表格 ====================

function IncidentTable({ incidents }: { incidents: AnomalyIncident[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={STYLES.card}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>
        🚨 异常事件详情
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={thStyle}>事件</th>
            <th style={thStyle}>级别</th>
            <th style={thStyle}>来源</th>
            <th style={thStyle}>时间</th>
            <th style={thStyle}>持续</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <React.Fragment key={inc.id}>
              <tr
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: expandedId === inc.id ? '#f8fafc' : 'transparent',
                }}
                onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
              >
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>
                      {expandedId === inc.id ? '▼' : '▶'}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{inc.title}</span>
                  </div>
                </td>
                <td style={tdStyle}><SeverityBadge severity={inc.severity} /></td>
                <td style={{ ...tdStyle, color: '#475569' }}>{inc.source}</td>
                <td style={{ ...tdStyle, color: '#64748b', fontFamily: 'monospace' }}>{inc.time}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{inc.duration}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {inc.handled ? (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#f0fdf4',
                      color: '#166534',
                    }}>
                      已处理
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#fef2f2',
                      color: '#991b1b',
                    }}>
                      待处理
                    </span>
                  )}
                </td>
              </tr>
              {expandedId === inc.id && (
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={6} style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>
                      {inc.description}
                    </div>
                    {inc.handler && (
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#94a3b8' }}>
                        <span>处理人: <strong style={{ color: '#0f172a' }}>{inc.handler}</strong></span>
                        <span>处理时间: <strong style={{ color: '#0f172a' }}>{inc.handledAt ?? '—'}</strong></span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};

// ==================== 子组件: 异常分布面板 ====================

function AnomalyDistributionPanel({ distribution }: { distribution: AnomalyDistribution[] }) {
  const total = distribution.reduce((s, d) => s + d.count, 0);
  return (
    <div style={STYLES.card}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>
        📊 异常类型分布
      </h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {distribution.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#475569' }}>{d.type}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.count} ({pct}%)</span>
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#f1f5f9',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 4,
                  background: d.color,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 子组件: 操作记录面板 ====================

function OperationLogPanel({ records }: { records: OperationRecord[] }) {
  return (
    <div style={STYLES.card}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>
        📝 处理操作记录
      </h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {records.map((op) => (
          <div key={op.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#fafafa',
            border: '1px solid #f1f5f9',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#0284c7',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {op.operator[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{op.action}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{op.time}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {op.operator} · {op.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 子组件: 导出按钮栏 ====================

function ActionBar({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      marginBottom: 16,
    }}>
      <button style={{
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#fff',
        color: '#475569',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        📥 导出报告
      </button>
      <button style={{
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#fff',
        color: '#475569',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        🔔 设置告警
      </button>
      <button
        onClick={onRefresh}
        style={{
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 500,
          border: '1px solid #6366f1',
          borderRadius: 8,
          background: '#eef2ff',
          color: '#6366f1',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        🔄 刷新数据
      </button>
    </div>
  );
}

// ==================== 组件 ====================

export default function AnomalyFrequencyPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAllIncidents, setShowAllIncidents] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const buckets = useMemo(
    () => generateMockBuckets(timeRange, severityFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeRange, severityFilter, refreshKey],
  );

  const stats = useMemo(() => {
    const totalAlerts = buckets.reduce((s, b) => s + b.total, 0);
    const criticalCount = buckets.reduce((s, b) => s + b.bySeverity.critical, 0);
    const highCount = buckets.reduce((s, b) => s + b.bySeverity.high, 0);
    const mediumCount = buckets.reduce((s, b) => s + b.bySeverity.medium, 0);
    const avgPerBucket = buckets.length > 0 ? Math.round(totalAlerts / buckets.length) : 0;
    return { totalAlerts, criticalCount, highCount, mediumCount, avgPerBucket };
  }, [buckets]);

  const displayedIncidents = showAllIncidents ? MOCK_INCIDENTS : MOCK_INCIDENTS.slice(0, 4);

  return (
    <div style={STYLES.container}>
      {/* 头部 */}
      <div style={STYLES.header}>
        <div>
          <h1 style={STYLES.title}>门店异常时序频率</h1>
          <p style={STYLES.subtitle}>
            监控各时段门店异常分布趋势，及时发现高频异常时段
          </p>
        </div>
        <div style={STYLES.controls}>
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

      {/* 操作栏 */}
      <ActionBar onRefresh={handleRefresh} />

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

      {/* 异常分布 + 操作记录（并排） */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <AnomalyDistributionPanel distribution={ANOMALY_DISTRIBUTION} />
        <OperationLogPanel records={OPERATION_RECORDS} />
      </div>

      {/* 异常事件详情 */}
      <IncidentTable incidents={displayedIncidents} />

      {/* 展开更多按钮 */}
      {MOCK_INCIDENTS.length > 4 && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={() => setShowAllIncidents(!showAllIncidents)}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            {showAllIncidents ? '收起' : `查看全部 ${MOCK_INCIDENTS.length} 条事件`}
          </button>
        </div>
      )}

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
        异常事件详情支持展开查看处理记录和操作人信息。
      </div>
    </div>
  );
}
