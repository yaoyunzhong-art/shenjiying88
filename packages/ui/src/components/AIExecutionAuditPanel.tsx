'use client';

import React, { useMemo, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type ExecutionStatus = 'success' | 'failure' | 'partial' | 'skipped';

export interface AIExecutionRecord {
  /** 执行记录 ID */
  id: string;
  /** 规则/策略名称 */
  ruleName: string;
  /** 执行状态 */
  status: ExecutionStatus;
  /** 触发来源 (手动/自动/定时) */
  triggerSource: 'manual' | 'auto' | 'scheduled';
  /** 执行耗时 (ms) */
  durationMs: number;
  /** 受影响记录数 */
  affectedCount: number;
  /** 成功条数 */
  successCount: number;
  /** 失败条数 */
  failureCount: number;
  /** 执行时间 */
  executedAt: string;
  /** 执行人 (手动时) */
  operator?: string;
  /** 备注/错误信息 */
  message?: string;
  /** 详情链接 */
  detailUrl?: string;
}

export interface AIExecutionAuditPanelProps {
  /** 执行记录列表 */
  records: AIExecutionRecord[];
  /** 标题 */
  title?: string;
  /** 是否显示行详情展开 */
  expandable?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 最多显示条数 */
  maxItems?: number;
  /** 查看详情回调 */
  onViewDetail?: (record: AIExecutionRecord) => void;
  /** 重新执行回调 */
  onRetry?: (record: AIExecutionRecord) => void;
  className?: string;
  style?: React.CSSProperties;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  success:  { label: '成功', color: '#166534', bg: '#dcfce7' },
  failure:  { label: '失败', color: '#991b1b', bg: '#fee2e2' },
  partial:  { label: '部分成功', color: '#92400e', bg: '#fef3c7' },
  skipped:  { label: '已跳过', color: '#6b7280', bg: '#f3f4f6' },
};

const TRIGGER_LABEL: Record<string, string> = {
  manual: '手动',
  auto: '自动',
  scheduled: '定时',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        color: s.color,
        backgroundColor: s.bg,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        backgroundColor: s.color,
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
}

function TriggerBadge({ source }: { source: AIExecutionRecord['triggerSource'] }) {
  const colors: Record<string, string> = {
    manual: '#2563eb',
    auto: '#7c3aed',
    scheduled: '#0891b2',
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 6px',
        borderRadius: 3,
        fontSize: 11,
        fontWeight: 500,
        color: '#fff',
        backgroundColor: colors[source],
      }}
    >
      {TRIGGER_LABEL[source]}
    </span>
  );
}

// ── Summary Row ─────────────────────────────────────────────────────────────

function SummaryBar({ records }: { records: AIExecutionRecord[] }) {
  const stats = useMemo(() => {
    const total = records.length;
    const success = records.filter(r => r.status === 'success').length;
    const failure = records.filter(r => r.status === 'failure').length;
    const partial = records.filter(r => r.status === 'partial').length;
    const skipped = records.filter(r => r.status === 'skipped').length;
    const avgDuration = total > 0
      ? Math.round(records.reduce((s, r) => s + r.durationMs, 0) / total)
      : 0;
    const totalAffected = records.reduce((s, r) => s + r.affectedCount, 0);
    return { total, success, failure, partial, skipped, avgDuration, totalAffected };
  }, [records]);

  if (records.length === 0) return null;

  const segments = [
    { label: '成功', count: stats.success, color: '#22c55e' },
    { label: '部分', count: stats.partial, color: '#f59e0b' },
    { label: '失败', count: stats.failure, color: '#ef4444' },
    { label: '跳过', count: stats.skipped, color: '#9ca3af' },
  ].filter(s => s.count > 0);

  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '10px 14px',
      backgroundColor: '#f9fafb',
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 13,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
        共 {stats.total} 条执行记录
      </span>

      {/* Segmented bar */}
      <div style={{
        flex: 1,
        minWidth: 120,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: '#e5e7eb',
      }}>
        {segments.map(seg => (
          <div
            key={seg.label}
            style={{
              width: `${(seg.count / total) * 100}%`,
              minWidth: 4,
              backgroundColor: seg.color,
            }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
        <span>⏱ 平均 {formatDuration(stats.avgDuration)}</span>
        <span>📊 影响 {stats.totalAffected} 条</span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function AIExecutionAuditPanel({
  records,
  title = 'AI 决策执行审计',
  expandable = true,
  emptyText = '暂无执行记录',
  maxItems = 50,
  onViewDetail,
  onRetry,
  className,
  style,
}: AIExecutionAuditPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ExecutionStatus | 'all'>('all');

  const displayed = useMemo(() => {
    let list = filter === 'all'
      ? records
      : records.filter(r => r.status === filter);
    return list.slice(0, maxItems);
  }, [records, filter, maxItems]);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterOptions: { key: ExecutionStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'success', label: '成功' },
    { key: 'failure', label: '失败' },
    { key: 'partial', label: '部分' },
    { key: 'skipped', label: '跳过' },
  ];

  return (
    <div
      className={className}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        backgroundColor: '#fff',
        padding: 16,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
          {title}
        </h3>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: filter === opt.key ? '#6366f1' : '#d1d5db',
              backgroundColor: filter === opt.key ? '#eef2ff' : '#fff',
              color: filter === opt.key ? '#4338ca' : '#6b7280',
              fontSize: 12,
              fontWeight: filter === opt.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <SummaryBar records={records} />

      {/* Empty state */}
      {displayed.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '32px 16px',
          color: '#9ca3af',
          fontSize: 14,
        }}>
          {emptyText}
        </div>
      )}

      {/* Record list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayed.map(record => {
          const expanded = expandedIds.has(record.id);
          return (
            <div
              key={record.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Main row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  backgroundColor: '#fafafa',
                  cursor: expandable ? 'pointer' : 'default',
                  flexWrap: 'wrap',
                }}
                onClick={() => expandable && toggleExpanded(record.id)}
              >
                <StatusBadge status={record.status} />
                <span style={{ fontWeight: 500, color: '#1f2937', fontSize: 13, minWidth: 100 }}>
                  {record.ruleName}
                </span>
                <TriggerBadge source={record.triggerSource} />
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {formatDuration(record.durationMs)}
                </span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {record.successCount}/{record.affectedCount}
                </span>
                <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 'auto' }}>
                  {formatTime(record.executedAt)}
                </span>
                {expandable && (
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>
                    {expanded ? '▲' : '▼'}
                  </span>
                )}
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div style={{
                  padding: '10px 12px',
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  fontSize: 13,
                  color: '#374151',
                }}>
                  {record.message && (
                    <p style={{ margin: '0 0 6px' }}>📝 {record.message}</p>
                  )}
                  {record.operator && (
                    <p style={{ margin: '0 0 6px' }}>👤 操作人: {record.operator}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {onViewDetail && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDetail(record); }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid #6366f1',
                          backgroundColor: '#eef2ff',
                          color: '#4338ca',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        查看详情
                      </button>
                    )}
                    {onRetry && record.status === 'failure' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRetry(record); }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid #ef4444',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        重新执行
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overflow hint */}
      {records.length > maxItems && (
        <div style={{
          textAlign: 'center',
          padding: '8px 0',
          color: '#9ca3af',
          fontSize: 12,
        }}>
          仅显示最近 {maxItems} 条记录，共 {records.length} 条
        </div>
      )}
    </div>
  );
}
