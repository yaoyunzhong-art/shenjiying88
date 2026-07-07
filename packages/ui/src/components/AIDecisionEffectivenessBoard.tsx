'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 决策执行结果状态 */
export type DecisionResult = 'success' | 'partial' | 'failure';

/** 决策来源 */
export type DecisionSource = 'rule' | 'model' | 'hybrid';

/** 单条决策评估记录 */
export interface DecisionEffectivenessItem {
  /** 决策 ID */
  id: string;
  /** 决策名称 */
  name: string;
  /** 决策来源 */
  source: DecisionSource;
  /** 执行结果 */
  result: DecisionResult;
  /** 执行次数 */
  executionCount: number;
  /** 成功次数 */
  successCount: number;
  /** 平均响应时间 ms */
  avgResponseMs: number;
  /** 提升指标 % 如转化率提升 */
  liftPercent?: number;
  /** 最后执行时间 */
  lastExecutedAt: string;
  /** 是否启用 */
  enabled: boolean;
}

/** 汇总卡 */
export interface EffectivenessSummary {
  totalDecisions: number;
  totalExecutions: number;
  overallSuccessRate: number;
  avgResponseMs: number;
  avgLiftPercent: number;
}

/** 决策效果看板 Props */
export interface AIDecisionEffectivenessBoardProps {
  /** 决策效果数据 */
  items: DecisionEffectivenessItem[];
  /** 面板标题 */
  title?: string;
  /** 是否显示汇总 */
  showSummary?: boolean;
  /** 成功阈值（超过此百分比视为高效果） */
  successThreshold?: number;
}

// ==================== 默认值 ====================

const DEFAULT_SUCCESS_THRESHOLD = 80;

const RESULT_LABELS: Record<DecisionResult, string> = {
  success: '成功',
  partial: '部分成功',
  failure: '失败',
};

const RESULT_COLORS: Record<DecisionResult, string> = {
  success: '#22c55e',
  partial: '#f59e0b',
  failure: '#ef4444',
};

const SOURCE_LABELS: Record<DecisionSource, string> = {
  rule: '规则引擎',
  model: 'AI模型',
  hybrid: '混合策略',
};

const SOURCE_TAG_COLORS: Record<DecisionSource, string> = {
  rule: '#3b82f6',
  model: '#8b5cf6',
  hybrid: '#06b6d4',
};

// ==================== 工具函数 ====================

const formatPct = (v: number): string => `${Math.round(v)}%`;

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const getSuccessRate = (success: number, total: number): number =>
  total > 0 ? Math.round((success / total) * 100) : 0;

const getRateColor = (rate: number, threshold: number): string => {
  if (rate >= threshold) return '#22c55e';
  if (rate >= threshold * 0.7) return '#f59e0b';
  return '#ef4444';
};

// ==================== 组件 ====================

