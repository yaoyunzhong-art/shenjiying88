'use client';

import React, { useState, useCallback } from 'react';

// ---- 类型 ----

export type AnnouncementSeverity = 'info' | 'success' | 'warning' | 'error' | 'promotion';

export type AnnouncementVariant = 'banner' | 'bar' | 'ribbon';

export interface AnnouncementBannerAction {
  label: string;
  onClick: () => void;
  href?: string;
}

export interface AnnouncementBannerProps {
  /** 公告内容 */
  message: React.ReactNode;
  /** 严重级别 */
  severity?: AnnouncementSeverity;
  /** 视觉变体 */
  variant?: AnnouncementVariant;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否默认可见 */
  defaultVisible?: boolean;
  /** 操作按钮 */
  action?: AnnouncementBannerAction;
  /** 图标 (覆盖默认) */
  icon?: React.ReactNode;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认图标 ----

const DefaultIcons: Record<AnnouncementSeverity, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '🚫',
  promotion: '🎉',
};

// ---- 颜色映射 ----

const SeverityColors: Record<AnnouncementSeverity, { bg: string; border: string; text: string; iconBg: string }> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.22)',
    text: '#93c5fd',
    iconBg: 'rgba(59, 130, 246, 0.15)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.22)',
    text: '#86efac',
    iconBg: 'rgba(34, 197, 94, 0.15)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.22)',
    text: '#fde68a',
    iconBg: 'rgba(234, 179, 8, 0.15)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.22)',
    text: '#fca5a5',
    iconBg: 'rgba(239, 68, 68, 0.15)',
  },
  promotion: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.22)',
    text: '#d8b4fe',
    iconBg: 'rgba(168, 85, 247, 0.15)',
  },
};

// ---- 组件 ----

export function AnnouncementBanner({
  message,
  severity = 'info',
  variant = 'banner',
  closable = true,
  defaultVisible = true,
  action,
  icon,
  style,
  onClose,
  className,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(defaultVisible);

  const handleClose = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  if (!visible) return null;

  const colors = SeverityColors[severity];
  const displayIcon = icon ?? <span style={{ fontSize: 16 }}>{DefaultIcons[severity]}</span>;

  // ---- 变体样式 ----

  const variantStyles: Record<AnnouncementVariant, React.CSSProperties> = {
    banner: {
      borderRadius: 14,
      padding: '14px 18px',
    },
    bar: {
      borderRadius: 0,
      padding: '10px 18px',
    },
    ribbon: {
      borderRadius: '0 14px 14px 0',
      padding: '10px 18px',
      borderLeftWidth: 4,
    },
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeftWidth: variant === 'ribbon' ? 4 : 1,
        borderLeftColor: variant === 'ribbon' ? colors.border : undefined,
        ...variantStyles[variant],
        color: '#e2e8f0',
        fontSize: 14,
        lineHeight: 1.5,
        ...style,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* 图标 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          background: colors.iconBg,
          flexShrink: 0,
        }}
      >
        {displayIcon}
      </div>

      {/* 消息内容 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: colors.text }}>{message}</span>
        {action ? (
          <a
            href={action.href}
            onClick={(e) => {
              if (!action.href) e.preventDefault();
              action.onClick();
            }}
            style={{
              color: colors.text,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {action.label} →
          </a>
        ) : null}
      </div>

      {/* 关闭按钮 */}
      {closable ? (
        <button
          onClick={handleClose}
          aria-label="关闭公告"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 4,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
