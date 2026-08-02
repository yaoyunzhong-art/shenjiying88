'use client';

/**
 * 🎨 BatchOperationsBar — 批量操作浮动工具栏
 * 当用户选中表格行时，在表格上方显示选中计数和批量操作按钮
 */
import React from 'react';

export interface BatchAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'default';
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}

interface BatchOperationsBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BatchAction[];
  onClearSelection: () => void;
  /** 选中项的摘要标签（如"3 件商品"） */
  itemLabel?: string;
}

export default function BatchOperationsBar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  itemLabel = '项',
}: BatchOperationsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 12,
        background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        marginBottom: 12,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
          已选 {selectedCount} / {totalCount} {itemLabel}
        </span>
        <button
          onClick={onClearSelection}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          取消选择
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.disabled ? action.disabledReason : action.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor:
                action.variant === 'danger'
                  ? 'rgba(248, 113, 113, 0.4)'
                  : action.variant === 'primary'
                    ? 'rgba(59, 130, 246, 0.4)'
                    : 'rgba(148, 163, 184, 0.25)',
              background:
                action.variant === 'danger'
                  ? 'rgba(248, 113, 113, 0.12)'
                  : action.variant === 'primary'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(148, 163, 184, 0.08)',
              color:
                action.disabled
                  ? '#64748b'
                  : action.variant === 'danger'
                    ? '#f87171'
                    : action.variant === 'primary'
                      ? '#93c5fd'
                      : '#cbd5e1',
              fontSize: 12,
              fontWeight: 600,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              opacity: action.disabled ? 0.5 : 1,
            }}
          >
            {action.icon && <span style={{ fontSize: 14 }}>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
