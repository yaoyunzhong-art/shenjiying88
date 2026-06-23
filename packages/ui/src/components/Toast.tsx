'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

// ---- 类型 ----

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastEntry {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
  createdAt: number;
}

export interface ToastOptions {
  /** 通知类型 */
  variant?: ToastVariant;
  /** 自动消失时长 ms（0 表示不自动消失） */
  durationMs?: number;
}

interface ToastItemProps {
  entry: ToastEntry;
  onDismiss: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

// ---- 图标 ----

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#f87171"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ---- 变体配色 ----

const TOAST_STYLES: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'rgba(22, 101, 52, 0.65)',
    border: 'rgba(74, 222, 128, 0.35)',
    text: '#bbf7d0',
  },
  error: {
    bg: 'rgba(127, 29, 29, 0.65)',
    border: 'rgba(248, 113, 113, 0.35)',
    text: '#fecaca',
  },
  warning: {
    bg: 'rgba(113, 63, 18, 0.65)',
    border: 'rgba(251, 191, 36, 0.35)',
    text: '#fde68a',
  },
  info: {
    bg: 'rgba(30, 64, 175, 0.65)',
    border: 'rgba(96, 165, 250, 0.35)',
    text: '#bfdbfe',
  },
};

// ---- 进度条样式 ----

const PROGRESS_COLORS: Record<ToastVariant, string> = {
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
};

// ============== ToastItem（单个通知） ==============

function ToastItem({ entry, onDismiss }: ToastItemProps) {
  const colors = TOAST_STYLES[entry.variant];
  const progressColor = PROGRESS_COLORS[entry.variant];

  // 进度条动画
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entry.durationMs <= 0) return;

    const bar = progressBarRef.current;
    if (!bar) return;

    // 触发动画
    const raf = requestAnimationFrame(() => {
      bar.style.transition = `width ${entry.durationMs}ms linear`;
      bar.style.width = '0%';
    });

    return () => cancelAnimationFrame(raf);
  }, [entry.durationMs]);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: 13,
        padding: '12px 16px',
        minWidth: 280,
        maxWidth: 420,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        animation: 'toast-slide-in 0.25s ease-out',
        pointerEvents: 'auto',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* 图标 */}
      <div style={{ flexShrink: 0, marginTop: 1 }}>{TOAST_ICONS[entry.variant]}</div>

      {/* 消息 */}
      <div style={{ flex: 1, lineHeight: 1.5, wordBreak: 'break-word' }}>{entry.message}</div>

      {/* 关闭按钮 */}
      <button
        type="button"
        onClick={() => onDismiss(entry.id)}
        aria-label="关闭通知"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: '0 0 0 4px',
          opacity: 0.7,
        }}
      >
        ×
      </button>

      {/* 底部进度条 */}
      {entry.durationMs > 0 && (
        <div
          ref={progressBarRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            width: '100%',
            background: progressColor,
            borderRadius: '0 0 0 12px',
          }}
        />
      )}
    </div>
  );
}

// ============== ToastContainer（通知容器） ==============

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-right': { top: 20, right: 20 },
  'top-left': { top: 20, left: 20 },
  'bottom-right': { bottom: 20, right: 20 },
  'bottom-left': { bottom: 20, left: 20 },
};

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
  maxVisible = 5,
}: ToastContainerProps) {
  const visible = toasts.slice(0, maxVisible);

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden',
        ...POSITION_STYLES[position],
      }}
      aria-label="通知列表"
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} entry={toast} onDismiss={onDismiss} />
      ))}

      {/* 超出数量提示 */}
      {toasts.length > maxVisible && (
        <div
          style={{
            fontSize: 12,
            color: '#94a3b8',
            textAlign: 'center',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: 8,
            pointerEvents: 'auto',
          }}
        >
          还有 {toasts.length - maxVisible} 条通知
        </div>
      )}

      {/* slide-in 动画 */}
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(${position?.includes('right') ? '40px' : position?.includes('left') ? '-40px' : '0'});
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

// ============== useToast（核心 Hook） ==============

let toastCounter = 0;

export interface UseToastReturn {
  /** 当前活跃的通知列表 */
  toasts: ToastEntry[];
  /** 显示成功通知 */
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** 显示错误通知 */
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** 显示警告通知 */
  warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** 显示信息通知 */
  info: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** 显示自定义变体通知 */
  toast: (message: string, options?: ToastOptions) => void;
  /** 手动关闭指定通知 */
  dismiss: (id: string) => void;
  /** 手动关闭所有通知 */
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const addToast = useCallback((message: string, options?: ToastOptions) => {
    const variant = options?.variant ?? 'info';
    const durationMs = options?.durationMs ?? 4000;

    const entry: ToastEntry = {
      id: `toast-${++toastCounter}-${Date.now()}`,
      message,
      variant,
      durationMs,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, entry]);

    // 自动消失
    if (durationMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== entry.id));
      }, durationMs);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, options),
    [addToast]
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'error' }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'warning' }),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'info' }),
    [addToast]
  );

  return { toasts, success, error, warning, info, toast, dismiss, dismissAll };
}
