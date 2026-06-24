'use client';

import React from 'react';

// ---- 类型 ----

export interface QuickStatItem {
  /** 展示标签 */
  label: string;
  /** 主数值/文字 */
  value: string | number;
  /** 辅助说明文字 */
  helper?: string;
  /** 主值颜色覆盖 */
  valueColor?: string;
}

export interface QuickStatsProps {
  /** 统计数据项 */
  items: QuickStatItem[];
  /** 列数 (默认 4) */
  columns?: number;
  /** 间距 (默认 14) */
  gap?: number;
  /** 卡片内边距 (默认 18) */
  padding?: number;
}

// ---- 默认样式 ----

const DEFAULT_STYLES: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gap: 14,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    background: 'rgba(15, 23, 42, 0.38)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  label: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  value: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 700,
  },
  helper: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
};

/**
 * QuickStats — 快速统计概览行
 *
 * 用于列表页顶部，展示关键指标卡片。
 * 替代重复的手写 stat 卡片模板代码。
 *
 * @example
 * <QuickStats
 *   items={[
 *     { label: '总数', value: 15, helper: '5 个区域' },
 *     { label: '运营中', value: 8, valueColor: '#4ade80', helper: '53% 激活率' },
 *   ]}
 *   columns={4}
 * />
 */
export function QuickStats({
  items,
  columns = 4,
  gap = 14,
  padding = 18,
}: QuickStatsProps) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        ...DEFAULT_STYLES.grid,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        marginBottom: 20,
      }}
    >
      {items.map((item, idx) => (
        <article
          key={`stat-${idx}`}
          style={{
            ...DEFAULT_STYLES.card,
            padding,
          }}
        >
          <div style={DEFAULT_STYLES.label}>{item.label}</div>
          <div
            style={{
              ...DEFAULT_STYLES.value,
              ...(item.valueColor ? { color: item.valueColor } : {}),
            }}
          >
            {item.value}
          </div>
          {item.helper ? (
            <div style={DEFAULT_STYLES.helper}>{item.helper}</div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
