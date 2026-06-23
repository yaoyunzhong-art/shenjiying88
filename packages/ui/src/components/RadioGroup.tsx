'use client';
import React, { useId } from 'react';

// ==================== 类型 ====================

export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioDirection = 'horizontal' | 'vertical';

export interface RadioOption<T extends string = string> {
  /** 选项值 */
  value: T;
  /** 选项标签 */
  label: string;
  /** 禁用该选项 */
  disabled?: boolean;
  /** 辅助说明文字 */
  description?: string;
}

export interface RadioGroupProps<T extends string = string> {
  /** 选项列表 */
  options: RadioOption<T>[];
  /** 受控：当前选中值 */
  value?: T;
  /** 非受控：默认选中值 */
  defaultValue?: T;
  /** 值变化回调 */
  onChange?: (value: T) => void;
  /** 字段名（用于表单提交） */
  name?: string;
  /** 排列方向 */
  direction?: RadioDirection;
  /** 尺寸 */
  size?: RadioSize;
  /** 是否禁用整个组 */
  disabled?: boolean;
  /** 是否必选标记 */
  required?: boolean;
  /** 组标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 辅助提示 */
  hint?: string;
  /** data-testid 前缀 */
  'data-testid'?: string;
  /** 额外 className */
  className?: string;
  /** 内联样式覆盖 */
  style?: React.CSSProperties;
  /** 单个选项样式覆盖 */
  optionStyle?: React.CSSProperties;
}

// ==================== 尺寸映射 ====================

const DOT_SIZE_MAP: Record<RadioSize, number> = { sm: 8, md: 10, lg: 12 };
const RING_SIZE_MAP: Record<RadioSize, number> = { sm: 16, md: 20, lg: 24 };
const FONT_SIZE_MAP: Record<RadioSize, number> = { sm: 13, md: 14, lg: 15 };
const GAP_MAP: Record<RadioSize, number> = { sm: 8, md: 12, lg: 16 };

const CHECKED_COLOR = '#3b82f6';
const UNCHECKED_BORDER = '#475569';
const DISABLED_BORDER = '#334155';
const DISABLED_BG = 'rgba(30, 41, 59, 0.5)';
const HOVER_BG = 'rgba(59, 130, 246, 0.06)';
const FOCUS_RING = 'rgba(59, 130, 246, 0.35)';
const ERROR_COLOR = '#ef4444';

/**
 * RadioGroup — 单选组组件。
 *
 * 支持受控/非受控、水平/垂直排列、三种尺寸、禁用、错误态、
 * 单选项附带描述，以及完整键盘 & ARIA 可访问性。
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: 'active', label: '启用' },
 *     { value: 'inactive', label: '停用', description: '停用后不可恢复' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 *   direction="horizontal"
 * />
 * ```
 */
export function RadioGroup<T extends string = string>({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  direction = 'vertical',
  size = 'md',
  disabled = false,
  required = false,
  label: groupLabel,
  error,
  hint,
  'data-testid': dataTestId,
  className,
  style,
  optionStyle,
}: RadioGroupProps<T>) {
  const generatedName = useId();
  const resolvedName = name ?? generatedName;

  const [internalValue, setInternalValue] = React.useState<T | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : internalValue;

  const handleChange = React.useCallback(
    (optionValue: T) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
    },
    [disabled, isControlled, onChange],
  );

  const ringSize = RING_SIZE_MAP[size];
  const dotSize = DOT_SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const itemGap = GAP_MAP[size];

  const directionStyle: React.CSSProperties =
    direction === 'horizontal'
      ? { display: 'flex', flexWrap: 'wrap', gap: itemGap }
      : { display: 'flex', flexDirection: 'column', gap: itemGap };

  return (
    <fieldset
      className={className}
      style={{
        border: 'none',
        padding: 0,
        margin: 0,
        ...style,
      }}
      data-testid={dataTestId}
      aria-invalid={!!error}
      disabled={disabled}
    >
      {/* 组标签 */}
      {groupLabel && (
        <legend
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: disabled ? '#64748b' : '#cbd5e1',
            marginBottom: 8,
            padding: 0,
          }}
        >
          {groupLabel}
          {required && <span style={{ color: ERROR_COLOR, marginLeft: 2 }}>*</span>}
        </legend>
      )}

      {/* 选项列表 */}
      <div style={directionStyle} role="radiogroup" aria-label={groupLabel}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isDisabled = disabled || option.disabled;
          const optionId = `${resolvedName}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.45 : 1,
                padding: '6px 10px',
                borderRadius: 8,
                background: isSelected ? HOVER_BG : 'transparent',
                border: isSelected
                  ? `1px solid ${isDisabled ? DISABLED_BORDER : CHECKED_COLOR}`
                  : `1px solid transparent`,
                transition: 'background 0.15s, border-color 0.15s',
                userSelect: 'none',
                ...optionStyle,
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  (e.currentTarget as HTMLLabelElement).style.background = HOVER_BG;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLLabelElement).style.background = 'transparent';
                }
              }}
            >
              {/* Radio 圆形指示器 */}
              <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
                {/* 隐藏原生 radio */}
                <input
                  type="radio"
                  id={optionId}
                  name={resolvedName}
                  value={option.value}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleChange(option.value)}
                  data-testid={dataTestId ? `${dataTestId}-input-${option.value}` : undefined}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: ringSize,
                    height: ringSize,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    margin: 0,
                  }}
                  aria-label={option.label}
                  aria-describedby={option.description ? `${optionId}-desc` : undefined}
                />
                {/* 自定义 radio 外观 */}
                <div
                  style={{
                    width: ringSize,
                    height: ringSize,
                    borderRadius: '50%',
                    border: `2px solid ${
                      isDisabled
                        ? DISABLED_BORDER
                        : isSelected
                          ? CHECKED_COLOR
                          : UNCHECKED_BORDER
                    }`,
                    background: isDisabled ? DISABLED_BG : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: '50%',
                        background: isDisabled ? '#64748b' : CHECKED_COLOR,
                        transition: 'transform 0.12s ease-out',
                        transform: 'scale(1)',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 标签文本 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize, color: isDisabled ? '#64748b' : '#e2e8f0', lineHeight: 1.4 }}>
                  {option.label}
                </div>
                {option.description && (
                  <div
                    id={`${optionId}-desc`}
                    style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}
                  >
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* 辅助提示 */}
      {hint && !error && (
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{hint}</p>
      )}

      {/* 错误信息 */}
      {error && (
        <p style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}>{error}</p>
      )}
    </fieldset>
  );
}
