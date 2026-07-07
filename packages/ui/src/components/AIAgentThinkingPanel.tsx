'use client';

import React, { useState } from 'react';

// ==================== 类型定义 ====================

/** 推理步骤状态 */
export type ReasoningStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'error';

/** 单个推理步骤 */
export interface ReasoningStep {
  /** 步骤 ID */
  id: string;
  /** 步骤序号 */
  index: number;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description?: string;
  /** 当前状态 */
  status: ReasoningStepStatus;
  /** 耗时(ms) */
  durationMs?: number;
  /** 中间结论 */
  conclusion?: string;
  /** 置信度 (0-100) */
  confidence?: number;
  /** 替代方案列表 */
  alternatives?: string[];
}

/** 最终决策结论 */
export interface AgentConclusion {
  /** 建议措施 */
  action: string;
  /** 总体置信度 (0-100) */
  confidence: number;
  /** 关键依据 */
  rationale: string;
  /** 风险提示 */
  risks?: string[];
  /** 建议优先级 */
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

/** AI 代理思考面板 Props */
export interface AIAgentThinkingPanelProps {
  /** 代理名称 */
  agentName: string;
  /** 推理步骤列表 */
  steps: ReasoningStep[];
  /** 最终结论 */
  conclusion?: AgentConclusion;
  /** 面板标题 */
  title?: string;
  /** 思考总耗时(ms) */
  totalDurationMs?: number;
  /** 加载中（模拟思考动画） */
  thinking?: boolean;
  /** 是否默认展开步骤 */
  defaultExpanded?: boolean;
  /** 空状态文本 */
  emptyText?: string;
  /** 测试 id */
  'data-testid'?: string;
  /** 类名 */
  className?: string;
}

// ==================== 子组件 ====================

function StatusIcon({ status }: { status: ReasoningStepStatus }) {
  const icons: Record<ReasoningStepStatus, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    skipped: '⏭️',
    error: '❌',
  };
  return (
    <span data-testid={`step-status-icon-${status}`} style={{ fontSize: 14, lineHeight: 1 }}>
      {icons[status] || icons.pending}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: AgentConclusion['priority'] }) {
  const colorMap: Record<string, string> = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#16a34a',
  };
  const labelMap: Record<string, string> = {
    urgent: '紧急',
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };
  return (
    <span
      data-testid={`priority-badge-${priority}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: colorMap[priority] || '#6b7280',
      }}
    >
      {labelMap[priority] || priority}
    </span>
  );
}

// ==================== 主组件 ====================

export function AIAgentThinkingPanel({
  agentName,
  steps,
  conclusion,
  title,
  totalDurationMs,
  thinking = false,
  defaultExpanded = true,
  emptyText = '暂无推理过程',
  'data-testid': dataTestId = 'ai-agent-thinking-panel',
  className = '',
}: AIAgentThinkingPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    // When defaultExpanded is true, all steps start expanded
    steps.forEach((s) => { map[s.id] = defaultExpanded; });
    return map;
  });

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const errorCount = steps.filter((s) => s.status === 'error').length;
  const avgConfidence = steps
    .filter((s) => s.confidence != null)
    .reduce((acc, s) => acc + (s.confidence ?? 0), 0) /
    Math.max(steps.filter((s) => s.confidence != null).length, 1);

  // ---------- 空状态 ----------
  if (!thinking && steps.length === 0) {
    return (
      <div
        data-testid={`${dataTestId}-empty`}
        className={className}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ---------- Header ---------- */}
      <div
        data-testid={`${dataTestId}-header`}
        style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {title || `${agentName} 推理过程`}
            </div>
            {totalDurationMs != null && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                耗时 {totalDurationMs}ms
              </div>
            )}
          </div>
        </div>

        {thinking && (
          <span
            data-testid={`${dataTestId}-thinking-badge`}
            style={{
              fontSize: 12,
              color: '#6366f1',
              background: '#eef2ff',
              padding: '2px 8px',
              borderRadius: 4,
              animation: 'pulse 1.5s infinite',
            }}
          >
            思考中...
          </span>
        )}

        {!thinking && steps.length > 0 && (
          <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
            <div data-testid={`${dataTestId}-progress`}>
              {completedCount}/{steps.length} 步完成
            </div>
            {errorCount > 0 && (
              <div style={{ color: '#dc2626' }}>{errorCount} 个错误</div>
            )}
            {avgConfidence > 0 && (
              <div style={{ color: '#16a34a' }}>平均置信度 {avgConfidence.toFixed(0)}%</div>
            )}
          </div>
        )}
      </div>

      {/* ---------- Steps ---------- */}
      <div data-testid={`${dataTestId}-steps`} style={{ padding: '8px 0' }}>
        {steps.map((step) => {
          const isExpanded = expandedSteps[step.id];
          return (
            <div
              key={step.id}
              data-testid={`${dataTestId}-step-${step.id}`}
              style={{
                borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.15s',
              }}
            >
              {/* Step header (clickable) */}
              <button
                type="button"
                data-testid={`${dataTestId}-step-toggle-${step.id}`}
                onClick={() => toggleStep(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#374151',
                  textAlign: 'left',
                }}
              >
                <StatusIcon status={step.status} />
                <span style={{ fontWeight: 500 }}>步骤 {step.index}: {step.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                  {step.durationMs ? `${step.durationMs}ms` : ''}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', transform: isExpanded ? 'rotate(180deg)' : undefined }}>
                  ▼
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  data-testid={`${dataTestId}-step-body-${step.id}`}
                  style={{
                    padding: '0 16px 12px 42px',
                    fontSize: 13,
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {step.description && (
                    <div style={{ marginBottom: 6 }}>{step.description}</div>
                  )}

                  {step.conclusion && (
                    <div
                      data-testid={`${dataTestId}-step-conclusion-${step.id}`}
                      style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        background: '#f0fdf4',
                        borderLeft: '3px solid #22c55e',
                        borderRadius: 4,
                        color: '#15803d',
                      }}
                    >
                      <strong>结论:</strong> {step.conclusion}
                    </div>
                  )}

                  {step.alternatives && step.alternatives.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>替代方案:</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {step.alternatives.map((alt, i) => (
                          <li key={i} style={{ marginBottom: 2 }}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.confidence != null && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>置信度:</span>
                      <div
                        data-testid={`${dataTestId}-step-confidence-${step.id}`}
                        style={{
                          height: 6,
                          width: 80,
                          background: '#e5e7eb',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${step.confidence}%`,
                            background: step.confidence >= 80 ? '#22c55e' : step.confidence >= 50 ? '#eab308' : '#ef4444',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{step.confidence}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Conclusion ---------- */}
      {conclusion && (
        <div
          data-testid={`${dataTestId}-conclusion`}
          style={{
            padding: 16,
            borderTop: '2px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>决策建议</span>
            <PriorityBadge priority={conclusion.priority} />
          </div>

          <div
            data-testid={`${dataTestId}-action`}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#1d4ed8',
              marginBottom: 8,
            }}
          >
            {conclusion.action}
          </div>

          <div
            data-testid={`${dataTestId}-rationale`}
            style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}
          >
            {conclusion.rationale}
          </div>

          {/* Confidence bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>推荐置信度</span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
                maxWidth: 180,
              }}
            >
              <div
                data-testid={`${dataTestId}-confidence-bar`}
                style={{
                  height: '100%',
                  width: `${conclusion.confidence}%`,
                  background: conclusion.confidence >= 80
                    ? '#22c55e'
                    : conclusion.confidence >= 50
                      ? '#eab308'
                      : '#ef4444',
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {conclusion.confidence}%
            </span>
          </div>

          {/* Risks */}
          {conclusion.risks && conclusion.risks.length > 0 && (
            <div
              data-testid={`${dataTestId}-risks`}
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: '#fef2f2',
                borderLeft: '3px solid #ef4444',
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>
                风险提示
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#b91c1c' }}>
                {conclusion.risks.map((risk, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIAgentThinkingPanel;
