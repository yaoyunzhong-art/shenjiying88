'use client';

import React from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** @deprecated Breadcrumb is not rendered. Use `subtitle` or `description` instead. */
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ title, description, subtitle, actions, children }: PageShellProps) {
  const resolvedDescription = description ?? subtitle;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            {title}
          </h1>
          {resolvedDescription && (
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0' }}>{resolvedDescription}</p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}
