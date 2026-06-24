'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ---- Types ----

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional description shown beneath the label */
  description?: string;
  /** Optional avatar/icon */
  icon?: React.ReactNode;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional group label */
  group?: string;
}

export interface ComboboxProps {
  /** Current value */
  value?: string;
  /** Options */
  options: ComboboxOption[];
  /** Value change callback */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label above the input */
  label?: string;
  /** Whether to allow custom (non-option) values */
  allowCustom?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Whether required */
  required?: boolean;
  /** Empty state message when no results */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Maximum visible options before scroll (default 8) */
  maxVisible?: number;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

// ---- Styles ----

const BG = 'rgba(15, 23, 42, 0.97)';
const BORDER = 'rgba(148, 163, 184, 0.15)';
const TEXT = '#e2e8f0';
const MUTED = '#64748b';
const ACCENT = '#3b82f6';
const ACCENT_BG = 'rgba(59, 130, 246, 0.12)';
const ERROR = 'rgba(248, 113, 113, 0.4)';

const OPTION_HEIGHT = 40;

// ---- Helpers ----

function filterOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return options;

  return options.filter((opt) => {
    if (opt.disabled) return false; // disabled options still searchable
    return (
      opt.label.toLowerCase().includes(lower) ||
      opt.value.toLowerCase().includes(lower) ||
      (opt.description?.toLowerCase().includes(lower) ?? false)
    );
  });
}

