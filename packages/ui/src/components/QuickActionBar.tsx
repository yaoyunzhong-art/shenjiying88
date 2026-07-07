'use client';

import React from 'react';

// ---- Types ----

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  shortcut?: string;
  onClick: () => void;
}

export interface QuickActionBarProps {
  title?: string;
  actions: QuickAction[];
  role?: string;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  /** Show as floating bar at bottom instead of inline */
  floating?: boolean;
}

// ---- Component ----

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: '1px solid #6366f1',
  },
  secondary: {
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #e2e8f0',
  },
  danger: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid transparent',
  },
};

const iconMap: Record<string, string> = {
  plus: '+',
  edit: '✎',
  delete: '✕',
  search: '🔍',
  print: '🖨',
  download: '⬇',
  upload: '⬆',
  refresh: '⟳',
  settings: '⚙',
  user: '👤',
  bell: '🔔',
  home: '🏠',
  chart: '📊',
  list: '☰',
  filter: '⥁',
  check: '✓',
  close: '✕',
  arrowLeft: '←',
  arrowRight: '→',
  calendar: '📅',
  clock: '⏰',
  phone: '📞',
};

const roleThemes: Record<string, { primary: string; bg: string }> = {
  manager: { primary: '#6366f1', bg: '#eef2ff' },
  frontdesk: { primary: '#0891b2', bg: '#ecfeff' },
  salesclerk: { primary: '#d97706', bg: '#fffbeb' },
  guide: { primary: '#7c3aed', bg: '#f5f3ff' },
  operator: { primary: '#059669', bg: '#ecfdf5' },
};

export function QuickActionBar({
  title,
  actions,
  role,
  className = '',
  columns = 4,
  floating = false,
}: QuickActionBarProps) {
  const theme = role ? roleThemes[role] : undefined;

  const containerStyle: React.CSSProperties = floating
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        padding: '12px 16px',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }
    : {
        backgroundColor: theme?.bg ?? '#f8fafc',
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${theme ? theme.primary + '22' : '#e2e8f0'}`,
      };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
  };

  const getIcon = (icon?: string) => {
    if (!icon) return null;
    return iconMap[icon] ?? icon;
  };

  return (
    <div className={`quick-action-bar ${className}`} style={containerStyle} data-role={role ?? 'default'}>
      {title && (
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme?.primary ?? '#475569',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {role && (
            <span
              style={{
                display: 'inline-block',
                padding: '1px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: theme?.primary ?? '#6366f1',
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              {role}
            </span>
          )}
          {title}
        </div>
      )}
      <div style={gridStyle} data-testid="quick-action-grid">
        {actions.map((action) => {
          const vs = variantStyles[action.variant ?? 'secondary'];
          const isPrimary = action.variant === 'primary';
          return (
            <button
              key={action.id}
              data-testid={`action-${action.id}`}
              disabled={action.disabled}
              aria-label={action.label}
              style={{
                ...vs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isPrimary ? 600 : 500,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                ...(isPrimary && theme
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : {}),
              }}
              onClick={action.onClick}
            >
              {action.loading ? (
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              ) : (
                getIcon(action.icon) && (
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{getIcon(action.icon)}</span>
                )
              )}
              <span>{action.label}</span>
              {action.shortcut && (
                <span
                  style={{
                    marginLeft: '4px',
                    fontSize: '10px',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                  }}
                >
                  {action.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
