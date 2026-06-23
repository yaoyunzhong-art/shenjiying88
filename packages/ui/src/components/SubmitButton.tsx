'use client';
import React from 'react';

// ---- 类型 ----

export type SubmitButtonVariant = 'primary' | 'secondary' | 'danger' | 'brand';

export interface SubmitButtonProps {
  /** Whether the button is in a submitting/loading state */
  loading?: boolean;
  /** Label shown when not loading */
  label?: string;
  /** Label shown when loading (default: "提交中...") */
  loadingLabel?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: SubmitButtonVariant;
  /** Click handler (ignored when loading) */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** HTML button type */
  type?: 'submit' | 'button' | 'reset';
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Additional className */
  className?: string;
  /** Children content (overrides label/loading when provided) */
  children?: React.ReactNode;
}

// ---- 预设样式 ----

const VARIANT_STYLES: Record<SubmitButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#1d4ed8',
    border: '1px solid rgba(96, 165, 250, 0.28)',
  },
  brand: {
    background: '#7c3aed',
    border: '1px solid rgba(167, 139, 250, 0.28)',
  },
  secondary: {
    background: 'rgba(71, 85, 105, 0.55)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
  },
  danger: {
    background: '#dc2626',
    border: '1px solid rgba(252, 165, 165, 0.28)',
  },
};

// ---- 组件 ----

export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  function SubmitButton(
    {
      loading = false,
      label = '提交',
      loadingLabel = '提交中...',
      disabled = false,
      variant = 'primary',
      onClick,
      type = 'submit',
      style,
      className,
      children,
    },
    ref
  ) {
    const variantStyle = VARIANT_STYLES[variant];
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={loading ? undefined : onClick}
        className={className}
        style={{
          marginTop: 4,
          borderRadius: 10,
          padding: '12px 16px',
          color: '#f8fafc',
          fontSize: 15,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isDisabled ? 0.7 : 1,
          cursor: isDisabled ? 'wait' : 'pointer',
          ...variantStyle,
          ...style,
        }}
      >
        {children ? (
          children
        ) : loading ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(248, 250, 252, 0.3)',
                borderTopColor: '#f8fafc',
                borderRadius: '50%',
                animation: 'm5-spin 0.6s linear infinite',
              }}
            />
            {loadingLabel}
          </>
        ) : (
          label
        )}
        {/* Inject spinner keyframes once */}
        <style>{`@keyframes m5-spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }
);
