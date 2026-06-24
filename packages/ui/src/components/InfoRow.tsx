'use client';

import React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  labelColor?: string;
  valueColor?: string;
  labelFontSize?: number;
  valueFontSize?: number;
  gap?: number;
}

export function InfoRow({
  label,
  value,
  labelColor = '#94a3b8',
  valueColor = '#f8fafc',
  labelFontSize = 13,
  valueFontSize = 14,
  gap = 4,
}: InfoRowProps) {
  return (
    <div>
      <div style={{ fontSize: labelFontSize, color: labelColor, marginBottom: gap }}>{label}</div>
      <div style={{ fontSize: valueFontSize, color: valueColor }}>{value}</div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmColor = variant === 'danger' ? '#ef4444' : '#3b82f6';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid rgba(148,163,184,0.16)',
          borderRadius: 16,
          padding: 24,
          minWidth: 360,
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: confirmColor,
              color: '#fff',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
