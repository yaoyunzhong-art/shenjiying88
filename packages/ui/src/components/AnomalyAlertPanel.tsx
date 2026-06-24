'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 异常严重程度 */
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/** 异常来源 */
export type AnomalySource = 'device' | 'member' | 'transaction' | 'system' | 'network';

/** 单条异常告警 */
export interface AnomalyAlert {
  /** 告警 ID */
  id: string;
  /** 告警标题 */
  title: string;
  /** 告警描述 */
  description: string;
  /** 严重程度 */
  severity: AnomalySeverity;
  /** 来源类型 */
  source: AnomalySource;
  /** 发生时间 */
  timestamp: string;
  /** 影响范围描述 */
  impact?: string;
  /** 是否已确认 */
  acknowledged: boolean;
  /** 相关指标值 */
  metricValue?: number;
  /** 指标阈值 */
  metricThreshold?: number;
  /** 指标单位 */
  metricUnit?: string;
}

/** 告警汇总统计 */
export interface AnomalySummary {
  /** 总告警数 */
  total: number;
  /** 未确认数 */
  unacknowledged: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/** 异常告警面板 Props */
export interface AnomalyAlertPanelProps {
  /** 告警数据列表 */
  alerts: AnomalyAlert[];
  /** 面板标题 */
  title?: string;
  /** 最大显示条数 */
  maxDisplay?: number;
  /** 是否显示汇总统计 */
  showSummary?: boolean;
  /** 是否显示筛选栏 */
  showFilters?: boolean;
  /** 刷新间隔(ms)，默认不自动刷新 */
  refreshIntervalMs?: number;
  /** 确认告警回调 */
  onAcknowledge?: (alertId: string) => void;
  /** 确认全部回调 */
  onAcknowledgeAll?: () => void;
  /** 查看详情回调 */
  onViewDetail?: (alert: AnomalyAlert) => void;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
}

// ==================== 常量 ====================

const SEVERITY_CONFIG: Record<AnomalySeverity, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  order: number;
}> = {
  critical: {
    label: '严重',
    color: '#fecaca',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(248,113,113,0.3)',
    dot: '#ef4444',
    order: 0,
  },
  high: {
    label: '高',
    color: '#fed7aa',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(251,146,60,0.3)',
    dot: '#f97316',
    order: 1,
  },
  medium: {
    label: '中',
    color: '#fde68a',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(250,204,21,0.3)',
    dot: '#eab308',
    order: 2,
  },
  low: {
    label: '低',
    color: '#bbf7d0',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(74,222,128,0.25)',
    dot: '#22c55e',
    order: 3,
  },
};

const SOURCE_CONFIG: Record<AnomalySource, { label: string; icon: string }> = {
  device: { label: '设备', icon: '🖥️' },
  member: { label: '会员', icon: '👤' },
  transaction: { label: '交易', icon: '💳' },
  system: { label: '系统', icon: '⚙️' },
  network: { label: '网络', icon: '🌐' },
};

// ==================== 子组件 ====================

