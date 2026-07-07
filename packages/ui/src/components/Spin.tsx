'use client';

import React from 'react';

// ---- Types ----

type SpinSize = 'sm' | 'md' | 'lg';

export interface SpinProps {
  /** 是否为加载中状态，默认 true */
  spinning?: boolean;
  /** 加载描述文案（显示在指示器下方） */
  tip?: string;
  /** 指示器尺寸 */
  size?: SpinSize;
  /** 自定义加载指示器，替换默认 spinner */
  indicator?: React.ReactNode;
  /** 延迟显示加载时间（毫秒），用于防止闪烁 */
  delay?: number;
  /** 包裹的内容区域 */
  children?: React.ReactNode;
  /** 外层容器类名 */
  className?: string;
  /** 遮罩容器样式 */
  style?: React.CSSProperties;
  /** 是否全屏覆盖 */
  fullscreen?: boolean;
}

// ---- Constants ----

const SPINNER_SIZE_MAP: Record<SpinSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
};

const SPINNER_STROKE_MAP: Record<SpinSize, number> = {
  sm: 2,
  md: 2.5,
  lg: 3.5,
};

// ---- DefaultSpinner ----

function DefaultSpinner({ size }: { size: SpinSize }) {
  const dim = SPINNER_SIZE_MAP[size];
  const stroke = SPINNER_STROKE_MAP[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = circumference * 0.75;

  return (
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
        stroke="#d9d9d9"
        strokeWidth={stroke}
        opacity={0.3}
      />
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={radius}
        fill="none"
        stroke="#6366f1"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        style={{
          transformOrigin: 'center',
          animation: 'spin-rotate 0.8s linear infinite',
        }}
      />
    </svg>
  );
}

// ---- Hook: useDelay ----

function useDelay(delay: number | undefined, spinning: boolean): boolean {
  const [delayed, setDelayed] = React.useState(!delay || !spinning);

  React.useEffect(() => {
    if (!delay || !spinning) {
      setDelayed(!delay || spinning);
      return;
    }
    const timer = setTimeout(() => setDelayed(true), delay);
    return () => clearTimeout(timer);
  }, [delay, spinning]);

  return delayed;
}

// ---- Spin Component ----

export function Spin({
  spinning = true,
  tip,
  size = 'md',
  indicator,
  delay,
  children,
  className,
  style,
  fullscreen = false,
}: SpinProps) {
  const visible = useDelay(delay, spinning);

  // ---- Inline mode (no children wrap) ----
  if (!children && !fullscreen) {
    return (
      <div
        role="status"
        aria-label={tip ?? '加载中'}
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          ...style,
        }}
      >
        {visible ? (indicator ?? <DefaultSpinner size={size} />) : null}
        {tip && visible ? (
          <span
            style={{
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.3,
            }}
          >
            {tip}
          </span>
        ) : null}
        <style>{`@keyframes spin-rotate { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---- Container mode (wraps children) ----
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {children}
      {visible && (
        <div
          style={{
            position: fullscreen ? 'fixed' : 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.75)',
            zIndex: 999,
            gap: 8,
          }}
        >
          {indicator ?? <DefaultSpinner size={size} />}
          {tip ? (
            <span
              style={{
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.3,
              }}
            >
              {tip}
            </span>
          ) : null}
        </div>
      )}
      <style>{`@keyframes spin-rotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export type { SpinSize };
