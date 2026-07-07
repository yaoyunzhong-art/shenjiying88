'use client';
import React, { useCallback } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  /** 选项列表 */
  options: SegmentedOption[];
  /** 当前选中值 */
  value?: string;
  /** 默认选中值 (非受控) */
  defaultValue?: string;
  /** 选中回调 */
  onChange?: (value: string) => void;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否填充父容器宽度 */
  fullWidth?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
  /** 自定义样式 */
  className?: string;
  style?: React.CSSProperties;
  /** ARIA label */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg', { height: number; fontSize: number; padding: string; gap: string }> = {
  sm: { height: 28, fontSize: 12, padding: '2px', gap: '2px' },
  md: { height: 36, fontSize: 14, padding: '3px', gap: '3px' },
  lg: { height: 44, fontSize: 16, padding: '4px', gap: '4px' },
};

function useControlledState<T>(controlled: T | undefined, defaultValue: T): [T, (v: T) => void] {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const value = isControlled ? controlled : internal;
  const setValue = useCallback(
    (v: T) => {
      if (!isControlled) setInternal(v);
    },
    [isControlled],
  );
  return [value, setValue];
}

/**
 * SegmentedControl — 分段控件/按钮组。
 *
 * 提供互斥选项切换，支持图标、受控/非受控、多尺寸。
 * 适用于视图切换、筛选切换等场景。
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={[
 *     { value: 'day', label: '日' },
 *     { value: 'week', label: '周' },
 *     { value: 'month', label: '月' },
 *   ]}
 *   defaultValue="week"
 *   onChange={(v) => console.log(v)}
 * />
 * ```
 */
export function SegmentedControl({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  style,
  'aria-label': ariaLabel = '分段控件',
  'data-testid': dataTestId,
}: SegmentedControlProps) {
  const [selectedValue, setSelectedValue] = useControlledState(controlledValue, defaultValue ?? options[0]?.value ?? '');

  const handleSelect = useCallback(
    (val: string) => {
      if (disabled) return;
      setSelectedValue(val);
      onChange?.(val);
    },
    [disabled, setSelectedValue, onChange],
  );

  const selectedIndex = options.findIndex((o) => o.value === selectedValue);
  const sizeCfg = SIZE_MAP[size];

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    position: 'relative',
    alignItems: 'center',
    padding: sizeCfg.padding,
    gap: sizeCfg.gap,
    borderRadius: sizeCfg.height / 2,
    backgroundColor: '#f1f5f9',
    height: sizeCfg.height,
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  const sliderStyle: React.CSSProperties = selectedIndex >= 0
    ? {
        position: 'absolute',
        top: sizeCfg.padding,
        left: `calc(${sizeCfg.padding} + ${selectedIndex} * (100% - 2 * ${sizeCfg.padding}) / ${options.length})`,
        width: `calc((100% - 2 * ${sizeCfg.padding}) / ${options.length})`,
        height: `calc(100% - 2 * ${sizeCfg.padding})`,
        borderRadius: (sizeCfg.height - parseInt(sizeCfg.padding) * 2) / 2,
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'left 0.2s ease, width 0.2s ease',
        zIndex: 0,
      }
    : { display: 'none' };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-testid={dataTestId}
      className={className}
      style={containerStyle}
    >
      <div style={sliderStyle} data-testid={dataTestId ? `${dataTestId}-slider` : undefined} />
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || opt.disabled}
            data-testid={dataTestId ? `${dataTestId}-option-${opt.value}` : undefined}
            onClick={() => handleSelect(opt.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: `0 ${size === 'sm' ? 10 : size === 'lg' ? 20 : 14}px`,
              height: '100%',
              border: 'none',
              borderRadius: (sizeCfg.height - parseInt(sizeCfg.padding) * 2 - 2) / 2,
              backgroundColor: 'transparent',
              color: isSelected ? '#0f172a' : '#64748b',
              fontSize: sizeCfg.fontSize,
              fontWeight: isSelected ? 600 : 400,
              cursor: disabled || opt.disabled ? 'not-allowed' : 'pointer',
              position: 'relative',
              zIndex: 1,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease',
              opacity: disabled || opt.disabled ? 0.5 : 1,
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !disabled && !opt.disabled) {
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !disabled && !opt.disabled) {
                e.currentTarget.style.color = '#64748b';
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #38bdf8';
              e.currentTarget.style.outlineOffset = '1px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            {opt.icon && <span style={{ display: 'inline-flex' }}>{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
