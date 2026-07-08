'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 决策因素类型 */
export type FactorType = 'positive' | 'negative' | 'neutral';

/** 决策因素权重 */
export interface DecisionFactor {
  /** 因素名称 */
  name: string;
  /** 因素描述 */
  description?: string;
  /** 权重值 (0-100) */
  weight: number;
  /** 贡献方向 */
  type: FactorType;
  /** 细项说明 */
  details?: string[];
  /** 图标 */
  icon?: string;
}

/** 决策候选选项 */
export interface DecisionCandidate {
  /** 选项ID */
  id: string;
  /** 选项名称 */
  label: string;
  /** 评分 0-100 */
  score: number;
  /** 置信度 0-1 */
  confidence: number;
  /** 是否被选中 */
  selected: boolean;
  /** 优势因素 */
  strengths?: string[];
  /** 劣势因素 */
  weaknesses?: string[];
}

/** 决策执行步骤 */
export interface DecisionStep {
  /** 步骤序号 */
  order: number;
  /** 步骤名称 */
  name: string;
  /** 步骤状态 */
  status: 'completed' | 'running' | 'pending' | 'failed';
  /** 耗时 ms */
  durationMs?: number;
  /** 步骤输出 */
  output?: string;
}

/** 可解释性数据 */
export interface ExplainabilityData {
  /** 决策ID */
  decisionId: string;
  /** 决策时间 */
  timestamp: string;
  /** 决策类型标签 */
  decisionType: string;
  /** 最终决策 */
  finalDecision: string;
  /** 总体置信度 0-1 */
  overallConfidence: number;
  /** 决策因素分析 */
  factors: DecisionFactor[];
  /** 候选选项对比 */
  candidates?: DecisionCandidate[];
  /** 执行步骤 */
  steps: DecisionStep[];
  /** 决策摘要说明 */
  summary: string;
  /** 备选方案建议 */
  alternative?: string;
}

/** 组件 Props */
export interface AIDecisionExplainerPanelProps {
  /** 可解释性数据 */
  data: ExplainabilityData;
  /** 标题 */
  title?: string;
  /** 是否折叠 */
  collapsible?: boolean;
  /** 默认展开 */
  defaultExpanded?: boolean;
  /** 变体 */
  variant?: 'pc' | 'h5' | 'pad';
}

// ==================== 常量 ====================

const FACTOR_TYPE_CONFIG: Record<FactorType, { color: string; bg: string; label: string }> = {
  positive: { color: '#52c41a', bg: '#f6ffed', label: '正向贡献' },
  negative: { color: '#f5222d', bg: '#fff2f0', label: '负向抑制' },
  neutral:  { color: '#1677ff', bg: '#e6f4ff', label: '中性参考' },
};

const STEP_STATUS_CONFIG: Record<string, { icon: string; color: string }> = {
  completed: { icon: '✅', color: '#52c41a' },
  running:   { icon: '🔄', color: '#1677ff' },
  pending:   { icon: '⏳', color: '#8c8c8c' },
  failed:    { icon: '❌', color: '#f5222d' },
};

// ==================== 子组件 ====================

/** 决策置信度环 */
function ConfidenceRing({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  const strokeColor = value >= 0.8 ? '#52c41a' : value >= 0.5 ? '#faad14' : '#f5222d';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size > 60 ? 18 : 14,
          fontWeight: 700,
          color: strokeColor,
        }}
      >
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  );
}

