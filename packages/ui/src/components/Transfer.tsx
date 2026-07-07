'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { SearchFilterInput } from './SearchFilterInput';

// ── Types ───────────────────────────────────────────────────────────────────

export interface TransferItem {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface TransferProps {
  /** All available items */
  dataSource: TransferItem[];
  /** Keys of selected / target items */
  targetKeys: string[];
  /** Called when target keys change */
  onChange?: (targetKeys: string[], direction: 'left' | 'right', moveKeys: string[]) => void;
  /** Left / source panel title */
  leftTitle?: string;
  /** Right / target panel title */
  rightTitle?: string;
  /** Custom render for each item */
  render?: (item: TransferItem) => React.ReactNode;
  /** Whether to show search */
  showSearch?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Height of each list box */
  listHeight?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultRender = (item: TransferItem) => (
  <span className="m5-transfer-item-label">{item.label}</span>
);

// ── Component ───────────────────────────────────────────────────────────────

export const Transfer: React.FC<TransferProps> = ({
  dataSource,
  targetKeys,
  onChange,
  leftTitle = '待选择',
  rightTitle = '已选择',
  render = defaultRender,
  showSearch = false,
  searchPlaceholder = '搜索...',
  disabled = false,
  className = '',
  style,
  listHeight = 240,
}) => {
  const targetSet = useMemo(() => new Set(targetKeys), [targetKeys]);

  const leftItems = useMemo(
    () => dataSource.filter((item) => !targetSet.has(item.key)),
    [dataSource, targetSet],
  );
  const rightItems = useMemo(
    () => dataSource.filter((item) => targetSet.has(item.key)),
    [dataSource, targetSet],
  );

  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set());
  const [rightChecked, setRightChecked] = useState<Set<string>>(new Set());

  const filteredLeft = useMemo(
    () =>
      leftSearch
        ? leftItems.filter((i) => i.label.toLowerCase().includes(leftSearch.toLowerCase()))
        : leftItems,
    [leftItems, leftSearch],
  );
  const filteredRight = useMemo(
    () =>
      rightSearch
        ? rightItems.filter((i) => i.label.toLowerCase().includes(rightSearch.toLowerCase()))
        : rightItems,
    [rightItems, rightSearch],
  );

  const handleLeftCheck = useCallback((key: string, checked: boolean) => {
    setLeftChecked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const handleRightCheck = useCallback((key: string, checked: boolean) => {
    setRightChecked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const moveRight = useCallback(() => {
    const moveKeys = Array.from(leftChecked).filter((k) => !disabled);
    if (moveKeys.length === 0) return;
    onChange?.(
      [...targetKeys, ...moveKeys],
      'right',
      moveKeys,
    );
    setLeftChecked(new Set());
  }, [leftChecked, targetKeys, onChange, disabled]);

  const moveLeft = useCallback(() => {
    const moveKeys = Array.from(rightChecked).filter((k) => !disabled);
    if (moveKeys.length === 0) return;
    onChange?.(
      targetKeys.filter((k) => !rightChecked.has(k)),
      'left',
      moveKeys,
    );
    setRightChecked(new Set());
  }, [rightChecked, targetKeys, onChange, disabled]);

  const allLeftChecked = filteredLeft.length > 0 && filteredLeft.every((i) => leftChecked.has(i.key));
  const allRightChecked = filteredRight.length > 0 && filteredRight.every((i) => rightChecked.has(i.key));

  const toggleAllLeft = useCallback(() => {
    if (allLeftChecked) {
      setLeftChecked(new Set());
    } else {
      setLeftChecked(new Set(filteredLeft.filter((i) => !i.disabled).map((i) => i.key)));
    }
  }, [filteredLeft, allLeftChecked]);

  const toggleAllRight = useCallback(() => {
    if (allRightChecked) {
      setRightChecked(new Set());
    } else {
      setRightChecked(new Set(filteredRight.filter((i) => !i.disabled).map((i) => i.key)));
    }
  }, [filteredRight, allRightChecked]);

  const renderList = (
    items: TransferItem[],
    checked: Set<string>,
    onCheck: (key: string, checked: boolean) => void,
    searchValue: string,
    onSearch: (v: string) => void,
    title: string,
    allChecked: boolean,
    toggleAll: () => void,
  ) => (
    <div className="m5-transfer-panel">
      <div className="m5-transfer-panel-header">
        <span className="m5-transfer-panel-title">{title}</span>
        <span className="m5-transfer-panel-count">{items.length}</span>
      </div>
      {showSearch && (
        <div className="m5-transfer-panel-search">
          <SearchFilterInput
            value={searchValue}
            onChange={(value) => onSearch(value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
        </div>
      )}
      <div className="m5-transfer-panel-body" style={{ maxHeight: listHeight, overflowY: 'auto' }}>
        {filteredLeft.length === 0 && title === leftTitle ? (
          <div className="m5-transfer-empty">暂无数据</div>
        ) : filteredRight.length === 0 && title === rightTitle ? (
          <div className="m5-transfer-empty">暂无数据</div>
        ) : null}
        {items.map((item) => (
          <label
            key={item.key}
            className={`m5-transfer-item ${item.disabled || disabled ? 'm5-transfer-item-disabled' : ''}`}
          >
            <Checkbox
              checked={checked.has(item.key)}
              onChange={(checked) => onCheck(item.key, checked)}
              disabled={item.disabled || disabled}
            />
            <div className="m5-transfer-item-content">
              {render(item)}
              {item.description && (
                <span className="m5-transfer-item-desc">{item.description}</span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`m5-transfer ${className}`} style={style}>
      {renderList(
        filteredLeft,
        leftChecked,
        handleLeftCheck,
        leftSearch,
        setLeftSearch,
        leftTitle,
        allLeftChecked,
        toggleAllLeft,
      )}
      <div className="m5-transfer-actions">
        <Button
          onClick={moveRight}
          disabled={disabled || leftChecked.size === 0}
          variant="outline"
          size="sm"
          aria-label="移至右侧"
        >
          &gt;
        </Button>
        <Button
          onClick={moveLeft}
          disabled={disabled || rightChecked.size === 0}
          variant="outline"
          size="sm"
          aria-label="移至左侧"
        >
          &lt;
        </Button>
      </div>
      {renderList(
        filteredRight,
        rightChecked,
        handleRightCheck,
        rightSearch,
        setRightSearch,
        rightTitle,
        allRightChecked,
        toggleAllRight,
      )}
    </div>
  );
};

export default Transfer;
