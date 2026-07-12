'use client';

import React from 'react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export function EmptyState({ title = '暂无数据', description, action, actionLabel, actionHref, icon, variant = 'default' }: EmptyStateProps) {
  const compact = variant === 'compact';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 24 : 48,
        textAlign: 'center',
      }}
    >
      {icon && <div style={{ marginBottom: 16, color: '#475569' }}>{icon}</div>}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', margin: 0 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px', maxWidth: 320 }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          style={{
            display: 'inline-block',
            marginTop: 12,
            padding: '8px 20px',
            borderRadius: 6,
            background: '#2563eb',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
