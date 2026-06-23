'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  helper?: string;
  disabled?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  helper,
  disabled,
  compact,
  children,
}: FormFieldProps) {
  const helperText = helper ?? hint;
  return (
    <div style={{ marginBottom: compact ? 8 : 16 }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: disabled ? '#64748b' : '#cbd5e1',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{helperText}</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
