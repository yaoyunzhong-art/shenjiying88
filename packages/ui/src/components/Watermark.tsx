'use client';

import React, { useMemo } from 'react';

export type WatermarkContent = string | React.ReactNode;

export interface WatermarkProps {
  /** Watermark text or node to display */
  content?: WatermarkContent;
  /** Whether to enable the watermark */
  disabled?: boolean;
  /** Font size in px */
  fontSize?: number;
  /** Font color */
  color?: string;
  /** Opacity 0-1 */
  opacity?: number;
  /** Rotation angle in degrees */
  rotate?: number;
  /** Gap between watermarks (horizontal, vertical) in px */
  gap?: [number, number];
  /** Offset of the first watermark from top-left (x, y) in px */
  offset?: [number, number];
  /** Z-index of the watermark overlay */
  zIndex?: number;
  /** Children to be watermarked */
  children?: React.ReactNode;
  /** data-testid */
  'data-testid'?: string;
}

const DEFAULT_PROPS: Partial<WatermarkProps> = {
  content: '',
  fontSize: 14,
  color: '#000',
  opacity: 0.15,
  rotate: -22,
  gap: [100, 100],
  offset: [50, 50],
  zIndex: 9999,
};

/**
 * Watermark 组件
 *
 * 在内容区域覆盖半透明水印，用于敏感页面/文档的权限标识。
 * 支持自定义文字、旋转角度、间距和透明度。
 */
export const Watermark: React.FC<WatermarkProps> = ({
  content = DEFAULT_PROPS.content,
  disabled = false,
  fontSize = DEFAULT_PROPS.fontSize!,
  color = DEFAULT_PROPS.color!,
  opacity = DEFAULT_PROPS.opacity!,
  rotate = DEFAULT_PROPS.rotate!,
  gap = DEFAULT_PROPS.gap as [number, number],
  offset = DEFAULT_PROPS.offset as [number, number],
  zIndex = DEFAULT_PROPS.zIndex!,
  children,
  'data-testid': dataTestId,
}) => {
  const svgText = useMemo(() => {
    if (!content) return '';
    const text = typeof content === 'string' ? content : '';
    return text;
  }, [content]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const [gapX, gapY] = gap;
  const [offsetX, offsetY] = offset;

  const watermarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex,
    overflow: 'hidden',
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="watermark" x="${offsetX}" y="${offsetY}" width="${gapX}" height="${gapY}" patternUnits="userSpaceOnUse">
            <text x="0" y="${fontSize}" fill="${color}" fill-opacity="${opacity}" font-size="${fontSize}px" transform="rotate(${rotate})" dominant-baseline="hanging">
              ${svgText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark)" />
      </svg>`
    )}")`,
    backgroundRepeat: 'repeat',
  };

  return (
    <div
      style={{ position: 'relative' }}
      data-testid={dataTestId ?? 'watermark-root'}
      data-watermark="true"
    >
      {children}
      <div style={watermarkStyle} aria-hidden="true" data-testid="watermark-overlay" />
    </div>
  );
};

export default Watermark;
