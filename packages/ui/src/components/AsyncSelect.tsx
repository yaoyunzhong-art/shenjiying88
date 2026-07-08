'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SelectOption } from './Select';

export interface AsyncSelectProps {
  /** 异步加载选项的函数，返回选项列表 */
  loadOptions: (searchText: string) => Promise<SelectOption[]>;
  /** 当前选中值（受控） */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 占位文本 */
  placeholder?: string;
  /** 搜索占位文本 */
  searchPlaceholder?: string;
  /** 加载中提示 */
  loadingText?: string;
  /** 空数据提示 */
  notFoundContent?: React.ReactNode;
  /** 最小宽度 */
  minWidth?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 表单 name */
  name?: string;
  /** 错误状态 */
  error?: boolean;
  /** 初始加载（打开时立即加载，不等待输入） */
  loadOnOpen?: boolean;
  /** aria-label */
  'aria-label'?: string;
}

/**
 * AsyncSelect — 异步搜索选择器组件。
 *
 * 支持远程搜索、防抖、加载状态、清除、键盘导航。
 * 适用于选项数量巨大、需要按需加载的场景。
 *
 * @example
 * <AsyncSelect
 *   loadOptions={async (query) => {
 *     const res = await fetch(`/api/users?q=${query}`);
 *     return res.json();
 *   }}
 *   onChange={setUserId}
 *   placeholder="搜索用户..."
 * />
 */
export function AsyncSelect({
  loadOptions,
  value,
  onChange,
  placeholder = '请选择',
  searchPlaceholder = '输入搜索...',
  loadingText = '加载中...',
  notFoundContent = '无匹配结果',
  minWidth = 160,
  disabled = false,
  allowClear = false,
  debounceMs = 300,
  className,
  style,
  name,
  error = false,
  loadOnOpen = true,
  'aria-label': ariaLabel,
}: AsyncSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  // 执行加载
  const doLoad = useCallback(
    async (query: string) => {
      // 取消进行中的请求
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const result = await loadOptions(query);
        if (!controller.signal.aborted) {
          setOptions(result);
          setHasLoaded(true);
          setHighlightIndex(0);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setOptions([]);
          setHasLoaded(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [loadOptions],
  );

  // 防抖搜索
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doLoad(text);
      }, debounceMs);
    },
    [doLoad, debounceMs],
  );

  // 打开下拉
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearchText('');
    if (loadOnOpen && !hasLoaded) {
      doLoad('');
    } else if (loadOnOpen) {
      setHighlightIndex(0);
    }
  }, [disabled, loadOnOpen, hasLoaded, doLoad]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchText('');
    setHighlightIndex(-1);
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  // 搜索框自动聚焦
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleSelect = useCallback(
    (val: string) => {
      onChange?.(val);
      handleClose();
    },
    [onChange, handleClose],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      handleClose();
    },
    [onChange, handleClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open && (e.key === 'Enter' || e.key === 'ArrowDown')) {
        e.preventDefault();
        handleOpen();
        return;
      }
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && options[highlightIndex]) {
            handleSelect(options[highlightIndex].value);
          }
          break;
      }
    },
    [open, options, highlightIndex, handleOpen, handleClose, handleSelect],
  );

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
    border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: disabled ? '#f5f5f5' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 32,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    opacity: disabled ? 0.6 : 1,
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
    maxHeight: 300,
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
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <div
        style={selectorStyle}
        onClick={handleOpen}
        role="button"
        aria-disabled={disabled}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption ? '#333' : '#bfbfbf',
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {allowClear && value && (
            <span
              style={{ cursor: 'pointer', color: '#999', fontSize: 14, lineHeight: 1 }}
              onClick={handleClear}
              role="button"
              aria-label="清除选择"
            >
              ✕
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: '#999',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </span>
      </div>

      {open && (
        <div style={dropdownStyle} role="listbox">
          <input
            ref={searchInputRef}
            type="text"
            style={searchInputStyle}
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="搜索选项"
          />

          {loading ? (
            <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center', fontSize: 14 }}>
              {loadingText}
            </div>
          ) : options.length === 0 && hasLoaded ? (
            <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center', fontSize: 14 }}>
              {notFoundContent}
            </div>
          ) : (
            options.map((opt, index) => (
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

export default AsyncSelect;
