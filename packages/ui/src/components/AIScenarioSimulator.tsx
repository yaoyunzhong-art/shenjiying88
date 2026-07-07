'use client';

import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { StatTrend } from './StatTrend';
import { Button } from './Button';
import { Select } from './Select';
import { Spinner } from './Spinner';

// ─── 类型定义 ───────────────────────────────────────────

export interface ScenarioVariable {
  id: string;
  label: string;
  type: 'number' | 'select';
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

export interface SimulationResult {
  variable: string;
  before: number;
  after: number;
  unit: string;
  direction: 'up' | 'down' | 'flat';
  changePercent: number;
}

export interface AIScenarioSimulatorProps {
  /** 场景名称 */
  scenarioName: string;
  /** 可调变量列表 */
  variables: ScenarioVariable[];
  /** 模拟回调（返回预测结果） */
  onSimulate: (
    values: Record<string, number | string>,
  ) => Promise<SimulationResult[]>;
  /** 初始基线说明 */
  baselineDescription?: string;
  /** 加载中文本 */
  loadingText?: string;
  /** 错误时文本 */
  errorText?: string;
  style?: React.CSSProperties;
}

// ─── 迷你 InputNumber ──────────────────────────────────

const MiniNumberInput: React.FC<{
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, step = 1, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #D1D5DB',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
};

// ─── 组件 ───────────────────────────────────────────────

export const AIScenarioSimulator: React.FC<AIScenarioSimulatorProps> = ({
  scenarioName,
  variables,
  onSimulate,
  baselineDescription = '当前基线',
  loadingText = 'AI 模拟计算中…',
  errorText = '模拟失败，请重试',
  style,
}) => {
  const [values, setValues] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {};
    variables.forEach((v) => {
      init[v.id] = v.defaultValue;
    });
    return init;
  });

  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return variables.every((v) => {
      const val = values[v.id];
      if (val === undefined || val === null) return false;
      if (v.type === 'number' && typeof val === 'number') {
        if (v.min !== undefined && val < v.min) return false;
        if (v.max !== undefined && val > v.max) return false;
      }
      return true;
    });
  }, [values, variables]);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onSimulate(values);
      setResults(res);
    } catch {
      setError(errorText);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const init: Record<string, number | string> = {};
    variables.forEach((v) => {
      init[v.id] = v.defaultValue;
    });
    setValues(init);
    setResults(null);
    setError(null);
  };

  return (
    <Card
      title={`🤖 ${scenarioName}`}
      subtitle="调整变量后点击「模拟运行」查看 AI 预测结果"
      style={style}
    >
      {/* 变量输入区 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {variables.map((v) => (
          <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {v.label}
            </label>
            {v.type === 'number' ? (
              <MiniNumberInput
                value={values[v.id] as number}
                min={v.min}
                max={v.max}
                step={v.step ?? 1}
                onChange={(val: number) =>
                  setValues((prev) => ({ ...prev, [v.id]: val }))
                }
              />
            ) : (
              <Select
                value={values[v.id] as string}
                options={v.options ?? []}
                onChange={(val: string) =>
                  setValues((prev) => ({ ...prev, [v.id]: val }))
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button
          variant="primary"
          onClick={handleRunSimulation}
          disabled={!isValid || loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size="sm" /> {loadingText}
            </span>
          ) : (
            '▶ 模拟运行'
          )}
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          重置
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 6,
            color: '#B91C1C',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* 模拟结果 */}
      {results && (
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
            📊 模拟结果 ({baselineDescription} → 调整后)
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {results.map((r, idx) => (
              <StatTrend
                key={`${r.variable}-${idx}`}
                label={r.variable}
                value={`${r.after.toLocaleString()} ${r.unit}`}
                direction={r.direction === 'flat' ? 'stable' : r.direction}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIScenarioSimulator;
