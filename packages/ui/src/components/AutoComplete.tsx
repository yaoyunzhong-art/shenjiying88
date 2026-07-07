'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============ Types ============

export interface AutoCompleteOption<T = string> {
  value: T;
  label: string;
  /** 可选的副标题/描述 */
  subtitle?: string;
  /** 可选的图标/标记 */
  icon?: React.ReactNode;
  /** 是否禁用该选项 */
  disabled?: boolean;
}

export interface AutoCompleteProps<T = string> {
  /** 选项列表 */
  options: AutoCompleteOption<T>[];
  /** 当前选中值（受控） */
  value?: T;
  /** 默认值（非受控） */
  defaultValue?: T;
  /** 选中回调 */
  onChange?: (value: T, option: AutoCompleteOption<T>) => void;
  /** 输入值变化回调 */
  onInputChange?: (input: string) => void;
  /** 占位文字 */
  placeholder?: string;
  /** 是否显示搜索图标 */
  showSearchIcon?: boolean;
  /** 是否允许清空 */
  clearable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 加载占位文字 */
  loadingText?: string;
  /** 空数据占位文字 */
  emptyText?: string;
  /** 输入防抖毫秒数，默认 300 */
  debounceMs?: number;
  /** 自定义过滤函数，默认 label 模糊匹配 */
  filterOption?: (input: string, option: AutoCompleteOption<T>) => boolean;
  /** 最大显示选项数 */
  maxOptions?: number;
  /** 宽度 */
  width?: number | string;
  /** 自定义类名 */
  className?: string;
  /** 自定义 data-testid */
  'data-testid'?: string;
}

// ============ Component ============

export function AutoComplete<T = string>(props: AutoCompleteProps<T>) {
  const {
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    onInputChange,
    placeholder = '请输入搜索关键词',
    showSearchIcon = true,
    clearable = true,
    disabled = false,
    loading = false,
    loadingText = '加载中...',
    emptyText = '无匹配结果',
    debounceMs = 300,
    filterOption,
    maxOptions = 20,
    width,
    className = '',
    'data-testid': dataTestId = 'auto-complete',
  } = props;

  // ---- State ----
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const isControlled = controlledValue !== undefined;

  const currentValue = (isControlled ? controlledValue : internalValue) as T | undefined;

  // ---- 根据 value 反显 label ----
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null) {
      const matched = options.find((o) => o.value === currentValue);
      if (matched) {
        setInputValue(matched.label);
      }
    }
  }, [currentValue, options]);

  // ---- 过滤选项 ----
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) {
      return options.slice(0, maxOptions);
    }
    const defaultFilter = (input: string, opt: AutoCompleteOption<T>) => {
      return (
        opt.label.toLowerCase().includes(input.toLowerCase()) ||
        (opt.subtitle ?? '').toLowerCase().includes(input.toLowerCase())
      );
    };
    const filterFn = filterOption || defaultFilter;
    return options.filter((o) => filterFn(inputValue, o)).slice(0, maxOptions);
  }, [options, inputValue, filterOption, maxOptions]);

  // ---- 选中选项 ----
  const selectOption = useCallback(
    (option: AutoCompleteOption<T>) => {
      setInputValue(option.label);
      if (!isControlled) {
        setInternalValue(option.value);
      }
      onChange?.(option.value, option);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange, isControlled],
  );

  // ---- 输入变化 ----
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setIsOpen(true);
      setHighlightIndex(-1);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onInputChange?.(val);
      }, debounceMs);

      // 如果用户清空输入且受控，清空选中值
      if (val === '' && clearable) {
        if (!isControlled) {
          setInternalValue(undefined);
        }
        // 通知父组件
        const emptyOpt: AutoCompleteOption<T> = { value: '' as unknown as T, label: '' };
        onChange?.(emptyOpt.value, emptyOpt);
      }
    },
    [debounceMs, onInputChange, clearable, isControlled, onChange],
  );

  // ---- 键盘导航 ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
            const opt = filteredOptions[highlightIndex];
            if (opt) selectOption(opt);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightIndex(-1);
          break;
      }
    },
    [isOpen, filteredOptions, highlightIndex, selectOption],
  );

  // ---- 外部点击关闭 ----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- 清理防抖 ----
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ---- 清空 ----
  const handleClear = useCallback(() => {
    setInputValue('');
    if (!isControlled) {
      setInternalValue(undefined);
    }
    const emptyOpt: AutoCompleteOption<T> = { value: '' as unknown as T, label: '' };
    onChange?.(emptyOpt.value, emptyOpt);
    inputRef.current?.focus();
    setIsOpen(false);
  }, [onChange, isControlled]);

  // ---- 聚焦展开 ----
  const handleFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  // ---- Render ----
  const showDropdown = isOpen && !disabled && (filteredOptions.length > 0 || loading);

  const testId = (suffix: string) => `${dataTestId}-${suffix}`;

  return (
    <div
      ref={containerRef}
      className={`m5-auto-complete ${className}`}
      style={{ width, position: 'relative' }}
      data-testid={dataTestId}
    >
      {/* 输入框 */}
      <div
        className="m5-auto-complete-input-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          padding: '4px 8px',
          background: disabled ? '#f3f4f6' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      >
        {showSearchIcon && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            style={{ marginRight: 6, flexShrink: 0 }}
            data-testid={testId('search-icon')}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            lineHeight: '22px',
            color: disabled ? '#9ca3af' : '#1f2937',
          }}
          data-testid={testId('input')}
        />
        {clearable && inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            data-testid={testId('clear')}
            aria-label="清空"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 下拉面板 */}
      {showDropdown && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1050,
            maxHeight: 280,
            overflowY: 'auto',
          }}
          data-testid={testId('dropdown')}
        >
          {loading ? (
            <li
              style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}
              data-testid={testId('loading')}
            >
              {loadingText}
            </li>
          ) : filteredOptions.length === 0 ? (
            <li
              style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}
              data-testid={testId('empty')}
            >
              {emptyText}
            </li>
          ) : (
            filteredOptions.map((option, idx) => (
              <li
                key={`${option.value}-${idx}`}
                role="option"
                aria-selected={highlightIndex === idx}
                onClick={() => !option.disabled && selectOption(option)}
                style={{
                  padding: '6px 12px',
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  background: highlightIndex === idx ? '#eff6ff' : 'transparent',
                  color: option.disabled ? '#d1d5db' : '#1f2937',
                  fontSize: 14,
                  lineHeight: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                data-testid={testId(`option-${idx}`)}
                onMouseEnter={() => setHighlightIndex(idx)}
                onMouseLeave={() => setHighlightIndex(-1)}
              >
                {option.icon && (
                  <span data-testid={testId(`option-icon-${idx}`)}>{option.icon}</span>
                )}
                <div style={{ flex: 1 }}>
                  <div data-testid={testId(`option-label-${idx}`)}>{option.label}</div>
                  {option.subtitle && (
                    <div
                      style={{ fontSize: 12, color: '#6b7280' }}
                      data-testid={testId(`option-subtitle-${idx}`)}
                    >
                      {option.subtitle}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
