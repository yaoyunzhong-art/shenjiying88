// h5-components.tsx · H5移动端基础组件库
// Phase-FP T-FP-026 · 2026-07-02

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================
// MobileLayout - 移动端布局容器
// ============================================================

export interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showNav?: boolean;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function MobileLayout({
  children,
  title,
  subtitle,
  showBack = false,
  showNav = true,
  actions,
  onBack,
  className = '',
}: MobileLayoutProps) {
  const pathname = usePathname();

  const defaultTabs = [
    { icon: '🏠', label: '首页', href: '/h5' },
    { icon: '🔍', label: '门店', href: '/h5/stores' },
    { icon: '🎫', label: '卡券', href: '/h5/coupons' },
    { icon: '👤', label: '我的', href: '/h5/profile' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
      }}
      className={className}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showBack && (
            <button
              onClick={onBack}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(148, 163, 184, 0.1)',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
          )}
          <div style={{ flex: 1 }}>
            {title && (
              <h1
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#f8fafc',
                  margin: 0,
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  margin: '2px 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          padding: 16,
          paddingBottom: showNav ? 80 : 16,
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && <BottomTabBar tabs={defaultTabs} currentPath={pathname} />}
    </div>
  );
}

// ============================================================
// BottomTabBar - 底部标签栏
// ============================================================

export interface TabItem {
  icon: string;
  label: string;
  href: string;
  badge?: number | string;
}

export interface BottomTabBarProps {
  tabs: TabItem[];
  currentPath: string;
}

export function BottomTabBar({ tabs, currentPath }: BottomTabBarProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '8px 0',
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentPath.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              padding: '6px 0',
            }}
          >
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                color: isActive ? '#667eea' : '#64748b',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ============================================================
// H5Card - H5卡片组件
// ============================================================

export interface H5CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function H5Card({ children, onClick, style = {}, className = '' }: H5CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        padding: 16,
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================================
// H5Badge - H5徽章组件
// ============================================================

export type H5BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface H5BadgeProps {
  children: React.ReactNode;
  variant?: H5BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<H5BadgeVariant, { bg: string; color: string }> = {
  primary: { bg: 'rgba(102, 126, 234, 0.2)', color: '#a5b4fc' },
  success: { bg: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' },
  warning: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
  info: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' },
};

export function H5Badge({ children, variant = 'info', size = 'sm' }: H5BadgeProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: size === 'sm' ? 4 : 6,
        background: style.bg,
        color: style.color,
        fontSize: size === 'sm' ? 11 : 13,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================
// H5Button - H5按钮组件
// ============================================================

export type H5ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type H5ButtonSize = 'sm' | 'md' | 'lg';

export interface H5ButtonProps {
  children: React.ReactNode;
  variant?: H5ButtonVariant;
  size?: H5ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

const VARIANT_BUTTON_STYLES: Record<H5ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: '#fff',
  },
  secondary: {
    background: 'rgba(148, 163, 184, 0.1)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#e2e8f0',
  },
  outline: {
    background: 'transparent',
    border: '1px solid rgba(102, 126, 234, 0.5)',
    color: '#a5b4fc',
  },
  ghost: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
  },
};

const SIZE_STYLES: Record<H5ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: 13 },
  md: { padding: '12px 20px', fontSize: 14 },
  lg: { padding: '14px 24px', fontSize: 16 },
};

export function H5Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style = {},
}: H5ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        borderRadius: 10,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...VARIANT_BUTTON_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {loading ? '加载中...' : children}
    </button>
  );
}

// ============================================================
// H5SearchBar - H5搜索框组件
// ============================================================

export interface H5SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export function H5SearchBar({
  value,
  onChange,
  placeholder = '搜索...',
  onSubmit,
}: H5SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      style={{ position: 'relative' }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px 12px 44px',
          borderRadius: 12,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: '#f8fafc',
          fontSize: 15,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 16,
          color: '#64748b',
        }}
      >
        🔍
      </span>
    </form>
  );
}

// ============================================================
// H5EmptyState - H5空状态组件
// ============================================================

export interface H5EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function H5EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: H5EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48, marginBottom: 16 }}>{icon}</span>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#f8fafc',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            margin: '0 0 20px',
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <H5Button variant="outline" size="md" onClick={action.onClick}>
          {action.label}
        </H5Button>
      )}
    </div>
  );
}

// ============================================================
// useH5Back - H5返回导航Hook
// ============================================================

export function useH5Back() {
  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  return handleBack;
}
