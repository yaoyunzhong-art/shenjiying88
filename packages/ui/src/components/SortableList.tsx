'use client';

import React, { useState, useCallback, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SortableItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SortableListProps {
  /** Items in current order */
  items: SortableItem[];
  /** Called when order changes */
  onReorder: (items: SortableItem[]) => void;
  /** Optional custom renderer for each item */
  renderItem?: (item: SortableItem, index: number) => React.ReactNode;
  /** Disable drag sorting entirely */
  disabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Accessible label for the list */
  ariaLabel?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * A keyboard- and mouse-accessible sortable list.
 * Users can drag items by their handle, or use Arrow Up / Arrow Down
 * when an item is focused.
 */
export const SortableList: React.FC<SortableListProps> = ({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className = '',
  ariaLabel = '排序列表',
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ── Drag handlers ───────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (disabled) return;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (disabled || dragIndex === null) return;
      e.dataTransfer.dropEffect = 'move';
      setOverIndex(index);
    },
    [disabled, dragIndex],
  );

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (disabled || dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }

      const updated = [...items];
      const moved = updated.splice(dragIndex, 1)[0]!;
      updated.splice(dropIndex, 0, moved);
      onReorder(updated);
      setDragIndex(null);
      setOverIndex(null);
    },
    [disabled, dragIndex, items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  // ── Keyboard handlers ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;
      if (items[index]?.disabled) return;

      if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        const updated = [...items];
        const a = updated[index - 1]!;
        const b = updated[index]!;
        updated[index - 1] = b;
        updated[index] = a;
        onReorder(updated);
        // Focus the moved element after render
        requestAnimationFrame(() => {
          const li = listRef.current?.children[index - 1] as HTMLElement | undefined;
          li?.focus();
        });
      } else if (e.key === 'ArrowDown' && index < items.length - 1) {
        e.preventDefault();
        const updated = [...items];
        const a = updated[index]!;
        const b = updated[index + 1]!;
        updated[index] = b;
        updated[index + 1] = a;
        onReorder(updated);
        requestAnimationFrame(() => {
          const li = listRef.current?.children[index + 1] as HTMLElement | undefined;
          li?.focus();
        });
      }
    },
    [disabled, items, onReorder],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ul
      ref={listRef}
      className={`m5-sortable-list ${className}`}
      role="list"
      aria-label={ariaLabel}
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <li
            key={item.id}
            role="listitem"
            tabIndex={disabled || item.disabled ? -1 : 0}
            aria-label={`${item.label}, 位置 ${index + 1} / ${items.length}`}
            aria-disabled={disabled || item.disabled}
            draggable={!disabled && !item.disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              background: isDragging ? '#e6f4ff' : isOver ? '#f0f5ff' : '#fff',
              opacity: disabled || item.disabled ? 0.5 : 1,
              cursor: disabled || item.disabled ? 'not-allowed' : 'grab',
              transition: 'background 0.2s, box-shadow 0.2s',
              outline: 'none',
              userSelect: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px #1677ff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Drag Handle */}
            {!disabled && !item.disabled && (
              <span
                aria-hidden="true"
                style={{
                  cursor: 'grab',
                  fontSize: '16px',
                  color: '#999',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1,
                }}
              >
                ⠿
              </span>
            )}

            {/* Item Content */}
            {renderItem ? (
              renderItem(item, index)
            ) : (
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px', color: '#333' }}>
                  {item.label}
                </div>
                {item.description && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {item.description}
                  </div>
                )}
              </div>
            )}

            {/* Position badge */}
            <span
              style={{
                fontSize: '11px',
                color: '#bbb',
                minWidth: '20px',
                textAlign: 'right',
              }}
            >
              #{index + 1}
            </span>
          </li>
        );
      })}

      {items.length === 0 && (
        <li
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#bbb',
            fontSize: '14px',
            border: '1px dashed #d9d9d9',
            borderRadius: '6px',
          }}
        >
          暂无项目
        </li>
      )}
    </ul>
  );
};
