'use client';
import React from 'react';

// ---- 类型 ----

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button label / children */
  children?: React.ReactNode;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler (ignored when loading) */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
  /** Full width */
  block?: boolean;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Additional className */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

// ---- 预设样式 ----

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#1d4ed8',
    color: '#f8fafc',
    border: '1px solid rgba(96, 165, 250, 0.28)',
  },
  secondary: {
    background: 'rgba(71, 85, 105, 0.55)',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.22)',
  },
  danger: {
    background: '#dc2626',
    color: '#f8fafc',
    border: '1px solid rgba(252, 165, 165, 0.28)',
  },
  ghost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid transparent',
  },
  outline: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.35)',
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12, borderRadius: 8 },
  md: { padding: '10px 16px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '14px 20px', fontSize: 16, borderRadius: 12 },
};

// ---- 组件 ----

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    block = false,
    style,
    className,
    'data-testid': dataTestId,
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={loading ? undefined : onClick}
      className={className}
      data-testid={dataTestId ?? 'button'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 600,
        lineHeight: 1.4,
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s, background 0.15s',
        whiteSpace: 'nowrap',
        width: block ? '100%' : undefined,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'm5-btn-spin 0.6s linear infinite',
            opacity: 0.7,
          }}
        />
      )}
      {children}
      {/* Inject spinner keyframes */}
      <style>{`@keyframes m5-btn-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
});
