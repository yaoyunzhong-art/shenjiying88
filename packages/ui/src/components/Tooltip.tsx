'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---- Types ----

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** 提示文字 */
  content: React.ReactNode;
  /** 触发元素 */
  children: React.ReactNode;
  /** 弹出方向 */
  placement?: TooltipPlacement;
  /** 延迟显示毫秒 */
  delayMs?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// ---- Placement offset helpers ----

const PLACEMENT_STYLES: Record<TooltipPlacement, (rect: DOMRect, tooltipRect: DOMRect) => React.CSSProperties> = {
  top: (rect, tt) => ({
    top: rect.top - tt.height - 8,
    left: rect.left + rect.width / 2 - tt.width / 2,
  }),
  bottom: (rect, tt) => ({
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2 - tt.width / 2,
  }),
  left: (rect, tt) => ({
    top: rect.top + rect.height / 2 - tt.height / 2,
    left: rect.left - tt.width - 8,
  }),
  right: (rect, tt) => ({
    top: rect.top + rect.height / 2 - tt.height / 2,
    left: rect.right + 8,
  }),
};

const ARROW_STYLES: Record<TooltipPlacement, React.CSSProperties> = {
  top: {
    bottom: -4,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderRight: '1px solid rgba(148, 163, 184, 0.18)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
  },
  bottom: {
    top: -4,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderLeft: '1px solid rgba(148, 163, 184, 0.18)',
    borderTop: '1px solid rgba(148, 163, 184, 0.18)',
  },
  left: {
    right: -4,
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderRight: '1px solid rgba(148, 163, 184, 0.18)',
    borderTop: '1px solid rgba(148, 163, 184, 0.18)',
  },
  right: {
    left: -4,
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderLeft: '1px solid rgba(148, 163, 184, 0.18)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
  },
};

// ---- Component ----

export const Tooltip = React.memo(function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 300,
  maxWidth = 280,
  style,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 计算弹出位置
  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const posStyle = PLACEMENT_STYLES[placement](triggerRect, tooltipRect);

    // 保底：不超出视口
    const margin = 8;
    if (typeof posStyle.left === 'number') {
      if (posStyle.left < margin) posStyle.left = margin;
      if (posStyle.left + tooltipRect.width > window.innerWidth - margin) {
        posStyle.left = window.innerWidth - tooltipRect.width - margin;
      }
    }
    if (typeof posStyle.top === 'number') {
      if (posStyle.top < margin) posStyle.top = margin;
      if (posStyle.top + tooltipRect.height > window.innerHeight - margin) {
        posStyle.top = window.innerHeight - tooltipRect.height - margin;
      }
    }

    setPosition(posStyle);
  }, [visible, placement]);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-flex', position: 'relative', cursor: 'pointer' }}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={className}
          style={{
            position: 'fixed',
            zIndex: 9999,
            maxWidth,
            padding: '8px 12px',
            fontSize: 12,
            lineHeight: 1.5,
            color: '#e2e8f0',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            ...position,
            ...style,
          }}
        >
          {/* 箭头 */}
          <span
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              background: 'rgba(15, 23, 42, 0.95)',
              ...ARROW_STYLES[placement],
            }}
          />
          {content}
        </div>
      )}
    </span>
  );
});

export default Tooltip;
