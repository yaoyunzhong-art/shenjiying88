'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 排班约束类型 */
export type SchedulingConstraintType =
  | 'max_weekly_hours'
  | 'min_rest_hours'
  | 'preferred_shift'
  | 'skill_requirement'
  | 'max_consecutive_days';

/** 排班约束 */
export interface SchedulingConstraint {
  type: SchedulingConstraintType;
  label: string;
  value: number | string;
  active: boolean;
}

/** 员工排班偏好 */
export interface StaffPreference {
  staffId: string;
  staffName: string;
  /** 员工等级 / 技能标签 */
  skills: string[];
  /** 可用工时(周) */
  availableWeeklyHours: number;
  /** 偏好班次: morning/afternoon/night */
  preferredShift: 'morning' | 'afternoon' | 'night' | 'flexible';
  /** 已排天数 */
  scheduledDays?: number;
  /** 头像颜色 */
  avatarColor?: string;
}

/** 排班时间段 */
export interface ScheduleSlot {
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  assignedStaff: string[];
}

/** AI 推荐结果 */
export interface SchedulingRecommendation {
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  recommendedStaff: string[];
  confidenceScore: number;
  /** 替代人选 */
  alternates?: string[];
  /** 推荐依据 */
  rationale?: string;
}

/** AI 智能排班面板 Props */
export interface AISmartSchedulingPanelProps {
  /** 员工列表 */
  staff: StaffPreference[];
  /** 待排班时间段 */
  slots: ScheduleSlot[];
  /** AI 推荐结果 */
  recommendations?: SchedulingRecommendation[];
  /** 面板标题 */
  title?: string;
  /** 正在生成中 */
  isGenerating?: boolean;
  /** 约束条件 */
  constraints?: SchedulingConstraint[];
  /** 生成排班回调 */
  onGenerate?: () => void;
  /** 应用推荐回调 */
  onApplyRecommendation?: (rec: SchedulingRecommendation) => void;
  /** 批量应用所有推荐 */
  onApplyAll?: (recs: SchedulingRecommendation[]) => void;
  /** 修改约束回调 */
  onToggleConstraint?: (type: SchedulingConstraintType) => void;
  /** 自定义类名 */
  className?: string;
}

// ==================== 辅助组件 ====================

/** 置信度徽标 */
function ConfidenceBadge({ score }: { score: number }) {
  let color: string;
  let label: string;
  if (score >= 0.9) { color = '#22c55e'; label = '高'; }
  else if (score >= 0.7) { color = '#eab308'; label = '中'; }
  else { color = '#ef4444'; label = '低'; }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}14`,
        padding: '2px 8px',
        borderRadius: 10,
      }}
      data-testid={`confidence-${label}`}
    >
      <span style={{ fontSize: 10 }}>●</span>
      {label} ({Math.round(score * 100)}%)
    </span>
  );
}

/** 约束标签 */
function ConstraintChip({
  constraint,
  onToggle,
}: {
  constraint: SchedulingConstraint;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={`constraint-${constraint.type}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        fontSize: 12,
        borderRadius: 6,
        border: `1px solid ${constraint.active ? '#6366f1' : '#d1d5db'}`,
        background: constraint.active ? 'rgba(99,102,241,0.08)' : '#fff',
        color: constraint.active ? '#6366f1' : '#9ca3af',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 10 }}>{constraint.active ? '✓' : '○'}</span>
      {constraint.label}
      <span style={{ opacity: 0.6, fontSize: 11 }}>
        {typeof constraint.value === 'number' ? `${constraint.value}h` : constraint.value}
      </span>
    </button>
  );
}

// ==================== 主组件 ====================

