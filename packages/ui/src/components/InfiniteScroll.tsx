'use client';

import React, { useCallback, useEffect, useRef } from 'react';

// ==================== 类型定义 ====================

export interface InfiniteScrollProps {
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 加载更多回调 */
  onLoadMore: () => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 加载提示文字 */
  loadingText?: string;
  /** 没有更多数据时的提示文字 */
  endText?: string;
  /** 距底部触发加载的距离（px 或 viewport 百分比） */
  threshold?: number;
  /** 是否禁用（比如初始化时） */
  disabled?: boolean;
  /** 加载骨架屏 */
  loader?: React.ReactNode;
  /** 空内容 */
  empty?: React.ReactNode;
  /** 子节点 */
  children?: React.ReactNode;
  /** 容器 class */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 容器方向：垂直滚动 / 水平滚动 */
  direction?: 'vertical' | 'horizontal';
}

// ==================== InfiniteScroll 组件 ====================

/**
 * InfiniteScroll — 无限滚动组件
 *
 * 监听容器滚动到底部/右侧自动触发 onLoadMore。
 * 适用于长列表、分页加载等场景。
 *
 * @example
 * ```tsx
 * <InfiniteScroll hasMore={hasMore} onLoadMore={loadMore} loading={loading}>
 *   {items.map(item => <div key={item.id}>{item.name}</div>)}
 * </InfiniteScroll>
 * ```
 */
export function InfiniteScroll({
  hasMore,
  onLoadMore,
  loading = false,
  loadingText = '加载中...',
  endText = '没有更多了',
  threshold = 120,
  disabled = false,
  loader,
  empty,
  children,
  className = '',
  style,
  direction = 'vertical',
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(loading);
  const disabledRef = useRef(disabled);

  // Keep refs in sync
  loadingRef.current = loading;
  disabledRef.current = disabled;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      if (
        entry.isIntersecting &&
        hasMore &&
        !loadingRef.current &&
        !disabledRef.current
      ) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin:
        direction === 'horizontal'
          ? `0px ${threshold}px 0px 0px`
          : `0px 0px ${threshold}px 0px`,
      threshold: 0,
    });

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, threshold, direction]);

  // Check if children is empty (no items rendered)
  const isEmpty =
    !loading &&
    !hasMore &&
    React.Children.count(children) === 0;

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={className}
      style={{
        overflow: 'auto',
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        ...style,
      }}
      role="feed"
      aria-busy={loading}
    >
      {isEmpty && empty ? (
        empty
      ) : (
        children
      )}

      {/* Sentinel element for intersection observer */}
      <div
        ref={sentinelRef}
        style={{
          width: isHorizontal ? 1 : '100%',
          height: isHorizontal ? '100%' : 1,
          flexShrink: 0,
        }}
        aria-hidden
      />

      {/* Loading indicator */}
      {loading &&
        (loader ?? (
          <div
            style={{
              padding: '16px 0',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 14,
            }}
          >
            {loadingText}
          </div>
        ))}

      {/* End indicator */}
      {!hasMore && !loading && !isEmpty && (
        <div
          style={{
            padding: '16px 0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {endText}
        </div>
      )}
    </div>
  );
}

export default InfiniteScroll;
