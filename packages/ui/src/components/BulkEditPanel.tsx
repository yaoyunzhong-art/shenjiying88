'use client';

import React, { useMemo, useCallback, useState } from 'react';

// --------------- Types ---------------

export interface BulkEditField<T = string> {
  /** Unique field key */
  key: T;
  /** Display label */
  label: string;
  /** Current field value type */
  type: 'text' | 'number' | 'select' | 'toggle' | 'date';
  /** For select type: available options */
  options?: { label: string; value: string }[];
  /** Placeholder for text/number inputs */
  placeholder?: string;
  /** Validation function: return error string or null */
  validate?: (value: string | number | boolean | null) => string | null;
}

export interface BulkEditEntry<ID = string> {
  /** Unique record id */
  id: ID;
  /** Display title (shown in preview row) */
  title: string;
  /** Subtitle or secondary info */
  subtitle?: string;
  /** Current field values keyed by field key */
  values: Record<string, string | number | boolean | null>;
}

export interface BulkEditPanelProps<ID = string, F = string> {
  /** All selected entries that will be edited */
  entries: BulkEditEntry<ID>[];
  /** Field definitions for the edit form */
  fields: BulkEditField<F>[];
  /** Currently editing values (can be partial) */
  editingValues: Record<string, string | number | boolean | null>;
  /** Called when a field value changes */
  onFieldChange: (fieldKey: string, value: string | number | boolean | null) => void;
  /** Called when "Apply to all" is confirmed */
  onApply: (values: Record<string, string | number | boolean | null>) => void;
  /** Called when the panel is closed / cancelled */
  onCancel: () => void;
  /** Whether the panel is performing the update */
  isSubmitting?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
  /** Error message to display */
  error?: string | null;
  /** CSS class */
  className?: string;
}

// --------------- Internal ---------------

const inputContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const inputBase: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  lineHeight: '1.5',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  ...inputBase,
  background: '#fff',
  cursor: 'pointer',
};

const textInputFocus: React.CSSProperties = {
  borderColor: '#2563eb',
  boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
};

const previewRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
  color: '#374151',
};

const previewTitleStyle: React.CSSProperties = {
  fontWeight: 500,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const previewSubStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  marginLeft: '8px',
  whiteSpace: 'nowrap',
};

const actionBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500,
  fontFamily: 'inherit',
};

const primaryBtn: React.CSSProperties = {
  ...actionBtn,
  background: '#2563eb',
  color: '#fff',
  border: '1px solid #2563eb',
};

// --------------- Component ---------------

