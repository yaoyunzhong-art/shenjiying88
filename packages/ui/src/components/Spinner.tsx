'use client';

import React from 'react';

// ---- 类型 ----

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'primary' | 'inverted';

interface SpinnerProps {
  /** 尺寸 */
  size?: SpinnerSize;
  /** 外观变体 */
  variant?: SpinnerVariant;
  /** 可选标签，展示在旋转图标下方 */
  label?: string;
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, number> = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

const STROKE_WIDTH: Record<SpinnerSize, number> = {
  xs: 2,
  sm: 2.5,
  md: 3,
  lg: 3.5,
  xl: 4,
};

const COLOR_MAP: Record<SpinnerVariant, string> = {
  default: '#94a3b8',
  primary: '#6366f1',
  inverted: '#e2e8f0',
};

function Spinner({
  size = 'md',
  variant = 'default',
  label,
  className,
}: SpinnerProps) {
  const dim = SIZE_MAP[size];
  const stroke = STROKE_WIDTH[size];
  const color = COLOR_MAP[variant];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = circumference * 0.75;

  return (
    <div
      className={className}
      role="status"
      aria-label={label ?? '加载中'}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        style={{ display: 'block' }}
      >
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          opacity={0.18}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeDashoffset={0}
          style={{
            transformOrigin: 'center',
            animation: 'spinner-rotate 0.8s linear infinite',
          }}
        />
      </svg>
      {label ? (
        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.3 }}>
          {label}
        </span>
      ) : null}
      <style>{`
        @keyframes spinner-rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export { Spinner };
export type { SpinnerProps, SpinnerSize, SpinnerVariant };
