'use client';
import React from 'react';

export type StatisticVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type StatisticSize = 'sm' | 'md' | 'lg';
export type StatisticLayout = 'horizontal' | 'vertical';

export interface StatisticProps {
  /** 统计数值 */
  value: string | number;
  /** 数值前缀（货币符号等） */
  prefix?: React.ReactNode;
  /** 数值后缀（单位等） */
  suffix?: React.ReactNode;
  /** 标签文本 */
  label?: string;
  /** 数值精度（小数位数），不传则用原始值 */
  precision?: number;
  /** 是否显示千分位分隔符 */
  groupSeparator?: boolean;
  /** 数值颜色变体 */
  variant?: StatisticVariant;
  /** 尺寸 */
  size?: StatisticSize;
  /** 排列方向 */
  layout?: StatisticLayout;
  /** 额外 css class */
  className?: string;
  /** 内联样式 */
  style?: React.CSSProperties;
  /** 测试 id */
  'data-testid'?: string;
  /** 加载中状态 */
  loading?: boolean;
  /** loading 占位符宽度 */
  loadingWidth?: number;
}

const VARIANT_COLORS: Record<StatisticVariant, string> = {
  default: '#f8fafc',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#38bdf8',
};

const SIZE_FONTS: Record<StatisticSize, { value: number; label: number }> = {
  sm: { value: 20, label: 12 },
  md: { value: 28, label: 13 },
  lg: { value: 36, label: 14 },
};

/**
 * 将数值格式化为带千分位和小数的字符串
 */
function formatValue(
  raw: string | number,
  precision?: number,
  groupSeparator?: boolean,
): string {
  let num: number;
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw);
    num = isNaN(parsed) ? 0 : parsed;
  } else {
    num = raw;
  }

  let formatted = precision != null ? num.toFixed(precision as number) : String(num);

  if (groupSeparator) {
    const parts = formatted.split('.');
    const intPart = parts[0];
    const decPart = parts[1] ?? '';
    formatted = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decPart ? '.' + decPart : '');
  }

  return formatted;
}

/**
 * Statistic — 用于展示统计数据（标签 + 数值）。
 *
 * 可作为统计卡片的内容，或独立使用。支持前缀/后缀、精度、千分位、颜色变体、尺寸和加载占位。
 *
 * 不同于 StatCard（带边框/背景的卡片），Statistic 是纯文字排版原子组件。
 */
export function Statistic({
  value,
  prefix,
  suffix,
  label,
  precision,
  groupSeparator,
  variant = 'default',
  size = 'md',
  layout = 'vertical',
  className,
  style,
  'data-testid': dataTestId,
  loading,
  loadingWidth,
}: StatisticProps) {
  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.default;
  const fonts = SIZE_FONTS[size] ?? SIZE_FONTS.md;
  const displayValue = formatValue(value, precision, groupSeparator);

  const isHorizontal = layout === 'horizontal';

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: isHorizontal ? 'baseline' : 'flex-start',
        gap: isHorizontal ? 8 : 4,
        ...style,
      }}
    >
      {/* Label */}
      {label ? (
        <span
          data-testid={dataTestId ? `${dataTestId}-label` : undefined}
          style={{
            fontSize: fonts.label,
            color: '#94a3b8',
            fontWeight: 500,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      ) : null}

      {/* Value row */}
      <span
        data-testid={dataTestId ? `${dataTestId}-value` : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 4,
          fontSize: fonts.value,
          fontWeight: 700,
          color,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {loading ? (
          <span
            data-testid={dataTestId ? `${dataTestId}-skeleton` : undefined}
            style={{
              display: 'inline-block',
              width: loadingWidth ?? 60,
              height: fonts.value * 0.7,
              borderRadius: 4,
              background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 0%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 100%)',
              backgroundSize: '200% 100%',
              animation: 'm5-skeleton-shimmer 1.5s ease-in-out infinite',
              verticalAlign: 'middle',
            }}
          />
        ) : (
          <>
            {prefix ? (
              <span
                data-testid={dataTestId ? `${dataTestId}-prefix` : undefined}
                style={{ fontSize: fonts.value * 0.6, fontWeight: 600, opacity: 0.8 }}
              >
                {prefix}
              </span>
            ) : null}
            <span data-testid={dataTestId ? `${dataTestId}-number` : undefined}>
              {displayValue}
            </span>
            {suffix ? (
              <span
                data-testid={dataTestId ? `${dataTestId}-suffix` : undefined}
                style={{ fontSize: fonts.value * 0.6, fontWeight: 600, opacity: 0.8 }}
              >
                {suffix}
              </span>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}

// SSR-safe keyframe injection
if (typeof document !== 'undefined' && !document.getElementById('m5-statistic-keyframes')) {
  const style = document.createElement('style');
  style.id = 'm5-statistic-keyframes';
  style.textContent = `
    @keyframes m5-skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
