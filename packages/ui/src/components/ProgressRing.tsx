'use client';

import React from 'react';

// ==================== 类型定义 ====================

export interface ProgressRingProps {
  /** 进度百分比 (0-100) */
  percent: number;
  /** 环大小 (px) */
  size?: number;
  /** 环宽度 (px) */
  strokeWidth?: number;
  /** 进度环颜色 */
  color?: string;
  /** 轨道环颜色 */
  trackColor?: string;
  /** 标题 */
  title?: string;
  /** 是否显示百分比文字 */
  showPercentLabel?: boolean;
  /** 自定义格式函数 */
  formatLabel?: (percent: number) => string;
  /** 自定义类名 */
  className?: string;
  /** 加载态 */
  loading?: boolean;
  /** 动画过渡时间 (ms) */
  transitionDuration?: number;
}

// ==================== 默认值 ====================

const DEFAULT_SIZE = 120;
const DEFAULT_STROKE_WIDTH = 10;
const ACCENT_COLOR = '#6366f1';
const TRACK_COLOR = '#e5e7eb';

// ==================== 组件 ====================

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  color = ACCENT_COLOR,
  trackColor = TRACK_COLOR,
  title,
  showPercentLabel = true,
  formatLabel,
  className = '',
  loading = false,
  transitionDuration = 600,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercent / 100) * circumference;

  const center = size / 2;
  const label = formatLabel ? formatLabel(clampedPercent) : `${Math.round(clampedPercent)}%`;

  return (
    <div
      className={`progress-ring ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={title || `进度 ${label}`}
    >
      {/* 标题 */}
      {title && (
        <div
          style={{
            position: 'absolute',
            top: -20,
            fontSize: 12,
            color: '#6b7280',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      )}

      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* 轨道环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : offset}
          style={{
            transition: `stroke-dashoffset ${transitionDuration}ms ease-in-out`,
          }}
        />
      </svg>

      {/* 中心文字 */}
      {showPercentLabel && !loading && (
        <div
          style={{
            position: 'absolute',
            fontSize: Math.round(size * 0.22),
            fontWeight: 700,
            color: '#1f2937',
            lineHeight: 1,
          }}
        >
          {label}
        </div>
      )}

      {/* 加载态骨架 */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            width: size * 0.5,
            height: size * 0.2,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'progress-ring-shimmer 1.5s infinite',
          }}
          aria-label="加载中"
        />
      )}

      {/* Shimmer 动画 keyframes */}
      <style>{`
        @keyframes progress-ring-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressRing;
