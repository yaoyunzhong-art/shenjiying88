'use client';

import React, { useState, useCallback } from 'react';

// ==================== 类型定义 ====================

/** 策略参数类型 */
export type StrategyParamType = 'number' | 'string' | 'boolean' | 'select' | 'tags';

/** 策略参数选项 */
export interface StrategyParamOption {
  label: string;
  value: string;
}

/** 策略参数定义 */
export interface StrategyParamDef {
  /** 参数 key */
  key: string;
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description?: string;
  /** 参数类型 */
  type: StrategyParamType;
  /** 默认值 */
  defaultValue: string | number | boolean | string[];
  /** 当前值（编辑时） */
  value?: string | number | boolean | string[];
  /** select/tags 的可选值 */
  options?: StrategyParamOption[];
  /** 数值范围（type=number） */
  min?: number;
  max?: number;
  step?: number;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 校验正则 */
  pattern?: string;
  /** 校验提示 */
  patternMessage?: string;
}

/** 策略规则条件 */
export interface StrategyCondition {
  /** 条件 ID */
  id: string;
  /** 条件字段 */
  field: string;
  /** 运算符 */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  /** 条件值 */
  value: string | number;
  /** 关联值（between 时第二个值） */
  value2?: string | number;
}

/** 策略定义 */
export interface StrategyConfig {
  /** 策略 ID */
  id: string;
  /** 策略名称 */
  name: string;
  /** 策略描述 */
  description?: string;
  /** 策略分类 */
  category?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（1-100，越高越优先） */
  priority: number;
  /** 参数配置 */
  params: StrategyParamDef[];
  /** 触发条件 */
  conditions?: StrategyCondition[];
  /** 标签 */
  tags?: string[];
  /** 最后修改时间 */
  updatedAt?: string;
}

/** 策略配置面板 Props */
export interface StrategyConfigPanelProps {
  /** 当前策略配置 */
  strategy: StrategyConfig;
  /** 面板标题 */
  title?: string;
  /** 策略分类选项 */
  categoryOptions?: StrategyParamOption[];
  /** 保存回调 */
  onSave?: (config: StrategyConfig) => void;
  /** 重置回调 */
  onReset?: (config: StrategyConfig) => void;
  /** 启用/禁用回调 */
  onToggle?: (id: string, enabled: boolean) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否只读模式 */
  readOnly?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 保存提示文案 */
  saveLabel?: string;
  /** 重置提示文案 */
  resetLabel?: string;
}

// ==================== 颜色/状态映射 ====================

const PRIORITY_COLORS: { high: string; medium: string; low: string } = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

function getPriorityLevel(p: number): { label: string; color: string } {
  if (p >= 80) return { label: '高', color: PRIORITY_COLORS.high };
  if (p >= 40) return { label: '中', color: PRIORITY_COLORS.medium };
  return { label: '低', color: PRIORITY_COLORS.low };
}

// ==================== 子组件 ====================

/** 参数值渲染/输入 */
function ParamInput({
  def,
  onChange,
  readOnly,
}: {
  def: StrategyParamDef;
  onChange: (key: string, value: string | number | boolean | string[]) => void;
  readOnly: boolean;
}) {
  const currentVal = def.value ?? def.defaultValue;

  const handleChange = (val: string | number | boolean | string[]) => {
    onChange(def.key, val);
  };

  switch (def.type) {
    case 'number': {
      const numVal = typeof currentVal === 'number' ? currentVal : Number(currentVal) || 0;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={def.min ?? 0}
            max={def.max ?? 100}
            step={def.step ?? 1}
            value={numVal}
            disabled={readOnly}
            onChange={(e) => handleChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#3b82f6' }}
          />
          <input
            type="number"
            min={def.min ?? 0}
            max={def.max ?? 100}
            step={def.step ?? 1}
            value={numVal}
            disabled={readOnly}
            onChange={(e) => handleChange(Number(e.target.value))}
            style={{
              width: 70,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.4)',
              color: '#e2e8f0',
              fontSize: 12,
              textAlign: 'center',
            }}
          />
        </div>
      );
    }
    case 'boolean':
      return (
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: readOnly ? 'default' : 'pointer',
            opacity: readOnly ? 0.6 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(currentVal)}
            disabled={readOnly}
            onChange={(e) => handleChange(e.target.checked)}
            style={{ accentColor: '#3b82f6' }}
          />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {Boolean(currentVal) ? '已启用' : '未启用'}
          </span>
        </label>
      );
    case 'select': {
      return (
        <select
          value={String(currentVal)}
          disabled={readOnly}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.4)',
            color: '#e2e8f0',
            fontSize: 12,
          }}
        >
          {(def.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    case 'tags': {
      const tags = Array.isArray(currentVal) ? (currentVal as string[]) : [];
      const allOptions = def.options ?? [];
      const [searchText, setSearchText] = useState('');
      const filteredOptions = allOptions.filter(
        (o) => !tags.includes(o.value) && o.label.includes(searchText)
      );

      const addTag = (val: string) => {
        if (!tags.includes(val)) handleChange([...tags, val]);
      };
      const removeTag = (val: string) => {
        handleChange(tags.filter((t) => t !== val));
      };

      return (
        <div>
          {/* 已选标签 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {tags.map((tag) => {
              const opt = allOptions.find((o) => o.value === tag);
              return (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.15)',
                    color: '#93c5fd',
                    fontSize: 11,
                  }}
                >
                  {opt?.label ?? tag}
                  {!readOnly && (
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#93c5fd',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {/* 添加标签 */}
          {!readOnly && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={def.placeholder ?? '搜索添加...'}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.4)',
                  color: '#e2e8f0',
                  fontSize: 12,
                }}
              />
              {searchText && filteredOptions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 6,
                    marginTop: 2,
                    maxHeight: 120,
                    overflow: 'auto',
                  }}
                >
                  {filteredOptions.slice(0, 6).map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        addTag(opt.value);
                        setSearchText('');
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        color: '#cbd5e1',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'rgba(59,130,246,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'transparent';
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    default: {
      // string
      const strVal = String(currentVal);
      return (
        <input
          type="text"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={def.placeholder ?? ''}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.4)',
            color: '#e2e8f0',
            fontSize: 12,
          }}
        />
      );
    }
  }
}

