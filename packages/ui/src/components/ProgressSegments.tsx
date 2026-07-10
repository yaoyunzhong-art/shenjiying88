'use client';

import React from 'react';

// ==================== 类型定义 ====================

export interface ProgressSegment {
  /** 段标签 */
  label: string;
  /** 数值 */
  value: number;
  /** 颜色（Tailwind class 或 hex） */
  color: string;
  /** 点击回调 */
  onClick?: () => void;
}

export interface ProgressSegmentsProps {
  /** 分段数据 */
  segments: ProgressSegment[];
  /** 总量（默认自动求和） */
  total?: number;
  /** 高度 */
  height?: number;
  /** 圆角 */
  radius?: number;
  /** 是否显示数值标签 */
  showLabels?: boolean;
  /** 类名 */
  className?: string;
  /** 测试 ID */
  'data-testid'?: string;
}

// ==================== 组件实现 ====================

const CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  overflow: 'hidden',
  width: '100%',
  backgroundColor: 'rgba(148,163,184,0.08)',
};

const LABEL_WRAPPER: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 6,
  fontSize: 12,
  color: '#94a3b8',
};

/**
 * ProgressSegments - 分段进度条组件
 * 用于展示多段数据占比，如库存分类占比、销售额构成等
 */
export function ProgressSegments({
  segments,
  total: totalProp,
  height = 20,
  radius = 4,
  showLabels = false,
  className,
  'data-testid': testId,
}: ProgressSegmentsProps) {
  const total = totalProp ?? segments.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0 || segments.length === 0) {
    return (
      <div
        style={{ ...CONTAINER_STYLE, height, borderRadius: radius }}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <div data-testid={testId}>
      <div
        style={{ ...CONTAINER_STYLE, height, borderRadius: radius }}
        className={className}
      >
        {segments.map((seg, idx) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          if (pct <= 0) return null;
          const isLast = idx === segments.length - 1;
          return (
            <div
              key={seg.label}
              onClick={seg.onClick}
              title={`${seg.label}: ${seg.value} (${pct.toFixed(1)}%)`}
              style={{
                height: '100%',
                width: `${pct}%`,
                minWidth: isLast ? undefined : 4,
                flex: isLast ? 1 : undefined,
                backgroundColor: seg.color,
                cursor: seg.onClick ? 'pointer' : undefined,
                borderRight: idx < segments.length - 1 ? '2px solid transparent' : undefined,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div style={LABEL_WRAPPER}>
          {segments.map((seg) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <span key={seg.label} style={{ color: seg.color }}>
                {seg.label} {pct.toFixed(1)}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
