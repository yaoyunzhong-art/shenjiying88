'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── 断点定义 ──────────────────────────────────────────────
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type BreakpointValue = (typeof BREAKPOINTS)[BreakpointKey];

/** 反向映射：minWidth → breakpoint key */
export function resolveBreakpoint(width: number): BreakpointKey {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

// ─── Context（透传当前断点和可见区域信息） ─────────────────
interface ResponsiveContextValue {
  /** 当前断点 key */
  breakpoint: BreakpointKey;
  /** viewport 宽度 (px) */
  width: number;
  /** viewport 高度 (px) */
  height: number;
  /** 是否 <= 指定断点（移动优先缩写） */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextValue>({
  breakpoint: 'lg',
  width: 1200,
  height: 800,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

export const useResponsive = () => useContext(ResponsiveContext);

// ─── Props ─────────────────────────────────────────────────
export interface ResponsiveContainerProps {
  children: React.ReactNode;

  /** 自定义断点覆盖 */
  breakpoints?: Partial<Record<BreakpointKey, number>>;

  /** 是否监听 resize（默认 true）。SSR 可关闭。 */
  observeResize?: boolean;

  /** ResizeObserver 防抖间隔 (ms) */
  debounceMs?: number;

  /** 传给外层 wrapper 的 className */
  className?: string;

  /** 传给外层 wrapper 的 style */
  style?: React.CSSProperties;

  /** 作为子元素渲染而非 wrapper（不额外产生 DOM 节点） */
  asChild?: boolean;
}

// ─── 组件 ──────────────────────────────────────────────────
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  breakpoints: customBp,
  observeResize = true,
  debounceMs = 200,
  className,
  style,
  asChild = false,
}) => {
  const mergedBreakpoints = { ...BREAKPOINTS, ...customBp } as Record<BreakpointKey, number>;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!observeResize || typeof window === 'undefined') return;

    const el = containerRef.current || document.documentElement;

    const handler = (entry: ResizeObserverEntry) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const rect = (entry.contentBoxSize?.[0] as ResizeObserverSize | undefined) ?? entry.contentRect;
        const width = 'inlineSize' in rect ? rect.inlineSize : rect.width;
        const height = 'blockSize' in rect ? rect.blockSize : rect.height;
        setDimensions({ width: Math.round(width), height: Math.round(height) });
      }, debounceMs);
    };

    // 初始化一次
    const rect = el.getBoundingClientRect();
    setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) handler(entry);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [observeResize, debounceMs]);

  const w = dimensions.width;
  const bp = resolveBreakpoint(w);
  const value: ResponsiveContextValue = {
    breakpoint: bp,
    width: w,
    height: dimensions.height,
    isMobile: w < mergedBreakpoints.md,
    isTablet: w >= mergedBreakpoints.md && w < mergedBreakpoints.lg,
    isDesktop: w >= mergedBreakpoints.lg,
  };

  if (asChild) {
    return (
      <ResponsiveContext.Provider value={value}>
        {children}
      </ResponsiveContext.Provider>
    );
  }

  return (
    <ResponsiveContext.Provider value={value}>
      <div ref={containerRef} className={className} style={style}>
        {children}
      </div>
    </ResponsiveContext.Provider>
  );
};

export default ResponsiveContainer;
