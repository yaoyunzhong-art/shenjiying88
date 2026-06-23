'use client';

import React from 'react';

// --------------- types ---------------

export interface BatchAction<T = string> {
  /** Unique action key */
  key: T;
  /** Display label */
  label: string;
  /** Optional icon (render before label) */
  icon?: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'danger' | 'default' | 'outline';
  /** Whether this action requires confirmation before execution */
  requireConfirm?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Tooltip / aria description */
  description?: string;
}

export interface BatchSelectionBarProps<T = string> {
  /** Number of selected items */
  selectedCount: number;
  /** Total items (used to show "All N selected") */
  totalCount?: number;
  /** Human-readable item label, e.g. "orders", "users" */
  itemLabel?: string;
  /** Available batch actions */
  actions: BatchAction<T>[];
  /** Called when an action is invoked */
  onAction: (actionKey: T) => void;
  /** Called when user clicks "Clear selection" */
  onClearSelection: () => void;
  /** Custom test id */
  'data-testid'?: string;
}

// --------------- variant styles ---------------

const variantStyles: Record<
 NonNullable<BatchAction['variant']>,
 React.CSSProperties
> = {
  primary: {
    background: '#2563eb',
    color: '#fff',
    border: '1px solid #2563eb',
  },
  danger: {
    background: '#dc2626',
    color: '#fff',
    border: '1px solid #dc2626',
  },
  default: {
    background: '#f1f5f9',
    color: '#1e293b',
    border: '1px solid #cbd5e1',
  },
  outline: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #cbd5e1',
  },
};

// --------------- BatchSelectionBar ---------------

export function BatchSelectionBar<T extends string = string>({
  selectedCount,
  totalCount,
  itemLabel = 'items',
  actions,
  onAction,
  onClearSelection,
  'data-testid': testId,
}: BatchSelectionBarProps<T>) {
  if (selectedCount === 0) {
    return null;
  }

  const countLabel =
    totalCount && selectedCount === totalCount
      ? `All ${selectedCount} ${itemLabel} selected`
      : `${selectedCount} ${itemLabel} selected`;

  return (
    <div
      data-testid={testId ?? 'batch-selection-bar'}
      role="toolbar"
      aria-label="Batch selection actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '10px 16px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        marginBottom: 12,
      }}
    >
      {/* Left: count + clear */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          data-testid="batch-selection-count"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1e40af',
          }}
        >
          {countLabel}
        </span>
        <button
          data-testid="batch-selection-clear"
          type="button"
          onClick={onClearSelection}
          style={{
            fontSize: 13,
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Clear selection
        </button>
      </div>

      {/* Right: action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {actions.map((action) => {
          const style = variantStyles[action.variant ?? 'default'];

          return (
            <button
              key={action.key}
              data-testid={`batch-action-${action.key}`}
              type="button"
              disabled={action.disabled}
              title={action.description}
              aria-label={action.description ?? action.label}
              onClick={() => onAction(action.key)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 6,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                ...style,
              }}
            >
              {action.icon}
              {action.requireConfirm ? `${action.label}...` : action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
