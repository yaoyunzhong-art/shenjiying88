'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';

// ---- 类型 ----

/** 分割方向 */
export type SplitDirection = 'horizontal' | 'vertical';

/** 面板最小尺寸 (px) */
const MIN_PANE_SIZE = 100;

export interface SplitPaneProps {
  /** 第一个面板 (左侧/上侧) */
  first: React.ReactNode;
  /** 第二个面板 (右侧/下侧) */
  second: React.ReactNode;
  /** 分割方向 (默认 horizontal) */
  direction?: SplitDirection;
  /** 初始分割比例, 0-1 之间, 默认 0.5 */
  initialSplit?: number;
  /** 分隔条宽度 (默认 4) */
  dividerWidth?: number;
  /** 分隔条颜色 (默认 rgba(148,163,184,0.24)) */
  dividerColor?: string;
  /** 分隔条悬停颜色 (默认 rgba(148,163,184,0.48)) */
  dividerHoverColor?: string;
  /** 容器最小高度 (默认 300) */
  minHeight?: number;
  /** 容器最小宽度 (默认 300) */
  minWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ---- 常量 ----

const DIVIDER_DEFAULT_COLOR = 'rgba(148, 163, 184, 0.24)';
const DIVIDER_DEFAULT_HOVER_COLOR = 'rgba(148, 163, 184, 0.48)';

/**
 * SplitPane — 可拖拽分割面板
 *
 * 支持水平和垂直方向分割，拖拽分隔条调整两个面板尺寸。
 * 用于管理后台的左右分栏、上下分栏等场景。
 *
 * @example
 * // 水平分割（左右）
 * <SplitPane
 *   first={<ListPanel />}
 *   second={<DetailPanel />}
 *   direction="horizontal"
 *   initialSplit={0.3}
 * />
 *
 * @example
 * // 垂直分割（上下）
 * <SplitPane
 *   first={<EditorPanel />}
 *   second={<PreviewPanel />}
 *   direction="vertical"
 *   initialSplit={0.6}
 * />
 */
export function SplitPane({
  first,
  second,
  direction = 'horizontal',
  initialSplit = 0.5,
  dividerWidth = 4,
  dividerColor = DIVIDER_DEFAULT_COLOR,
  dividerHoverColor = DIVIDER_DEFAULT_HOVER_COLOR,
  minHeight = 300,
  minWidth = 300,
  className,
  style,
}: SplitPaneProps) {
  const isHorizontal = direction === 'horizontal';

  // 用百分比控制分割比例
  const [splitPct, setSplitPct] = useState(() =>
    Math.min(1, Math.max(0, initialSplit)) * 100,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPosRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      lastPosRef.current = isHorizontal ? e.clientX : e.clientY;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = isHorizontal ? rect.width : rect.height;
        const currentPos = isHorizontal ? ev.clientX : ev.clientY;
        const delta = currentPos - lastPosRef.current;
        const deltaPct = (delta / containerSize) * 100;

        setSplitPct((prev) => {
          const next = prev + deltaPct;
          // 确保最小面板尺寸
          const minPct = (MIN_PANE_SIZE / containerSize) * 100;
          return Math.min(100 - minPct, Math.max(minPct, next));
        });

        lastPosRef.current = currentPos;
      };

      const handleMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isHorizontal],
  );

  // 样式
  const firstSizePct = splitPct;
  const secondSizePct = 100 - splitPct;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    width: '100%',
    height: '100%',
    minHeight,
    minWidth,
    overflow: 'hidden',
    ...style,
  };

  const dividerStyle: React.CSSProperties = {
    flexShrink: 0,
    cursor: isHorizontal ? 'col-resize' : 'row-resize',
    backgroundColor: dividerColor,
    transition: 'background-color 0.15s ease',
    ...(isHorizontal
      ? { width: dividerWidth, height: '100%', minHeight: '100%' }
      : { height: dividerWidth, width: '100%', minWidth: '100%' }),
  };

  // hover 通过 data 属性处理
  const containerClass = `split-pane-container${className ? ` ${className}` : ''}`;

  return (
    <div ref={containerRef} className={containerClass} style={containerStyle}>
      <div
        className="split-pane-first"
        style={{
          flexBasis: `${firstSizePct}%`,
          flexGrow: 0,
          flexShrink: 0,
          overflow: 'auto',
          minWidth: isHorizontal ? MIN_PANE_SIZE : undefined,
          minHeight: isHorizontal ? undefined : MIN_PANE_SIZE,
        }}
      >
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={direction}
        aria-label={`${direction} resize handle`}
        tabIndex={0}
        style={dividerStyle}
        onMouseDown={handleMouseDown}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = dividerHoverColor;
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = dividerColor;
        }}
      />
      <div
        className="split-pane-second"
        style={{
          flex: 1,
          overflow: 'auto',
          minWidth: isHorizontal ? MIN_PANE_SIZE : undefined,
          minHeight: isHorizontal ? undefined : MIN_PANE_SIZE,
        }}
      >
        {second}
      </div>
    </div>
  );
}
