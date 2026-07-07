'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
// ==================== 状态颜色 ====================

const STATUS_STYLES: Record<ExperimentStatus, { bg: string; text: string }> = {
  running: { bg: '#e6f7ff', text: '#1890ff' },
  completed: { bg: '#f6ffed', text: '#52c41a' },
  draft: { bg: '#f5f5f5', text: '#999' },
  paused: { bg: '#fffbe6', text: '#faad14' },
  failed: { bg: '#fff2f0', text: '#ff4d4f' },
};

const COLORS = STATUS_STYLES;

// ==================== 类型定义 ====================

/** 实验状态 */
export type ExperimentStatus = 'running' | 'completed' | 'draft' | 'paused' | 'failed';

/** A/B 实验方案 */
export interface ExperimentVariant {
  /** 方案标识 */
  id: string;
  /** 方案名称 */
  name: string;
  /** 流量占比 (%) */
  trafficPercent: number;
  /** 转化率 */
  conversionRate: number;
  /** 样本量 */
  sampleSize: number;
  /** 是否优胜方案 */
  isWinner: boolean;
  /** 提升百分比 (相对对照组) */
  liftPercent: number;
}

/** 单个实验条目 */
export interface ExperimentEntry {
  /** 实验ID */
  id: string;
  /** 实验名称 */
  name: string;
  /** 实验状态 */
  status: ExperimentStatus;
  /** 目标指标 */
  targetMetric: string;
  /** 开始时间 */
  startDate: string;
  /** 结束时间 (预期/实际) */
  endDate?: string;
  /** 实验方案列表 */
  variants: ExperimentVariant[];
  /** 置信度 (0-100) */
  confidenceLevel: number;
  /** AI推荐建议 */
  aiRecommendation?: string;
}

/** 优化建议条目 */
export interface OptimizationSuggestion {
  /** 建议ID */
  id: string;
  /** 建议标题 */
  title: string;
  /** 预期提升百分比 */
  expectedLift: number;
  /** 建议类别 */
  category: 'pricing' | 'promotion' | 'content' | 'placement' | 'other';
  /** 关联实验ID */
  relatedExperimentId?: string;
  /** 建议详细描述 */
  description: string;
}

/** AI 实验优化面板 Props */
export interface AIExperimentOptimizationPanelProps {
  /** 实验列表 */
  experiments: ExperimentEntry[];
  /** AI优化建议列表 */
  suggestions: OptimizationSuggestion[];
  /** 总体测试中实验数 */
  activeExperimentCount: number;
  /** 已识别优化机会数 */
  opportunityCount: number;
  /** 预计总提升 */
  estimatedTotalLift: number;
  /** 面板标题 */
  title?: string;
  /** 是否 loading */
  loading?: boolean;
  /** 空状态提示 */
  emptyMessage?: string;
}

// ==================== 样式 ====================

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
};

const statBoxStyle: React.CSSProperties = {
  flex: '1 1 160px',
  padding: '12px 16px',
  borderRadius: '8px',
  background: '#f5f7fa',
  textAlign: 'center',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#1a1a2e',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#333',
  marginBottom: '12px',
};

const experimentCardStyle: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '10px',
};

const variantRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '6px 0',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '13px',
};

const suggestionCardStyle: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
  borderLeft: '4px solid #52c41a',
};

const categoryColorMap: Record<string, string> = {
  pricing: '#722ed1',
  promotion: '#eb2f96',
  content: '#1890ff',
  placement: '#13c2c2',
  other: '#666',
};

// ==================== 子组件 ====================

