'use client';

import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export function EmptyState({ title = '暂无数据', description, action, icon, variant = 'default' }: EmptyStateProps) {
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
    </div>
  );
}
