import React from 'react';

export type TrendDirection = 'up' | 'down' | 'stable';

export interface StatTrendProps {
  /** 趋势方向 */
  direction: TrendDirection;
  /** 变化数值（如 +12.5%） */
  value?: string;
  /** 标签文字 */
  label?: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否反转颜色（下跌为绿色时设为 true） */
  invert?: boolean;
  className?: string;
}

const arrowMap: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

const colorMap: Record<TrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-gray-500 dark:text-gray-400',
};

const invertedColorMap: Record<TrendDirection, string> = {
  up: 'text-red-600 dark:text-red-400',
  down: 'text-green-600 dark:text-green-400',
  stable: 'text-gray-500 dark:text-gray-400',
};

const sizeMap: Record<string, string> = {
  sm: 'text-xs gap-0.5',
  md: 'text-sm gap-1',
  lg: 'text-base gap-1.5',
};

/**
 * StatTrend — 统计趋势指示器
 *
 * 在仪表盘/卡片上显示数据变化的升降趋势。
 */
export function StatTrend({
  direction,
  value,
  label,
  size = 'md',
  invert = false,
  className = '',
}: StatTrendProps) {
  const colors = invert ? invertedColorMap : colorMap;
  return (
    <span
      className={`inline-flex items-center font-medium ${sizeMap[size]} ${colors[direction]} ${className}`}
    >
      <span className="shrink-0 leading-none" aria-hidden>
        {arrowMap[direction]}
      </span>
      {value && <span className="tabular-nums">{value}</span>}
      {label && <span className="opacity-70">{label}</span>}
    </span>
  );
}

export default StatTrend;
