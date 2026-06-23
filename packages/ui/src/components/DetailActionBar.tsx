'use client';
import React, { useState } from 'react';
import { useToast, type ToastOptions } from './Toast';

export type DetailActionBarIcon = 'copy' | 'export' | 'share' | 'print' | 'download' | 'link';

export interface DetailActionBarAction {
  /** Stable key used for React keys and test selectors. */
  key: string;
  /** Button label. */
  label: string;
  /** Click handler — may be async. */
  onClick: () => void | Promise<void>;
  /** Optional icon name; 'custom' is allowed for callers that inject their own. */
  icon?: DetailActionBarIcon;
  /** Visual variant — defaults to 'default'. */
  variant?: 'default' | 'primary' | 'danger';
  /** Optional description (used as aria-label and tooltip). */
  description?: string;
  /** Disabled state. */
  disabled?: boolean;
  /**
   * Optional toast feedback. When the click resolves successfully, the
   * success message (or default `已复制`/`已导出`/etc.) is shown; when it
   * rejects, the error message is shown.
   */
  successToast?: ToastOptions & { message?: string };
  errorToast?: ToastOptions & { message?: string };
}

export interface DetailActionBarProps {
  /** List of actions rendered as buttons in order. */
  actions: DetailActionBarAction[];
  /** Optional section heading. */
  heading?: string;
  /** Optional caption describing the bar. */
  caption?: string;
  /** Test id for the wrapper. */
  'data-testid'?: string;
  /**
   * When false, the bar does not render a toast container or surface
   * success/error feedback. Default is true. SSR callers can opt out so
   * the bar renders in static HTML without needing the ToastContainer.
   */
  showToast?: boolean;
}

const DEFAULT_SUCCESS_MESSAGES: Record<DetailActionBarIcon | 'other', string> = {
  copy: '已复制到剪贴板',
  link: '已复制到剪贴板',
  export: '已下载 JSON',
  download: '已下载',
  share: '已分享',
  print: '已发送打印任务',
  other: '操作完成'
};

const DEFAULT_ERROR_MESSAGES: Record<DetailActionBarIcon | 'other', string> = {
  copy: '复制失败',
  link: '复制失败',
  export: '导出失败',
  download: '下载失败',
  share: '分享失败',
  print: '打印失败',
  other: '操作失败'
};

/**
 * DetailActionBar renders the standard "收口动作" footer for every detail
 * page in the admin workbench.
 *
 * Unlike DetailClosureBar (which renders deep-link cards), this bar renders
 * actionable buttons (copy link, export JSON, share, print, etc.). Each
 * caller provides its own `onClick` handlers, so the bar stays a thin
 * presentation component.
 *
 * The bar is SSR-friendly: it renders buttons with attached onClick
 * handlers without executing any side effects during render. Each button
 * tracks its own busy state and is disabled while a handler is in flight.
 *
 * When `showToast` is true (default), successful actions show a success
 * toast and failed actions show an error toast using the shared
 * useToast hook.
 */
export function DetailActionBar({
  actions,
  heading = '详情收口动作',
  caption = '复制深链 / 导出 JSON / 分享 — 闭环到本页的常用动作',
  'data-testid': testId,
  showToast = true
}: DetailActionBarProps) {
  if (!actions || actions.length === 0) {
    return null;
  }
  return (
    <ActionBarWithToast
      actions={actions}
      heading={heading}
      caption={caption}
      data-testid={testId}
      showToast={showToast}
    />
  );
}

interface ActionBarWithToastProps extends DetailActionBarProps {
  showToast: boolean;
}

function ActionBarWithToast({
  actions,
  heading,
  caption,
  'data-testid': testId,
  showToast
}: ActionBarWithToastProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  return (
    <section
      data-testid={testId ?? 'detail-action-bar'}
      aria-label="Detail action bar"
      style={sectionStyle}
    >
      <header style={{ marginBottom: 12 }}>
        <h3 style={headingStyle}>{heading}</h3>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{caption}</p>
      </header>
      <div style={gridStyle} data-testid="detail-action-grid">
        {actions.map((action) => (
          <ActionButton
            key={action.key}
            action={action}
            onSuccess={showToast ? toastSuccess : undefined}
            onError={showToast ? toastError : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function ActionButton({
  action,
  onSuccess,
  onError
}: {
  action: DetailActionBarAction;
  onSuccess?: (message: string, options?: ToastOptions) => void;
  onError?: (message: string, options?: ToastOptions) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy || action.disabled) {
      return;
    }
    setBusy(true);
    try {
      await action.onClick();
      if (onSuccess) {
        const message =
          action.successToast?.message ?? DEFAULT_SUCCESS_MESSAGES[action.icon ?? 'other'];
        onSuccess(message, action.successToast);
      }
    } catch (err) {
      if (onError) {
        const fallback = err instanceof Error ? err.message : DEFAULT_ERROR_MESSAGES[action.icon ?? 'other'];
        const message = action.errorToast?.message ?? fallback;
        onError(message, action.errorToast);
      }
    } finally {
      setBusy(false);
    }
  };

  const variant = action.variant ?? 'default';
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || action.disabled}
      aria-label={action.description ?? action.label}
      title={action.description ?? action.label}
      data-testid={`detail-action-${action.key}`}
      style={{
        ...buttonStyle,
        ...(variant === 'primary' ? primaryButtonStyle : null),
        ...(variant === 'danger' ? dangerButtonStyle : null),
        ...(busy || action.disabled ? disabledButtonStyle : null)
      }}
    >
      <ActionIcon name={action.icon} />
      <span>{action.label}</span>
    </button>
  );
}

function ActionIcon({ name }: { name?: DetailActionBarIcon }) {
  if (!name) {
    return null;
  }
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      data-testid="detail-action-icon"
    >
      {name === 'copy' || name === 'link' ? (
        <>
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : null}
      {name === 'export' || name === 'download' ? (
        <>
          <path d="M8 2v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      {name === 'share' ? (
        <>
          <circle cx="4" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="3.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="12.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.4 7.2L10.6 4.3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.4 8.8L10.6 11.7" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : null}
      {name === 'print' ? (
        <>
          <path d="M4 6V2h8v4" stroke="currentColor" strokeWidth="1.2" />
          <rect x="2" y="6" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="5" y="10" width="6" height="3" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : null}
    </svg>
  );
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)',
  marginTop: 8
};

const headingStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  margin: '0 0 4px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.14)',
  background: 'rgba(15,23,42,0.45)',
  color: '#cbd5f5',
  cursor: 'pointer',
  transition: 'all 0.15s'
};

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(96,165,250,0.4)',
  background: 'rgba(59,130,246,0.16)',
  color: '#bfdbfe'
};

const dangerButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(239,68,68,0.4)',
  background: 'rgba(239,68,68,0.12)',
  color: '#fecaca'
};

const disabledButtonStyle: React.CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.55
};

export default DetailActionBar;

