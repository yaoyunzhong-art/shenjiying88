'use client';

import React, { useCallback, useEffect, useRef } from 'react';

// ============================================================
// Types
// ============================================================

export interface DialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Dialog title shown in the header */
  title?: string;
  /** Dialog body content */
  children?: React.ReactNode;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Callback when dialog requests close (overlay click, Escape key) */
  onClose?: () => void;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  /** Whether clicking the overlay backdrop closes the dialog */
  closeOnOverlay?: boolean;
  /** Whether pressing Escape closes the dialog */
  closeOnEscape?: boolean;
  /** Whether to show the close (×) button in the header */
  showCloseButton?: boolean;
  /** Whether to show a backdrop overlay */
  showOverlay?: boolean;
  /** Custom styles for the dialog container */
  style?: React.CSSProperties;
  /** Additional CSS class name */
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Test id */
  'data-testid'?: string;
}

// ============================================================
// Sizing
// ============================================================

const SIZE_WIDTHS: Record<string, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
  fullscreen: '100vw',
};

// ============================================================
// Styles
// ============================================================

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 5000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(4px)',
};

const DIALOG_STYLE_BASE: React.CSSProperties = {
  position: 'relative',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  flexShrink: 0,
};

const BODY_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 20,
};

const FOOTER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 12,
  padding: '12px 20px',
  borderTop: '1px solid rgba(148, 163, 184, 0.12)',
  flexShrink: 0,
};

const CLOSE_BTN_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 8,
  background: 'rgba(148, 163, 184, 0.1)',
  color: '#94a3b8',
  fontSize: 18,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const TITLE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: '#e2e8f0',
};

// ============================================================
//  Dialog Component
// ============================================================

/**
 * Dialog — a modal dialog overlay for confirmations, forms, and detail views.
 *
 * Features:
 * - Escape key / overlay click to close
 * - Configurable size from sm to fullscreen
 * - Header title, body, and footer slot
 * - Accessible with ARIA attributes
 */
export function Dialog({
  open,
  title,
  children,
  footer,
  onClose,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  showOverlay = true,
  style,
  ariaLabel = 'Dialog',
  'data-testid': testId,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /** Escape key handler */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose?.();
      }
    },
    [closeOnEscape, onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  /** Lock body scroll when open */
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  const width = SIZE_WIDTHS[size] || SIZE_WIDTHS.md;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={showOverlay ? OVERLAY_STYLE : { ...OVERLAY_STYLE, background: 'transparent', backdropFilter: 'none' }}
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        data-testid={testId ?? 'dialog-window'}
        style={{
          ...DIALOG_STYLE_BASE,
          width,
          minWidth: size === 'fullscreen' ? undefined : '320px',
          maxWidth: size === 'fullscreen' ? '100vw' : '90vw',
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={HEADER_STYLE}>
            {title && <h2 style={TITLE_STYLE}>{title}</h2>}
            {showCloseButton && (
              <button
                aria-label="Close dialog"
                style={{ ...CLOSE_BTN_STYLE, marginLeft: title ? 'auto' : 0 }}
                onClick={onClose}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          style={BODY_STYLE}
          data-testid={testId ? `${testId}-body` : 'dialog-body'}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && <div style={FOOTER_STYLE}>{footer}</div>}
      </div>
    </div>
  );
}