/** 单个实验卡片 */
function ExperimentCard({ experiment }: { experiment: ExperimentEntry }) {
  const winner = experiment.variants.find(v => v.isWinner);
  return (
    <div style={experimentCardStyle} data-testid={`experiment-card-${experiment.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{experiment.name}</span>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          background: COLORS[experiment.status].bg,
          color: COLORS[experiment.status].text,
        }}>
          {experiment.status === 'running' ? '运行中' : experiment.status === 'completed' ? '已完成' : experiment.status === 'draft' ? '草稿' : experiment.status === 'paused' ? '已暂停' : '失败'}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: 8 }}>
        目标: {experiment.targetMetric} {experiment.startDate} {experiment.endDate ? `~ ${experiment.endDate}` : ''}
      </div>
      <div style={{ fontSize: '13px', marginBottom: 6 }}>方案对比:</div>
      {experiment.variants.map(v => (
        <div key={v.id} style={variantRowStyle}>
          <span style={{ flex: 1 }}>{v.name} ({v.trafficPercent}%)</span>
          <span style={{ width: 80, textAlign: 'right' }}>转化 {v.conversionRate}%</span>
          <span style={{ width: 80, textAlign: 'right', color: v.liftPercent >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {v.liftPercent >= 0 ? '+' : ''}{v.liftPercent}%
          </span>
          <span style={{ width: 70, textAlign: 'right', fontSize: '11px', color: '#999' }}>(n={v.sampleSize})</span>
          {v.isWinner && <span style={{ color: '#52c41a', fontWeight: 600 }}>🏆 优胜</span>}
        </div>
      ))}
      {experiment.confidenceLevel > 0 && (
        <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
          置信度: {experiment.confidenceLevel}%
        </div>
      )}
      {experiment.aiRecommendation && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#f0f5ff',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1890ff',
        }}>
          🤖 AI 建议: {experiment.aiRecommendation}
        </div>
      )}
    </div>
  );
}

/** 优化建议卡片 */
function SuggestionCard({ suggestion }: { suggestion: OptimizationSuggestion }) {
  return (
    <div style={{ ...suggestionCardStyle, borderLeftColor: categoryColorMap[suggestion.category] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>{suggestion.title}</span>
        <span style={{
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: categoryColorMap[suggestion.category] + '20',
          color: categoryColorMap[suggestion.category],
        }}>
          {suggestion.category === 'pricing' ? '定价' : suggestion.category === 'promotion' ? '促销' : suggestion.category === 'content' ? '内容' : suggestion.category === 'placement' ? '布局' : '其他'}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>{suggestion.description}</div>
      <div style={{ fontSize: '12px', color: '#52c41a', marginTop: 4, fontWeight: 500 }}>
        预期提升: +{suggestion.expectedLift}%
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function AIExperimentOptimizationPanel({
  experiments,
  suggestions,
  activeExperimentCount,
  opportunityCount,
  estimatedTotalLift,
  title = 'AI 实验优化',
  loading = false,
  emptyMessage = '暂无实验数据',
}: AIExperimentOptimizationPanelProps) {
  const runningExperiments = useMemo(
    () => experiments.filter(e => e.status === 'running'),
    [experiments],
  );
  const completedExperiments = useMemo(
    () => experiments.filter(e => e.status === 'completed'),
    [experiments],
  );
  const otherExperiments = useMemo(
    () => experiments.filter(e => e.status !== 'running' && e.status !== 'completed'),
    [experiments],
  );

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid="ai-experiment-optimization-panel">
      {/* 标题 */}
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{title}</h3>
      </div>

      {/* 概览统计 */}
      <div style={statsRowStyle}>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>运行中实验</div>
          <div style={statValueStyle}>{activeExperimentCount}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>优化机会</div>
          <div style={statValueStyle}>{opportunityCount}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>预计总提升</div>
          <div style={{ ...statValueStyle, color: '#52c41a' }}>+{estimatedTotalLift}%</div>
        </div>
      </div>

      {/* 运行中实验 */}
      {runningExperiments.length > 0 && (
        <Card>
          <div style={sectionTitleStyle}>
            进行中实验 ({runningExperiments.length})
          </div>
          {runningExperiments.map(exp => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </Card>
      )}

      {/* 已完成实验 */}
      {completedExperiments.length > 0 && (
        <Card>
          <div style={sectionTitleStyle}>
            已完成实验 ({completedExperiments.length})
          </div>
          {completedExperiments.map(exp => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </Card>
      )}

      {/* 其他实验 */}
      {otherExperiments.length > 0 && (
        <Card>
          <div style={sectionTitleStyle}>
            其他实验 ({otherExperiments.length})
          </div>
          {otherExperiments.map(exp => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </Card>
      )}

      {/* AI 优化建议 */}
      {suggestions.length > 0 && (
        <Card>
          <div style={sectionTitleStyle}>
            🤖 AI 优化建议 ({suggestions.length})
          </div>
          {suggestions.map(s => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </Card>
      )}
    </div>
  );
}