export function BulkEditPanel<ID extends string = string, F extends string = string>({
  entries,
  fields,
  editingValues,
  onFieldChange,
  onApply,
  onCancel,
  isSubmitting = false,
  submitLabel = '批量更新',
  error = null,
  className,
}: BulkEditPanelProps<ID, F>) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

  const handleChange = useCallback(
    (fieldKey: string, rawValue: string | number | boolean | null) => {
      const field = fields.find((f) => f.key === fieldKey);
      if (field?.validate) {
        const err = field.validate(rawValue);
        setValidationErrors((prev) => ({ ...prev, [fieldKey]: err }));
      } else {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
      onFieldChange(fieldKey, rawValue);
    },
    [fields, onFieldChange],
  );

  const handleSubmit = useCallback(() => {
    const errs: Record<string, string | null> = {};
    let hasError = false;
    for (const field of fields) {
      if (field.validate) {
        const val = editingValues[field.key as string] ?? null;
        const err = field.validate(val);
        errs[field.key as string] = err;
        if (err) hasError = true;
      }
    }
    setValidationErrors(errs);
    if (!hasError) {
      onApply(editingValues);
    }
  }, [fields, editingValues, onApply]);

  const allSetCount = useMemo(
    () => fields.filter((f) => editingValues[f.key as string] !== undefined && editingValues[f.key as string] !== null).length,
    [fields, editingValues],
  );

  // --------------- Render ---------------

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    maxHeight: '90vh',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  return (
    <div
      className={className}
      style={panelStyle}
      role="dialog"
      aria-label="批量编辑面板"
      data-testid="bulk-edit-panel"
    >
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            批量编辑
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
            已选 {entries.length} 条记录 · 已设置 {allSetCount}/{fields.length} 个字段
          </p>
        </div>
        <button
          onClick={onCancel}
          style={{
            ...actionBtn,
            padding: '6px 12px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          data-testid="bulk-edit-cancel"
        >
          ✕ 取消
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
        {/* Edit Form */}
        <div style={{ marginBottom: '16px' }}>
          {fields.map((field) => {
            const currentValue = editingValues[field.key as string] ?? '';
            const errMsg = validationErrors[field.key as string];
            const isFocused = focusedField === field.key;

            const inputStyle: React.CSSProperties = {
              ...inputBase,
              ...(isFocused ? textInputFocus : {}),
              ...(errMsg ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.15)' } : {}),
            };

            return (
              <div key={field.key as string} style={inputContainer}>
                <label style={labelStyle} htmlFor={`bulk-field-${field.key as string}`}>
                  {field.label}
                  {currentValue !== '' && currentValue !== null && (
                    <span style={{ color: '#2563eb', marginLeft: '6px', fontSize: '12px' }}>✓ 已设置</span>
                  )}
                </label>
                {field.type === 'select' && field.options ? (
                  <select
                    id={`bulk-field-${field.key as string}`}
                    style={selectStyle}
                    value={String(currentValue ?? '')}
                    onChange={(e) => handleChange(field.key as string, e.target.value)}
                    onFocus={() => setFocusedField(field.key as string)}
                    onBlur={() => setFocusedField(null)}
                    data-testid={`bulk-field-${field.key as string}`}
                  >
                    <option value="">— 保持不变 —</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'toggle' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      role="switch"
                      aria-checked={currentValue === true || currentValue === 'true'}
                      onClick={() =>
                        handleChange(
                          field.key as string,
                          currentValue === true || currentValue === 'true' ? false : true,
                        )
                      }
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        border: 'none',
                        background: currentValue === true || currentValue === 'true' ? '#2563eb' : '#d1d5db',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.15s',
                      }}
                      data-testid={`bulk-field-${field.key as string}`}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: currentValue === true || currentValue === 'true' ? '20px' : '2px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.15s',
                        }}
                      />
                    </button>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {currentValue === true || currentValue === 'true' ? '是' : '否'}
                    </span>
                  </div>
                ) : field.type === 'number' ? (
                  <input
                    id={`bulk-field-${field.key as string}`}
                    type="number"
                    style={inputStyle}
                    placeholder={field.placeholder ?? '请输入...'}
                    value={currentValue !== null ? String(currentValue) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleChange(field.key as string, v === '' ? null : Number(v));
                    }}
                    onFocus={() => setFocusedField(field.key as string)}
                    onBlur={() => setFocusedField(null)}
                    data-testid={`bulk-field-${field.key as string}`}
                  />
                ) : (
                  <input
                    id={`bulk-field-${field.key as string}`}
                    type="text"
                    style={inputStyle}
                    placeholder={field.placeholder ?? '请输入...'}
                    value={currentValue !== null ? String(currentValue) : ''}
                    onChange={(e) => handleChange(field.key as string, e.target.value || null)}
                    onFocus={() => setFocusedField(field.key as string)}
                    onBlur={() => setFocusedField(null)}
                    data-testid={`bulk-field-${field.key as string}`}
                  />
                )}
                {errMsg && (
                  <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
                    {errMsg}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview of affected records */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
            受影响记录预览
          </p>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {entries.map((entry) => (
              <div key={entry.id} style={previewRowStyle}>
                <span style={previewTitleStyle}>{entry.title}</span>
                {entry.subtitle && <span style={previewSubStyle}>{entry.subtitle}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {error && (
          <span style={{ fontSize: '13px', color: '#dc2626', flex: 1 }}>
            {error}
          </span>
        )}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={onCancel}
            style={actionBtn}
            disabled={isSubmitting}
            data-testid="bulk-edit-cancel-btn"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            style={{
              ...primaryBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            disabled={isSubmitting}
            data-testid="bulk-edit-apply"
          >
            {isSubmitting ? '更新中...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
