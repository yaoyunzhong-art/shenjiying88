'use client';

import React, { useEffect, useCallback, useRef } from 'react';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 侧边栏位置 */
  placement?: DrawerPlacement;
  /** 自定义宽度 (left/right) 或高度 (top/bottom) */
  size?: number;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 按下 Escape 是否关闭 */
  keyboardClosable?: boolean;
  /** 子内容 */
  children: React.ReactNode;
  /** 底部区域（如操作按钮） */
  footer?: React.ReactNode;
  /** CSS z-index */
  zIndex?: number;
}

/**
 * Drawer — 侧边抽屉组件。
 *
 * 从屏幕边缘滑入的面板，常用于详情展示、表单编辑、过滤面板等场景。
 * 支持上下左右四个方向的滑入，与 Modal 互补。
 *
 * @example
 * <Drawer open={visible} onClose={() => setVisible(false)} title="用户详情" placement="right">
 *   <p>用户信息...</p>
 * </Drawer>
 */
export function Drawer({
  open,
  onClose,
  title,
  placement = 'right',
  size,
  showClose = true,
  maskClosable = true,
  keyboardClosable = true,
  children,
  footer,
  zIndex = 1000,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 默认尺寸
  const isHorizontal = placement === 'left' || placement === 'right';
  const resolvedSize = size ?? (isHorizontal ? 448 : 320);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && keyboardClosable) {
        onClose();
      }
    },
    [onClose, keyboardClosable]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // 返回打开时的焦点到面板
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  // 位置样式
  const positionStyles: Record<DrawerPlacement, React.CSSProperties> = {
    left: {
      top: 0,
      left: 0,
      bottom: 0,
      width: resolvedSize,
      borderRight: '1px solid rgba(148, 163, 184, 0.16)',
      animation: 'drawer-slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    right: {
      top: 0,
      right: 0,
      bottom: 0,
      width: resolvedSize,
      borderLeft: '1px solid rgba(148, 163, 184, 0.16)',
      animation: 'drawer-slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    top: {
      top: 0,
      left: 0,
      right: 0,
      height: resolvedSize,
      borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
      animation: 'drawer-slide-in-top 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: resolvedSize,
      borderTop: '1px solid rgba(148, 163, 184, 0.16)',
      animation: 'drawer-slide-in-bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        animation: 'drawer-mask-fade-in 0.2s ease-out',
      }}
      onClick={(e) => {
        if (maskClosable && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Drawer'}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          position: 'fixed',
          background: '#1e293b',
          boxShadow:
            placement === 'right'
              ? '-8px 0 40px rgba(0, 0, 0, 0.4)'
              : placement === 'left'
              ? '8px 0 40px rgba(0, 0, 0, 0.4)'
              : placement === 'top'
              ? '0 8px 40px rgba(0, 0, 0, 0.4)'
              : '0 -8px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isHorizontal ? 'calc(100vw - 48px)' : undefined,
          maxHeight: !isHorizontal ? 'calc(100vh - 48px)' : undefined,
          ...positionStyles[placement],
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            flexShrink: 0,
          }}
        >
          {title ? (
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 22,
                cursor: 'pointer',
                padding: '0 0 0 12px',
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = '#94a3b8';
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* 内容区域 — 可滚动 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes drawer-mask-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawer-slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes drawer-slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes drawer-slide-in-top {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes drawer-slide-in-bottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
