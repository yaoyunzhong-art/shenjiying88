'use client';

import React from 'react';

export interface DescriptionItem {
  label: string;
  value?: React.ReactNode;
  /** render prop when value needs special formatting */
  render?: () => React.ReactNode;
  /** span across multiple columns (1-4) */
  span?: number;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  /** columns count: 1 | 2 | 3 | 4 (default: 2) */
  columns?: 1 | 2 | 3 | 4;
  /** layout direction */
  layout?: 'horizontal' | 'vertical';
  /** size preset */
  size?: 'default' | 'compact';
  /** title above the list */
  title?: string;
  /** optional className for the wrapper */
  className?: string;
}

const columnGridMap: Record<number, string> = {
  1: '1fr',
  2: '1fr 1fr',
  3: '1fr 1fr 1fr',
  4: '1fr 1fr 1fr 1fr',
};

export function DescriptionList({
  items,
  columns = 2,
  layout = 'horizontal',
  size = 'default',
  title,
  className,
}: DescriptionListProps) {
  const compact = size === 'compact';
  const vertical = layout === 'vertical';

  const gridTemplateColumns = columnGridMap[columns] || columnGridMap[2];

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: compact ? 12 : 16,
    ...(className ? {} : {}),
  };

  return (
    <div className={className} style={wrapperStyle}>
      {title && (
        <h3
          style={{
            fontSize: compact ? 14 : 16,
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
            paddingBottom: compact ? 4 : 8,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {title}
        </h3>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          gap: compact ? '8px 16px' : '12px 24px',
        }}
      >
        {items.map((item, idx) => {
          const span = item.span || 1;
          const clampedSpan = Math.min(Math.max(span, 1), columns);

          const cellStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            gap: vertical ? (compact ? 2 : 4) : (compact ? 4 : 8),
            alignItems: vertical ? 'flex-start' : 'center',
            padding: compact ? '4px 0' : '8px 0',
            borderBottom: '1px solid #f1f5f9',
            gridColumn: clampedSpan > 1 ? `span ${clampedSpan}` : undefined,
          };

          const labelStyle: React.CSSProperties = {
            fontSize: compact ? 12 : 13,
            fontWeight: 500,
            color: '#64748b',
            whiteSpace: 'nowrap',
            minWidth: vertical ? undefined : compact ? 80 : 100,
            flexShrink: 0,
          };

          const valueStyle: React.CSSProperties = {
            fontSize: compact ? 13 : 14,
            color: '#1e293b',
            wordBreak: 'break-word',
          };

          const content = item.render
            ? item.render()
            : item.value !== undefined && item.value !== null
              ? item.value
              : React.createElement('span', {
                  style: { color: '#94a3b8', fontStyle: 'italic', fontSize: compact ? 12 : 13 }
                }, '-');

          return (
            <div key={idx} style={cellStyle}>
              <span style={labelStyle}>{item.label}</span>
              <span style={valueStyle}>{content}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
