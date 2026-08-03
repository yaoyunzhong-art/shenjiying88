'use client';

/**
 * 🎨 useRowSelection — 表格行选择 hook
 * 用法:
 *   const selection = useRowSelection<ProductItem>(items, (item) => item.id)
 *   // selection.selectedIds: Set<string>
 *   // selection.toggle: (id) => void
 *   // selection.toggleAll: () => void
 *   // selection.isAllSelected: boolean
 *   // selection.clear: () => void
 */
import { useState, useCallback, useMemo } from 'react';

export interface RowSelectionState<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectedCount: number;
  isAllSelected: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  selectAll: () => void;
  clear: () => void;
}

export function useRowSelection<T>(
  items: T[],
  getId: (item: T) => string,
): RowSelectionState<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map(getId));
    });
  }, [items, getId]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getId)));
  }, [items, getId]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(getId(item))),
    [items, selectedIds, getId],
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected: items.length > 0 && selectedIds.size === items.length,
    toggle,
    toggleAll,
    selectAll,
    clear,
  };
}
