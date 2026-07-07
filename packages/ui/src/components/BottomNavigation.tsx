'use client';

import React from 'react';

// ---- Types ----

/** 底部导航项 */
export interface BottomNavItem {
  /** 唯一标识 */
  id: string;
  /** 显示标签 */
  label: string;
  /** 图标字符 (emoji/icon 文本) */
  icon?: string;
  /** 是否当前活跃 */
  active?: boolean;
  /** 徽章数量 */
  badge?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick: () => void;
}

export interface BottomNavigationProps {
  /** 导航项列表 */
  items: BottomNavItem[];
  /** 底部安全区适配 (iOS 刘海屏等) */
  safeArea?: boolean;
  /** 自定义 className */
  className?: string;
  /** 主题色变体 */
  variant?: BottomNavVariant;
  /** 是否显示标签文字 */
  showLabels?: boolean;
  /** 是否有顶部边框分割线 */
  bordered?: boolean;
}

// ---- Constants ----

type BottomNavVariant = 'default' | 'frosted' | 'dark';

const variantStyles: { [K in BottomNavVariant]: React.CSSProperties } = {
  default: {
    backgroundColor: '#ffffff',
    color: '#64748b',
  },
  frosted: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#64748b',
  },
  dark: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
  },
};

const activeColorStyles: { [K in 'default' | 'frosted' | 'dark']: string } = {
  default: '#6366f1',
  frosted: '#6366f1',
  dark: '#a5b4fc',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -8,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: '#ef4444',
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
  lineHeight: 1,
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  width: '100%',
  padding: '8px 0 8px 0',
  borderTop: '1px solid #e2e8f0',
};

const itemBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  border: 'none',
  background: 'transparent',
  padding: '4px 12px',
  flex: 1,
  position: 'relative',
  transition: 'color 0.15s ease',
};

const iconStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

// ---- Icon mapping ----

const iconMap: Record<string, string> = {
  home: '🏠',
  dashboard: '📊',
  orders: '📋',
  members: '👥',
  products: '📦',
  settings: '⚙️',
  notifications: '🔔',
  profile: '👤',
  search: '🔍',
  chat: '💬',
  calendar: '📅',
  analytics: '📈',
  store: '🏪',
  coupon: '🎫',
  clock: '🕐',
  bell: '🔔',
  star: '⭐',
  heart: '❤️',
  chart: '📊',
  list: '📝',
  plus: '➕',
  check: '✅',
  close: '✕',
  back: '←',
  forward: '→',
  menu: '☰',
  more: '•••',
  user: '👤',
  camera: '📷',
  location: '📍',
  phone: '📞',
  mail: '✉️',
  info: 'ℹ️',
  warning: '⚠️',
  refresh: '🔄',
  share: '📤',
  download: '⬇️',
  upload: '⬆️',
};

function resolveIcon(icon?: string): string {
  if (!icon) return '○';
  return iconMap[icon] || icon;
}

// ---- Component ----

export function BottomNavigation({
  items,
  safeArea = true,
  className,
  variant = 'default',
  showLabels = true,
  bordered = true,
}: BottomNavigationProps) {
  const v = variant ?? 'default';
  const resolvedVariant = variantStyles[v];
  const activeColor = activeColorStyles[v];

  return (
    <nav
      data-testid="bottom-navigation"
      className={className}
      style={{
        ...resolvedVariant,
        width: '100%',
        paddingBottom: safeArea ? 'max(8px, env(safe-area-inset-bottom, 8px))' : 8,
        borderTop: bordered ? `1px solid ${variant === 'dark' ? '#334155' : '#e2e8f0'}` : 'none',
      }}
      role="navigation"
      aria-label="底部导航"
    >
      <div
        data-testid="bottom-nav-container"
        style={containerStyle}
      >
        {items.map((item) => (
          <button
            key={item.id}
            data-testid={`bottom-nav-item-${item.id}`}
            data-active={item.active ? 'true' : 'false'}
            disabled={item.disabled}
            onClick={item.onClick}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            style={{
              ...itemBaseStyle,
              color: item.disabled
                ? (variant === 'dark' ? '#475569' : '#cbd5e1')
                : item.active
                  ? activeColor
                  : (resolvedVariant.color || '#64748b'),
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span style={iconStyle} aria-hidden="true">
                {resolveIcon(item.icon)}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span
                  data-testid={`badge-${item.id}`}
                  style={badgeStyle}
                  aria-label={`${item.badge} 条未读`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </span>
            {showLabels && (
              <span data-testid={`label-${item.id}`} style={labelStyle}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
