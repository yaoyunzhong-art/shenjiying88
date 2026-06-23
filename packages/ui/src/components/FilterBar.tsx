'use client';

import React from 'react';

interface FilterChip {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface FilterBarProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  activeCount?: number;
}

export function FilterBar({ chips, onClearAll, activeCount }: FilterBarProps) {
  const count = activeCount ?? chips.filter((c) => c.active).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '8px 0',
      }}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClick}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: chip.active
              ? '1px solid rgba(96,165,250,0.3)'
              : '1px solid rgba(148,163,184,0.12)',
            background: chip.active
              ? 'rgba(59,130,246,0.15)'
              : 'transparent',
            color: chip.active ? '#93c5fd' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {chip.label}
        </button>
      ))}
      {count > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            marginLeft: 4,
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
