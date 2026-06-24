'use client';

import React, { useState } from 'react';

// ---- Types ----

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ---- Variant colors ----

const VARIANT_PALETTE: Record<AlertVariant, {
  bg: string;
  border: string;
  title: string;
  text: string;
  icon: string;
}> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(96, 165, 250, 0.25)',
    title: '#bfdbfe',
    text: '#93c5fd',
    icon: '#60a5fa',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(74, 222, 128, 0.25)',
    title: '#bbf7d0',
    text: '#86efac',
    icon: '#4ade80',
  },
  warning: {
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(250, 204, 21, 0.25)',
    title: '#fde68a',
    text: '#fcd34d',
    icon: '#facc15',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(248, 113, 113, 0.25)',
    title: '#fecaca',
    text: '#fca5a5',
    icon: '#f87171',
  },
};

// ---- Icons ----

function AlertIcon({ variant }: { variant: AlertVariant }) {
  const color = VARIANT_PALETTE[variant].icon;

  switch (variant) {
    case 'info':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Zm-.625 4.375h1.25v5h-1.25v-5Zm1.25 7.5h-1.25v-1.25h1.25v1.25Z"
            fill={color}
          />
        </svg>
      );
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Zm4.358 7.108-4.846 4.846a.625.625 0 0 1-.884 0l-2.346-2.346a.625.625 0 1 1 .884-.884l1.904 1.904 4.404-4.404a.625.625 0 1 1 .884.884Z"
            fill={color}
          />
        </svg>
      );
    case 'warning':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M8.947 2.709a1.25 1.25 0 0 1 2.106 0l7.417 11.8a1.25 1.25 0 0 1-1.053 1.866H2.583a1.25 1.25 0 0 1-1.053-1.866l7.417-11.8Zm1.053.625v6.25h-1.25v-6.25h1.25Zm0 8.75h-1.25v-1.25h1.25v1.25Z"
            fill={color}
          />
        </svg>
      );
    case 'danger':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5ZM6.576 6.576a.625.625 0 0 1 .884 0L10 9.116l2.54-2.54a.625.625 0 1 1 .884.884L10.884 10l2.54 2.54a.625.625 0 1 1-.884.884L10 10.884l-2.54 2.54a.625.625 0 1 1-.884-.884L9.116 10l-2.54-2.54a.625.625 0 0 1 0-.884Z"
            fill={color}
          />
        </svg>
      );
  }
}

// ---- Component ----

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon = true,
  className,
  style,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const palette = VARIANT_PALETTE[variant];

  if (dismissed) return null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: 12,
        padding: '14px 16px',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        ...style,
      }}
    >
      {icon && (
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <AlertIcon variant={variant} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <div style={{ fontWeight: 600, fontSize: 14, color: palette.title, marginBottom: 4 }}>{title}</div>
        ) : null}
        <div style={{ fontSize: 13, lineHeight: 1.55, color: palette.text }}>{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: palette.icon,
            flexShrink: 0,
            opacity: 0.7,
          }}
          aria-label="Dismiss alert"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1.232 1.232a.525.525 0 0 1 .743 0L7 6.257l5.025-5.025a.525.525 0 1 1 .743.743L7.743 7l5.025 5.025a.525.525 0 1 1-.743.743L7 7.743l-5.025 5.025a.525.525 0 1 1-.743-.743L6.257 7 1.232 1.975a.525.525 0 0 1 0-.743Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ---- Utility hook for common alert patterns ----

export interface UseAlertOptions {
  variant?: AlertVariant;
  dismissAfterMs?: number;
}

export interface AlertState {
  visible: boolean;
  variant: AlertVariant;
  title: string;
  message: string;
}

export function useAlert(defaultOptions?: UseAlertOptions) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const show = (title: string, message: string, variant?: AlertVariant) => {
    const resolvedVariant = variant ?? defaultOptions?.variant ?? 'info';
    setAlert({ visible: true, variant: resolvedVariant, title, message });

    const dismissAfter = defaultOptions?.dismissAfterMs;
    if (dismissAfter && dismissAfter > 0) {
      setTimeout(() => setAlert(null), dismissAfter);
    }
  };

  const info = (title: string, message: string) => show(title, message, 'info');
  const success = (title: string, message: string) => show(title, message, 'success');
  const warning = (title: string, message: string) => show(title, message, 'warning');
  const danger = (title: string, message: string) => show(title, message, 'danger');
  const dismiss = () => setAlert(null);

  return { alert, show, info, success, warning, danger, dismiss };
}
