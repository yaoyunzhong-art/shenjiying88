'use client';

import React from 'react';

// ---- Types ----

export interface InfoCardItem {
  /** 标签/字段名 */
  label: string;
  /** 值 */
  value: React.ReactNode;
  /** 可选颜色变体 */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Tooltip 提示 */
  tooltip?: string;
}

export interface InfoCardProps {
  /** 标题 */
  title?: string;
  /** 数据条目列表 */
  items: InfoCardItem[];
  /** 布局方向 */
  layout?: 'vertical' | 'horizontal';
  /** 列数 (仅 vertical 有效) */
  columns?: 1 | 2 | 3 | 4;
  /** 卡片变体 */
  variant?: 'default' | 'elevated' | 'compact';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 测试 id */
  'data-testid'?: string;
}

// ---- Variant styles ----

const VARIANT_CONTAINER: Record<InfoCardProps['variant'] & string, React.CSSProperties> = {
  default: {
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  elevated: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
  },
  compact: {
    background: 'rgba(15, 23, 42, 0.25)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
};

const VALUE_COLORS: Record<InfoCardItem['variant'] & string, string> = {
  default: '#e2e8f0',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
};

// ---- Component ----

/**
 * InfoCard — a reusable key-value info display card.
 *
 * Renders a titled card containing a list of label/value pairs,
 * supporting multi-column grid, horizontal layout, and color variants.
 */
export function InfoCard({
  title,
  items,
  layout = 'vertical',
  columns = 2,
  variant = 'default',
  style,
  className,
  'data-testid': dataTestId,
}: InfoCardProps) {
  const containerStyle = VARIANT_CONTAINER[variant] ?? VARIANT_CONTAINER.default;

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        borderRadius: 12,
        padding: variant === 'compact' ? 12 : 18,
        color: '#e2e8f0',
        ...containerStyle,
        ...style,
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </div>
      ) : null}

      {layout === 'horizontal' ? (
        // Horizontal: label then value on same line
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
              title={item.tooltip}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: item.variant ? VALUE_COLORS[item.variant] ?? VALUE_COLORS.default : VALUE_COLORS.default,
                  fontFamily: 'monospace',
                  textAlign: 'right',
                  fontWeight: item.variant && item.variant !== 'default' ? 600 : 400,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Vertical: label above value in a CSS grid
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(columns, items.length)}, 1fr)`,
            gap: 16,
          }}
        >
          {items.map((item, i) => (
            <div key={`${item.label}-${i}`} title={item.tooltip}>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: item.variant ? VALUE_COLORS[item.variant] ?? VALUE_COLORS.default : VALUE_COLORS.default,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
