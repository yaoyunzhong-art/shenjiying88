'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface VirtualizedListRow<T> {
  key: string;
  data: T;
}

export interface VirtualizedListProps<T> {
  /** 数据行列表 */
  rows: VirtualizedListRow<T>[];
  /** 每行渲染函数 */
  renderRow: (row: VirtualizedListRow<T>, index: number) => React.ReactNode;
  /** 每行高度 (px)，固定高度模式使用 */
  rowHeight?: number;
  /** 可变行高：根据行数据返回高度 */
  rowHeightFn?: (row: VirtualizedListRow<T>, index: number) => number;
  /** 容器高度，不传则自适应父容器 */
  height?: number;
  /** 容器宽度 */
  width?: string | number;
  /** 缓冲区行数（超出可视区域的预渲染行数），默认 3 */
  overscan?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 空数据展示 */
  emptyText?: React.ReactNode;
  /** 行点击 */
  onRowClick?: (row: VirtualizedListRow<T>, index: number) => void;
  /** 滚动回调 */
  onScroll?: (scrollTop: number) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * VirtualizedList — 虚拟滚动列表组件。
 *
 * 只渲染可视区域内的行，通过占位元素撑开总高度实现滚动。
 * 支持固定行高和动态行高两种模式。
 *
 * @example
 * // 固定行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeight={48}
 *   height={600}
 *   renderRow={(row, index) => <div>{row.data.name}</div>}
 * />
 *
 * @example
 * // 动态行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeightFn={(row) => row.data.expanded ? 120 : 48}
 *   height={600}
 *   renderRow={(row, index) => <ExpandableRow data={row.data} />}
 * />
 */
export function VirtualizedList<T>({
  rows,
  renderRow,
  rowHeight = 48,
  rowHeightFn,
  height: heightProp,
  width = '100%',
  overscan = 3,
  className,
  style,
  emptyText = '暂无数据',
  onRowClick,
  onScroll,
  disabled = false,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(heightProp ?? 0);
  const [scrollTop, setScrollTop] = useState(0);

  // 自适应容器高度
  useEffect(() => {
    const calcHeight = () => {
      if (heightProp) {
        setContainerHeight(heightProp);
        return;
      }
      if (containerRef.current?.parentElement) {
        const parentHeight = containerRef.current.parentElement.clientHeight;
        setContainerHeight(parentHeight > 0 ? parentHeight : 400);
      }
    };

    calcHeight();

    if (!heightProp) {
      const observer = new ResizeObserver(() => calcHeight());
      if (containerRef.current?.parentElement) {
        observer.observe(containerRef.current.parentElement);
      }
      return () => observer.disconnect();
    }
  }, [heightProp]);

  // 计算行高数组（动态模式）
  const rowHeights = useMemo(() => {
    if (!rowHeightFn) return undefined;
    return rows.map((row, idx) => rowHeightFn(row, idx));
  }, [rows, rowHeightFn]);

  // 累积高度偏移
  const { totalHeight, rowOffsets } = useMemo(() => {
    const offsets: number[] = [0];
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const h = rowHeights ? (rowHeights[i] ?? rowHeight) : rowHeight;
      total += h;
      offsets.push(total);
    }
    return { totalHeight: total, rowOffsets: offsets };
  }, [rows, rowHeights, rowHeight]);

  // 计算可视范围
  const visibleRange = useMemo(() => {
    const startIdx = binarySearchStart(rowOffsets, scrollTop, rows.length);
    const endIdx = binarySearchEnd(
      rowOffsets,
      scrollTop + containerHeight,
      rows.length,
    );

    const start = Math.max(0, startIdx - overscan);
    const end = Math.min(rows.length, endIdx + overscan);

    return { start, end };
  }, [rowOffsets, scrollTop, containerHeight, rows.length, overscan]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const top = (e.target as HTMLDivElement).scrollTop;
      setScrollTop(top);
      onScroll?.(top);
    },
    [onScroll],
  );

  // 空状态
  if (rows.length === 0) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width,
          height: containerHeight > 0 ? containerHeight : 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 14,
          ...style,
        }}
      >
        {emptyText}
      </div>
    );
  }

  const visibleRows = rows.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height: containerHeight > 0 ? containerHeight : 400,
        overflow: 'auto',
        position: 'relative',
        ...(disabled ? { pointerEvents: 'none', opacity: 0.6 } : {}),
        ...style,
      }}
      onScroll={handleScroll}
      role="list"
    >
      {/* 总高度占位 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 渲染可视行 */}
        {visibleRows.map((row, i) => {
          const actualIndex = visibleRange.start + i;
          const top = rowOffsets[actualIndex];
          const h = rowHeights ? rowHeights[actualIndex] : rowHeight;

          return (
            <div
              key={row.key}
              role="listitem"
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: h,
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
              onClick={() => onRowClick?.(row, actualIndex)}
            >
              {renderRow(row, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 二分查找：找到第一个 offset > target 的前一个位置 */
function binarySearchStart(offsets: number[], target: number, maxIdx: number): number {
  let low = 0;
  let high = maxIdx;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    // offsets.length === maxIdx + 1, mid + 1 always in bounds
    if ((offsets[mid + 1] as number) <= target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

/** 二分查找：找到最后一个 offset <= target 的位置 */
function binarySearchEnd(offsets: number[], target: number, maxIdx: number): number {
  let low = 0;
  let high = maxIdx;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    // offsets.length === maxIdx + 1, mid always in bounds
    if ((offsets[mid] as number) < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return high;
}

export default VirtualizedList;
