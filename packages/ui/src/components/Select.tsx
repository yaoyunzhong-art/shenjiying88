'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** 当前选中值（受控） */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 选项列表 */
  options: SelectOption[];
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否可搜索 */
  showSearch?: boolean;
  /** 搜索占位文本 */
  searchPlaceholder?: string;
  /** 空数据提示 */
  notFoundContent?: React.ReactNode;
  /** 最小宽度 */
  minWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 下拉框类名 */
  dropdownClassName?: string;
  /** 表单 name */
  name?: string;
  /** aria-label */
  'aria-label'?: string;
  /** aria-labelledby */
  'aria-labelledby'?: string;
}

/**
 * Select — 下拉选择器组件。
 *
 * 提供单选下拉选择能力，支持搜索过滤、清除选择、禁用状态。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <Select
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  allowClear = false,
  showSearch = false,
  searchPlaceholder = '搜索...',
  notFoundContent = '无匹配结果',
  minWidth = 160,
  className,
  style,
  dropdownClassName,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchText.trim()) return options;
    const lower = searchText.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(lower) || o.value.toLowerCase().includes(lower),
    );
  }, [options, searchText, showSearch]);

  // 点击外部关闭
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
      setSearchText('');
    }
  }, []);

  // Escape 关闭
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(0);
        return;
      }

      if (!open) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setSearchText('');
          break;
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
          if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
            handleSelect(filteredOptions[highlightIndex].value);
          }
          break;
      }
    },
    [open, filteredOptions, highlightIndex],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (open && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, showSearch]);

  // 重置高亮
  useEffect(() => {
    if (!open) setHighlightIndex(-1);
  }, [open]);

  const handleSelect = useCallback(
    (val: string) => {
      const opt = options.find((o) => o.value === val);
      if (opt?.disabled) return;
      onChange?.(val);
      setOpen(false);
      setSearchText('');
    },
    [onChange, options],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setSearchText('');
    },
    [onChange],
  );

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setSearchText('');
  }, [disabled]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    minWidth,
    ...style,
  };

  const selectorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: disabled ? '#f5f5f5' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 32,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    opacity: disabled ? 0.6 : 1,
  };

  const placeholderStyle: React.CSSProperties = {
    color: '#bfbfbf',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const valueStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const arrowStyle: React.CSSProperties = {
    marginLeft: 8,
    fontSize: 10,
    color: '#999',
    transition: 'transform 0.2s',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0,
  };

  const clearStyle: React.CSSProperties = {
    marginLeft: 4,
    cursor: 'pointer',
    color: '#999',
    fontSize: 14,
    lineHeight: 1,
    flexShrink: 0,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 1050,
    maxHeight: 256,
    overflow: 'auto',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const optionStyle = (opt: SelectOption, index: number): React.CSSProperties => ({
    padding: '6px 12px',
    cursor: opt.disabled ? 'not-allowed' : 'pointer',
    backgroundColor:
      opt.value === value
        ? '#e6f7ff'
        : index === highlightIndex
          ? '#f5f5f5'
          : 'transparent',
    color: opt.disabled ? '#ccc' : '#333',
    fontSize: 14,
    transition: 'background-color 0.15s',
  });

  const notFoundStyle: React.CSSProperties = {
    padding: '8px 12px',
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  };

  const hiddenInputStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Hidden input for form integration */}
      <input type="hidden" name={name} value={value ?? ''} style={hiddenInputStyle} />

      {/* Selector trigger */}
      <div
        style={selectorStyle}
        onClick={handleToggle}
        role="button"
        aria-disabled={disabled}
      >
        <span style={selectedOption ? valueStyle : placeholderStyle}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {allowClear && value && (
            <span style={clearStyle} onClick={handleClear} role="button" aria-label="清除选择">
              ✕
            </span>
          )}
          <span style={arrowStyle}>▼</span>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className={dropdownClassName}
          style={dropdownStyle}
          role="listbox"
          aria-label={ariaLabel ? `${ariaLabel} 选项` : '选项列表'}
        >
          {showSearch && (
            <input
              ref={searchInputRef}
              type="text"
              style={searchInputStyle}
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setHighlightIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="搜索选项"
            />
          )}

          {filteredOptions.length === 0 ? (
            <div style={notFoundStyle}>{notFoundContent}</div>
          ) : (
            filteredOptions.map((opt, index) => (
              <div
                key={opt.value}
                style={optionStyle(opt, index)}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Select;
