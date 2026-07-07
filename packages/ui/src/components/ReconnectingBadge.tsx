'use client';

import React, { useEffect, useState } from 'react';

/**
 * Phase-32: SSE 连接状态徽章 (4 状态可视化)
 *
 * - connecting: 灰色 "🔄 连接中..."
 * - open: 绿色 "✓ 已连接" (3 秒后自动隐藏)
 * - reconnecting: 黄色 "🔄 重连中... (2/3)"
 * - closed: 红色 "❌ 连接已断开 [重试]" (带按钮)
 *
 * 通过 props `state` 控制,不耦合具体 stream 逻辑
 * 通过 `attempt` 显示当前重试次数 (用于 reconnecting 状态)
 * 通过 `onRetry` 触发手动重试 (用于 closed 状态)
 */

export type ReconnectingState = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface ReconnectingBadgeProps {
  state: ReconnectingState;
  /** 当前重试次数 (1-based),用于 reconnecting 状态显示 */
  attempt?: number;
  /** 最大重试次数,默认 3 */
  maxRetries?: number;
  /** 手动重试回调 (closed 状态显示按钮) */
  onRetry?: () => void;
  /** open 状态自动隐藏延迟 ms,默认 3000 */
  autoHideMs?: number;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

interface StateStyle {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: (attempt?: number, maxRetries?: number) => string;
}

const STATE_STYLES: Record<ReconnectingState, StateStyle> = {
  connecting: {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.3)',
    icon: '🔄',
    label: () => '连接中...'
  },
  open: {
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#86efac',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '✓',
    label: () => '已连接'
  },
  reconnecting: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#fcd34d',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '🔄',
    label: (attempt = 1, maxRetries = 3) => `重连中... (${attempt}/${maxRetries})`
  },
  closed: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#fca5a5',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '❌',
    label: () => '连接已断开'
  }
};

export function ReconnectingBadge({
  state,
  attempt,
  maxRetries = 3,
  onRetry,
  autoHideMs = 3000,
  style
}: ReconnectingBadgeProps) {
  // open 状态 3 秒后自动隐藏
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (state === 'open') {
      setHidden(false);
      const timer = setTimeout(() => setHidden(true), autoHideMs);
      return () => clearTimeout(timer);
    }
    setHidden(false);
    return undefined;
  }, [state, autoHideMs]);

  if (hidden) return null;

  const cfg = STATE_STYLES[state];
  const label = cfg.label(attempt, maxRetries);
  const showRetryButton = state === 'closed' && onRetry;

  return (
    <span
      data-testid="reconnecting-badge"
      data-state={state}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span data-testid="reconnecting-badge-icon" style={{ fontSize: 14 }}>
        {cfg.icon}
      </span>
      <span data-testid="reconnecting-badge-label">{label}</span>
      {showRetryButton ? (
        <button
          type="button"
          data-testid="reconnecting-badge-retry"
          onClick={onRetry}
          style={{
            marginLeft: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            border: `1px solid ${cfg.border}`,
            borderRadius: 6,
            background: 'transparent',
            color: cfg.text,
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      ) : null}
    </span>
  );
}

export default ReconnectingBadge;