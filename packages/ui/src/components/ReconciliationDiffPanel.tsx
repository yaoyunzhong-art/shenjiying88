'use client';

import React, { useState, useMemo, useCallback } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type DiffSeverity = 'critical' | 'major' | 'minor' | 'info';

export interface ReconciliationDiff {
  id: string;
  /** 业务主体，如订单号、流水号 */
  refId: string;
  /** 来源系统 */
  sourceSystem: string;
  /** 目标系统 */
  targetSystem: string;
  /** 源系统值 */
  sourceValue: string | number;
  /** 目标系统值 */
  targetValue: string | number;
  /** 差异绝对值 */
  diffAmount: number;
  /** 差异字段名 */
  field: string;
  /** 严重级别 */
  severity: DiffSeverity;
  /** 差异说明 */
  description?: string;
  /** 发生时间 */
  occurredAt: string;
  /** 是否已处理 */
  resolved: boolean;
}

export interface ReconciliationDiffPanelProps {
  /** 差异数据列表 */
  diffs: ReconciliationDiff[];
  /** 标题 */
  title?: string;
  /** 开启自动刷新指示 */
  loading?: boolean;
  /** 单条标记已处理的回调 */
  onResolve?: (id: string) => void;
  /** 查看差异详情回调 */
  onViewDetail?: (diff: ReconciliationDiff) => void;
  /** 导出回调 */
  onExport?: () => void;
}

// ── severity 颜色映射 ───────────────────────────────────────────────────────

const severityColors: Record<DiffSeverity, { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: '严重' },
  major: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: '主要' },
  minor: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', label: '轻微' },
  info: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '信息' },
};

// ── 过滤器 ───────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'unresolved' | DiffSeverity;

// ── 格式化数值（带千分位） ──────────────────────────────────────────────────

function fmtNum(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── 格式化时间（相对时间） ──────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

// ── 组件 ─────────────────────────────────────────────────────────────────────

export function ReconciliationDiffPanel({
  diffs,
  title = '对账差异',
  loading = false,
  onResolve,
  onViewDetail,
  onExport,
}: ReconciliationDiffPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ── 过滤逻辑 ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return diffs;
    if (activeFilter === 'unresolved') return diffs.filter((d) => !d.resolved);
    return diffs.filter((d) => d.severity === activeFilter);
  }, [diffs, activeFilter]);

  // ── 统计数据 ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = diffs.length;
    const unresolved = diffs.filter((d) => !d.resolved).length;
    const totalDiff = diffs.reduce((s, d) => s + d.diffAmount, 0);
    const criticalCount = diffs.filter((d) => d.severity === 'critical' && !d.resolved).length;
    return { total, unresolved, totalDiff, criticalCount };
  }, [diffs]);

  // ── 过滤按钮 ─────────────────────────────────────────────────────────

  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'unresolved', label: '未处理', count: stats.unresolved },
    { key: 'critical', label: '严重', count: stats.criticalCount },
    { key: 'major', label: '主要' },
    { key: 'minor', label: '轻微' },
  ];

  // ── 渲染 ───────────────────────────────────────────────────────────

  return (
    <div
      data-testid="reconciliation-diff-panel"
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── 头部 ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
          {loading && <span style={{ fontSize: 12, color: '#3b82f6' }}>⟳ 刷新中</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            差异总额: <span style={{ color: '#f59e0b', fontWeight: 600 }}>¥{fmtNum(stats.totalDiff)}</span>
          </span>
          {onExport && (
            <button
              data-testid="export-btn"
              onClick={onExport}
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                color: '#60a5fa',
                fontSize: 11,
                padding: '3px 10px',
                cursor: 'pointer',
              }}
            >
              导出
            </button>
          )}
        </div>
      </div>

      {/* ── 过滤器 ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.08)',
          flexWrap: 'wrap',
        }}
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              data-testid={`filter-${f.key}`}
              onClick={() => setActiveFilter(f.key)}
              style={{
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.15)'}`,
                borderRadius: 6,
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontSize: 12,
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
              {f.count !== undefined && (
                <span style={{ marginLeft: 4, fontWeight: 600 }}>{f.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 差异列表 ────────────────────────────────────────────────── */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
            }}
          >
            ✅ 暂无差异数据
          </div>
        ) : (
          filtered.map((diff) => {
            const sev = severityColors[diff.severity];
            const isExpanded = expandedId === diff.id;
            return (
              <div
                key={diff.id}
                data-testid={`diff-row-${diff.id}`}
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(148,163,184,0.06)',
                  background: isExpanded ? 'rgba(59,130,246,0.04)' : undefined,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => toggleExpanded(diff.id)}
              >
                {/* ── 主行 ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* 严重标记 */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sev.text,
                      flexShrink: 0,
                    }}
                  />
                  {/* 单号 */}
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, minWidth: 120 }}>
                    {diff.refId}
                  </span>
                  {/* 字段 */}
                  <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 70 }}>{diff.field}</span>
                  {/* 源值 */}
                  <span style={{ fontSize: 12, color: '#f8fafc', minWidth: 70, textAlign: 'right' }}>
                    {diff.sourceValue}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>→</span>
                  {/* 目标值 */}
                  <span style={{ fontSize: 12, color: '#f8fafc', minWidth: 70, textAlign: 'right' }}>
                    {diff.targetValue}
                  </span>
                  {/* 差异金额 */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: diff.diffAmount > 0 ? '#ef4444' : '#22c55e',
                      minWidth: 80,
                      textAlign: 'right',
                    }}
                  >
                    {diff.diffAmount > 0 ? '+' : ''}¥{fmtNum(diff.diffAmount)}
                  </span>
                  {/* 严重标签 */}
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: sev.bg,
                      color: sev.text,
                      fontWeight: 500,
                    }}
                  >
                    {sev.label}
                  </span>
                  {/* 系统来源 */}
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                    {diff.sourceSystem}
                  </span>
                  {/* 时间 */}
                  <span style={{ fontSize: 11, color: '#64748b', minWidth: 60, textAlign: 'right' }}>
                    {fmtTime(diff.occurredAt)}
                  </span>
                  {/* 处理状态 */}
                  {diff.resolved ? (
                    <span style={{ fontSize: 11, color: '#22c55e' }}>✓ 已处理</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#f59e0b' }}>待处理</span>
                  )}
                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {onViewDetail && (
                      <button
                        data-testid={`view-${diff.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(diff);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: 4,
                          color: '#94a3b8',
                          fontSize: 11,
                          padding: '2px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        详情
                      </button>
                    )}
                    {!diff.resolved && onResolve && (
                      <button
                        data-testid={`resolve-${diff.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolve(diff.id);
                        }}
                        style={{
                          background: 'rgba(34,197,94,0.12)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: 4,
                          color: '#22c55e',
                          fontSize: 11,
                          padding: '2px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>

                {/* ── 展开详情 ──────────────────────────────────────── */}
                {isExpanded && diff.description && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: 'rgba(15,23,42,0.4)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#cbd5e1',
                      lineHeight: 1.5,
                    }}
                  >
                    {diff.description}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── 底部统计 ────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          borderTop: '1px solid rgba(148,163,184,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#64748b',
        }}
      >
        <span>共 {filtered.length} 条差异</span>
        <span>
          <span style={{ color: '#ef4444' }}>● {stats.criticalCount} 严重</span>
          {' · '}
          <span style={{ color: '#94a3b8' }}>未处理 {stats.unresolved}</span>
        </span>
      </div>
    </div>
  );
}

export default ReconciliationDiffPanel;
