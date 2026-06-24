'use client';

import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  rows?: number;
  label?: string;
  variant?: 'default' | 'card' | 'table';
}

export function LoadingSkeleton({
  lines,
  rows,
  label,
  variant = 'default',
}: LoadingSkeletonProps) {
  const resolvedLines = lines ?? (variant === 'card' ? 2 : 3);
  const resolvedRows = rows ?? (variant === 'card' ? 2 : 5);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {label ? <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div> : null}
      {/* Block lines */}
      {Array.from({ length: resolvedLines }).map((_, i) => (
        <div
          key={`line-${i}`}
          style={{
            height: 16,
            borderRadius: 4,
            background: 'rgba(148,163,184,0.08)',
            width: `${100 - i * 15}%`,
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      {/* Table rows */}
      <div style={{ marginTop: 16 }}>
        {Array.from({ length: resolvedRows }).map((_, i) => (
          <div
            key={`row-${i}`}
            style={{
              height: 40,
              borderRadius: 6,
              background: 'rgba(148,163,184,0.05)',
              marginBottom: 8,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
