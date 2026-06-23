'use client';

import React from 'react';

interface DetailSection {
  title: string;
  content: React.ReactNode;
}

export interface DetailShellAction {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  href?: string;
}

interface DetailShellProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  subtitle?: string;
  sections?: DetailSection[];
  children?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  backLink?: { label: string; href: string };
  actions?: DetailShellAction[];
  loading?: boolean;
  error?: string;
  onBack?: () => void;
}

export function DetailShell({
  title,
  backHref,
  backLabel = 'Back to list',
  sections,
  subtitle,
  children,
  breadcrumbs,
  backLink,
  actions,
  loading = false,
  error,
  onBack,
}: DetailShellProps) {
  const resolvedBackHref = backLink?.href ?? backHref;
  const resolvedBackLabel = backLink?.label ?? backLabel;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#fca5a5',
          background: 'rgba(239,68,68,0.08)',
          borderRadius: 12,
          margin: 24,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
      {breadcrumbs?.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {item.href ? (
                <a href={item.href} style={{ color: '#93c5fd', textDecoration: 'none' }}>
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? <span>/</span> : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}
      {(resolvedBackHref || onBack) && (
        <a
          href={resolvedBackHref}
          onClick={(e) => {
            if (onBack) {
              e.preventDefault();
              onBack();
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
            color: '#93c5fd',
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          ← {resolvedBackLabel}
        </a>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{title}</h1>
          {subtitle ? <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>{subtitle}</div> : null}
        </div>
        {actions?.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {actions.map((action) => {
              const palette =
                action.variant === 'secondary'
                  ? { background: 'transparent', border: '1px solid rgba(148,163,184,0.18)', color: '#cbd5e1' }
                  : action.variant === 'danger'
                    ? { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.25)', color: '#fecaca' }
                    : { background: 'rgba(59,130,246,0.16)', border: '1px solid rgba(96,165,250,0.3)', color: '#dbeafe' };

              return (
                <button
                  key={action.key}
                  type="button"
                  disabled={action.disabled || action.loading}
                  onClick={() => void action.onClick?.()}
                  style={{
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: action.disabled || action.loading ? 'not-allowed' : 'pointer',
                    opacity: action.disabled || action.loading ? 0.6 : 1,
                    ...palette,
                  }}
                >
                  {action.loading ? `${action.label}...` : action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {children ?? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(sections ?? []).map((section, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px',
                }}
              >
                {section.title}
              </h3>
              <div>{section.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
