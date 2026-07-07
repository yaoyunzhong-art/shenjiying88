'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---- Types ----

export type PopconfirmPlacement =
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

export interface PopconfirmProps {
  /** 触发器元素 */
  children: React.ReactNode;
  /** 确认弹窗标题 */
  title?: React.ReactNode;
  /** 确认弹窗描述 */
  description?: React.ReactNode;
  /** 确认按钮文本，默认「确定」 */
  confirmText?: string;
  /** 取消按钮文本，默认「取消」 */
  cancelText?: string;
  /** 弹出方向，默认 top */
  placement?: PopconfirmPlacement;
  /** 触发方式，默认 click */
  triggerMode?: 'click' | 'hover';
  /** 确认按钮是否为危险样式 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大宽度 */
  maxWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
  /** 打开/关闭状态变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 确认前校验，返回 false 阻止关闭 */
  beforeConfirm?: () => boolean | Promise<boolean>;
}

// ---- Placement resolver ----

function resolvePlacement(p: PopconfirmPlacement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const parts = p.split('-');
  const side = parts[0] as 'top' | 'bottom' | 'left' | 'right';
  const align = parts[1] as 'start' | 'center' | 'end' | undefined;
  return { side, align: align ?? 'center' };
}

// ---- Position computation ----

function computePosition(
  popoverRect: DOMRect,
  triggerRect: DOMRect,
  placement: PopconfirmPlacement,
): React.CSSProperties {
  const { side, align } = resolvePlacement(placement);
  const gap = 8;
  const popW = popoverRect.width;
  const popH = popoverRect.height;
  const trigW = triggerRect.width;
  const trigH = triggerRect.height;

  let top = 0;
  let left = 0;

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

// ---- Arrow styles ----

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

export const Popconfirm = React.memo(function Popconfirm({
  children,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  placement = 'top',
  triggerMode = 'click',
  danger = false,
  disabled = false,
  maxWidth = 300,
  className,
  style,
  onConfirm,
  onCancel,
  onOpenChange,
  beforeConfirm,
}: PopconfirmProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { side } = resolvePlacement(placement);

  const close = useCallback(() => {
    setOpen(false);
    setConfirming(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openPop = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    onOpenChange?.(true);
  }, [disabled, onOpenChange]);

  // Toggle for click mode
  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [disabled, onOpenChange]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (confirming) return;

    if (beforeConfirm) {
      const canProceed = await beforeConfirm();
      if (!canProceed) return;
    }

    setConfirming(true);
    try {
      await onConfirm?.();
      close();
    } finally {
      setConfirming(false);
    }
  }, [confirming, beforeConfirm, onConfirm, close]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel?.();
    close();
  }, [onCancel, close]);

  // Click outside to close
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

  // Compute position when open
  useEffect(() => {
    if (!open || !containerRef.current || !popoverRef.current) return;

    const triggerEl = containerRef.current.firstElementChild;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    setPosition(computePosition(popoverRect, triggerRect, placement));
  }, [open, placement]);

  // Trigger handlers
  const handleTriggerClick = useCallback(() => {
    if (triggerMode === 'click') toggle();
  }, [triggerMode, toggle]);

  const handleMouseEnter = useCallback(() => {
    if (triggerMode === 'hover' && !disabled) {
      openPop();
    }
  }, [triggerMode, disabled, openPop]);

  const handleMouseLeave = useCallback(() => {
    if (triggerMode === 'hover') {
      close();
    }
  }, [triggerMode, close]);

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
        {children}
      </div>

      {/* Popconfirm content */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : '确认操作'}
          style={{
            position: 'fixed',
            zIndex: 1050,
            minWidth: 180,
            maxWidth,
            borderRadius: 12,
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            animation: 'popconfirm-slide-in 0.15s ease-out',
            ...position,
          }}
        >
          {/* Arrow */}
          <span style={arrowStyles(side)} />

          {/* Title */}
          {title && (
            <div
              style={{
                padding: '14px 16px 4px',
                fontSize: 14,
                fontWeight: 600,
                color: '#f1f5f9',
                lineHeight: 1.4,
              }}
            >
              {title}
            </div>
          )}

          {/* Description */}
          {description && (
            <div
              style={{
                padding: title ? '4px 16px 12px' : '14px 16px 12px',
                fontSize: 13,
                color: '#94a3b8',
                lineHeight: 1.55,
              }}
            >
              {description}
            </div>
          )}

          {/* Empty content when no title or description */}
          {!title && !description && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: '#94a3b8' }}>
              确认执行此操作？
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '8px 16px 14px',
              borderTop: '1px solid rgba(148, 163, 184, 0.10)',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={confirming}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.22)',
                background: 'rgba(71, 85, 105, 0.55)',
                color: '#f1f5f9',
                cursor: confirming ? 'not-allowed' : 'pointer',
                opacity: confirming ? 0.6 : 1,
                transition: 'opacity 0.15s',
                lineHeight: 1.4,
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: danger ? '#dc2626' : '#1d4ed8',
                color: '#f8fafc',
                cursor: confirming ? 'not-allowed' : 'pointer',
                opacity: confirming ? 0.7 : 1,
                transition: 'opacity 0.15s',
                lineHeight: 1.4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              data-testid="popconfirm-confirm-btn"
            >
              {confirming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'popconfirm-btn-spin 0.6s linear infinite',
                  }}
                />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popconfirm-slide-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes popconfirm-btn-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default Popconfirm;
