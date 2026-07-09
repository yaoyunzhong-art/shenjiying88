'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 告警严重级别 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/** 告警来源类型 */
export type AlertSource = 'device' | 'member' | 'transaction' | 'system' | 'network';

/** AI 分析置信度 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** 单条告警 */
export interface CorrelatedAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: AlertSource;
  timestamp: string;
  description: string;
  acknowledged: boolean;
}

/** AI 关联分析结果 */
export interface AlertCorrelationGroup {
  /** 关联组 ID */
  groupId: string;
  /** 关联根因分析 */
  rootCause: string;
  /** AI 置信度 */
  confidence: ConfidenceLevel;
  /** 关联告警 ID 列表 */
  alertIds: string[];
  /** 受影响范围描述 */
  impact: string;
  /** AI 推荐操作 */
  recommendedAction: string;
  /** 预估恢复时间(分钟) */
  estimatedResolutionMin: number;
}

/** AI 告警关联仪表板 Props */
export interface AlertCorrelationDashboardProps {
  /** 原始告警列表 */
  alerts: CorrelatedAlert[];
  /** AI 关联分组 */
  correlationGroups: AlertCorrelationGroup[];
  /** 仪表板标题 */
  title?: string;
  /** 确认单条告警 */
  onAcknowledgeAlert?: (alertId: string) => void;
  /** 确认整个关联组 */
  onAcknowledgeGroup?: (groupId: string) => void;
  /** 执行推荐操作 */
  onExecuteAction?: (groupId: string) => void;
  /** 查看详情 */
  onViewDetail?: (groupId: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ==================== 常量 ====================

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; dot: string; bg: string }> = {
  critical: { label: '严重', dot: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  high: { label: '高', dot: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  medium: { label: '中', dot: '#eab308', bg: 'rgba(234,179,8,0.10)' },
  low: { label: '低', dot: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string }> = {
  high: { label: '高置信度', color: '#16a34a' },
  medium: { label: '中置信度', color: '#ca8a04' },
  low: { label: '低置信度', color: '#dc2626' },
};

const SOURCE_LABELS: Record<AlertSource, string> = {
  device: '设备',
  member: '会员',
  transaction: '交易',
  system: '系统',
  network: '网络',
};

// ==================== 子组件 ====================

/** 置信度徽章 */
function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const cfg = CONFIDENCE_CONFIG[level];
  return (
    <span
      data-testid={`confidence-badge-${level}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

/** 严重性圆点 */
function SeverityDot({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      data-testid={`severity-dot-${severity}`}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: SEVERITY_CONFIG[severity].dot,
        marginRight: 4,
      }}
    />
  );
}

/** 严重性标签 */
function SeverityLabel({ severity }: { severity: AlertSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      data-testid={`severity-label-${severity}`}
      style={{
        fontSize: 12,
        color: cfg.dot,
        fontWeight: 500,
      }}
    >
      {cfg.label}
    </span>
  );
}

/** 格式化时间 */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

// ==================== 关联组卡片 ====================

function CorrelationGroupCard({
  group,
  alerts,
  onAcknowledgeGroup,
  onExecuteAction,
  onViewDetail,
}: {
  group: AlertCorrelationGroup;
  alerts: CorrelatedAlert[];
  onAcknowledgeGroup?: (groupId: string) => void;
  onExecuteAction?: (groupId: string) => void;
  onViewDetail?: (groupId: string) => void;
}) {
  const groupAlerts = useMemo(
    () => alerts.filter((a) => group.alertIds.includes(a.id)),
    [alerts, group.alertIds],
  );

  const maxSeverity = useMemo((): AlertSeverity => {
    const order: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
    for (const s of order) {
      if (groupAlerts.some((a) => a.severity === s)) return s;
    }
    return 'low';
  }, [groupAlerts]);

  const allAcknowledged = groupAlerts.every((a) => a.acknowledged);

  return (
    <div
      data-testid={`correlation-group-${group.groupId}`}
      style={{
        border: `1px solid ${allAcknowledged ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        backgroundColor: SEVERITY_CONFIG[maxSeverity].bg,
      }}
    >
      {/* 顶部：根因 + 置信度 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <SeverityDot severity={maxSeverity} />
          <span style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4, flex: 1 }}>
            {group.rootCause}
          </span>
        </div>
        <ConfidenceBadge level={group.confidence} />
      </div>

      {/* 影响范围 + 推荐恢复时间 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: '#666' }}>
        <span data-testid={`impact-${group.groupId}`}>📊 影响: {group.impact}</span>
        <span data-testid={`eta-${group.groupId}`}>⏱ 预估恢复: {group.estimatedResolutionMin}min</span>
      </div>

      {/* AI 推荐操作 */}
      <div
        data-testid={`recommendation-${group.groupId}`}
        style={{
          padding: '6px 10px',
          backgroundColor: 'rgba(22,119,255,0.08)',
          borderRadius: 4,
          fontSize: 12,
          color: '#1677ff',
          marginBottom: 8,
        }}
      >
        🤖 AI推荐: {group.recommendedAction}
      </div>

      {/* 关联告警列表 */}
      <div style={{ marginBottom: 8 }}>
        {groupAlerts.map((alert) => (
          <div
            key={alert.id}
            data-testid={`group-alert-${alert.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              fontSize: 12,
              color: alert.acknowledged ? '#999' : '#333',
              textDecoration: alert.acknowledged ? 'line-through' : 'none',
            }}
          >
            <SeverityDot severity={alert.severity} />
            <SeverityLabel severity={alert.severity} />
            <span style={{ minWidth: 60, color: SEVERITY_CONFIG[alert.severity].dot }}>
              [{SOURCE_LABELS[alert.source]}]
            </span>
            <span style={{ flex: 1 }}>{alert.title}</span>
            <span style={{ color: '#999' }}>{formatTime(alert.timestamp)}</span>
            {alert.acknowledged && <span style={{ color: '#22c55e' }}>✓</span>}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {!allAcknowledged && onAcknowledgeGroup && (
          <button
            data-testid={`ack-group-${group.groupId}`}
            onClick={() => onAcknowledgeGroup(group.groupId)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid #22c55e',
              backgroundColor: 'transparent',
              color: '#22c55e',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            确认关联组
          </button>
        )}
        {onExecuteAction && (
          <button
            data-testid={`execute-${group.groupId}`}
            onClick={() => onExecuteAction(group.groupId)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#1677ff',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            执行推荐
          </button>
        )}
        {onViewDetail && (
          <button
            data-testid={`detail-${group.groupId}`}
            onClick={() => onViewDetail(group.groupId)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              color: '#333',
            }}
          >
            查看详情
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function AlertCorrelationDashboard({
  alerts,
  correlationGroups,
  title = 'AI 告警关联分析',
  onAcknowledgeAlert,
  onAcknowledgeGroup,
  onExecuteAction,
  onViewDetail,
  className,
}: AlertCorrelationDashboardProps) {
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterAcknowledged, setFilterAcknowledged] = useState<boolean | null>(null);

  const unacknowledgedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  );

  const severityCounts = useMemo(() => {
    const counts: Record<AlertSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach((a) => { counts[a.severity]++; });
    return counts;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
      if (filterAcknowledged === true && !a.acknowledged) return false;
      if (filterAcknowledged === false && a.acknowledged) return false;
      return true;
    });
  }, [alerts, filterSeverity, filterAcknowledged]);

  const filteredGroups = useMemo(() => {
    return correlationGroups.filter((g) => {
      const groupAlertIds = new Set(g.alertIds);
      return filteredAlerts.some((a) => groupAlertIds.has(a.id));
    });
  }, [correlationGroups, filteredAlerts]);

  const severityOrder: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

  return (
    <div
      data-testid="alert-correlation-dashboard"
      className={className}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* 标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {title}
        </h2>
        <span data-testid="unacknowledged-count" style={{ fontSize: 13, color: unacknowledgedCount > 0 ? '#ef4444' : '#22c55e' }}>
          {unacknowledgedCount > 0 ? `⚠ ${unacknowledgedCount} 条未确认` : '✅ 全部已确认'}
        </span>
      </div>

      {/* 严重性统计 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {severityOrder.map((s) => (
          <span
            key={s}
            data-testid={`severity-stat-${s}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: SEVERITY_CONFIG[s].bg,
              color: SEVERITY_CONFIG[s].dot,
              cursor: 'pointer',
              border: filterSeverity === s ? `1px solid ${SEVERITY_CONFIG[s].dot}` : '1px solid transparent',
            }}
            onClick={() => setFilterSeverity(filterSeverity === s ? 'all' : s)}
          >
            <SeverityDot severity={s} /> {SEVERITY_CONFIG[s].label}: {severityCounts[s]}
          </span>
        ))}
        {filterSeverity !== 'all' && (
          <button
            data-testid="clear-severity-filter"
            onClick={() => setFilterSeverity('all')}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: 11,
              color: '#999',
            }}
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 关联组列表 */}
      <div data-testid="correlation-groups-list">
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>
            暂无关联告警分组
          </div>
        ) : (
          filteredGroups.map((group) => (
            <CorrelationGroupCard
              key={group.groupId}
              group={group}
              alerts={alerts}
              onAcknowledgeGroup={onAcknowledgeGroup}
              onExecuteAction={onExecuteAction}
              onViewDetail={onViewDetail}
            />
          ))
        )}
      </div>
    </div>
  );
}
