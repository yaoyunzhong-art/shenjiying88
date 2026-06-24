'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ScrollAreaProps {
  /** Content to render inside the scrollable area */
  children: React.ReactNode;
  /** Maximum height. If not set, grows with content. */
  maxHeight?: number | string;
  /** Fixed height. Overrides maxHeight. */
  height?: number | string;
  /** Max width. If not set, fills container. */
  maxWidth?: number | string;
  /** Scrollbar thumb color (CSS color), default #94a3b8 */
  thumbColor?: string;
  /** Scrollbar track color, default transparent */
  trackColor?: string;
  /** Scrollbar width in px, default 8 */
  scrollbarWidth?: number;
  /** Always show scrollbar (not only on hover/focus), default false */
  alwaysVisible?: boolean;
  /** Whether to show scroll shadow indicators at top/bottom edges */
  showShadowEdges?: boolean;
  /** ARIA label for the scrollable region */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class for the outer wrapper */
  className?: string;
  /** Inline style override for the outer wrapper */
  style?: React.CSSProperties;
  /** Callback when scroll position changes */
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  /** Scroll to bottom when content changes (e.g. chat) */
  autoScrollToBottom?: boolean;
}

/**
 * ScrollArea — a custom-scrollbar container for consistent cross-platform scrolling.
 *
 * Used in dashboards, modals, dropdowns, and any constrained-height containers
 * where native scrollbars are visually inconsistent.
 */
export function ScrollArea({
  children,
  maxHeight,
  height,
  maxWidth,
  thumbColor = '#94a3b8',
  trackColor = 'transparent',
  scrollbarWidth = 8,
  alwaysVisible = false,
  showShadowEdges = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
  onScroll,
  autoScrollToBottom = false,
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    thumbHeight: 0,
    thumbTop: 0,
    isHovered: false,
    isScrolling: false,
    thumbDragging: false,
    showTopShadow: false,
    showBottomShadow: false,
  });

  const recalc = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const { scrollTop, scrollHeight, clientHeight } = vp;
    const thumbH = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
    const thumbT =
      scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbH)
        : 0;

    setScrollState((prev) => ({
      ...prev,
      scrollTop,
      scrollHeight,
      clientHeight,
      thumbHeight: thumbH,
      thumbTop: thumbT,
      showTopShadow: showShadowEdges ? scrollTop > 0 : false,
      showBottomShadow: showShadowEdges ? scrollTop + clientHeight < scrollHeight - 1 : false,
    }));

    onScroll?.(scrollTop, scrollHeight, clientHeight);
  }, [onScroll, showShadowEdges]);

  // Auto-scroll to bottom when children change
  useEffect(() => {
    if (!autoScrollToBottom || !viewportRef.current) return;
    const vp = viewportRef.current;
    vp.scrollTop = vp.scrollHeight;
    recalc();
  }, [children, autoScrollToBottom, recalc]);

  // Ensure recalc when content changes size
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    recalc();

    // Use ResizeObserver to track content size changes
    const ro = new ResizeObserver(() => recalc());
    ro.observe(vp);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [recalc]);

  const handleScroll = useCallback(() => {
    recalc();
  }, [recalc]);

  const handleMouseEnter = useCallback(() => {
    if (!alwaysVisible) setScrollState((prev) => ({ ...prev, isHovered: true }));
  }, [alwaysVisible]);

  const handleMouseLeave = useCallback(() => {
    if (!alwaysVisible)
      setScrollState((prev) => ({ ...prev, isHovered: false, isScrolling: false }));
  }, [alwaysVisible]);

  // Thumb drag support
  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const vp = viewportRef.current;
      if (!vp) return;
      const startY = e.clientY;
      const startScrollTop = vp.scrollTop;
      const ratio =
        (vp.scrollHeight - vp.clientHeight) / (vp.clientHeight - scrollState.thumbHeight);

      setScrollState((prev) => ({ ...prev, thumbDragging: true }));

      const onMouseMove = (ev: MouseEvent) => {
        const dy = ev.clientY - startY;
        vp.scrollTop = startScrollTop + dy * ratio;
      };
      const onMouseUp = () => {
        setScrollState((prev) => ({ ...prev, thumbDragging: false }));
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [scrollState.thumbHeight]
  );

  const hasScrollbar = scrollState.scrollHeight > scrollState.clientHeight;
  const showScrollbar = alwaysVisible || scrollState.isHovered || scrollState.isScrolling || scrollState.thumbDragging;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: maxWidth ?? undefined,
    height: height ?? undefined,
    maxHeight: height ? undefined : (maxHeight ?? undefined),
    ...style,
  };

  const viewportStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none' as const, // Firefox
    msOverflowStyle: 'none', // IE/Edge
    // Hide native scrollbar in WebKit
    ...({} as any),
    position: 'relative',
  };

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    width: scrollbarWidth,
    borderRadius: scrollbarWidth / 2,
    background: trackColor,
    opacity: showScrollbar ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: showScrollbar ? 'auto' : 'none',
    zIndex: 10,
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: scrollState.thumbTop,
    right: 0,
    width: scrollbarWidth,
    height: scrollState.thumbHeight,
    borderRadius: scrollbarWidth / 2,
    background: thumbColor,
    cursor: 'pointer',
    transition: scrollState.thumbDragging ? 'none' : 'opacity 0.15s ease, background 0.15s ease',
    opacity: showScrollbar ? 0.8 : 0,
  };

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={wrapperStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top shadow edge */}
      {showShadowEdges && scrollState.showTopShadow ? (
        <div
          data-testid={dataTestId ? `${dataTestId}-top-shadow` : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: scrollbarWidth + 4,
            height: 20,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      ) : null}

      <div
        ref={viewportRef}
        data-testid={dataTestId ? `${dataTestId}-viewport` : undefined}
        role="region"
        aria-label={ariaLabel ?? 'Scrollable content'}
        tabIndex={0}
        style={viewportStyle}
        onScroll={handleScroll}
        onFocus={() => {
          if (!alwaysVisible) setScrollState((prev) => ({ ...prev, isScrolling: true }));
        }}
        onBlur={() => {
          if (!alwaysVisible)
            setScrollState((prev) => ({ ...prev, isScrolling: false }));
        }}
      >
        {/* Hide native scrollbar in WebKit */}
        <style>{`
          [data-testid="${dataTestId ? `${dataTestId}-viewport` : ''}"]::-webkit-scrollbar {
            display: none;
          }
          [data-testid="${dataTestId ? `${dataTestId}-viewport` : ''}"] {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div ref={contentRef} data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
          {children}
        </div>
      </div>

      {/* Custom scrollbar track */}
      {hasScrollbar ? (
        <div
          data-testid={dataTestId ? `${dataTestId}-track` : undefined}
          style={trackStyle}
        >
          <div
            data-testid={dataTestId ? `${dataTestId}-thumb` : undefined}
            style={thumbStyle}
            onMouseDown={handleThumbMouseDown}
            role="scrollbar"
            aria-controls={dataTestId ? `${dataTestId}-viewport` : undefined}
            aria-orientation="vertical"
            aria-valuenow={Math.round(
              scrollState.clientHeight > 0
                ? (scrollState.scrollTop / (scrollState.scrollHeight - scrollState.clientHeight)) * 100
                : 0
            )}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      ) : null}

      {/* Bottom shadow edge */}
      {showShadowEdges && scrollState.showBottomShadow ? (
        <div
          data-testid={dataTestId ? `${dataTestId}-bottom-shadow` : undefined}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: scrollbarWidth + 4,
            height: 20,
            background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      ) : null}
    </div>
  );
}
