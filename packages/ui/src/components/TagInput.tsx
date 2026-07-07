'use client';

import React, { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Tag } from './Tag';

export interface TagInputProps {
  /** Current list of tags */
  value: string[];
  /** Called when tags change (add/remove) */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of tags allowed (0 = unlimited) */
  maxTags?: number;
  /** Maximum characters per tag */
  maxTagLength?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Label text above the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Unique tags only (default true) */
  unique?: boolean;
  /** Tag variant */
  tagVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  /** Input width */
  width?: number | string;
  /** Test id */
  'data-testid'?: string;
}

const ENTER_KEY = 'Enter';
const COMMA = ',';
const BACKSPACE = 'Backspace';
const EMPTY_ARRAY: string[] = [];

/**
 * TagInput — multi-tag input component.
 *
 * Press Enter or type comma to add a tag. Press Backspace on empty input
 * to remove the last tag. Tags are displayed as closable chips.
 */
export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  maxTags = 0,
  maxTagLength = 32,
  disabled = false,
  label,
  error,
  helperText,
  unique = true,
  tagVariant = 'primary',
  width = 320,
  'data-testid': dataTestId,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!error;

  const tags = value ?? EMPTY_ARRAY;
  const atMax = maxTags > 0 && tags.length >= maxTags;

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (maxTagLength > 0 && trimmed.length > maxTagLength) return;
      if (atMax) return;
      if (unique && tags.includes(trimmed)) return;
      onChange([...tags, trimmed]);
    },
    [tags, onChange, unique, maxTagLength, atMax]
  );

  const removeTag = useCallback(
    (index: number) => {
      const next = tags.filter((_, i) => i !== index);
      onChange(next);
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ENTER_KEY || e.key === COMMA) {
        e.preventDefault();
        if (inputValue) {
          addTag(inputValue);
          setInputValue('');
        }
        return;
      }
      if (e.key === BACKSPACE && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [inputValue, addTag, removeTag, tags]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text');
      // Split by comma, newline, or semicolon
      const parts = text.split(/[,;\n\r]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        e.preventDefault();
        let newTags = [...tags];
        for (const part of parts) {
          if (maxTagLength > 0 && part.length > maxTagLength) continue;
          if (atMax) break;
          if (unique && newTags.includes(part)) continue;
          newTags.push(part);
        }
        onChange(newTags);
        setInputValue('');
      }
    },
    [tags, onChange, unique, maxTagLength, atMax]
  );

  const handleContainerClick = useCallback(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div style={{ width }} data-testid={dataTestId}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 4,
            fontSize: 13,
            fontWeight: 500,
            color: hasError ? '#ef4444' : disabled ? '#9ca3af' : '#374151',
          }}
        >
          {label}
        </label>
      )}
      <div
        onClick={handleContainerClick}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          padding: '4px 8px',
          minHeight: 36,
          border: `1px solid ${disabled ? '#d1d5db' : hasError ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 6,
          background: disabled ? '#f9fafb' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
          boxShadow: hasError ? '0 0 0 2px rgba(239,68,68,0.15)' : undefined,
        }}
      >
        {tags.map((tag, i) => (
          <Tag
            key={`${tag}-${i}`}
            variant={tagVariant}
            size="sm"
            closable={!disabled}
            onClose={() => removeTag(i)}
          >
            {tag}
          </Tag>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue) {
              addTag(inputValue);
              setInputValue('');
            }
          }}
          disabled={disabled || atMax}
          placeholder={atMax ? `Max ${maxTags} tags` : !tags.length ? placeholder : ''}
          aria-label={label ?? 'Tag input'}
          style={{
            flex: '1 1 120px',
            minWidth: 80,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            color: disabled ? '#9ca3af' : '#1f2937',
            padding: '2px 0',
            lineHeight: '22px',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>
      {(error || helperText) && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: error ? '#ef4444' : '#6b7280',
            lineHeight: '16px',
          }}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
