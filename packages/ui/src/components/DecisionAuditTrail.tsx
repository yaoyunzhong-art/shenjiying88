'use client';

import React, { useState, useMemo } from 'react';
import { RuleExecutionStatus } from './AIDecisionPanel';
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';

// ==================== 类型定义 ====================

/** 审计条目操作类型 */
export type AuditAction =
  | 'rule_evaluated'
  | 'decision_applied'
  | 'decision_overridden'
  | 'decision_reverted'
  | 'alert_triggered'
  | 'notification_sent'
  | 'manual_review'
  | 'auto_resolved';

/** 审计条目严重程度 */
export type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';

/** 单条审计记录 */
export interface AuditEntry {
  /** 唯一标识 */
  id: string;
  /** 操作类型 */
  action: AuditAction;
  /** 操作描述 */
  message: string;
  /** 关联的规则 ID（可选） */
  ruleId?: string;
  /** 关联的规则名称（可选） */
  ruleName?: string;
  /** 规则执行状态（可选） */
  ruleStatus?: RuleExecutionStatus;
  /** 严重程度 */
  severity: AuditSeverity;
  /** 操作人/系统 */
  actor: string;
  /** 操作时间 */
  timestamp: string;
  /** 变更详情（可选 JSON 字符串或结构化数据） */
  changes?: string;
  /** 是否可回滚 */
  revertible?: boolean;
  /** 关联实体 ID */
  entityId?: string;
  /** 关联实体类型 */
  entityType?: string;
}

/** 审计摘要统计 */
export interface AuditSummary {
  total: number;
  info: number;
  warning: number;
  critical: number;
  success: number;
  /** 最近 24h 新增 */
  last24h: number;
}

/** 审计过滤器 */
export interface AuditFilter {
  action?: AuditAction;
  severity?: AuditSeverity;
  ruleId?: string;
  actor?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DecisionAuditTrailProps {
  /** 审计记录列表 */
  entries: AuditEntry[];
  /** 审计摘要（可选） */
  summary?: AuditSummary;
  /** 当前过滤器 */
  filter?: AuditFilter;
  /** 过滤器变更回调 */
  onFilterChange?: (filter: AuditFilter) => void;
  /** 点击条目回调 */
  onEntryClick?: (entry: AuditEntry) => void;
  /** 回滚操作回调 */
  onRevert?: (entry: AuditEntry) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 空数据文案 */
  emptyText?: string;
}

// ==================== 工具函数 ====================

const ACTION_LABELS: Record<AuditAction, string> = {
  rule_evaluated: '规则评估',
  decision_applied: '决策执行',
  decision_overridden: '决策覆盖',
  decision_reverted: '决策回滚',
  alert_triggered: '告警触发',
  notification_sent: '通知发送',
  manual_review: '人工审核',
  auto_resolved: '自动解决',
};

const ACTION_ICONS: Record<AuditAction, string> = {
  rule_evaluated: '⚙️',
  decision_applied: '✅',
  decision_overridden: '✏️',
  decision_reverted: '↩️',
  alert_triggered: '🚨',
  notification_sent: '📨',
  manual_review: '👤',
  auto_resolved: '🤖',
};

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
  success: '#22c55e',
};

// ==================== 组件 ====================

/**
 * DecisionAuditTrail — AI 决策审计追踪组件。
 *
 * 展示 AI 规则决策的完整审计链路，包含：
 * - 操作时间线视图
 * - 多维度过滤（操作类型、严重程度、规则、操作人、日期）
 * - 分页浏览
 * - 回滚操作入口
 * - 统计摘要
 *
 * @example
 * ```tsx
 * <DecisionAuditTrail
 *   entries={auditLogs}
 *   summary={{ total: 1280, info: 800, warning: 300, critical: 120, success: 60, last24h: 45 }}
 *   filter={currentFilter}
 *   onFilterChange={setFilter}
 *   onRevert={handleRevert}
 *   pageSize={20}
 * />
 * ```
 */
