'use client';

import React, { useCallback } from 'react';
import type { AIRuleWeightPanelProps, RuleWeightItem, WeightAdjustResult } from './types';

// ── Color helpers ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  risk: '#fee2e2',
  promotion: '#fef3c7',
  member: '#dbeafe',
  stock: '#dcfce7',
  staff: '#f3e8ff',
};

const CATEGORY_LABELS: Record<string, string> = {
  risk: '风控',
  promotion: '营销',
  member: '会员',
  stock: '库存',
  staff: '人力',
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  risk: '#ef4444',
  promotion: '#f59e0b',
  member: '#3b82f6',
  stock: '#22c55e',
  staff: '#a855f7',
};

// ── Slider ──────────────────────────────────────────────────────────────────

function WeightSlider({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={5}
      value={value}
      disabled={disabled}
      onChange={e => onChange(Number(e.target.value))}
      aria-label="权重滑块"
      style={{
        width: '100%',
        accentColor: disabled ? '#94a3b8' : '#6366f1',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    />
  );
}

// ── Weight Badge ────────────────────────────────────────────────────────────

function WeightBadge({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 80) return '#ef4444';
    if (value >= 60) return '#f59e0b';
    if (value >= 40) return '#3b82f6';
    return '#6b7280';
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        height: 28,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        color: '#fff',
        backgroundColor: getColor(),
      }}
    >
      {value}
    </span>
  );
}

// ── Rule Row ────────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  onWeightChange,
}: {
  rule: RuleWeightItem;
  onWeightChange: (ruleId: string, v: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: rule.enabled ? '#fff' : '#f8fafc',
        border: '1px solid',
        borderColor: rule.enabled ? '#e2e8f0' : '#f1f5f9',
      }}
    >
      {/* Category badge */}
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          background: CATEGORY_BADGE_COLORS[rule.category] ?? '#94a3b8',
          whiteSpace: 'nowrap',
          minWidth: 36,
          textAlign: 'center',
        }}
      >
        {CATEGORY_LABELS[rule.category] ?? rule.category}
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: rule.enabled ? '#1e293b' : '#94a3b8',
          }}
        >
          {rule.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: rule.enabled ? '#64748b' : '#cbd5e1',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rule.description}
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: 160 }}>
        <WeightSlider
          value={rule.currentWeight}
          disabled={!rule.adjustable || !rule.enabled}
          onChange={v => onWeightChange(rule.id, v)}
        />
      </div>

      {/* Value badge */}
      <WeightBadge value={rule.currentWeight} />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function AIRuleWeightPanel({
  rules,
  onWeightChange,
  onBatchAdjust,
  onReset,
  loading = false,
  disabled = false,
}: AIRuleWeightPanelProps) {
  const handleWeightChange = useCallback(
    (ruleId: string, newWeight: number) => {
      onWeightChange?.(ruleId, newWeight);
    },
    [onWeightChange],
  );

  const handleBatchApply = useCallback(() => {
    const adjustments: WeightAdjustResult[] = rules
      .filter(r => r.adjustable && r.enabled)
      .map(r => ({
        ruleId: r.id,
        oldWeight: r.currentWeight,
        newWeight: r.currentWeight,
        impact: r.currentWeight >= 80 ? 'high' : r.currentWeight >= 50 ? 'medium' : 'low',
        affectedCount: Math.floor(Math.random() * 500) + 50,
        previewImpact:
          r.currentWeight >= 80 ? '高影响 — 建议审慎调整' : r.currentWeight >= 50 ? '中等影响' : '低影响',
      }));
    onBatchAdjust?.(adjustments);
  }, [rules, onBatchAdjust]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 14,
        }}
      >
        ⏳ 加载规则权重配置中...
      </div>
    );
  }

  const enabledRules = rules.filter(r => r.enabled);
  const disabledRules = rules.filter(r => !r.enabled);

  return (
    <div
      style={{
        borderRadius: 12,
        background: '#f8fafc',
        padding: 16,
        border: '1px solid #e2e8f0',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            🤖 AI 规则权重面板
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            调整各规则执行权重以优化 AI 决策效果 — 权重范围 0 ~ 100
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleBatchApply}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #6366f1',
              background: '#6366f1',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            批量应用
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            重置
          </button>
        </div>
      </div>

      {/* Enabled rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {enabledRules.map(rule => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onWeightChange={handleWeightChange}
          />
        ))}
      </div>

      {/* Disabled rules section */}
      {disabledRules.length > 0 && (
        <details>
          <summary
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            已禁用的规则（{disabledRules.length}）
          </summary>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 8,
            }}
          >
            {disabledRules.map(rule => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onWeightChange={handleWeightChange}
              />
            ))}
          </div>
        </details>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #e2e8f0',
          fontSize: 11,
          color: '#94a3b8',
        }}
      >
        <span>🔴 ≥80 高权重</span>
        <span>🟡 60~79 中权重</span>
        <span>🔵 40~59 较低权重</span>
        <span>⚪ &lt;40 低权重</span>
      </div>
    </div>
  );
}
