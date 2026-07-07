'use client';

import React from 'react';

// --------------- BreadcrumbPageHeader types ---------------
export interface BreadcrumbPageHeaderAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Disabled state */
  disabled?: boolean;
  /** Leading icon (emoji or short text) */
  icon?: string;
  /** HTML type attribute */
  type?: 'button' | 'submit' | 'reset';
}

export interface BreadcrumbPageHeaderProps {
  /** Ordered breadcrumb trail */
  breadcrumbs: Array<{ label: string; href?: string }>;
  /** Page title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Action buttons displayed in the header */
  actions?: BreadcrumbPageHeaderAction[];
  /** Test id */
  'data-testid'?: string;
  /** Extra CSS class */
  className?: string;
}

// --------------- BreadcrumbPageHeader ---------------
export function BreadcrumbPageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  'data-testid': testId,
  className,
}: BreadcrumbPageHeaderProps) {
  const colorMap: Record<string, React.CSSProperties> = {
    primary: { background: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },
    secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
    danger: { background: '#ef4444', color: '#fff', border: '1px solid #ef4444' },
    ghost: { background: 'transparent', color: '#4f46e5', border: 'none' },
  };

  const disabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  };

  return (
    <div
      data-testid={testId ?? 'breadcrumb-page-header'}
      className={className}
      style={{
        padding: '24px 32px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
      }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 12, fontSize: 14 }}>
        <ol
          style={{
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: 0,
            margin: 0,
            gap: 4,
          }}
        >
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <li
                key={`${item.label}-${idx}`}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {isLast ? (
                  <span
                    aria-current="page"
                    style={{ fontWeight: 600, color: '#111827' }}
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    style={{ color: '#4f46e5', textDecoration: 'none' }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span style={{ color: '#6b7280' }}>{item.label}</span>
                )}
                {!isLast && (
                  <span aria-hidden="true" style={{ color: '#9ca3af', margin: '0 4px' }}>
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Title + Actions row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.3,
              color: '#111827',
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: '#6b7280',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {actions.map((action, idx) => {
              const variant = action.variant ?? 'secondary';
              const btnStyle: React.CSSProperties = {
                ...colorMap[variant] ?? colorMap.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'box-shadow 0.15s',
                ...(action.disabled ? disabledStyle : {}),
              };

              return (
                <button
                  key={`action-${idx}`}
                  type={action.type ?? 'button'}
                  onClick={action.disabled ? undefined : action.onClick}
                  disabled={action.disabled}
                  data-testid={`page-header-action-${idx}`}
                  style={btnStyle}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BreadcrumbPageHeader;
