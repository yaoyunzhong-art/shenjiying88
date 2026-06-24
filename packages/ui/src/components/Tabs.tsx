'use client';

import React from 'react';

interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  variant?: 'underline' | 'segment' | 'pills';
  size?: 'sm' | 'md';
  fill?: boolean;
}

export function Tabs<T extends string = string>({
  items,
  activeKey,
  onChange,
  variant = 'underline',
  size = 'md',
  fill = false,
}: TabsProps<T>) {
  if (items.length === 0) return null;

  const containerGap = size === 'sm' ? 4 : 8;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: containerGap,
    flexWrap: 'wrap',
    ...(fill ? { width: '100%' } : {}),
    ...(variant === 'segment'
      ? {
          borderRadius: 12,
          padding: 4,
          background: 'rgba(15,23,42,0.35)',
          border: '1px solid rgba(148,163,184,0.14)',
        }
      : variant === 'underline'
        ? {
            borderBottom: '1px solid rgba(148,163,184,0.14)',
            paddingBottom: 0,
          }
        : {}),
  };

  return (
    <div style={containerStyle} role="tablist">
      {items.map((item) => {
        const active = item.key === activeKey;
        const fontSize = size === 'sm' ? 13 : 14;
        const paddingV = size === 'sm' ? 6 : 10;
        const paddingH = size === 'sm' ? 12 : 18;

        const style: React.CSSProperties = {
          fontSize,
          fontWeight: active ? 600 : 400,
          color: active ? '#93c5fd' : '#94a3b8',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: `${paddingV}px ${paddingH}px`,
          borderRadius: variant === 'pills' ? 999 : variant === 'segment' ? 8 : 0,
          whiteSpace: 'nowrap',
          flex: fill ? 1 : undefined,
          textAlign: fill ? 'center' : undefined,
          transition: 'color 0.15s ease, background 0.15s ease',
          ...(active && variant === 'pills'
            ? { background: 'rgba(37,99,235,0.22)', color: '#93c5fd' }
            : {}),
          ...(active && variant === 'segment'
            ? {
                background: 'rgba(37,99,235,0.30)',
                color: '#f8fafc',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }
            : {}),
          ...(variant === 'underline'
            ? {
                borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
                marginBottom: -1,
              }
            : {}),
        };

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            style={style}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: fontSize - 2,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: active
                    ? 'rgba(96,165,250,0.25)'
                    : 'rgba(148,163,184,0.12)',
                  color: active ? '#bfdbfe' : '#94a3b8',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