function groupOptions(options: ComboboxOption[]): { label?: string; options: ComboboxOption[] }[] {
  const groups: Record<string, ComboboxOption[]> = {};
  const ungrouped: ComboboxOption[] = [];

  for (const opt of options) {
    if (opt.group) {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group]!.push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  const result: { label?: string; options: ComboboxOption[] }[] = [];
  if (ungrouped.length > 0) result.push({ options: ungrouped });
  for (const [label, opts] of Object.entries(groups)) {
    result.push({ label, options: opts });
  }
  return result;
}

// ---- Main Component ----

export const Combobox = React.memo(function Combobox({
  value,
  options,
  onChange,
  placeholder = '搜索选择...',
  label,
  allowCustom = false,
  error,
  helpText,
  disabled = false,
  required = false,
  emptyMessage = '无匹配选项',
  loading = false,
  maxVisible = 8,
  style,
  className,
  'data-testid': dataTestId,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [internalValue, setInternalValue] = useState(value ?? '');

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Filter and group options
  const filteredOptions = useMemo(() => filterOptions(options, query), [options, query]);
  const grouped = useMemo(() => groupOptions(filteredOptions), [filteredOptions]);

  // Total available options count
  const totalAvailable = useMemo(
    () => grouped.reduce((sum, g) => sum + g.options.length, 0),
    [grouped],
  );

  // Get selected option label
  const selectedLabel = useMemo(() => {
    if (!internalValue) return '';
    const opt = options.find((o) => o.value === internalValue);
    return opt?.label ?? internalValue;
  }, [internalValue, options]);

  // Reset highlight when filtered change
  useEffect(() => {
    setHighlightIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted into view
  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector(`[data-combobox-option-index="${highlightIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSelect = useCallback(
    (opt: ComboboxOption) => {
      if (opt.disabled) return;
      setInternalValue(opt.value);
      onChange?.(opt.value);
      setOpen(false);
      setQuery('');
      setHighlightIndex(0);
    },
    [onChange],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (!open) setOpen(true);
    setHighlightIndex(0);
  }, [open]);

  const handleFocus = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    // Show all options on focus
    if (!query) setQuery('');
  }, [disabled, query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((i) => (i + 1) % Math.max(totalAvailable, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((i) => (i - 1 + totalAvailable) % Math.max(totalAvailable, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (totalAvailable > 0) {
            let idx = 0;
            for (const group of grouped) {
              for (const opt of group.options) {
                if (idx === highlightIndex) {
                  handleSelect(opt);
                  return;
                }
                idx++;
              }
            }
          } else if (allowCustom && query.trim()) {
            const newValue = query.trim();
            setInternalValue(newValue);
            onChange?.(newValue);
            setOpen(false);
            setQuery('');
          }
          break;
        case 'Tab':
          setOpen(false);
          setQuery('');
          break;
        default:
          break;
      }
    },
    [open, totalAvailable, highlightIndex, grouped, handleSelect, allowCustom, query, onChange],
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange?.('');
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const inputBorderColor = error ? ERROR : BORDER;

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}
      className={className}
      data-testid={dataTestId}
    >
      {label && (
        <label
          style={{ fontSize: 12, fontWeight: 500, color: error ? '#f87171' : '#94a3b8' }}
        >
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={open ? query : (selectedLabel || query)}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
            role="combobox"
            data-combobox-input="true"
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              fontSize: 13,
              lineHeight: 1.5,
              color: TEXT,
              background: 'rgba(15, 23, 42, 0.4)',
              border: `1px solid ${inputBorderColor}`,
              borderRadius: 8,
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.5 : 1,
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
          />

          {/* Clear button or dropdown chevron */}
          {internalValue && !disabled && !open ? (
            <button
              type="button"
              onClick={handleClear}
              data-combobox-clear="true"
              aria-label="Clear selection"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: MUTED,
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: `translateY(-50%) ${open ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                pointerEvents: 'none',
                color: MUTED,
                transition: 'transform 0.2s',
              }}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {/* Loading spinner */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                right: 32,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              data-combobox-loading="true"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: 'combobox-spin 0.6s linear infinite' }}>
                <circle cx="8" cy="8" r="6" stroke={MUTED} strokeWidth="2" strokeDasharray="28" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes combobox-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>

        {/* Dropdown list */}
        {open && (
          <div
            ref={listRef}
            role="listbox"
            data-combobox-list="true"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              maxHeight: maxVisible * OPTION_HEIGHT,
              overflowY: 'auto',
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              zIndex: 9997,
              padding: 4,
            }}
          >
            {totalAvailable === 0 ? (
              <div
                style={{
                  padding: '12px 10px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: MUTED,
                }}
              >
                {emptyMessage}
              </div>
            ) : (
              grouped.map((group, groupIdx) => (
                <div key={group.label ?? `__ungrouped_${groupIdx}`} data-combobox-group={group.label}>
                  {group.label && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: MUTED,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '6px 10px 2px',
                      }}
                    >
                      {group.label}
                    </div>
                  )}
                  {group.options.map((opt) => {
                    // Find flat index
                    let flatIdx = 0;
                    for (let gi = 0; gi < groupIdx; gi++) {
                      flatIdx += grouped[gi]!.options.length;
                    }
                    const idxInGroup = group.options.indexOf(opt);
                    const flatIndex = flatIdx + idxInGroup;

                    const isHighlighted = flatIndex === highlightIndex;
                    const isSelected = opt.value === internalValue;

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        data-combobox-option-index={flatIndex}
                        data-combobox-option-value={opt.value}
                        onClick={() => handleSelect(opt)}
                        onMouseEnter={() => setHighlightIndex(flatIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: opt.disabled ? 'not-allowed' : 'pointer',
                          opacity: opt.disabled ? 0.4 : 1,
                          background: isHighlighted ? ACCENT_BG : 'transparent',
                          color: isSelected && !isHighlighted ? ACCENT : TEXT,
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'background 0.1s',
                          height: OPTION_HEIGHT,
                          boxSizing: 'border-box',
                        }}
                      >
                        {opt.icon && (
                          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            {opt.icon}
                          </span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {opt.label}
                          </div>
                          {opt.description && (
                            <div
                              style={{
                                fontSize: 11,
                                color: MUTED,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {opt.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M3 8l3.5 3.5L13 5" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>
      )}
      {helpText && !error && (
        <span style={{ fontSize: 11, color: MUTED }}>{helpText}</span>
      )}
    </div>
  );
});

export default Combobox;
