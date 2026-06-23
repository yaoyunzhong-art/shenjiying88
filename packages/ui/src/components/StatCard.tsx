'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  helper?: React.ReactNode;
}

const ACCENTS: Record<string, string> = {
  default: '#3b82f6',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
};

export function StatCard({ label, value, trend, icon, variant = 'default', helper }: StatCardProps) {
  const accent = ACCENTS[variant] ?? ACCENTS.default;

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{value}</span>
        {trend && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: trend.positive ? '#22c55e' : '#ef4444',
            }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {helper ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{helper}</div> : null}
    </div>
  );
}
