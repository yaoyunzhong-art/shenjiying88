'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';

/* ---------- types ---------- */

export interface StoreItem {
  /** 门店唯一标识 */
  id: string;
  /** 门店名称 */
  label: string;
  /** 所属城市 */
  city: string;
  /** 所属区域（可选） */
  region?: string;
  /** 门店地址（搜索辅助） */
  address?: string;
  /** 是否禁用选择 */
  disabled?: boolean;
}

export interface StoreGroup {
  /** 分组标识 */
  key: string;
  /** 分组显示名 */
  label: string;
  /** 组内门店 */
  stores: StoreItem[];
}

export type StoreSelectorMode = 'single' | 'multiple';

export interface StoreSelectorProps {
  /** 门店列表（平铺结构） */
  stores: StoreItem[];
  /** 按城市/区域分组（默认按 city 分组，null=不分组） */
  groupBy?: 'city' | 'region' | null;
  /** 分组自定义标签函数 */
  groupLabel?: (key: string, stores: StoreItem[]) => string;
  /** 当前选中值（受控） */
  value?: string | string[];
  /** 值变化回调 */
  onChange?: (value: string | string[]) => void;
  /** 选择模式 */
  mode?: StoreSelectorMode;
  /** 占位文本 */
  placeholder?: string;
  /** 搜索占位文本 */
  searchPlaceholder?: string;
  /** 空数据提示 */
  notFoundContent?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示全选（多选模式） */
  showSelectAll?: boolean;
  /** 全选文本 */
  selectAllText?: string;
  /** 最大显示标签数量（多选模式） */
  maxTagCount?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最大高度（下拉面板） */
  maxDropdownHeight?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 下拉类名 */
  dropdownClassName?: string;
  /** 表单 name */
  name?: string;
}

/* ---------- 辅助函数 ---------- */

export function groupStoresByKey(
  stores: StoreItem[],
  key: 'city' | 'region',
): StoreGroup[] {
  const groups = new Map<string, StoreItem[]>();

  for (const store of stores) {
    const groupKey = key === 'city' ? store.city : store.region ?? store.city;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(store);
  }

  return Array.from(groups.entries())
    .map(([groupKey, items]) => ({
      key: groupKey,
      label: groupKey,
      stores: items,
    }))
    .sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'));
}

function getDefaultGroupLabel(key: string, _stores: StoreItem[]): string {
  return key;
}

/* ---------- 组件 ---------- */