/** 汇总统计卡片 */
function SummaryBar({ summary }: { summary: AnomalySummary }) {
  const items: { label: string; value: number; color: string }[] = [
    { label: '严重', value: summary.critical, color: SEVERITY_CONFIG.critical.dot },
    { label: '高', value: summary.high, color: SEVERITY_CONFIG.high.dot },
    { label: '中', value: summary.medium, color: SEVERITY_CONFIG.medium.dot },
    { label: '低', value: summary.low, color: SEVERITY_CONFIG.low.dot },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        borderRadius: 12,
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.1)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>🔔</span>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>告警总数</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
            {summary.total}
          </div>
        </div>
        {summary.unacknowledged > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#f87171',
              background: 'rgba(239,68,68,0.15)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {summary.unacknowledged} 未确认
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      {items
        .filter((i) => i.value > 0)
        .map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 6px ${item.color}`,
              }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
              {item.value}
            </span>
          </div>
        ))}
    </div>
  );
}

/** 单条告警行 */
function AlertRow({
  alert,
  onAcknowledge,
  onViewDetail,
}: {
  alert: AnomalyAlert;
  onAcknowledge?: (id: string) => void;
  onViewDetail?: (alert: AnomalyAlert) => void;
}) {
  const severity = SEVERITY_CONFIG[alert.severity];
  const source = SOURCE_CONFIG[alert.source];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderRadius: 10,
        background: severity.bg,
        border: `1px solid ${severity.border}`,
        padding: '12px 14px',
        transition: 'all 0.2s',
      }}
    >
      {/* 主行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 严重程度指示点 */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: severity.dot,
            boxShadow: `0 0 8px ${severity.dot}`,
            flexShrink: 0,
            marginTop: 4,
          }}
        />

        {/* 图标 */}
        <span style={{ fontSize: 14, flexShrink: 0 }}>{source.icon}</span>

        {/* 内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
              {alert.title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: severity.color,
                background: severity.border,
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {severity.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: '#64748b',
                background: 'rgba(148,163,184,0.08)',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {source.label}
            </span>
            {alert.acknowledged && (
              <span
                style={{
                  fontSize: 10,
                  color: '#22c55e',
                  background: 'rgba(34,197,94,0.1)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                已确认
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginTop: 4,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {alert.description}
          </div>

          {/* 指标对比 */}
          {alert.metricValue !== undefined && alert.metricThreshold !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                fontSize: 11,
              }}
            >
              <span style={{ color: '#64748b' }}>当前值</span>
              <span
                style={{
                  fontWeight: 700,
                  color:
                    alert.metricValue > alert.metricThreshold ? '#f87171' : '#4ade80',
                }}
              >
                {alert.metricValue}
                {alert.metricUnit ?? ''}
              </span>
              <span style={{ color: '#475569' }}>/</span>
              <span style={{ color: '#64748b' }}>阈值</span>
              <span style={{ color: '#94a3b8' }}>
                {alert.metricThreshold}
                {alert.metricUnit ?? ''}
              </span>
            </div>
          )}
        </div>

        {/* 时间 */}
        <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatTimeAgo(alert.timestamp)}
        </span>

        {/* 展开图标 */}
        <span
          style={{
            fontSize: 10,
            color: '#475569',
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </div>

      {/* 展开操作区 */}
      {expanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(148,163,184,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {alert.impact && (
            <span
              style={{
                fontSize: 11,
                color: '#f87171',
                background: 'rgba(239,68,68,0.08)',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              ⚡ 影响: {alert.impact}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {onViewDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(alert);
              }}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#60a5fa',
                background: 'rgba(96,165,250,0.1)',
                border: '1px solid rgba(96,165,250,0.2)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              查看详情
            </button>
          )}

          {!alert.acknowledged && onAcknowledge && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(alert.id);
              }}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#4ade80',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              确认告警
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** 时间格式化 */
function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const ts = new Date(timestamp).getTime();
  const diffMs = now - ts;

  if (isNaN(ts)) return timestamp;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

// ==================== 主组件 ====================

/**
 * AnomalyAlertPanel — 异常告警面板组件。
 *
 * 用于集中展示系统中的各类异常告警，支持：
 * - 告警列表（按严重程度排序）
 * - 汇总统计（总数/未确认/各级别数量）
 * - 严重程度筛选
 * - 来源类型筛选
 * - 确认/确认全部操作
 * - 展开查看详情
 * - 空状态处理
 *
 * @example
 * // 基础用法
 * <AnomalyAlertPanel
 *   title="实时告警监控"
 *   alerts={[
 *     {
 *       id: '1',
 *       title: '设备温度过高',
 *       description: '设备 #A103 温度达到 85°C，超过安全阈值 75°C',
 *       severity: 'critical',
 *       source: 'device',
 *       timestamp: new Date().toISOString(),
 *       acknowledged: false,
 *       impact: '可能影响 3 条产线',
 *       metricValue: 85,
 *       metricThreshold: 75,
 *       metricUnit: '°C',
 *     },
 *   ]}
 *   onAcknowledge={(id) => console.log('ack', id)}
 *   onViewDetail={(a) => console.log('detail', a)}
 * />
 *
 * @example
 * // 空状态
 * <AnomalyAlertPanel
 *   alerts={[]}
 *   emptyText="✅ 当前无异常告警，系统运行正常"
 * />
 */
export function AnomalyAlertPanel({
  alerts,
  title = '异常告警',
  maxDisplay = 50,
  showSummary = true,
  showFilters = true,
  onAcknowledge,
  onAcknowledgeAll,
  onViewDetail,
  className,
  emptyText = '暂无异常告警',
}: AnomalyAlertPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<AnomalySeverity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<AnomalySource | 'all'>('all');

  // 计算汇总
  const summary = useMemo<AnomalySummary>(() => {
    const s: AnomalySummary = { total: 0, unacknowledged: 0, critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of alerts) {
      s.total++;
      if (!a.acknowledged) s.unacknowledged++;
      s[a.severity]++;
    }
    return s;
  }, [alerts]);

  // 筛选 + 排序
  const filtered = useMemo(() => {
    let list = [...alerts];

    if (severityFilter !== 'all') {
      list = list.filter((a) => a.severity === severityFilter);
    }
    if (sourceFilter !== 'all') {
      list = list.filter((a) => a.source === sourceFilter);
    }

    // 按严重程度排序，再按时间倒序
    list.sort((a, b) => {
      const sevDiff = SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order;
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return list.slice(0, maxDisplay);
  }, [alerts, severityFilter, sourceFilter, maxDisplay]);

  const unacknowledgedCount = filtered.filter((a) => !a.acknowledged).length;

  // 可用的筛选选项（只显示有数据的）
  const availableSeverities = useMemo(() => {
    const set = new Set(alerts.map((a) => a.severity));
    return Array.from(set);
  }, [alerts]);

  const availableSources = useMemo(() => {
    const set = new Set(alerts.map((a) => a.source));
    return Array.from(set);
  }, [alerts]);

  const isEmpty = alerts.length === 0;

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15,23,42,0.35)',
        border: '1px solid rgba(148,163,184,0.14)',
        padding: '20px 18px 18px',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#e2e8f0',
            margin: 0,
          }}
        >
          🚨 {title}
        </h3>

        {!isEmpty && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#f87171',
              background: 'rgba(239,68,68,0.15)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {summary.total} 条告警
          </span>
        )}

        <div style={{ flex: 1 }} />

        {unacknowledgedCount > 0 && onAcknowledgeAll && (
          <button
            type="button"
            onClick={onAcknowledgeAll}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#4ade80',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            确认全部 ({unacknowledgedCount})
          </button>
        )}
      </div>

      {/* 汇总统计 */}
      {showSummary && !isEmpty && <SummaryBar summary={summary} />}

      {/* 筛选栏 */}
      {showFilters && !isEmpty && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* 严重程度筛选 */}
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 2 }}>严重程度:</span>
          <FilterChip
            label="全部"
            active={severityFilter === 'all'}
            onClick={() => setSeverityFilter('all')}
          />
          {(['critical', 'high', 'medium', 'low'] as AnomalySeverity[]).map((sev) =>
            availableSeverities.includes(sev) ? (
              <FilterChip
                key={sev}
                label={SEVERITY_CONFIG[sev].label}
                active={severityFilter === sev}
                onClick={() => setSeverityFilter(sev)}
                dotColor={SEVERITY_CONFIG[sev].dot}
              />
            ) : null
          )}

          <span style={{ width: 16 }} />

          {/* 来源筛选 */}
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 2 }}>来源:</span>
          <FilterChip
            label="全部"
            active={sourceFilter === 'all'}
            onClick={() => setSourceFilter('all')}
          />
          {availableSources.map((src) => (
            <FilterChip
              key={src}
              label={`${SOURCE_CONFIG[src].icon} ${SOURCE_CONFIG[src].label}`}
              active={sourceFilter === src}
              onClick={() => setSourceFilter(src)}
            />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {isEmpty ? (
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          {emptyText}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          当前筛选条件下无告警
        </div>
      ) : (
        /* 告警列表 */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: showFilters || showSummary ? 0 : 12,
          }}
        >
          {filtered.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 小型筛选标签 ====================

function FilterChip({
  label,
  active,
  onClick,
  dotColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        color: active ? '#e2e8f0' : '#64748b',
        background: active ? 'rgba(96,165,250,0.15)' : 'rgba(148,163,184,0.06)',
        border: `1px solid ${active ? 'rgba(96,165,250,0.3)' : 'rgba(148,163,184,0.1)'}`,
        borderRadius: 6,
        padding: '3px 10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {dotColor && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
          }}
        />
      )}
      {label}
    </button>
  );
}

export default AnomalyAlertPanel;
