'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---- Types ----

export type PopoverPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

export interface PopoverProps {
  /** 触发器元素 */
  trigger: React.ReactNode;
  /** popover 弹层内容 */
  children: React.ReactNode;
  /** 可选标题 */
  title?: string;
  /** 弹出方向，默认 bottom */
  placement?: PopoverPlacement;
  /** 触发方式，默认 click */
  triggerMode?: 'click' | 'hover';
  /** 弹出后是否显示关闭按钮 */
  showClose?: boolean;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 打开/关闭回调 */
  onOpenChange?: (open: boolean) => void;
}

// ---- Placement resolver ----
// 根据 placement 解析主方向和子对齐
// 主方向: top/bottom/left/right
// 子对齐: start/center/end
function resolvePlacement(p: PopoverPlacement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const parts = p.split('-');
  const side = parts[0] as 'top' | 'bottom' | 'left' | 'right';
  const align = parts[1] as 'start' | 'center' | 'end' | undefined;
  return { side, align: align ?? 'center' };
}

function computePosition(
  popoverRect: DOMRect,
  triggerRect: DOMRect,
  placement: PopoverPlacement,
): React.CSSProperties {
  const { side, align } = resolvePlacement(placement);
  const gap = 8;
  const popW = popoverRect.width;
  const popH = popoverRect.height;
  const trigW = triggerRect.width;
  const trigH = triggerRect.height;

  let top = 0;
  let left = 0;

  // 主方向定位
  switch (side) {
    case 'top':
      top = triggerRect.top - popH - gap;
      break;
    case 'bottom':
      top = triggerRect.bottom + gap;
      break;
    case 'left':
      left = triggerRect.left - popW - gap;
      break;
    case 'right':
      left = triggerRect.right + gap;
      break;
  }

  // 副轴对齐
  if (side === 'top' || side === 'bottom') {
    switch (align) {
      case 'start':
        left = triggerRect.left;
        break;
      case 'center':
        left = triggerRect.left + trigW / 2 - popW / 2;
        break;
      case 'end':
        left = triggerRect.right - popW;
        break;
    }
  } else {
    switch (align) {
      case 'start':
        top = triggerRect.top;
        break;
      case 'center':
        top = triggerRect.top + trigH / 2 - popH / 2;
        break;
      case 'end':
        top = triggerRect.bottom - popH;
        break;
    }
  }

  // 视口保底
  const margin = 8;
  if (left < margin) left = margin;
  if (left + popW > window.innerWidth - margin) {
    left = window.innerWidth - popW - margin;
  }
  if (top < margin) top = margin;
  if (top + popH > window.innerHeight - margin) {
    top = window.innerHeight - popH - margin;
  }

  return { top, left };
}

function arrowStyles(side: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 10,
    height: 10,
    background: '#1e293b',
    border: '1px solid rgba(148, 163, 184, 0.16)',
  };
  switch (side) {
    case 'top':
      return { ...base, bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderTop: 'none', borderLeft: 'none' };
    case 'bottom':
      return { ...base, top: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderBottom: 'none', borderRight: 'none' };
    case 'left':
      return { ...base, right: -5, top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderLeft: 'none', borderBottom: 'none' };
    case 'right':
      return { ...base, left: -5, top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderRight: 'none', borderTop: 'none' };
  }
}

// ---- Component ----

export const Popover = React.memo(function Popover({
  trigger,
  children,
  title,
  placement = 'bottom',
  triggerMode = 'click',
  showClose = false,
  maxWidth = 360,
  minWidth = 200,
  disabled = false,
  className,
  style,
  onOpenChange,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { side } = resolvePlacement(placement);

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [disabled, onOpenChange]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    // 延迟绑定，避免当前 click 立即触发关闭
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  // 计算弹出位置
  useEffect(() => {
    if (!open || !containerRef.current || !popoverRef.current) return;

    const triggerEl = containerRef.current.firstElementChild;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    setPosition(computePosition(popoverRect, triggerRect, placement));
  }, [open, placement]);

  const handleTriggerClick = useCallback(() => {
    if (triggerMode === 'click') toggle();
  }, [triggerMode, toggle]);

  const handleMouseEnter = useCallback(() => {
    if (triggerMode === 'hover' && !disabled) {
      setOpen(true);
      onOpenChange?.(true);
    }
  }, [triggerMode, disabled, onOpenChange]);

  const handleMouseLeave = useCallback(() => {
    if (triggerMode === 'hover') {
      setOpen(false);
      onOpenChange?.(false);
    }
  }, [triggerMode, onOpenChange]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <div
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="dialog"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTriggerClick();
          }
        }}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
        }}
      >
        {trigger}
      </div>

      {/* Popover content */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          style={{
            position: 'fixed',
            zIndex: 1000,
            minWidth,
            maxWidth,
            borderRadius: 12,
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            animation: 'popover-slide-in 0.15s ease-out',
            ...position,
          }}
        >
          {/* 箭头 */}
          <span style={arrowStyles(side)} />

          {/* 标题栏 */}
          {(title || showClose) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px 8px',
                borderBottom: title
                  ? '1px solid rgba(148, 163, 184, 0.10)'
                  : 'none',
              }}
            >
              {title && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#f1f5f9',
                  }}
                >
                  {title}
                </span>
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={close}
                  aria-label="关闭"
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 16,
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* 内容 */}
          <div style={{ padding: '12px 16px' }}>{children}</div>
        </div>
      )}

      <style>{`
        @keyframes popover-slide-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

export default Popover;
