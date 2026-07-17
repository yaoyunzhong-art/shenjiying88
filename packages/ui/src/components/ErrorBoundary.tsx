'use client';
import React from 'react';

export type ErrorBoundarySeverity = 'block' | 'inline' | 'toast';

export interface ErrorBoundaryFallbackArgs {
  error: Error;
  resetError: () => void;
}

export interface ErrorBoundaryProps {
  /** Accessible name for the error region */
  name?: string;
  /** Visual severity */
  severity?: ErrorBoundarySeverity;
  /** Custom fallback renderer; receives error + reset callback */
  fallback?: React.ReactNode | ((args: ErrorBoundaryFallbackArgs) => React.ReactNode);
  /** Text for the reset/retry button (block / inline modes) */
  retryLabel?: string;
  /** Extra text shown below the error message (block mode) */
  description?: string;
  /** Called when the boundary catches an error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called just before resetError is invoked */
  onReset?: () => void;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const DEFAULT_RETRY_LABEL = '重试';
const DEFAULT_FALLBACK_MESSAGE = '组件加载异常';

const BLOCK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  textAlign: 'center' as const,
  minHeight: 80,
};

const INLINE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 12px',
  borderRadius: 6,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  fontSize: 13,
  color: '#b91c1c',
};

const RETRY_BUTTON_STYLE: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: '1px solid #f87171',
  background: '#fff',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const ICON_STYLE: React.CSSProperties = {
  width: 20,
  height: 20,
  flexShrink: 0,
};

/**
 * ErrorBoundary — catch rendering errors in children with configurable fallback.
 *
 * Supports three visual severities:
 *  - `block`: full-width card with message + optional description + retry button.
 *  - `inline`: compact one-liner with retry button, suitable for rows / cells.
 *  - `toast`: renders nothing (log-only); consumer listens via `onError` to show a toast elsewhere.
 *
 * When a `fallback` renderer is provided it takes precedence over the built-in views.
 * The `resetError` callback resets internal state and calls `onReset`.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.props.onReset?.();
    this.state = { error: null };
  };

  render() {
    if (!this.state.error) {
      return this.props.children ?? null;
    }

    const {
      name = 'ErrorBoundary',
      severity = 'block',
      fallback,
      retryLabel = DEFAULT_RETRY_LABEL,
      description,
      'data-testid': dataTestId,
      className,
      style,
    } = this.props;

    // Custom fallback takes priority
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, resetError: this.resetError });
      }
      return fallback;
    }

    if (severity === 'toast') {
      return null;
    }

    if (severity === 'inline') {
      return (
        <div
          role="alert"
          aria-label={name}
          data-testid={dataTestId}
          className={className}
          style={{ ...INLINE_STYLE, ...style }}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            style={ICON_STYLE}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{this.state.error.message || DEFAULT_FALLBACK_MESSAGE}</span>
          <button
            type="button"
            onClick={this.resetError}
            data-testid={dataTestId ? `${dataTestId}-retry` : undefined}
            style={RETRY_BUTTON_STYLE}
          >
            {retryLabel}
          </button>
        </div>
      );
    }

    // severity === 'block'
    return (
      <div
        role="alert"
        aria-label={name}
        data-testid={dataTestId}
        className={className}
        style={{ ...BLOCK_STYLE, ...style }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: 28, height: 28, color: '#ef4444', flexShrink: 0 }}
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <div
          style={{ fontSize: 15, fontWeight: 600, color: '#b91c1c' }}
        >
          {this.state.error.message || DEFAULT_FALLBACK_MESSAGE}
        </div>
        {description ? (
          <div
            style={{ fontSize: 13, color: '#dc2626', maxWidth: 360 }}
          >
            {description}
          </div>
        ) : null}
        <button
          type="button"
          onClick={this.resetError}
          data-testid={dataTestId ? `${dataTestId}-retry` : undefined}
          style={RETRY_BUTTON_STYLE}
        >
          {retryLabel}
        </button>
      </div>
    );
  }
}