export function DecisionAuditTrail({
  entries,
  summary,
  filter,
  onFilterChange,
  onEntryClick,
  onRevert,
  loading = false,
  pageSize = 20,
  className,
  compact = false,
  emptyText = '暂无审计记录',
}: DecisionAuditTrailProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 应用过滤器
  const filteredEntries = useMemo(() => {
    if (!filter) return entries;
    return entries.filter((e) => {
      if (filter.action && e.action !== filter.action) return false;
      if (filter.severity && e.severity !== filter.severity) return false;
      if (filter.ruleId && e.ruleId !== filter.ruleId) return false;
      if (filter.actor && !e.actor.includes(filter.actor)) return false;
      if (filter.dateFrom && e.timestamp < filter.dateFrom) return false;
      if (filter.dateTo && e.timestamp > filter.dateTo) return false;
      return true;
    });
  }, [entries, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // 过滤器变化时重置页码
  const handleFilterChange = (newFilter: AuditFilter) => {
    setCurrentPage(1);
    onFilterChange?.(newFilter);
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const renderSummaryBar = () => {
    if (!summary) return null;
    const items: { label: string; value: number; color: string }[] = [
      { label: '总计', value: summary.total, color: '#6b7280' },
      { label: '信息', value: summary.info, color: SEVERITY_COLORS.info },
      { label: '警告', value: summary.warning, color: SEVERITY_COLORS.warning },
      { label: '严重', value: summary.critical, color: SEVERITY_COLORS.critical },
      { label: '成功', value: summary.success, color: SEVERITY_COLORS.success },
    ];
    return (
      <div
        style={{
          display: 'flex',
          gap: compact ? 8 : 16,
          padding: compact ? '8px 12px' : '12px 16px',
          background: '#f8fafc',
          borderRadius: 8,
          marginBottom: compact ? 8 : 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: compact ? 12 : 13,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: item.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: '#6b7280' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.value}</span>
          </div>
        ))}
        {summary.last24h > 0 && (
          <div
            style={{
              marginLeft: 'auto',
              color: '#6b7280',
              fontSize: compact ? 11 : 12,
            }}
          >
            近24h: +{summary.last24h}
          </div>
        )}
      </div>
    );
  };

  const renderFilterBar = () => {
    if (!onFilterChange) return null;
    const currentFilter = filter ?? {};

    return (
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: compact ? '4px 0' : '8px 0',
          marginBottom: compact ? 8 : 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* 操作类型过滤 */}
        <select
          value={currentFilter.action ?? ''}
          onChange={(e) =>
            handleFilterChange({
              ...currentFilter,
              action: (e.target.value || undefined) as AuditAction | undefined,
            })
          }
          style={{
            padding: '4px 8px',
            fontSize: compact ? 11 : 12,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
          }}
          aria-label="按操作类型过滤"
        >
          <option value="">全部操作</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        {/* 严重程度过滤 */}
        <select
          value={currentFilter.severity ?? ''}
          onChange={(e) =>
            handleFilterChange({
              ...currentFilter,
              severity: (e.target.value || undefined) as AuditSeverity | undefined,
            })
          }
          style={{
            padding: '4px 8px',
            fontSize: compact ? 11 : 12,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
          }}
          aria-label="按严重程度过滤"
        >
          <option value="">全部级别</option>
          <option value="info">信息</option>
          <option value="warning">警告</option>
          <option value="critical">严重</option>
          <option value="success">成功</option>
        </select>

        {filteredEntries.length > 0 && (
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
            {filteredEntries.length} 条记录
          </span>
        )}
      </div>
    );
  };

  // 骨架/加载状态
  if (loading) {
    return (
      <div className={className} style={{ padding: 16 }}>
        {renderSummaryBar()}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: compact ? 40 : 52,
              background: '#f3f4f6',
              borderRadius: 6,
              marginBottom: 6,
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* 摘要栏 */}
      {renderSummaryBar()}

      {/* 过滤栏 */}
      {renderFilterBar()}

      {/* 审计列表 */}
      {filteredEntries.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: compact ? 24 : 40,
            color: '#9ca3af',
            fontSize: compact ? 13 : 14,
          }}
        >
          {emptyText}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: compact ? 2 : 4,
            }}
            role="list"
            aria-label="审计记录列表"
          >
            {paginatedEntries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const severityColor = SEVERITY_COLORS[entry.severity];

              return (
                <div
                  key={entry.id}
                  role="listitem"
                  style={{
                    border: `1px solid ${isExpanded ? severityColor : '#e5e7eb'}`,
                    borderRadius: 8,
                    background: isExpanded ? '#f9fafb' : '#fff',
                    transition: 'all 0.15s ease',
                    cursor: onEntryClick ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    onEntryClick?.(entry);
                    setExpandedId(isExpanded ? null : entry.id);
                  }}
                >
                  {/* 主行 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: compact ? 6 : 10,
                      padding: compact ? '8px 12px' : '10px 16px',
                    }}
                  >
                    {/* 严重程度指示条 */}
                    <div
                      style={{
                        width: 3,
                        height: compact ? 20 : 28,
                        borderRadius: 2,
                        backgroundColor: severityColor,
                        flexShrink: 0,
                      }}
                    />

                    {/* 操作图标 */}
                    <span style={{ fontSize: compact ? 14 : 16, flexShrink: 0 }}>
                      {ACTION_ICONS[entry.action] ?? '📋'}
                    </span>

                    {/* 操作类型标签 */}
                    <StatusBadge
                      variant={entry.severity === 'critical' ? 'error' : entry.severity === 'warning' ? 'warning' : entry.severity === 'success' ? 'success' : 'default'}
                      label={ACTION_LABELS[entry.action] ?? entry.action}
                      size="sm"
                    />

                    {/* 描述 */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: compact ? 12 : 13,
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.message}
                    </span>

                    {/* 关联规则名 */}
                    {entry.ruleName && (
                      <span
                        style={{
                          fontSize: compact ? 10 : 11,
                          color: '#6b7280',
                          background: '#f3f4f6',
                          padding: '1px 6px',
                          borderRadius: 4,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flexShrink: 1,
                        }}
                        title={entry.ruleName}
                      >
                        {entry.ruleName}
                      </span>
                    )}

                    {/* 操作人 */}
                    <span
                      style={{
                        fontSize: compact ? 11 : 12,
                        color: '#6b7280',
                        minWidth: compact ? 50 : 60,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {entry.actor}
                    </span>

                    {/* 时间 */}
                    <span
                      style={{
                        fontSize: compact ? 10 : 11,
                        color: '#9ca3af',
                        minWidth: compact ? 100 : 120,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(entry.timestamp)}
                    </span>

                    {/* 展开指示 */}
                    {(entry.changes || entry.revertible || entry.entityId) && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#9ca3af',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        ▶
                      </span>
                    )}
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: compact ? '4px 12px 10px' : '6px 16px 12px',
                        borderTop: '1px solid #e5e7eb',
                        fontSize: compact ? 11 : 12,
                        color: '#6b7280',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {/* 变更详情 */}
                      {entry.changes && (
                        <div>
                          <span style={{ fontWeight: 500, marginRight: 4 }}>变更详情:</span>
                          <code
                            style={{
                              background: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: compact ? 10 : 11,
                              wordBreak: 'break-all',
                            }}
                          >
                            {entry.changes}
                          </code>
                        </div>
                      )}

                      {/* 关联实体 */}
                      {entry.entityType && entry.entityId && (
                        <div>
                          <span style={{ fontWeight: 500, marginRight: 4 }}>关联实体:</span>
                          <span>
                            {entry.entityType} / {entry.entityId}
                          </span>
                        </div>
                      )}

                      {/* 回滚按钮 */}
                      {entry.revertible && onRevert && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRevert(entry);
                          }}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '3px 10px',
                            fontSize: compact ? 10 : 11,
                            borderRadius: 4,
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          回滚此操作
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {filteredEntries.length > pageSize && (
            <div style={{ marginTop: compact ? 8 : 12 }}>
              <Pagination
                page={currentPage}
                total={filteredEntries.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DecisionAuditTrail;