export function AIDecisionEffectivenessBoard({
  items,
  title = 'AI决策效果看板',
  showSummary = true,
  successThreshold = DEFAULT_SUCCESS_THRESHOLD,
}: AIDecisionEffectivenessBoardProps) {
  const [sortBy, setSortBy] = useState<'name' | 'rate' | 'executions' | 'lift'>('rate');
  const [sourceFilter, setSourceFilter] = useState<DecisionSource | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<DecisionResult | 'all'>('all');

  // ---- 计算汇总 ----
  const summary: EffectivenessSummary = useMemo(() => {
    if (items.length === 0) {
      return { totalDecisions: 0, totalExecutions: 0, overallSuccessRate: 0, avgResponseMs: 0, avgLiftPercent: 0 };
    }
    const totalExecutions = items.reduce((s, i) => s + i.executionCount, 0);
    const totalSuccess = items.reduce((s, i) => s + i.successCount, 0);
    const totalResponseMs = items.reduce((s, i) => s + i.avgResponseMs, 0);
    const itemsWithLift = items.filter((i) => i.liftPercent != null);
    const totalLift = itemsWithLift.reduce((s, i) => s + (i.liftPercent ?? 0), 0);
    return {
      totalDecisions: items.length,
      totalExecutions,
      overallSuccessRate: getSuccessRate(totalSuccess, totalExecutions),
      avgResponseMs: Math.round(totalResponseMs / items.length),
      avgLiftPercent: itemsWithLift.length > 0 ? Math.round(totalLift / itemsWithLift.length) : 0,
    };
  }, [items]);

  // ---- 过滤与排序 ----
  const processed = useMemo(() => {
    let list = [...items];

    if (sourceFilter !== 'all') {
      list = list.filter((i) => i.source === sourceFilter);
    }
    if (resultFilter !== 'all') {
      list = list.filter((i) => i.result === resultFilter);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rate': {
          const ra = getSuccessRate(a.successCount, a.executionCount);
          const rb = getSuccessRate(b.successCount, b.executionCount);
          return rb - ra;
        }
        case 'executions':
          return b.executionCount - a.executionCount;
        case 'lift':
          return (b.liftPercent ?? 0) - (a.liftPercent ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [items, sourceFilter, resultFilter, sortBy]);

  const totalSuccessO = summary.overallSuccessRate;
  const rateColor = getRateColor(totalSuccessO, successThreshold);

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: '#0f172a',
      border: '1px solid rgba(148,163,184,0.15)',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>{title}</h3>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {items.length} 项决策 · {summary.totalExecutions} 次执行
        </span>
      </div>

      {/* 汇总卡 */}
      {showSummary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}>
          {[
            { label: '综合成功率', value: formatPct(totalSuccessO), color: rateColor, unit: '' },
            { label: '平均响应', value: formatMs(summary.avgResponseMs), color: '#3b82f6', unit: '' },
            { label: '平均提升', value: formatPct(summary.avgLiftPercent), color: '#8b5cf6', unit: '' },
            { label: '决策总数', value: String(summary.totalDecisions), color: '#64748b', unit: '' },
          ].map((card) => (
            <div key={card.label} style={{
              padding: '10px 8px',
              borderRadius: 8,
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 过滤栏 */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* 来源过滤 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>来源:</span>
          {(['all', 'rule', 'model', 'hybrid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${sourceFilter === s ? SOURCE_TAG_COLORS[sourceFilter === 'all' ? 'rule' : sourceFilter] : 'rgba(148,163,184,0.15)'}`,
                background: sourceFilter === s ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: sourceFilter === s ? '#93c5fd' : '#64748b',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {s === 'all' ? '全部' : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* 结果过滤 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>结果:</span>
          {(['all', 'success', 'partial', 'failure'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${resultFilter === r ? RESULT_COLORS[resultFilter === 'all' ? 'success' : resultFilter] : 'rgba(148,163,184,0.15)'}`,
                background: resultFilter === r ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: resultFilter === r ? '#93c5fd' : '#64748b',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {r === 'all' ? '全部' : RESULT_LABELS[r]}
            </button>
          ))}
        </div>

        {/* 排序 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '3px 6px',
              borderRadius: 6,
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid rgba(148,163,184,0.2)',
              fontSize: 11,
            }}
          >
            <option value="rate">成功率</option>
            <option value="executions">执行次数</option>
            <option value="lift">提升率</option>
            <option value="name">名称</option>
          </select>
        </div>
      </div>

      {/* 决策列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {processed.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            暂无匹配的决策数据
          </div>
        ) : (
          processed.map((item) => {
            const rate = getSuccessRate(item.successCount, item.executionCount);
            const barColor = getRateColor(rate, successThreshold);
            return (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(15,23,42,0.4)',
                  border: `1px solid rgba(148,163,184,0.08)`,
                }}
              >
                {/* 第一行: 名称 + 标签 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</span>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: 10,
                      background: `${SOURCE_TAG_COLORS[item.source]}22`,
                      color: SOURCE_TAG_COLORS[item.source],
                      border: `1px solid ${SOURCE_TAG_COLORS[item.source]}33`,
                    }}>
                      {SOURCE_LABELS[item.source]}
                    </span>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: 10,
                      background: `${RESULT_COLORS[item.result]}22`,
                      color: RESULT_COLORS[item.result],
                      border: `1px solid ${RESULT_COLORS[item.result]}33`,
                    }}>
                      {RESULT_LABELS[item.result]}
                    </span>
                  </div>
                  <div style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    background: item.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: item.enabled ? '#22c55e' : '#94a3b8',
                  }}>
                    {item.enabled ? '启用' : '停用'}
                  </div>
                </div>

                {/* 第二行: 成功率 bar + 指标 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* 进度条 */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: '#1e293b',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${rate}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: barColor,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* 成功率 */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: barColor, minWidth: 42, textAlign: 'right' }}>
                    {formatPct(rate)}
                  </span>

                  {/* 执行次数 */}
                  <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 56, textAlign: 'right' }}>
                    {item.successCount}/{item.executionCount}
                  </span>

                  {/* 响应时间 */}
                  <span style={{ fontSize: 11, color: '#64748b', minWidth: 50, textAlign: 'right' }}>
                    {formatMs(item.avgResponseMs)}
                  </span>

                  {/* 提升率 */}
                  {item.liftPercent != null && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: item.liftPercent >= 0 ? '#22c55e' : '#ef4444',
                      minWidth: 40,
                      textAlign: 'right',
                    }}>
                      {item.liftPercent >= 0 ? '+' : ''}{item.liftPercent}%
                    </span>
                  )}
                </div>

                {/* 最后执行 */}
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                  最后执行: {item.lastExecutedAt}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
