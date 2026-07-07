'use client';

import React, { useEffect, useRef, useState } from 'react';

// ==================== 类型定义 ====================

export interface CountUpProps {
  /** 目标数值 */
  end: number;
  /** 起始数值，默认 0 */
  start?: number;
  /** 动画时长（毫秒），默认 1000 */
  duration?: number;
  /** 小数位数，默认 0 */
  decimals?: number;
  /** 数字前缀 */
  prefix?: string;
  /** 数字后缀 */
  suffix?: string;
  /** 千分位分隔符，默认 ',' */
  separator?: string;
  /** 是否自动开始动画，默认 true */
  autoStart?: boolean;
  /** 是否在可见时才触发动画（使用 IntersectionObserver） */
  enableScrollTrigger?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义 className */
  className?: string;
  /** 动画完成回调 */
  onEnd?: () => void;
  /** 格式化函数，覆盖默认格式化 */
  formatter?: (value: number) => string;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 工具函数 ====================

function formatNumber(
  value: number,
  decimals: number,
  separator: string,
  prefix: string,
  suffix: string,
): string {
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts[1] ?? '';

  // 千分位
  const separated = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const result = decPart ? `${separated}.${decPart}` : separated;
  return `${prefix}${result}${suffix}`;
}

// ==================== 组件 ====================

export function CountUp({
  end,
  start = 0,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  autoStart = true,
  enableScrollTrigger = false,
  style,
  className,
  onEnd,
  formatter,
  'data-testid': dataTestId,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  const animate = useRef(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;
    setDisplayValue(current);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate.current);
    } else {
      setDisplayValue(end);
      setIsAnimating(false);
      setHasAnimated(true);
      onEnd?.();
    }
  });

  const startAnimation = () => {
    if (startedRef.current && hasAnimated) return;
    startedRef.current = true;
    startTimeRef.current = 0;
    setIsAnimating(true);
    setHasAnimated(false);
    rafRef.current = requestAnimationFrame(animate.current);
  };

  // 自动启动
  useEffect(() => {
    if (autoStart && !enableScrollTrigger) {
      // 小额延迟确保 DOM 已挂载
      const timer = setTimeout(() => startAnimation(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoStart, enableScrollTrigger]);

  // ScrollTrigger
  useEffect(() => {
    if (!enableScrollTrigger || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            startAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [enableScrollTrigger, hasAnimated]);

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 暴露重新开始方法
  useEffect(() => {
    // 当 end 改变时重置并重新开始（如果 autoStart）
    if (autoStart) {
      startedRef.current = false;
      setHasAnimated(false);
      const timer = setTimeout(() => startAnimation(), 50);
      return () => clearTimeout(timer);
    }
  }, [end]);

  const displayed = formatter
    ? formatter(displayValue)
    : formatNumber(displayValue, decimals, separator, prefix, suffix);

  return (
    <span
      ref={elementRef}
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
      data-testid={dataTestId ?? 'count-up'}
      role="status"
      aria-live="polite"
      aria-label={`${prefix}${end}${suffix}`}
    >
      {displayed}
    </span>
  );
}