export function StoreSelector({
  stores,
  groupBy = 'city',
  groupLabel,
  value,
  onChange,
  mode = 'single',
  placeholder = '请选择门店',
  searchPlaceholder = '搜索门店...',
  notFoundContent = '无匹配门店',
  disabled = false,
  showSelectAll = true,
  selectAllText = '全选',
  maxTagCount = 3,
  minWidth = 220,
  maxDropdownHeight = 320,
  className,
  style,
  dropdownClassName,
  name,
}: StoreSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const instanceId = useId();

  const isMultiple = mode === 'multiple';
  const selectedValues: string[] = useMemo(
    () => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    },
    [value],
  );

  const grouped = useMemo(
    () => (groupBy ? groupStoresByKey(stores, groupBy) : []),
    [stores, groupBy],
  );

  const getGroupLabelFn = groupLabel ?? getDefaultGroupLabel;

  // 搜索过滤
  const filteredItems = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return null; // 无搜索时使用原始分组

    // 展平后过滤
    const allItems = stores.filter((s) => {
      return (
        s.label.toLowerCase().includes(search) ||
        s.city.toLowerCase().includes(search) ||
        (s.region ?? '').toLowerCase().includes(search) ||
        (s.address ?? '').toLowerCase().includes(search)
      );
    });

    // 过滤后不入组错误，再分组
    if (groupBy) {
      const filteredMap = new Map<string, StoreItem[]>();
      for (const item of allItems) {
        const gk = groupBy === 'city' ? item.city : item.region ?? item.city;
        if (!filteredMap.has(gk)) filteredMap.set(gk, []);
        filteredMap.get(gk)!.push(item);
      }
      return Array.from(filteredMap.entries())
        .map(([k, items]) => ({
          key: k,
          label: getGroupLabelFn(k, items),
          stores: items,
        }))
        .sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'));
    }
    return null;
  }, [stores, searchText, groupBy, getGroupLabelFn]);

  // 搜索为空时显示全量分组
  const displayGroups: StoreGroup[] = filteredItems ?? (groupBy ? grouped : []);
  const flatStores: StoreItem[] = filteredItems ? displayGroups.flatMap((g) => g.stores) : (groupBy ? stores : stores);

  // 选中状态
  const isSelected = useCallback(
    (id: string) => selectedValues.includes(id),
    [selectedValues],
  );

  const isAllSelected = useMemo(
    () => {
      if (!isMultiple || stores.length === 0) return false;
      const selectable = stores.filter((s) => !s.disabled);
      return selectable.length > 0 && selectable.every((s) => selectedValues.includes(s.id));
    },
    [isMultiple, stores, selectedValues],
  );

  const handleToggleStore = useCallback(
    (id: string) => {
      const store = stores.find((s) => s.id === id);
      if (!store || store.disabled || disabled) return;

      if (isMultiple) {
        const current = [...selectedValues];
        const idx = current.indexOf(id);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else {
          current.push(id);
        }
        onChange?.(current);
      } else {
        // 单选：点击已选则取消选择
        onChange?.(selectedValues[0] === id ? '' : id);
      }
    },
    [stores, disabled, isMultiple, selectedValues, onChange],
  );

  const handleSelectAll = useCallback(() => {
    if (!isMultiple || disabled) return;
    const selectable = stores.filter((s) => !s.disabled);
    if (isAllSelected) {
      onChange?.([]);
    } else {
      onChange?.(selectable.map((s) => s.id));
    }
  }, [isMultiple, stores, disabled, isAllSelected, onChange]);

  const handleClearAll = useCallback(() => {
    if (!isMultiple || disabled) return;
    onChange?.([]);
  }, [isMultiple, disabled, onChange]);

  // 显示已选的标签文本（多选模式）
  const selectedTags = useMemo(() => {
    if (!isMultiple || selectedValues.length === 0) return null;
    const labels = selectedValues
      .map((id) => stores.find((s) => s.id === id)?.label)
      .filter(Boolean) as string[];

    if (labels.length <= maxTagCount) {
      return labels.join(', ');
    }

    return `${labels.slice(0, maxTagCount).join(', ')} +${labels.length - maxTagCount}`;
  }, [isMultiple, selectedValues, stores, maxTagCount]);

  // 当前选中显示文本（单选模式）
  const selectedLabel = useMemo(() => {
    if (selectedValues.length === 0) return null;
    const s = stores.find((st) => st.id === selectedValues[0]);
    return s?.label ?? null;
  }, [selectedValues, stores]);

  // 关闭下拉
  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchText('');
  }, []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, handleClose]);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) handleClose();
      return !prev;
    });
  }, [disabled, handleClose]);

  // Escape 关闭
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleClose, handleToggle],
  );

  // 渲染单门店项
  const renderStoreItem = (store: StoreItem) => {
    const sel = isSelected(store.id);
    return (
      <div
        key={store.id}
        data-testid={`store-option-${store.id}`}
        data-store-id={store.id}
        data-selected={sel ? 'true' : 'false'}
        role="option"
        aria-selected={sel}
        aria-disabled={store.disabled || undefined}
        onClick={() => handleToggleStore(store.id)}
        style={{
          paddingTop: 8,
          paddingRight: 12,
          paddingBottom: 8,
          paddingLeft: groupBy ? 24 : 12,
          cursor: store.disabled ? 'not-allowed' : 'pointer',
          backgroundColor: sel ? '#e6f7ff' : 'transparent',
          color: store.disabled ? '#ccc' : '#333',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background-color 0.15s',
        }}
      >
        {isMultiple && (
          <span
            data-testid={`store-checkbox-${store.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: 3,
              border: sel ? 'none' : '1px solid #d9d9d9',
              backgroundColor: sel ? '#1677ff' : 'transparent',
              fontSize: 12,
              color: '#fff',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {sel ? '✓' : ''}
          </span>
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {store.label}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth,
        ...style,
      }}
      data-instance={instanceId}
      data-testid="store-selector"
      data-mode={mode}
      role="combobox"
      aria-expanded={open}
      aria-label="门店选择器"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form integration */}
      {name && <input type="hidden" name={name} value={JSON.stringify(selectedValues)} />}

      {/* Selector trigger */}
      <div
        data-testid="store-selector-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          border: `1px solid ${open ? '#1677ff' : '#d9d9d9'}`,
          borderRadius: 6,
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: 32,
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={handleToggle}
        role="button"
        aria-disabled={disabled}
      >
        {isMultiple ? (
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: selectedTags ? '#333' : '#bfbfbf',
              fontSize: 14,
            }}
          >
            {selectedTags || placeholder}
          </span>
        ) : (
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: selectedLabel ? '#333' : '#bfbfbf',
              fontSize: 14,
            }}
          >
            {selectedLabel || placeholder}
          </span>
        )}
        <span style={{ marginLeft: 8, fontSize: 10, color: '#999', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          ▼
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={dropdownClassName}
          data-testid="store-selector-dropdown"
          style={{
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
            maxHeight: maxDropdownHeight,
            overflow: 'auto',
          }}
        >
          {/* Search input */}
          <input
            ref={searchInputRef}
            data-testid="store-selector-search"
            type="text"
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              outline: 'none',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />

          {/* 全选按钮（多选模式） */}
          {isMultiple && showSelectAll && !searchText && (
            <div
              data-testid="store-selector-selectall"
              onClick={handleSelectAll}
              style={{
                padding: '8px 12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: '#fafafa',
                fontSize: 14,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: isAllSelected ? 'none' : '1px solid #d9d9d9',
                  backgroundColor: isAllSelected ? '#1677ff' : 'transparent',
                  fontSize: 12,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {isAllSelected ? '✓' : ''}
              </span>
              <span style={{ flex: 1 }}>{selectAllText}</span>
              {isAllSelected && (
                <span
                  data-testid="store-selector-clearall"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  style={{ color: '#999', cursor: 'pointer', fontSize: 12 }}
                >
                  清除
                </span>
              )}
            </div>
          )}

          {/* 选项列表 — 分组模式 */}
          {groupBy && displayGroups.length > 0 && displayGroups.map((group) => {
            const groupSelectedCount = group.stores.filter((s) => isSelected(s.id)).length;
            return (
              <div key={group.key} data-testid={`store-group-${group.key}`}>
                <div
                  data-testid={`store-group-header-${group.key}`}
                  style={{
                    padding: '6px 12px',
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#888',
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{getGroupLabelFn(group.key, group.stores)}</span>
                  {isMultiple && groupSelectedCount > 0 && (
                    <span style={{ fontSize: 12, color: '#1677ff' }}>
                      {groupSelectedCount}/{group.stores.length}
                    </span>
                  )}
                </div>
                {group.stores.map(renderStoreItem)}
              </div>
            );
          })}

          {/* 选项列表 — 不分组模式 */}
          {!groupBy && flatStores.length > 0 && flatStores.map(renderStoreItem)}

          {/* 空数据 */}
          {((groupBy && displayGroups.length === 0) || (!groupBy && flatStores.length === 0)) && (
            <div
              data-testid="store-selector-empty"
              style={{
                padding: '16px 12px',
                color: '#999',
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {notFoundContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

StoreSelector.displayName = 'StoreSelector';
