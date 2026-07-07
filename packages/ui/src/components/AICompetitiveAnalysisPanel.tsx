'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { StatusBadge } from './StatusBadge';
import { StatTrend } from './StatTrend';

// ==================== 类型定义 ====================

/** 竞争对手指标维度 */
export type CompetitorMetric =
  | 'price'
  | 'membership'
  | 'service'
  | 'promotion'
  | 'footfall';

/** 竞争对手数据条目 */
export interface CompetitorEntry {
  /** 对手名称 */
  name: string;
  /** 指标值 (相对分 0-100) */
  score: number;
  /** 指标维度 */
  metric: CompetitorMetric;
  /** 同比变化 */
  changePercent: number;
  /** 最近活动摘要 */
  recentActivity?: string;
  /** 是否本店 */
  isSelf?: boolean;
}

/** 竞争分析维度设置 */
export interface CompetitorDimension {
  /** 维度标识 */
  key: CompetitorMetric;
  /** 维度标签 */
  label: string;
  /** 本店得分 */
  selfScore: number;
  /** 行业均值 */
  industryAvg: number;
  /** 排名 (1-based) */
  rank: number;
  /** 总统计数 */
  totalCompetitors: number;
  /** 较上月排名变化 */
  rankDelta?: number;
}

/** AI 建议 */
export interface AICompetitiveSuggestion {
  /** 建议 ID */
  id: string;
  /** 建议标题 */
  title: string;
  /** 建议描述 */
  description: string;
  /** 影响等级 */
  impact: 'high' | 'medium' | 'low';
  /** 建议行动 */
  action: string;
}

/** 竞争分析面板 Props */
export interface AICompetitiveAnalysisPanelProps {
  /** 竞争对手排名数据 */
  dimensions: CompetitorDimension[];
  /** 最近对手动态 */
  entries: CompetitorEntry[];
  /** AI 建议列表 */
  suggestions?: AICompetitiveSuggestion[];
  /** 面板标题 */
  title?: string;
  /** 覆盖市场名称 */
  marketName?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 维度点击回调 */
  onDimensionClick?: (dimension: CompetitorDimension) => void;
  /** 建议点击回调 */
  onSuggestionClick?: (suggestion: AICompetitiveSuggestion) => void;
  /** 自定义类名 */
  className?: string;
}

// ==================== 内联样式 ====================

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  empty: { padding: '32px 16px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 },
  dimensions: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  dimBar: { cursor: 'pointer' as const },
  dimHeader: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  dimLabel: { fontSize: 14, fontWeight: 500, color: '#1e293b' },
  dimRank: { display: 'flex', alignItems: 'center' as const, gap: 4 },
  barRow: { display: 'flex', alignItems: 'center' as const, gap: 8, marginBottom: 4 },
  barLabel: { fontSize: 12, color: '#64748b', minWidth: 56, flexShrink: 0 },
  barLabelSelf: { fontSize: 12, color: '#2563eb', fontWeight: 500, minWidth: 56, flexShrink: 0 },
  barTrack: { flex: 1, height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' as const },
  barFillAvg: { height: '100%', background: '#93c5fd', borderRadius: 5, transition: 'width 0.3s' },
  barFillSelf: { height: '100%', background: '#2563eb', borderRadius: 5, transition: 'width 0.3s' },
  barValue: { fontSize: 13, fontWeight: 600, color: '#2563eb', minWidth: 28, textAlign: 'right' as const },
  entries: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  entryCard: {
    padding: 12, borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', transition: 'box-shadow 0.2s',
  },
  entryCardSelf: { border: '1px solid #93c5fd', background: '#eff6ff' },
  entryHeader: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 4 },
  entryName: { fontSize: 14, fontWeight: 500, color: '#1e293b' },
  entryActivity: { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 },
  suggestions: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  suggestionCard: {
    padding: 14, borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#f8fafc', cursor: 'pointer' as const,
  },
  suggestionHeader: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6 },
  suggestionTitle: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
  suggestionDesc: { fontSize: 13, color: '#475569', margin: '0 0 8px 0', lineHeight: 1.4 },
  suggestionAction: { fontSize: 13, color: '#2563eb', display: 'flex', gap: 4 },
  suggestionActionLabel: { color: '#64748b' },
};

// ==================== 子组件 ====================

