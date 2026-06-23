'use client';

import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 自定义宽度 */
  width?: number;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 按下 Escape 是否关闭 */
  keyboardClosable?: boolean;
  /** 子内容 */
  children: React.ReactNode;
  /** 底部区域（如按钮组） */
  footer?: React.ReactNode;
}

/**
 * Modal — 通用弹窗组件。
 *
 * 支持标题、自定义内容、底部操作区、遮罩关闭、键盘 Escape 关闭。
 * 使用 Portal 渲染到 document.body。
 *
 * @example
 * <Modal open={visible} onClose={() => setVisible(false)} title="编辑信息">
 *   <FormField label="名称">
 *     <input type="text" />
 *   </FormField>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  showClose = true,
  width = 480,
  maskClosable = true,
  keyboardClosable = true,
  children,
  footer,
}: ModalProps) {
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

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'modal-fade-in 0.15s ease-out',
      }}
      onClick={(e) => {
        if (maskClosable && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          borderRadius: 16,
          width,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
          animation: 'modal-slide-up 0.2s ease-out',
        }}
      >
        {/* 标题栏 */}
        {(title || showClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: title ? '20px 24px 0' : '12px 16px',
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
                  fontSize: 20,
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
        )}

        {/* 内容区 */}
        <div style={{ padding: title ? '16px 24px 24px' : '24px' }}>
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div
            style={{
              padding: '0 24px 20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
