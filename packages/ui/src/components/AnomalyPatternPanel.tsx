'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 识别出的异常模式类别 */
export type AnomalyPatternType =
  | 'periodic_spike'    // 周期性突增
  | 'time_correlated'   // 时间关联
  | 'cascading'         // 级联故障
  | 'silent_failure'    // 静默失败
  | 'threshold_drift'   // 阈值漂移
  | 'resource_exhaustion'; // 资源耗尽

export type PatternSeverity = 'critical' | 'high' | 'medium' | 'low';

/** 单条识别出的异常模式 */
export interface AnomalyPattern {
  /** 模式唯一 ID */
  id: string;
  /** 模式类型 */
  patternType: AnomalyPatternType;
  /** 模式名称 */
  name: string;
  /** 模式描述 */
  description: string;
  /** 严重程度 */
  severity: PatternSeverity;
  /** 影响实体数量 */
  affectedCount: number;
  /** 置信度 0-100 */
  confidence: number;
  /** 首次发现时间 */
  firstDetected: string;
  /** 最近触发时间 */
  lastTriggered: string;
  /** 触发次数 */
  triggerCount: number;
  /** 建议操作 */
  suggestion?: string;
}

export interface AnomalyPatternPanelProps {
  /** 识别出的异常模式列表 */
  patterns: AnomalyPattern[];
  /** 面板标题 */
  title?: string;
  /** 是否正在加载 */
  loading?: boolean;
  /** 空状态文案 */
  emptyLabel?: string;
  /** 点击建议操作回调 */
  onApplySuggestion?: (pattern: AnomalyPattern) => void;
  /** 点击查看详情回调 */
  onViewDetail?: (pattern: AnomalyPattern) => void;
}

// ==================== 子组件 ====================

const PATTERN_TYPE_LABELS: Record<AnomalyPatternType, string> = {
  periodic_spike: '周期性突增',
  time_correlated: '时间关联',
  cascading: '级联故障',
  silent_failure: '静默失败',
  threshold_drift: '阈值漂移',
  resource_exhaustion: '资源耗尽',
};

const PATTERN_TYPE_ICONS: Record<AnomalyPatternType, string> = {
  periodic_spike: '🔁',
  time_correlated: '⏱',
  cascading: '🔗',
  silent_failure: '🤫',
  threshold_drift: '📈',
  resource_exhaustion: '💥',
};

const SEVERITY_COLORS: Record<PatternSeverity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#6b7280',
};

const SEVERITY_LABELS: Record<PatternSeverity, string> = {
  critical: '严重',
  high: '较高',
  medium: '中等',
  low: '较低',
};

function PatternCard({
  pattern,
  onApplySuggestion,
  onViewDetail,
}: {
  pattern: AnomalyPattern;
  onApplySuggestion?: (p: AnomalyPattern) => void;
  onViewDetail?: (p: AnomalyPattern) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 8,
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 20 }}>{PATTERN_TYPE_ICONS[pattern.patternType]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>{pattern.name}</strong>
            <span
              style={{
                display: 'inline-block',
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                background: SEVERITY_COLORS[pattern.severity],
              }}
            >
              {SEVERITY_LABELS[pattern.severity]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {PATTERN_TYPE_LABELS[pattern.patternType]} · 置信度 {pattern.confidence}% · 触发 {pattern.triggerCount} 次
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '收起' : '详情'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 8px 0' }}>{pattern.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
            <span>影响实体: {pattern.affectedCount} 个</span>
            <span>首次发现: {new Date(pattern.firstDetected).toLocaleString('zh-CN')}</span>
            <span>最近触发: {new Date(pattern.lastTriggered).toLocaleString('zh-CN')}</span>
          </div>
          {pattern.suggestion && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 10,
                fontSize: 13,
                color: '#0369a1',
              }}
            >
              💡 {pattern.suggestion}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {pattern.suggestion && onApplySuggestion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplySuggestion(pattern);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                应用建议
              </button>
            )}
            {onViewDetail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail(pattern);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                查看详情
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export function AnomalyPatternPanel({
  patterns,
  title = '异常模式识别',
  loading = false,
  emptyLabel = '暂未识别出异常模式',
  onApplySuggestion,
  onViewDetail,
}: AnomalyPatternPanelProps) {
  const [filterSeverity, setFilterSeverity] = useState<PatternSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<AnomalyPatternType | 'all'>('all');

  const filtered = useMemo(() => {
    return patterns.filter((p) => {
      if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
      if (filterType !== 'all' && p.patternType !== filterType) return false;
      return true;
    });
  }, [patterns, filterSeverity, filterType]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    patterns.forEach((p) => {
      counts[p.severity] = (counts[p.severity] || 0) + 1;
    });
    return counts;
  }, [patterns]);

  const FILTERS = [
    { key: 'all' as const, label: '全部' },
    { key: 'critical' as const, label: '严重' },
    { key: 'high' as const, label: '较高' },
    { key: 'medium' as const, label: '中等' },
    { key: 'low' as const, label: '较低' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 14 }}>⏳ 正在分析异常模式…</div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        padding: 16,
      }}
    >
      {/* 标题栏 */}
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {title}
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>
          ({patterns.length} 个模式)
        </span>
      </div>

      {/* 严重程度概览 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {(Object.entries(SEVERITY_LABELS) as [PatternSeverity, string][]).map(([sev, label]) => (
          <div
            key={sev}
            style={{
              flex: 1,
              minWidth: 80,
              background: '#fff',
              borderRadius: 8,
              padding: '10px 14px',
              textAlign: 'center',
              border: `2px solid ${filterSeverity === sev ? SEVERITY_COLORS[sev] : 'transparent'}`,
              cursor: 'pointer',
            }}
            onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>
              {severityCounts[sev] ?? 0}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 筛选标签 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterSeverity(f.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              border: '1px solid #d1d5db',
              background: filterSeverity === f.key ? '#2563eb' : '#fff',
              color: filterSeverity === f.key ? '#fff' : '#374151',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 模式列表 */}
      {filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          {emptyLabel}
        </div>
      ) : (
        <div>
          {filtered.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onApplySuggestion={onApplySuggestion}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
