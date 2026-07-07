'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface TreeSelectNode {
  value: string;
  label: string;
  children?: TreeSelectNode[];
  disabled?: boolean;
}

export interface TreeSelectProps {
  /** 当前选中值（受控） */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 树节点数据 */
  treeData: TreeSelectNode[];
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 空数据提示 */
  notFoundContent?: React.ReactNode;
  /** 最小宽度 */
  minWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 下拉菜单类名 */
  dropdownClassName?: string;
  /** 表单 name */
  name?: string;
  /** aria-label */
  'aria-label'?: string;
}

function findLabel(treeData: TreeSelectNode[], value: string): string {
  for (const node of treeData) {
    if (node.value === value) return node.label;
    if (node.children) {
      const found = findLabel(node.children, value);
      if (found) return found;
    }
  }
  return '';
}

function flattenTree(treeData: TreeSelectNode[], depth = 0): { node: TreeSelectNode; depth: number }[] {
  const result: { node: TreeSelectNode; depth: number }[] = [];
  for (const node of treeData) {
    result.push({ node, depth });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export function TreeSelect({
  value,
  onChange,
  treeData,
  placeholder = '请选择',
  disabled = false,
  allowClear = false,
  notFoundContent = '暂无数据',
  minWidth,
  className,
  style,
  dropdownClassName,
  name,
  'aria-label': ariaLabel,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = value ? findLabel(treeData, value) : '';

  const flatItems = flattenTree(treeData);
  const hasData = flatItems.length > 0;

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (nodeValue: string) => {
      onChange?.(nodeValue);
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    },
    [onChange],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        minWidth: minWidth ?? 160,
        ...style,
      }}
    >
      {/* 隐藏 input 用于表单 */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {/* 触发器按钮 */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="tree"
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 12px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          background: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 14,
          color: selectedLabel ? '#1a1a1a' : '#bbb',
          textAlign: 'left',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <span style={{ marginLeft: 8, flexShrink: 0 }}>
          {allowClear && value ? (
            <span
              role="button"
              aria-label="清除选择"
              onClick={handleClear}
              style={{ cursor: 'pointer', marginRight: 4, color: '#999' }}
            >
              ✕
            </span>
          ) : null}
          ▼
        </span>
      </button>

      {/* 下拉树 */}
      {open && (
        <div
          ref={dropdownRef}
          className={dropdownClassName}
          role="tree"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            background: '#fff',
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 1050,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {!hasData ? (
            <div style={{ padding: '12px 16px', color: '#999', fontSize: 14 }}>
              {notFoundContent}
            </div>
          ) : (
            flatItems.map(({ node, depth }) => (
              <div
                key={node.value}
                role="treeitem"
                aria-selected={value === node.value}
                aria-disabled={node.disabled ?? false}
                onClick={() => {
                  if (!node.disabled) handleSelect(node.value);
                }}
                style={{
                  padding: '6px 12px',
                  paddingLeft: 12 + depth * 20,
                  cursor: node.disabled ? 'not-allowed' : 'pointer',
                  background: value === node.value ? '#e6f4ff' : 'transparent',
                  color: node.disabled ? '#bbb' : '#1a1a1a',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  if (!node.disabled && value !== node.value) {
                    (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== node.value) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {node.children ? '▸' : '  '}
                <span>{node.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
