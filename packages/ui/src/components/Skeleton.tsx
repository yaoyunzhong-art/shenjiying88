'use client';

import React from 'react';

type SkeletonShape = 'rect' | 'circle' | 'text';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 骨架屏形状：rect 矩形 / circle 圆形 / text 文本行 */
  shape?: SkeletonShape;
  /** 宽度（默认 100%） */
  width?: number | string;
  /** 高度（shape=circle 时自动等于 width） */
  height?: number;
  /** 圆角大小，覆盖 shape 默认值 */
  borderRadius?: number | string;
  /** 是否启用动画，默认 true */
  animated?: boolean;
  /** 行数（shape=text 时生效，渲染多条文本行） */
  lines?: number;
  /** 每行随机宽度范围 [min%, max%]，仅 lines 有效 */
  lineWidthRange?: [number, number];
  /** 行间距，默认 12 */
  lineGap?: number;
}

function randomBetween(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}

export function Skeleton({
  shape = 'rect',
  width = '100%',
  height,
  borderRadius,
  animated = true,
  lines = 1,
  lineWidthRange = [60, 100],
  lineGap = 12,
  style,
  className,
  ...rest
}: SkeletonProps) {
  if (shape === 'text' && lines > 1) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: lineGap,
          width,
          ...style,
        }}
        className={className}
        {...rest}
      >
        {Array.from({ length: lines }).map((_, i) => {
          const w = `${randomBetween(lineWidthRange[0], lineWidthRange[1])}%`;
          return (
            <div
              key={i}
              style={{
                height: height ?? 14,
                width: i === lines - 1 ? `${randomBetween(40, 60)}%` : w,
                borderRadius: borderRadius ?? 4,
                background: `var(--skeleton-bg, rgba(148,163,184,0.12))`,
                animation: animated ? 'skeleton-pulse 1.6s ease-in-out infinite' : 'none',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // single element
  const isCircle = shape === 'circle';
  const size = isCircle ? (height ?? (typeof width === 'number' ? width : 32)) : undefined;

  return (
    <div
      style={{
        width: isCircle ? size : width,
        height: isCircle ? size : (height ?? 16),
        borderRadius:
          borderRadius ?? (isCircle ? '50%' : shape === 'text' ? 4 : 8),
        background: `var(--skeleton-bg, rgba(148,163,184,0.12))`,
        animation: animated ? 'skeleton-pulse 1.6s ease-in-out infinite' : 'none',
        ...style,
      }}
      className={className}
      {...rest}
    />
  );
}
