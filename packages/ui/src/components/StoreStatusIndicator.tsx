/**
 * StoreStatusIndicator — 门店状态指示器组件
 *
 * 用于展示门店的运营状态，如营业中、休息中、维修中、离线等。
 * 支持多种状态类型、颜色编码、尺寸变体、脉冲动画和可选的点击交互。
 *
 * Pattern: 纯展示组件，无外部依赖，支持 .test.tsx 测试
 */

import React from 'react';

export type StoreStatus =
  | 'open'
  | 'closed'
  | 'busy'
  | 'maintenance'
  | 'offline'
  | 'error';

export type StoreStatusSize = 'sm' | 'md' | 'lg';

export interface StoreStatusIndicatorProps {
  /** 门店运营状态 */
  status: StoreStatus;
  /** 自定义状态显示文本，默认使用内置中文映射 */
  label?: string;
  /** 尺寸变体 */
  size?: StoreStatusSize;
  /** 是否显示脉冲动画（open/busy 状态默认开启） */
  animated?: boolean;
  /** 是否显示最后更新时间 */
  lastUpdated?: string;
  /** 是否显示纯文本模式（无圆点指示器） */
  textOnly?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击回调 */
  onClick?: (status: StoreStatus) => void;
}

/** 状态对应的标签映射 */
const STATUS_LABELS: Record<StoreStatus, string> = {
  open: '营业中',
  closed: '休息中',
  busy: '繁忙',
  maintenance: '维修中',
  offline: '离线',
  error: '异常',
};

/** 状态对应的颜色（dot + label） */
const STATUS_COLORS: Record<StoreStatus, { dot: string; label: string }> = {
  open: { dot: '#22c55e', label: '#22c55e' },
  closed: { dot: '#ef4444', label: '#ef4444' },
  busy: { dot: '#f59e0b', label: '#f59e0b' },
  maintenance: { dot: '#eab308', label: '#eab308' },
  offline: { dot: '#6b7280', label: '#9ca3af' },
  error: { dot: '#dc2626', label: '#dc2626' },
};

/** 尺寸映射 */
const SIZE_MAP: Record<StoreStatusSize, { dot: number; fontSize: number; gap: number }> = {
  sm: { dot: 8, fontSize: 12, gap: 6 },
  md: { dot: 10, fontSize: 14, gap: 8 },
  lg: { dot: 14, fontSize: 16, gap: 10 },
};

/** 默认开启动画的状态 */
const ANIMATED_STATUSES: Set<StoreStatus> = new Set(['open', 'busy']);

function getStatusColor(status: StoreStatus): { dot: string; labelColor: string } {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.offline;
  return { dot: c.dot, labelColor: c.label };
}

function getStatusLabel(status: StoreStatus, customLabel?: string): string {
  return customLabel ?? STATUS_LABELS[status] ?? status;
}

export function StoreStatusIndicator({
  status,
  label,
  size = 'md',
  animated,
  lastUpdated,
  textOnly = false,
  className,
  style,
  onClick,
}: StoreStatusIndicatorProps) {
  const colors = getStatusColor(status);
  const displayLabel = getStatusLabel(status, label);
  const sizes = SIZE_MAP[size];
  const showAnimation = animated ?? ANIMATED_STATUSES.has(status);
  const isInteractive = typeof onClick === 'function';

  const handleClick = () => {
    onClick?.(status);
  };

  return (
    <div
      data-testid={`store-status-indicator-${status}`}
      data-store-status={status}
      data-store-status-size={size}
      onClick={handleClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClick();
            }
          : undefined
      }
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizes.gap,
        cursor: isInteractive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* 状态圆点指示器 */}
      {!textOnly && (
        <span
          data-testid={`store-status-dot-${status}`}
          aria-hidden="true"
          style={{
            width: sizes.dot,
            height: sizes.dot,
            borderRadius: '50%',
            backgroundColor: colors.dot,
            display: 'inline-block',
            flexShrink: 0,
            ...(showAnimation
              ? {
                  animation: 'store-status-pulse 2s ease-in-out infinite',
                }
              : {}),
          }}
        />
      )}

      {/* 状态标签 */}
      <span
        data-testid={`store-status-label-${status}`}
        style={{
          fontSize: sizes.fontSize,
          fontWeight: 600,
          color: colors.labelColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {displayLabel}
      </span>

      {/* 最后更新时间 */}
      {lastUpdated && (
        <span
          data-testid={`store-status-time-${status}`}
          style={{
            fontSize: sizes.fontSize - 2,
            color: '#64748b',
            marginLeft: lastUpdated ? 4 : 0,
            lineHeight: 1,
          }}
        >
          {lastUpdated}
        </span>
      )}

      {/* 脉冲动画 keyframes */}
      {showAnimation && (
        <style>{`
          @keyframes store-status-pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      )}
    </div>
  );
}