/** 因素权重柱 */
function FactorBar({ factor }: { factor: DecisionFactor }) {
  const cfg = FACTOR_TYPE_CONFIG[factor.type];
  const barWidth = Math.min(Math.abs(factor.weight), 100);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {factor.icon && <span style={{ fontSize: 14 }}>{factor.icon}</span>}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1f1f1f' }}>
          {factor.name}
        </span>
        <span style={{ fontSize: 11, color: '#8c8c8c' }}>{factor.weight}%</span>
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 8,
            background: cfg.bg,
            color: cfg.color,
            fontWeight: 500,
          }}
        >
          {cfg.label}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            borderRadius: 3,
            background: cfg.color,
            opacity: 0.8,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      {factor.description && (
        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2, lineHeight: 1.4 }}>
          {factor.description}
        </div>
      )}
      {factor.details && factor.details.length > 0 && (
        <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12, color: '#595959' }}>
          {factor.details.map((d, i) => (
            <li key={i} style={{ marginBottom: 2 }}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 候选方案评分卡 */
function CandidateCard({ candidate }: { candidate: DecisionCandidate }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: `1px solid ${candidate.selected ? '#1677ff' : '#f0f0f0'}`,
        background: candidate.selected ? '#e6f4ff' : '#fff',
        position: 'relative',
      }}
    >
      {candidate.selected && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#1677ff',
            color: '#fff',
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          已选
        </span>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f' }}>{candidate.label}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: candidate.score >= 70 ? '#52c41a' : '#faad14' }}>
          {candidate.score}
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#8c8c8c' }}>置信度 </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: candidate.confidence >= 0.8 ? '#52c41a' : '#faad14' }}>
          {(candidate.confidence * 100).toFixed(0)}%
        </span>
      </div>
      {candidate.strengths && candidate.strengths.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#52c41a', fontWeight: 500 }}>优势: </span>
          {candidate.strengths.map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: '#595959' }}>
              {s}{i < candidate.strengths!.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
      {candidate.weaknesses && candidate.weaknesses.length > 0 && (
        <div>
          <span style={{ fontSize: 11, color: '#f5222d', fontWeight: 500 }}>劣势: </span>
          {candidate.weaknesses.map((w, i) => (
            <span key={i} style={{ fontSize: 11, color: '#595959' }}>
              {w}{i < candidate.weaknesses!.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export function AIDecisionExplainerPanel({
  data,
  title = 'AI 决策解释',
  collapsible = true,
  defaultExpanded = true,
  variant = 'pc',
}: AIDecisionExplainerPanelProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const isH5 = variant === 'h5';

  // 防御性：data 为空时不渲染内容
  if (!data) {
    return (
      <div
        data-testid="ai-decision-explainer-panel"
        style={{
          borderRadius: 16,
          border: '1px solid #e8e8e8',
          background: '#fff',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 20,
            background: '#fafafa',
          }}
        >
          <span style={{ fontSize: 20, marginRight: 10 }}>🤔</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f' }}>{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="ai-decision-explainer-panel"
      style={{
        borderRadius: 16,
        border: '1px solid #e8e8e8',
        background: '#fff',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 头部 */}
      <div
        data-testid="explainer-header"
        onClick={() => collapsible && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isH5 ? '14px 16px' : '16px 20px',
          cursor: collapsible ? 'pointer' : 'default',
          borderBottom: expanded ? '1px solid #f0f0f0' : 'none',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤔</span>
          <div>
            <div style={{ fontSize: isH5 ? 15 : 16, fontWeight: 600, color: '#1f1f1f' }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              {data.decisionType} · {data.decisionId.slice(0, 8)}...
            </div>
          </div>
        </div>
        {collapsible && (
          <span style={{ fontSize: 16, color: '#8c8c8c', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: isH5 ? 16 : 20 }}>
          {/* 决策摘要 */}
          <div
            style={{
              display: 'flex',
              gap: isH5 ? 12 : 20,
              alignItems: isH5 ? 'flex-start' : 'center',
              flexDirection: isH5 ? 'column' : 'row',
              marginBottom: 20,
              padding: 16,
              borderRadius: 12,
              background: '#fafafa',
            }}
          >
            <ConfidenceRing value={data.overallConfidence} size={isH5 ? 64 : 80} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f', marginBottom: 4 }}>
                {data.finalDecision}
              </div>
              <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, marginBottom: 4 }}>
                {data.summary}
              </div>
              {data.alternative && (
                <div style={{ fontSize: 12, color: '#faad14', background: '#fffbe6', padding: '6px 10px', borderRadius: 8, marginTop: 4 }}>
                  💡 备选建议: {data.alternative}
                </div>
              )}
            </div>
          </div>

          {/* 决策因素分析 */}
          <section style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📊</span> 影响因素分析
            </h4>
            <div data-testid="factors-section">
              {data.factors.map((factor, i) => (
                <FactorBar key={i} factor={factor} />
              ))}
            </div>
          </section>

          {/* 候选方案对比 */}
          {data.candidates && data.candidates.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚖️</span> 候选方案对比
              </h4>
              <div
                data-testid="candidates-section"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(data.candidates.length, isH5 ? 1 : 2)}, 1fr)`,
                  gap: 10,
                }}
              >
                {data.candidates.map((c) => (
                  <CandidateCard key={c.id} candidate={c} />
                ))}
              </div>
            </section>
          )}

          {/* 执行步骤 */}
          <section>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔍</span> 决策执行链路
            </h4>
            <div data-testid="steps-section">
              {data.steps.map((step) => {
                const cfg = STEP_STATUS_CONFIG[step.status] || { icon: '❓', color: '#8c8c8c' };
                return (
                  <div
                    key={step.order}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: '1px solid #f5f5f5',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                      <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                      {step.order < data.steps.length && (
                        <div style={{ width: 1, height: '100%', minHeight: 16, background: '#e8e8e8', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1f1f1f' }}>
                          {step.order}. {step.name}
                        </span>
                        {step.durationMs !== undefined && (
                          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{step.durationMs}ms</span>
                        )}
                      </div>
                      {step.output && (
                        <div style={{ fontSize: 12, color: '#595959', marginTop: 2, lineHeight: 1.5 }}>
                          {step.output}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 底部时间戳 */}
          <div style={{ marginTop: 16, textAlign: 'right', fontSize: 11, color: '#bfbfbf' }}>
            决策时间: {data.timestamp} · ID: {data.decisionId}
          </div>
        </div>
      )}
    </div>
  );
}
