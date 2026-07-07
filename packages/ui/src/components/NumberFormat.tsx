'use client';

import React from 'react';

// ---- Types ----

export type NumberFormatType = 'decimal' | 'integer' | 'currency' | 'percent' | 'compact';

export type NumberFormatSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface NumberFormatProps {
  /** 数值 */
  value: number | null | undefined;
  /** 格式化类型 */
  type?: NumberFormatType;
  /** 小数位数（默认按类型自动） */
  decimals?: number;
  /** 货币符号 */
  currencySymbol?: string;
  /** 字号 */
  size?: NumberFormatSize;
  /** 颜色 */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  /** 前缀文字 */
  prefix?: string;
  /** 后缀文字 */
  suffix?: string;
  /** 是否显示正负号 */
  signDisplay?: 'auto' | 'always' | 'never';
  /** null/undefined 时的占位文字 */
  placeholder?: string;
  /** 高亮变化方向（正值上升/负值下降分别着色） */
  colorizeTrend?: boolean;
  /** 自定义 class */
  className?: string;
  style?: React.CSSProperties;
}

// ---- Size map ----

const SIZE_FONT: Record<NumberFormatSize, number> = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 20,
  xl: 28,
  xxl: 40,
};

const SIZE_WEIGHT: Record<NumberFormatSize, number> = {
  xs: 500,
  sm: 500,
  md: 600,
  lg: 700,
  xl: 700,
  xxl: 800,
};

const COLOR_MAP: Record<string, string> = {
  default: '#e4e4e7',
  primary: '#60a5fa',
  success: '#4ade80',
  warning: '#facc15',
  danger:  '#f87171',
  muted:   '#71717a',
};

const TREND_COLOR_UP = '#4ade80';
const TREND_COLOR_DOWN = '#f87171';

// ---- Core formatter ----

function formatNumber(value: number, type: NumberFormatType, decimals?: number): string {
  let d = decimals;
  if (d === undefined) {
    switch (type) {
      case 'integer':   d = 0; break;
      case 'currency':  d = 2; break;
      case 'percent':   d = 1; break;
      case 'compact':   d = 1; break;
      default:          d = 2; break;
    }
  }

  switch (type) {
    case 'compact': {
      const abs = Math.abs(value);
      if (abs >= 1_0000_0000) return (value / 1_0000_0000).toFixed(d) + '亿';
      if (abs >= 1_0000) return (value / 1_0000).toFixed(d) + '万';
      if (abs >= 1000) return (value / 1000).toFixed(d) + 'k';
      return value.toFixed(d);
    }
    case 'percent':
      return (value * 100).toFixed(d) + '%';
    default:
      return value.toFixed(d);
  }
}

// ---- Component ----

export const NumberFormat: React.FC<NumberFormatProps> = ({
  value,
  type = 'decimal',
  decimals,
  currencySymbol = '¥',
  size = 'md',
  color = 'default',
  prefix,
  suffix,
  signDisplay = 'auto',
  placeholder = '--',
  colorizeTrend = false,
  className,
  style,
}) => {
  // Handle null / undefined
  if (value === null || value === undefined) {
    const fallbackStyle: React.CSSProperties = {
      fontSize: SIZE_FONT[size],
      fontWeight: SIZE_WEIGHT[size],
      color: COLOR_MAP.muted,
      fontVariantNumeric: 'tabular-nums',
      ...style,
    };
    return React.createElement('span', { className, style: fallbackStyle }, placeholder);
  }

  const numericValue = type === 'percent' ? value : value;
  let formatted = formatNumber(numericValue, type, decimals);

  // Sign display
  if (signDisplay === 'always' && value > 0) {
    formatted = '+' + formatted;
  } else if (signDisplay === 'always' && value < 0) {
    formatted = '-' + formatted;
  } else if (signDisplay === 'never') {
    formatted = formatted.replace(/^-/, '');
  }

  // Currency prefix
  if (type === 'currency') {
    formatted = currencySymbol + formatted;
  }

  // Trend color
  let resolvedColor = color;
  if (colorizeTrend && value !== 0) {
    resolvedColor = value > 0 ? 'success' : value < 0 ? 'danger' : color;
  }

  const mergedStyle: React.CSSProperties = {
    fontSize: SIZE_FONT[size],
    fontWeight: SIZE_WEIGHT[size],
    color: COLOR_MAP[resolvedColor] ?? COLOR_MAP.default,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    ...style,
  };

  const content = [prefix, formatted, suffix].filter(Boolean).join(' ');

  return React.createElement('span', { className, style: mergedStyle }, content);
};

// ---- Compound Exports ----

export const Currency: React.FC<Omit<NumberFormatProps, 'type'>> = (props) => (
  <NumberFormat type="currency" {...props} />
);

export const Percent: React.FC<Omit<NumberFormatProps, 'type'>> = (props) => (
  <NumberFormat type="percent" {...props} />
);

export const Compact: React.FC<Omit<NumberFormatProps, 'type'>> = (props) => (
  <NumberFormat type="compact" {...props} />
);
