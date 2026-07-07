/**
 * HoverCard — 悬浮卡片组件
 * 鼠标悬停/聚焦触发显示浮层，常用于用户头像预览、链接预览、摘要展示
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ──

export type HoverCardPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface HoverCardProps {
  /** 触发元素 */
  children: React.ReactNode;
  /** 卡片内容 */
  content: React.ReactNode;
  /** 浮层方向 */
  placement?: HoverCardPlacement;
  /** 显示延迟 (ms) */
  openDelay?: number;
  /** 隐藏延迟 (ms) */
  closeDelay?: number;
  /** 卡片最大宽度 */
  maxWidth?: number;
  /** 卡片最大高度 */
  maxHeight?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 内容区域样式 */
  contentStyle?: React.CSSProperties;
}

// ── Placement helpers ──

function computePosition(
  triggerRect: DOMRect,
  cardRect: DOMRect,
  placement: HoverCardPlacement,
  gap = 8,
): React.CSSProperties {
  switch (placement) {
    case 'top':
      return {
        top: triggerRect.top - cardRect.height - gap,
        left: triggerRect.left + triggerRect.width / 2 - cardRect.width / 2,
      };
    case 'bottom':
      return {
        top: triggerRect.bottom + gap,
        left: triggerRect.left + triggerRect.width / 2 - cardRect.width / 2,
      };
    case 'left':
      return {
        top: triggerRect.top + triggerRect.height / 2 - cardRect.height / 2,
        left: triggerRect.left - cardRect.width - gap,
      };
    case 'right':
      return {
        top: triggerRect.top + triggerRect.height / 2 - cardRect.height / 2,
        left: triggerRect.right + gap,
      };
  }
}

// ── Arrow direction map ──

const ARROW_STYLES: Record<HoverCardPlacement, React.CSSProperties> = {
  top: { bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  bottom: { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  left: { right: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
  right: { left: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
};

// ── Component ──

export function HoverCard({
  children,
  content,
  placement = 'bottom',
  openDelay = 200,
  closeDelay = 150,
  maxWidth = 300,
  maxHeight,
  disabled = false,
  className,
  style,
  contentStyle,
}: HoverCardProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    clearTimers();
    openTimer.current = setTimeout(() => {
      if (triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        // Render off-screen first to measure
        setVisible(true);
        requestAnimationFrame(() => {
          if (cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            setPosition(computePosition(triggerRect, cardRect, placement));
          }
        });
      }
    }, openDelay);
  }, [disabled, clearTimers, openDelay, placement]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => {
      setVisible(false);
    }, closeDelay);
  }, [clearTimers, closeDelay]);

  const handleCardMouseEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setVisible(false);
    }, closeDelay);
  }, [closeDelay]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <span
      ref={triggerRef}
      className={className}
      style={{ display: 'inline-flex', position: 'relative', ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {visible && content && (
        <div
          ref={cardRef}
          role="tooltip"
          style={{
            position: 'fixed',
            zIndex: 1050,
            ...position,
            maxWidth,
            maxHeight,
            background: '#fff',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
            padding: 12,
            fontSize: 13,
            lineHeight: 1.5,
            color: '#374151',
            overflow: 'auto',
            ...contentStyle,
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              background: '#fff',
              borderLeft: '1px solid #e5e7eb',
              borderTop: '1px solid #e5e7eb',
              ...ARROW_STYLES[placement],
            }}
          />
          {content}
        </div>
      )}
    </span>
  );
}