// ==================== 主组件 ====================

/**
 * StrategyConfigPanel — AI 策略配置面板。
 *
 * 用于可视化的策略参数编辑、条件配置、启用/禁用切换。
 * 适用于智能规则策略、风控策略、推荐策略等场景的运营配置。
 *
 * @example
 * // 基础用法
 * <StrategyConfigPanel
 *   strategy={{
 *     id: 'strategy-1',
 *     name: '价格异常检测策略',
 *     enabled: true,
 *     priority: 75,
 *     params: [
 *       { key: 'price_threshold', name: '价格波动阈值', type: 'number', defaultValue: 20, min: 0, max: 100 },
 *       { key: 'auto_fix', name: '自动修正', type: 'boolean', defaultValue: false },
 *     ],
 *   }}
 *   onSave={(s) => console.log('save', s)}
 * />
 *
 * @example
 * // 只读模式
 * <StrategyConfigPanel strategy={strategy} readOnly />
 */
export function StrategyConfigPanel({
  strategy: initialStrategy,
  title = '策略配置',
  categoryOptions,
  onSave,
  onReset,
  onToggle,
  className,
  readOnly = false,
  loading = false,
  saveLabel = '保存配置',
  resetLabel = '恢复默认',
}: StrategyConfigPanelProps) {
  const [editing, setEditing] = useState<StrategyConfig>(() => ({
    ...initialStrategy,
    params: initialStrategy.params.map((p) => ({
      ...p,
      value: p.value ?? p.defaultValue,
    })),
  }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 上次的外部策略引用，用于重置
  const strategyRef = React.useRef(initialStrategy);

  // 当外部 strategy 变化时同步
  React.useEffect(() => {
    if (initialStrategy.id !== strategyRef.current.id) {
      setEditing({
        ...initialStrategy,
        params: initialStrategy.params.map((p) => ({
          ...p,
          value: p.value ?? p.defaultValue,
        })),
      });
      strategyRef.current = initialStrategy;
      setDirty(false);
      setSaveMsg(null);
      setErrors({});
    }
  }, [initialStrategy]);

  /** 参数变更 */
  const handleParamChange = useCallback(
    (key: string, value: string | number | boolean | string[]) => {
      setEditing((prev) => ({
        ...prev,
        params: prev.params.map((p) =>
          p.key === key ? { ...p, value } : p
        ),
      }));
      setDirty(true);
      setSaveMsg(null);
      // 清除对应错误
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  /** 验证 */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    editing.params.forEach((p) => {
      if (p.required) {
        const val = p.value ?? p.defaultValue;
        if (val === '' || val == null) {
          newErrors[p.key] = `${p.name} 为必填项`;
        }
      }
      if (p.pattern && String(p.value ?? '')) {
        try {
          const re = new RegExp(p.pattern);
          if (!re.test(String(p.value))) {
            newErrors[p.key] = p.patternMessage ?? '格式不匹配';
          }
        } catch {
          // ignore invalid regex
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** 保存 */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave?.(editing);
      setDirty(false);
      setSaveMsg('✅ 配置已保存');
      setTimeout(() => setSaveMsg(null), 2500);
    } catch {
      setSaveMsg('❌ 保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 重置 */
  const handleReset = () => {
    const resetConfig: StrategyConfig = {
      ...editing,
      params: editing.params.map((p) => ({
        ...p,
        value: p.defaultValue,
      })),
    };
    setEditing(resetConfig);
    setDirty(false);
    setErrors({});
    setSaveMsg(null);
    onReset?.(resetConfig);
  };

  /** 切换启用 */
  const handleToggle = () => {
    const nextEnabled = !editing.enabled;
    setEditing((prev) => ({ ...prev, enabled: nextEnabled }));
    setDirty(true);
    onToggle?.(editing.id, nextEnabled);
  };

  const priorityInfo = getPriorityLevel(editing.priority);
  const isLoading = loading || saving;

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        padding: '20px 18px',
      }}
    >
      {/* 标题 + 启用开关 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
            ⚙️ {title}
          </span>
          {editing.category && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 8px',
                borderRadius: 10,
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
              }}
            >
              {editing.category}
            </span>
          )}
        </div>

        {!readOnly && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={handleToggle}
              style={{ accentColor: '#3b82f6' }}
            />
            <span
              style={{
                fontSize: 12,
                color: editing.enabled ? '#22c55e' : '#64748b',
                fontWeight: 600,
              }}
            >
              {editing.enabled ? '已启用' : '已禁用'}
            </span>
          </label>
        )}
      </div>

      {/* 策略基本信息 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(148,163,184,0.04)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
            {editing.name}
          </div>
          {editing.description && (
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              {editing.description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          {/* 优先级 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 6,
              background: `${priorityInfo.color}15`,
            }}
          >
            <span style={{ fontSize: 11, color: priorityInfo.color, fontWeight: 600 }}>
              P{editing.priority}
            </span>
            <span style={{ fontSize: 11, color: priorityInfo.color }}>
              {priorityInfo.label}
            </span>
          </div>
          {/* 更新时间 */}
          {editing.updatedAt && (
            <span style={{ fontSize: 11, color: '#475569' }}>
              {editing.updatedAt}
            </span>
          )}
        </div>
      </div>

      {/* 参数列表 */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          参数配置
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editing.params.map((param) => {
            const error = errors[param.key];
            return (
              <div key={param.key}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#e2e8f0',
                      }}
                    >
                      {param.name}
                    </span>
                    {param.required && (
                      <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    {param.type}
                  </span>
                </div>
                {param.description && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {param.description}
                  </div>
                )}
                <ParamInput
                  def={param}
                  onChange={handleParamChange}
                  readOnly={readOnly}
                />
                {error && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#ef4444',
                      marginTop: 4,
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 条件展示 */}
      {editing.conditions && editing.conditions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94a3b8',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            触发条件 ({editing.conditions.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {editing.conditions.map((cond) => (
              <div
                key={cond.id}
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(148,163,184,0.04)',
                  fontFamily: 'monospace',
                }}
              >
                {cond.field} {cond.operator} {cond.value}
                {cond.value2 != null ? ` ~ ${cond.value2}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 标签 */}
      {editing.tags && editing.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 16,
          }}
        >
          {editing.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(148,163,184,0.1)',
                color: '#94a3b8',
                fontSize: 11,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderTop: '1px solid rgba(148,163,184,0.1)',
            paddingTop: 14,
          }}
        >
          <button
            onClick={handleSave}
            disabled={isLoading || !dirty}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: dirty
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'rgba(148,163,184,0.15)',
              color: dirty ? '#fff' : '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: dirty && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? '保存中...' : saveLabel}
            {dirty && !isLoading && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  padding: '1px 4px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.2)',
                }}
              >
                有修改
              </span>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: 13,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {resetLabel}
          </button>

          {/* 保存反馈 */}
          {saveMsg && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444',
                fontWeight: 500,
              }}
            >
              {saveMsg}
            </span>
          )}

          {/* 分类选择器（只读模式展示） */}
          {!readOnly && categoryOptions && (
            <div style={{ marginLeft: 'auto' }}>
              <select
                value={editing.category ?? ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, category: e.target.value }))
                }
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.4)',
                  color: '#e2e8f0',
                  fontSize: 12,
                }}
              >
                <option value="">选择分类</option>
                {(categoryOptions ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 只读提示 */}
      {readOnly && (
        <div
          style={{
            fontSize: 11,
            color: '#475569',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          🔒 只读模式
        </div>
      )}
    </div>
  );
}
