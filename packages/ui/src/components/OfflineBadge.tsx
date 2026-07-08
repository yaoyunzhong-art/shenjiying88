'use client';

import React, { useEffect, useState } from 'react';

/**
 * OfflineBadge — 离线/在线状态徽章
 *
 * 适用场景: 移动端网络状态提示, sync-engine 离线队列提示
 *
 * - online: 绿色 "✓ 在线"
 * - offline: 灰色 "○ 离线" (带待同步数提示)
 * - syncing: 蓝色 "⟳ 同步中..."
 * - error: 红色 "✗ 同步失败 [重试]"
 */

export type OfflineStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface OfflineBadgeProps {
  /** 当前离线状态 */
  status: OfflineStatus;
  /** 待同步操作数 (offline 状态显示) */
  pendingCount?: number;
  /** 同步失败重试回调 (error 状态显示按钮) */
  onRetry?: () => void;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 在线状态自动隐藏延迟 ms, 默认 3000 */
  autoHideOnlineMs?: number;
  /** 测试 id */
  'data-testid'?: string;
}

interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: (pending?: number) => string;
}

const STATUS_STYLES: Record<OfflineStatus, StatusStyle> = {
  online: {
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#22c55e',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '✓',
    label: () => '在线',
  },
  offline: {
    bg: 'rgba(148, 163, 184, 0.12)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
    icon: '○',
    label: (pending = 0) => (pending > 0 ? `离线 (${pending})` : '离线'),
  },
  syncing: {
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: '⟳',
    label: () => '同步中...',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '✗',
    label: () => '同步失败',
  },
};

export function OfflineBadge({
  status,
  pendingCount = 0,
  onRetry,
  showIcon = true,
  style,
  autoHideOnlineMs = 3000,
  'data-testid': dataTestId,
}: OfflineBadgeProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (status === 'online') {
      setHidden(false);
      const timer = setTimeout(() => setHidden(true), autoHideOnlineMs);
      return () => clearTimeout(timer);
    }
    setHidden(false);
    return undefined;
  }, [status, autoHideOnlineMs]);

  if (hidden) return null;

  const cfg = STATUS_STYLES[status];
  const label = cfg.label(pendingCount);
  const showRetry = status === 'error' && onRetry;

  return (
    <span
      data-testid={dataTestId ?? 'offline-badge'}
      data-status={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {showIcon && (
        <span data-testid="offline-badge-icon" style={{ fontSize: 13 }}>
          {cfg.icon}
        </span>
      )}
      <span data-testid="offline-badge-label">{label}</span>
      {showRetry && (
        <button
          type="button"
          data-testid="offline-badge-retry"
          onClick={onRetry}
          style={{
            marginLeft: 2,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 600,
            border: `1px solid ${cfg.border}`,
            borderRadius: 4,
            background: 'transparent',
            color: cfg.text,
            cursor: 'pointer',
          }}
        >
          重试
        </button>
      )}
    </span>
  );
}

export default OfflineBadge;