/** 维度评分条 */
function DimensionBar({
  dimension,
  onClick,
}: {
  dimension: CompetitorDimension;
  onClick?: (d: CompetitorDimension) => void;
}) {
  const selfPct = Math.min(dimension.selfScore, 100);
  const avgPct = Math.min(dimension.industryAvg, 100);

  return (
    <div
      role="button"
      tabIndex={0}
      style={styles.dimBar}
      onClick={() => onClick?.(dimension)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(dimension); }}
    >
      <div style={styles.dimHeader}>
        <span style={styles.dimLabel}>{dimension.label}</span>
        <span style={styles.dimRank}>
          <Badge variant="info" size="sm">
            #{dimension.rank}/{dimension.totalCompetitors}
          </Badge>
          {dimension.rankDelta != null && dimension.rankDelta !== 0 && (
            <StatTrend
              direction={dimension.rankDelta > 0 ? 'up' : 'down'}
              value={`${dimension.rankDelta > 0 ? '+' : ''}${dimension.rankDelta}`}
            />
          )}
        </span>
      </div>

      <div>
        {/* 行业均值条 */}
        <div style={styles.barRow}>
          <span style={styles.barLabel}>行业均值</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFillAvg, width: `${avgPct}%` }} />
          </div>
        </div>
        {/* 本店得分条 */}
        <div style={styles.barRow}>
          <span style={styles.barLabelSelf}>本店</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFillSelf, width: `${selfPct}%` }} />
          </div>
          <span style={styles.barValue}>{dimension.selfScore}</span>
        </div>
      </div>
    </div>
  );
}

/** 对手动态卡片 */
function CompetitorEntryCard({ entry }: { entry: CompetitorEntry }) {
  return (
    <div
      style={{
        ...styles.entryCard,
        ...(entry.isSelf ? styles.entryCardSelf : {}),
      }}
    >
      <div style={styles.entryHeader}>
        <span style={styles.entryName}>{entry.isSelf ? '本店' : entry.name}</span>
        <StatusBadge
          variant={entry.changePercent >= 0 ? 'success' : 'error'}
          label={`${entry.changePercent >= 0 ? '+' : ''}${entry.changePercent.toFixed(1)}%`}
          size="sm"
        />
      </div>
      {entry.recentActivity && (
        <p style={styles.entryActivity}>{entry.recentActivity}</p>
      )}
    </div>
  );
}

/** AI 建议卡片 */
function SuggestionCard({
  suggestion,
  onClick,
}: {
  suggestion: AICompetitiveSuggestion;
  onClick?: (s: AICompetitiveSuggestion) => void;
}) {
  const impactLabel =
    suggestion.impact === 'high' ? '高影响' :
    suggestion.impact === 'medium' ? '中影响' : '低影响';
  const impactVariant: 'error' | 'warning' | 'info' =
    suggestion.impact === 'high' ? 'error' :
    suggestion.impact === 'medium' ? 'warning' : 'info';

  return (
    <div
      style={styles.suggestionCard}
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(suggestion)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(suggestion); }}
    >
      <div style={styles.suggestionHeader}>
        <span style={styles.suggestionTitle}>{suggestion.title}</span>
        <Badge variant={impactVariant} size="sm">{impactLabel}</Badge>
      </div>
      <p style={styles.suggestionDesc}>{suggestion.description}</p>
      <div style={styles.suggestionAction}>
        <span style={styles.suggestionActionLabel}>建议行动:</span>
        <span>{suggestion.action}</span>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function AICompetitiveAnalysisPanel({
  dimensions,
  entries,
  suggestions,
  title = '竞争分析',
  marketName,
  emptyText = '暂无竞争数据',
  onDimensionClick,
  onSuggestionClick,
  className,
}: AICompetitiveAnalysisPanelProps) {
  const isEmpty = dimensions.length === 0;

  // 按排名排序的维度
  const sortedDims = useMemo(
    () => [...dimensions].sort((a, b) => a.rank - b.rank),
    [dimensions]
  );

  // 按 changePercent 排序的对手动态
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.changePercent - a.changePercent),
    [entries]
  );

  if (isEmpty) {
    return (
      <div className={className}>
        <Card title={title}>
          <div style={styles.empty}>{emptyText}</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.wrapper} className={className}>
      {/* 维度雷达区域 */}
      <Card title={title} subtitle={marketName}>
        <div style={styles.dimensions}>
          {sortedDims.map((dim) => (
            <DimensionBar
              key={dim.key}
              dimension={dim}
              onClick={onDimensionClick}
            />
          ))}
        </div>
      </Card>

      {/* 对手动态 */}
      <Card title="对手动态">
        <div style={styles.entries}>
          {sortedEntries.map((entry, idx) => (
            <CompetitorEntryCard key={`${entry.name}-${idx}`} entry={entry} />
          ))}
        </div>
      </Card>

      {/* AI 策略建议 */}
      {suggestions && suggestions.length > 0 && (
        <Card title="AI 策略建议">
          <div style={styles.suggestions}>
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onClick={onSuggestionClick}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
