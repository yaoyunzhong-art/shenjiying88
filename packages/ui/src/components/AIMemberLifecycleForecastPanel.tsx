'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 会员生命周期阶段 */
export type LifecycleStage =
  | 'new'        // 新注册
  | 'active'     // 活跃
  | 'engaged'    // 高粘性
  | 'slipping'   // 下滑
  | 'at_risk'    // 高危
  | 'churned';   // 已流失

/** 阶段指标 */
export interface StageMetric {
  /** 指标名称 */
  label: string;
  /** 当前值 */
  currentValue: number;
  /** 历史值 */
  previousValue: number;
  /** 单位 */
  unit: string;
  /** 变化方向 */
  direction: 'up' | 'down' | 'flat';
}

/** 阶段迁移建议 */
export interface StageTransitionAdvice {
  /** 目标阶段 */
  targetStage: LifecycleStage;
  /** 预期效果描述 */
  description: string;
  /** 建议行动项 */
  actions: string[];
  /** 预期改善幅度 0-100 */
  expectedImprovement: number;
  /** 预估周期 */
  expectedTimeline: string;
}

/** 生命周期预测结果 */
export interface MemberLifecycleForecast {
  /** 会员 ID */
  memberId: string;
  /** 会员名称 */
  memberName: string;
  /** 当前阶段 */
  currentStage: LifecycleStage;
  /** 上次阶段变化日期 */
  lastStageChange: string;
  /** 在该阶段停留天数 */
  daysInCurrentStage: number;
  /** 下一预测阶段 */
  predictedNextStage?: LifecycleStage;
  /** 预测置信度 0-100 */
  confidence: number;
  /** 预测时间窗口 (天数) */
  predictedWindowDays: number;
  /** 阶段关键指标 */
  metrics: StageMetric[];
  /** 阶段迁移建议 */
  advice: StageTransitionAdvice[];
  /** 历史阶段序列 */
  stageHistory: { stage: LifecycleStage; date: string }[];
  /** 生命周期价值预估 */
  estimatedLtv: number;
  /** 上期 LTV 对比 */
  previousLtv: number;
}

