'use client';

import React, { useCallback, useMemo, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface DecisionComparisonItem {
  /** 决策唯一标识 */
  id: string;
  /** 规则/策略名称 */
  ruleName: string;
  /** 决策类别 */
  category: 'pricing' | 'inventory' | 'promotion' | 'allocation' | 'recommendation';
  /** 置信度 0-1 */
  confidence: number;
  /** 执行状态 */
  status: 'success' | 'failure' | 'rejected';
  /** 推荐值（数值摘要） */
  recommendedValue: string;
  /** 原始值（执行前） */
  originalValue: string;
  /** 预期提升百分比 */
  expectedLiftPct: number;
  /** 实际提升百分比（null=尚未采集） */
  actualLiftPct: number | null;
  /** 偏差分数 */
  deviationScore: number | null;
  /** 执行时间 */
  executedAt: string;
  /** 是否被采纳 */
  adopted: boolean;
  /** 触发方式 */
  trigger: 'manual' | 'cron' | 'event';
}

export interface AIDecisionComparisonPanelProps {
  /** 对比数据列表 */
  items: DecisionComparisonItem[];
  /** 排序方式 */
  sort?: 'confidence' | 'deviation' | 'lift-gap' | 'time';
  /** 类别筛选 */
  categoryFilter?: DecisionComparisonItem['category'] | 'all';
  /** 状态筛选 */
  statusFilter?: DecisionComparisonItem['status'] | 'all';
  /** 采纳筛选 */
  adoptedFilter?: 'all' | 'adopted' | 'not-adopted';
  /** 点击详情回调 */
  onItemClick?: (item: DecisionComparisonItem) => void;
  /** 点击采纳/取消采纳回调 */
  onToggleAdopt?: (item: DecisionComparisonItem) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DecisionComparisonItem['category'], string> = {
  pricing: '定价策略',
  inventory: '库存调配',
  promotion: '促销活动',
  allocation: '资源分配',
  recommendation: '商品推荐',
};

const STATUS_BADGE_COLORS: Record<DecisionComparisonItem['status'], string> = {
  success: '#22c55e',
  failure: '#ef4444',
  rejected: '#f59e0b',
};

const TRIGGER_LABELS: Record<DecisionComparisonItem['trigger'], string> = {
  manual: '手动',
  cron: '定时',
  event: '事件',
};

/** 偏差等级色 */
function deviationColor(score: number | null): string {
  if (score === null) return '#6b7280';
  if (score < 0.1) return '#22c55e';
  if (score < 0.25) return '#f59e0b';
  return '#ef4444';
}

function deviationLabel(score: number | null): string {
  if (score === null) return '待评估';
  if (score < 0.1) return '优';
  if (score < 0.25) return '中';
  return '差';
}

// ── Component ────────────────────────────────────────────────────────────────

export function AIDecisionComparisonPanel({
  items,
  sort = 'time',
  categoryFilter = 'all',
  statusFilter = 'all',
  adoptedFilter = 'all',
  onItemClick,
  onToggleAdopt,
}: AIDecisionComparisonPanelProps) {
  // ── 筛选 ──
  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (adoptedFilter === 'adopted') list = list.filter((i) => i.adopted);
    if (adoptedFilter === 'not-adopted') list = list.filter((i) => !i.adopted);
    return list;
  }, [items, categoryFilter, statusFilter, adoptedFilter]);

  // ── 排序 ──
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case 'confidence':
        arr.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'deviation':
        arr.sort((a, b) => (b.deviationScore ?? 1) - (a.deviationScore ?? 1));
        break;
      case 'lift-gap': {
        arr.sort((a, b) => {
          const gapA = a.actualLiftPct !== null ? Math.abs(a.expectedLiftPct - a.actualLiftPct) : 999;
          const gapB = b.actualLiftPct !== null ? Math.abs(b.expectedLiftPct - b.actualLiftPct) : 999;
          return gapB - gapA;
        });
        break;
      }
      case 'time':
      default:
        arr.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
        break;
    }
    return arr;
  }, [filtered, sort]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── 汇总统计（显示在顶部） ──
  const stats = useMemo(() => {
    const total = items.length;
    const adopted = items.filter((i) => i.adopted).length;
    const succeeded = items.filter((i) => i.status === 'success').length;
    const avgConfidence = items.reduce((s, i) => s + i.confidence, 0) / (total || 1);
    const avgDeviation =
      items.filter((i) => i.deviationScore !== null).reduce((s, i) => s + (i.deviationScore ?? 0), 0) /
      (items.filter((i) => i.deviationScore !== null).length || 1);
    return { total, adopted, succeeded, avgConfidence, avgDeviation };
  }, [items]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── 汇总统计行 ── */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: '16px 20px',
          marginBottom: 16,
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          fontSize: 13,
          flexWrap: 'wrap',
        }}
      >
        <Stat label="总决策数" value={String(stats.total)} />
        <Stat label="已采纳" value={String(stats.adopted)} color="#22c55e" />
        <Stat label="执行成功" value={String(stats.succeeded)} color="#3b82f6" />
        <Stat label="平均置信度" value={`${(stats.avgConfidence * 100).toFixed(0)}%`} />
        <Stat label="平均偏差" value={stats.avgDeviation ? `${(stats.avgDeviation * 100).toFixed(1)}%` : '-'} color={deviationColor(stats.avgDeviation)} />
      </div>

      {/* ── 列表头 ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 70px 60px 50px',
          gap: 8,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          borderBottom: '1px solid #e5e7eb',
          alignItems: 'center',
        }}
      >
        <span>规则 / 触发</span>
        <span>推荐值</span>
        <span>原始值</span>
        <span>提升对比</span>
        <span>置信度</span>
        <span>偏差</span>
        <span>状态</span>
        <span>采纳</span>
      </div>

      {/* ── 行列表 ── */}
      {sorted.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            fontSize: 14,
            color: '#94a3b8',
          }}
        >
          暂无匹配的决策记录
        </div>
      ) : (
        sorted.map((item) => {
          const isHovered = hoveredId === item.id;
          const liftGap =
            item.actualLiftPct !== null
              ? (item.actualLiftPct - item.expectedLiftPct).toFixed(1)
              : null;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 70px 60px 50px',
                gap: 8,
                padding: '12px 16px',
                fontSize: 13,
                borderBottom: '1px solid #f1f5f9',
                cursor: onItemClick ? 'pointer' : 'default',
                background: isHovered ? '#f8fafc' : item.adopted ? '#f0fdf4' : undefined,
                transition: 'background 0.12s',
                alignItems: 'center',
              }}
            >
              {/* 规则 / 触发 */}
              <div>
                <div style={{ fontWeight: 500, color: '#1e293b' }}>{item.ruleName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {CATEGORY_LABELS[item.category]} · {TRIGGER_LABELS[item.trigger]}
                </div>
              </div>

              {/* 推荐值 */}
              <div style={{ color: '#059669', fontWeight: 500 }}>{item.recommendedValue}</div>

              {/* 原始值 */}
              <div style={{ color: '#6b7280' }}>{item.originalValue}</div>

              {/* 提升对比 */}
              <div>
                <div style={{ fontSize: 12, color: '#3b82f6' }}>预期 +{item.expectedLiftPct}%</div>
                {item.actualLiftPct !== null ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: item.actualLiftPct >= item.expectedLiftPct ? '#22c55e' : '#f59e0b',
                    }}
                  >
                    实际 +{item.actualLiftPct}%
                    {liftGap !== null && (
                      <span style={{ marginLeft: 4, fontSize: 11, color: '#94a3b8' }}>
                        ({liftGap.startsWith('-') ? '' : '+'}{liftGap}pp)
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>待采集</div>
                )}
              </div>

              {/* 置信度 */}
              <div
                style={{
                  fontWeight: 600,
                  color: item.confidence >= 0.8 ? '#22c55e' : item.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                }}
              >
                {(item.confidence * 100).toFixed(0)}%
              </div>

              {/* 偏差 */}
              <div style={{ color: deviationColor(item.deviationScore), fontWeight: 500, fontSize: 12 }}>
                {deviationLabel(item.deviationScore)}
              </div>

              {/* 状态 */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: STATUS_BADGE_COLORS[item.status],
                  justifySelf: 'center',
                }}
                title={item.status}
              />

              {/* 采纳 */}
              <div style={{ justifySelf: 'center' }}>
                <input
                  type="checkbox"
                  checked={item.adopted}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleAdopt?.(item);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: onToggleAdopt ? 'pointer' : 'default' }}
                  aria-label={`采纳 ${item.ruleName}`}
                />
              </div>
            </div>
          );
        })
      )}

      {/* ── 底部提示 ── */}
      {sorted.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: 12,
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <span>共 {sorted.length} 条记录</span>
          <span>
            已采纳 {sorted.filter((i) => i.adopted).length} / {sorted.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Sub Components ──────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 18, color: color ?? '#1e293b' }}>{value}</span>
    </div>
  );
}