export function AISmartSchedulingPanel({
  staff,
  slots,
  recommendations = [],
  title = 'AI 智能排班',
  isGenerating = false,
  constraints: initialConstraints,
  onGenerate,
  onApplyRecommendation,
  onApplyAll,
  onToggleConstraint,
  className,
}: AISmartSchedulingPanelProps) {
  const defaultConstraints: SchedulingConstraint[] = [
    { type: 'max_weekly_hours', label: '周上限工时', value: 40, active: true },
    { type: 'min_rest_hours', label: '最短休息间隔', value: 12, active: true },
    { type: 'skill_requirement', label: '技能匹配', value: '是', active: true },
    { type: 'max_consecutive_days', label: '连续排班上限', value: 6, active: false },
  ];

  const [constraints, setConstraints] = useState<SchedulingConstraint[]>(
    initialConstraints ?? defaultConstraints,
  );

  const handleToggleConstraint = (type: SchedulingConstraintType) => {
    setConstraints((prev) =>
      prev.map((c) => (c.type === type ? { ...c, active: !c.active } : c)),
    );
    onToggleConstraint?.(type);
  };

  /** 已排班统计 */
  const scheduleStats = useMemo(() => {
    const totalStaff = staff.length;
    const coveredSlots = recommendations.filter((r) => r.confidenceScore >= 0.9).length;
    const coverage = recommendations.length > 0
      ? Math.round((coveredSlots / slots.length) * 100)
      : 0;
    return { totalStaff, coveredSlots, coverage };
  }, [staff, recommendations, slots]);

  /** 员工工时概览 */
  const staffHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    recommendations.forEach((rec) => {
      rec.recommendedStaff.forEach((sid) => {
        map.set(sid, (map.get(sid) ?? 0) + 8);
      });
    });
    return map;
  }, [recommendations]);

  return (
    <div
      className={className}
      data-testid="ai-smart-scheduling-panel"
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111' }}>{title}</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {staff.length} 名员工 · {slots.length} 个班次待排
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {recommendations.length > 0 && onApplyAll && (
            <button
              type="button"
              onClick={() => onApplyAll(recommendations)}
              data-testid="apply-all-btn"
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid #6366f1',
                background: '#6366f1',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              全部应用
            </button>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            data-testid="generate-btn"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              background: isGenerating ? '#e5e7eb' : '#6366f1',
              color: isGenerating ? '#9ca3af' : '#fff',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #d1d5db', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                生成中…
              </>
            ) : (
              '🤖 生成排班'
            )}
          </button>
        </div>
      </div>

      {/* 约束条件行 */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {constraints.map((c) => (
          <ConstraintChip
            key={c.type}
            constraint={c}
            onToggle={() => handleToggleConstraint(c.type)}
          />
        ))}
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: '#f3f4f6',
        }}
      >
        <div style={{ background: '#fff', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{staff.length}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>排班员工</div>
        </div>
        <div style={{ background: '#fff', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#6366f1' }}>
            {scheduleStats.coveredSlots}/{slots.length}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>已覆盖班次</div>
        </div>
        <div style={{ background: '#fff', padding: '12px 16px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: scheduleStats.coverage >= 80 ? '#22c55e' : '#eab308',
            }}
          >
            {scheduleStats.coverage}%
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>排班覆盖率</div>
        </div>
      </div>

      {/* 推荐列表 */}
      <div style={{ padding: 16 }}>
        {isGenerating && recommendations.length === 0 && (
          <div
            data-testid="generating-placeholder"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
            AI 正在分析员工可用性、技能匹配与约束条件…
          </div>
        )}

        {!isGenerating && recommendations.length === 0 && (
          <div
            data-testid="empty-placeholder"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            暂无排班推荐，点击上方按钮生成
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((rec, idx) => (
              <div
                key={`${rec.date}-${rec.shiftName}-${idx}`}
                data-testid={`recommendation-${idx}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: rec.confidenceScore >= 0.9
                    ? 'rgba(34,197,94,0.04)'
                    : rec.confidenceScore >= 0.7
                      ? 'rgba(234,179,8,0.04)'
                      : 'rgba(239,68,68,0.04)',
                  border: '1px solid #f3f4f6',
                }}
              >
                {/* 左侧信息 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {rec.date}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {rec.shiftName}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {rec.startTime}-{rec.endTime}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {rec.recommendedStaff.map((name) => {
                      const s = staff.find((st) => st.staffId === name);
                      return (
                        <span
                          key={name}
                          data-testid={`staff-${name}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: s?.avatarColor
                              ? `${s.avatarColor}18`
                              : '#eef2ff',
                            color: s?.avatarColor ?? '#6366f1',
                            fontWeight: 500,
                          }}
                        >
                          {s?.staffName ?? name}
                        </span>
                      );
                    })}
                    {rec.alternates && rec.alternates.length > 0 && (
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
                        备选: {rec.alternates.map((a) => staff.find((s) => s.staffId === a)?.staffName ?? a).join(', ')}
                      </span>
                    )}
                  </div>
                  {rec.rationale && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                      💡 {rec.rationale}
                    </p>
                  )}
                </div>

                {/* 右侧操作 */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}
                >
                  <ConfidenceBadge score={rec.confidenceScore} />
                  {onApplyRecommendation && (
                    <button
                      type="button"
                      onClick={() => onApplyRecommendation(rec)}
                      data-testid={`apply-rec-${idx}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      应用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部员工工时概览 */}
      {recommendations.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            padding: '12px 20px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
            员工工时概览
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {staff.map((s) => {
              const scheduled = staffHoursMap.get(s.staffId) ?? 0;
              const pct = Math.round((scheduled / s.availableWeeklyHours) * 100);
              const isOver = scheduled > s.availableWeeklyHours;
              return (
                <div
                  key={s.staffId}
                  data-testid={`staff-hours-${s.staffId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: isOver ? 'rgba(239,68,68,0.08)' : '#f9fafb',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: s.avatarColor ?? '#6366f1',
                    }}
                  />
                  <span style={{ fontWeight: 500, color: '#374151' }}>{s.staffName}</span>
                  <span style={{ color: isOver ? '#ef4444' : '#6b7280' }}>
                    {scheduled}/{s.availableWeeklyHours}h
                  </span>
                  <span style={{ color: isOver ? '#ef4444' : '#22c55e', fontSize: 11 }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
