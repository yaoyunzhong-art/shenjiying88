'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** 当前选中的值数组（受控） */
  value?: string[];
  /** 值变化回调 */
  onChange?: (values: string[]) => void;
  /** 选项列表 */
  options: MultiSelectOption[];
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可搜索 */
  showSearch?: boolean;
  /** 搜索占位文本 */
  searchPlaceholder?: string;
  /** 空数据提示 */
  notFoundContent?: React.ReactNode;
  /** 全选文本 */
  selectAllText?: string;
  /** 清除全部文本 */
  clearAllText?: string;
  /** 已选显示最大数量（超出显示 +N） */
  maxTagCount?: number;
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
}

/**
 * MultiSelect — 多选下拉选择器组件。
 *
 * 提供多选下拉选择能力，支持搜索过滤、全选、已选标签展示、超出折叠。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <MultiSelect
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *     { value: 'cherry', label: '樱桃' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  showSearch = false,
  searchPlaceholder = '搜索...',
  notFoundContent = '无匹配结果',
  selectAllText = '全选',
  clearAllText = '清除',
  maxTagCount,
  minWidth = 220,
  className,
  style,
  dropdownClassName,
  name,
  'aria-label': ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const valueSet = useMemo(() => new Set(value), [value]);

  const selectedOptions = useMemo(
    () => options.filter((o) => valueSet.has(o.value)),
    [options, valueSet],
  );

  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchText.trim()) return options;
    const lower = searchText.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(lower) || o.value.toLowerCase().includes(lower),
    );
  }, [options, searchText, showSearch]);

  const allFilteredSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every((o) => o.disabled || valueSet.has(o.value));
  }, [filteredOptions, valueSet]);

  const visibleTags = useMemo(() => {
    if (maxTagCount === undefined || selectedOptions.length <= maxTagCount) {
      return selectedOptions;
    }
    return selectedOptions.slice(0, maxTagCount);
  }, [selectedOptions, maxTagCount]);

  const remainingCount = useMemo(() => {
    if (maxTagCount === undefined || selectedOptions.length <= maxTagCount) return 0;
    return selectedOptions.length - maxTagCount;
  }, [selectedOptions.length, maxTagCount]);

  // 点击外部关闭
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setSearchText('');
    }
  }, []);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(0);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setSearchText('');
        return;
      }

      if (!open) return;

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
          if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
            handleToggleOption(filteredOptions[highlightIndex].value);
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

  useEffect(() => {
    if (open && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) setHighlightIndex(-1);
  }, [open]);

  const handleToggleOption = useCallback(
    (val: string) => {
      const opt = options.find((o) => o.value === val);
      if (opt?.disabled) return;

      const newValues = valueSet.has(val)
        ? value.filter((v) => v !== val)
        : [...value, val];
      onChange?.(newValues);
    },
    [onChange, options, value, valueSet],
  );

  const handleSelectAll = useCallback(() => {
    const selectableValues = filteredOptions
      .filter((o) => !o.disabled)
      .map((o) => o.value);
    // 取并集
    const newValues = [...new Set([...value, ...selectableValues])];
    onChange?.(newValues);
  }, [filteredOptions, value, onChange]);

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  const handleRemoveTag = useCallback(
    (val: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(value.filter((v) => v !== val));
    },
    [onChange, value],
  );

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setSearchText('');
  }, [disabled]);

  // ====== Styles ======
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
    padding: '4px 8px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: disabled ? '#f5f5f5' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 32,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    opacity: disabled ? 0.6 : 1,
    flexWrap: 'wrap',
    gap: 4,
  };

  const placeholderStyle: React.CSSProperties = {
    color: '#bfbfbf',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: 24,
    display: 'flex',
    alignItems: 'center',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: 4,
    padding: '0 6px',
    fontSize: 12,
    color: '#1890ff',
    gap: 4,
    height: 22,
    lineHeight: '22px',
    flexShrink: 0,
  };

  const tagRemoveStyle: React.CSSProperties = {
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
    opacity: 0.7,
    padding: '0 1px',
  };

  const countBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: '0 6px',
    fontSize: 12,
    color: '#666',
    height: 22,
    flexShrink: 0,
  };

  const arrowStyle: React.CSSProperties = {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#999',
    transition: 'transform 0.2s',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0,
    alignSelf: 'center',
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
    maxHeight: 280,
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

  const actionBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 12px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 13,
    gap: 8,
  };

  const actionLinkStyle: React.CSSProperties = {
    color: '#1890ff',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 13,
  };

  const optionStyle = (opt: MultiSelectOption, index: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    cursor: opt.disabled ? 'not-allowed' : 'pointer',
    backgroundColor:
      index === highlightIndex ? '#f5f5f5' : 'transparent',
    color: opt.disabled ? '#ccc' : '#333',
    fontSize: 14,
    transition: 'background-color 0.15s',
  });

  const checkboxStyle = (checked: boolean): React.CSSProperties => ({
    width: 16,
    height: 16,
    borderRadius: 3,
    border: checked ? '2px solid #1890ff' : '2px solid #d9d9d9',
    backgroundColor: checked ? '#1890ff' : '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
  });

  const checkmarkStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 1,
  };

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
      tabIndex={disabled ? -1 : 0}
    >
      {/* Hidden inputs for form integration (CSV encoded values) */}
      <input type="hidden" name={name} value={value.join(',')} style={hiddenInputStyle} />

      {/* Selector trigger */}
      <div
        style={selectorStyle}
        onClick={handleToggle}
        role="button"
        aria-disabled={disabled}
      >
        {selectedOptions.length === 0 ? (
          <span style={placeholderStyle}>{placeholder}</span>
        ) : (
          <>
            {visibleTags.map((opt) => (
              <span key={opt.value} style={tagStyle}>
                {opt.label}
                <span
                  style={tagRemoveStyle}
                  onClick={(e) => handleRemoveTag(opt.value, e)}
                  role="button"
                  aria-label={`移除 ${opt.label}`}
                >
                  ✕
                </span>
              </span>
            ))}
            {remainingCount > 0 && (
              <span style={countBadgeStyle}>+{remainingCount}</span>
            )}
            <span style={{ flex: 1, minWidth: 4 }} />
          </>
        )}
        <span style={arrowStyle}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={dropdownClassName}
          style={dropdownStyle}
          role="listbox"
          aria-multiselectable="true"
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

          {/* 全选/清除操作栏 */}
          <div style={actionBarStyle}>
            <button
              type="button"
              style={actionLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAll();
              }}
              aria-label={selectAllText}
            >
              {selectAllText}
            </button>
            <button
              type="button"
              style={actionLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              aria-label={clearAllText}
            >
              {clearAllText}
            </button>
          </div>

          {filteredOptions.length === 0 ? (
            <div style={notFoundStyle}>{notFoundContent}</div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = valueSet.has(opt.value);
              return (
                <div
                  key={opt.value}
                  style={optionStyle(opt, index)}
                  onClick={() => handleToggleOption(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                >
                  <span style={checkboxStyle(isSelected)}>
                    {isSelected && <span style={checkmarkStyle}>✓</span>}
                  </span>
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