export interface AIMemberLifecycleForecastPanelProps {
  /** 预测数据 */
  forecast: MemberLifecycleForecast;
  /** 加载态 */
  loading?: boolean;
  /** 空态文本 */
  emptyText?: string;
  /** 自定义 class */
  className?: string;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 常量 ====================

const STAGE_LABELS: Record<LifecycleStage, string> = {
  new: '新注册',
  active: '活跃',
  engaged: '高粘性',
  slipping: '下滑',
  at_risk: '高危',
  churned: '已流失',
};

const STAGE_COLORS: Record<LifecycleStage, string> = {
  new: '#60a5fa',
  active: '#34d399',
  engaged: '#818cf8',
  slipping: '#fbbf24',
  at_risk: '#f97316',
  churned: '#ef4444',
};

const DIRECTION_LABELS: Record<string, { icon: string; color: string }> = {
  up: { icon: '↑', color: '#34d399' },
  down: { icon: '↓', color: '#ef4444' },
  flat: { icon: '→', color: '#94a3b8' },
};

const DIRECTION_LABELS_CN: Record<string, string> = {
  up: '上升',
  down: '下降',
  flat: '持平',
};

// ==================== 子组件 ====================

function LifecycleStageBadge({ stage, size = 'md' }: { stage: LifecycleStage; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyle = size === 'sm' ? { padding: '2px 8px', fontSize: 12 } : size === 'lg' ? { padding: '6px 16px', fontSize: 16 } : { padding: '4px 12px', fontSize: 14 };
  return (
    <span
      data-testid={`stage-badge-${stage}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 9999,
        fontWeight: 600,
        background: `${STAGE_COLORS[stage]}22`,
        color: STAGE_COLORS[stage],
        border: `1px solid ${STAGE_COLORS[stage]}44`,
        ...sizeStyle,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: STAGE_COLORS[stage] }} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

// ==================== 主组件 ====================

export function AIMemberLifecycleForecastPanel({
  forecast,
  loading = false,
  emptyText = '暂无预测数据',
  className,
  'data-testid': testId = 'ai-member-lifecycle-forecast-panel',
}: AIMemberLifecycleForecastPanelProps) {
  const containerStyle: React.CSSProperties = {
    borderRadius: 20,
    padding: 24,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  const sectionStyle: React.CSSProperties = {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  };

  if (loading) {
    return (
      <div style={containerStyle} data-testid={`${testId}-loading`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#94a3b8' }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 24, height: 24 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ marginLeft: 10 }}>加载中...</span>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#94a3b8' }} data-testid={`${testId}-empty`}>
        {emptyText}
      </div>
    );
  }

  // 计算 LTV 变化 (必须先检查 forecast 非 null)
  const ltvDirection = useMemo<'up' | 'down' | 'flat'>(() => {
    if (forecast.estimatedLtv > forecast.previousLtv) return 'up';
    if (forecast.estimatedLtv < forecast.previousLtv) return 'down';
    return 'flat';
  }, [forecast.estimatedLtv, forecast.previousLtv]);

  // 置信度文字
  const confidenceLabel = useMemo(() => {
    if (forecast.confidence >= 80) return '高';
    if (forecast.confidence >= 50) return '中';
    return '低';
  }, [forecast.confidence]);

  return (
    <div className={className} style={containerStyle} data-testid={testId}>
      {/* 标题区 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>AI 会员生命周期预测</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {forecast.memberName}（{forecast.memberId}）
          </div>
        </div>
        <LifecycleStageBadge stage={forecast.currentStage} size="lg" />
      </div>

      {/* 状态卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatusCard label="当前阶段" value={STAGE_LABELS[forecast.currentStage]} color={STAGE_COLORS[forecast.currentStage]} />
        <StatusCard
          label="下一预测"
          value={forecast.predictedNextStage ? STAGE_LABELS[forecast.predictedNextStage] : '—'}
          color={forecast.predictedNextStage ? STAGE_COLORS[forecast.predictedNextStage] : '#94a3b8'}
        />
        <StatusCard label="置信度" value={`${forecast.confidence}%`} subText={confidenceLabel} color="#818cf8" />
        <StatusCard label="预估 LTV" value={`¥${forecast.estimatedLtv.toLocaleString()}`} subText={`上月 ¥${forecast.previousLtv.toLocaleString()} (${DIRECTION_LABELS_CN[ltvDirection]})`} color={ltvDirection === 'up' ? '#34d399' : ltvDirection === 'down' ? '#ef4444' : '#94a3b8'} />
      </div>

      {/* 阶段关键指标 */}
      <div style={sectionStyle} data-testid={`${testId}-metrics`}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>阶段关键指标</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {forecast.metrics.map((metric, idx) => {
            const dir = DIRECTION_LABELS[metric.direction] ?? { icon: '?', color: '#94a3b8' };
            const pctChange = metric.previousValue > 0
              ? ((metric.currentValue - metric.previousValue) / metric.previousValue * 100).toFixed(1)
              : '—';
            return (
              <div key={idx} style={{ padding: '10px 12px', borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>{metric.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  {metric.currentValue}{metric.unit}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: dir.color }}>
                  {dir.icon} {pctChange}% ({metric.previousValue}{metric.unit})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 阶段迁移建议 */}
      {forecast.advice.length > 0 && (
        <div style={sectionStyle} data-testid={`${testId}-advice`}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>阶段迁移建议</div>
          {forecast.advice.map((advice, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                marginBottom: idx < forecast.advice.length - 1 ? 10 : 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <LifecycleStageBadge stage={advice.targetStage} size="sm" />
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#64748b' }}>{advice.description}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>+{advice.expectedImprovement}%</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{advice.expectedTimeline}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {advice.actions.map((action, ai) => (
                  <span
                    key={ai}
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 9999,
                      fontSize: 12,
                      background: '#eff6ff',
                      color: '#3b82f6',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 历史阶段序列 */}
      {forecast.stageHistory.length > 0 && (
        <div style={sectionStyle} data-testid={`${testId}-history`}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>阶段变迁记录</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {forecast.stageHistory.map((h, idx) => (
              <React.Fragment key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      display: 'inline-block',
                      background: STAGE_COLORS[h.stage],
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#475569' }}>{STAGE_LABELS[h.stage]}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{h.date.slice(0, 10)}</span>
                </div>
                {idx < forecast.stageHistory.length - 1 && (
                  <span style={{ color: '#cbd5e1', fontSize: 12, margin: '0 2px' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 预测参数 */}
      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
        <span>上次阶段变更: {forecast.lastStageChange.slice(0, 10)}</span>
        <span>当前阶段已 {forecast.daysInCurrentStage} 天</span>
        <span>预测窗口: {forecast.predictedWindowDays} 天</span>
      </div>
    </div>
  );
}

// ==================== 辅助组件 ====================

function StatusCard({
  label,
  value,
  subText,
  color,
}: {
  label: string;
  value: string;
  subText?: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: '#ffffff',
        border: `1px solid ${color}22`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{value}</div>
      {subText && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subText}</div>}
    </div>
  );
}
