'use client';

import React from 'react';

export type InlineNotificationType = 'info' | 'success' | 'warning' | 'error';

export interface InlineNotificationProps {
  /** 通知类型：info / success / warning / error */
  type?: InlineNotificationType;
  /** 标题（可选） */
  title?: string;
  /** 正文内容 */
  message: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义操作按钮 */
  action?: React.ReactNode;
  /** 测试 id */
  'data-testid'?: string;
  /** 额外 class */
  className?: string;
  /** 内联样式 */
  style?: React.CSSProperties;
}

const TYPE_STYLES: Record<InlineNotificationType, { bg: string; border: string; iconColor: string; icon: string }> = {
  info: {
    bg: '#eff6ff',
    border: '#93c5fd',
    iconColor: '#3b82f6',
    icon: 'ℹ',
  },
  success: {
    bg: '#f0fdf4',
    border: '#86efac',
    iconColor: '#22c55e',
    icon: '✓',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fcd34d',
    iconColor: '#f59e0b',
    icon: '⚠',
  },
  error: {
    bg: '#fef2f2',
    border: '#fca5a5',
    iconColor: '#ef4444',
    icon: '✕',
  },
};

/**
 * InlineNotification — lightweight inline notification banner.
 *
 * Use for contextual feedback that doesn't require a full Alert/Toast.
 */
export function InlineNotification({
  type = 'info',
  title,
  message,
  closable = false,
  onClose,
  action,
  'data-testid': dataTestId,
  className,
  style,
}: InlineNotificationProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  const t = TYPE_STYLES[type];

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div
      data-testid={dataTestId ?? 'inline-notification'}
      className={className}
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 6,
        backgroundColor: t.bg,
        borderLeft: `4px solid ${t.border}`,
        fontSize: 14,
        lineHeight: 1.5,
        color: '#1f2937',
        ...style,
      }}
    >
      {/* Icon */}
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.iconColor,
          fontWeight: 700,
          fontSize: 14,
          marginTop: 2,
        }}
        aria-hidden
      >
        {t.icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <strong style={{ display: 'block', marginBottom: 2, fontSize: 14 }}>
            {title}
          </strong>
        )}
        <span>{message}</span>
        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>

      {/* Close button */}
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="关闭通知"
          style={{
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: 16,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
