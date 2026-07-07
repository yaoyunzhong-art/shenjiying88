'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

// ==================== 类型定义 ====================

/** 下拉菜单项分隔线 */
export interface DropdownMenuSeparator {
  kind: 'separator';
}

/** 下拉菜单项操作 */
export interface DropdownMenuItem {
  kind?: 'item';
  /** 唯一标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 快捷键提示 */
  shortcut?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 危险操作（红色高亮） */
  danger?: boolean;
  /** 图标（可选 ReactNode） */
  icon?: React.ReactNode;
  /** 子菜单项（实现嵌套） */
  children?: DropdownMenuEntry[];
  /** 点击回调 */
  onSelect?: () => void;
}

/** 下拉菜单项类型 */
export type DropdownMenuEntry = DropdownMenuItem | DropdownMenuSeparator;

/** DropdownMenu 组件属性 */
export interface DropdownMenuProps {
  /** 触发器内容（按钮/链接等） */
  trigger: React.ReactNode;
  /** 菜单项列表 */
  items: DropdownMenuEntry[];
  /** 菜单对齐方向 */
  align?: 'start' | 'center' | 'end';
  /** 菜单展开方向 */
  side?: 'bottom' | 'top';
  /** 关闭回调 */
  onOpenChange?: (open: boolean) => void;
  /** 是否默认打开 */
  defaultOpen?: boolean;
  /** 自定义宽度 */
  width?: number;
  /** 额外类名 */
  className?: string;
  /** 禁用整个下拉菜单 */
  disabled?: boolean;
}

// ==================== 样式常量 ====================

const TRIGGER_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
};

const MENU_WRAPPER: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
};

const MENU_PANEL: React.CSSProperties = {
  position: 'absolute',
  zIndex: 9999,
  minWidth: 180,
  maxWidth: 280,
  background: '#1e293b',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: 12,
  padding: '6px 0',
  boxShadow: '0 10px 38px -10px rgba(0,0,0,0.35), 0 6px 16px -6px rgba(0,0,0,0.2)',
  animation: 'dropdownFadeIn 0.15s ease-out',
};

const MENU_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  fontSize: 14,
  lineHeight: '20px',
  cursor: 'pointer',
  color: '#e2e8f0',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  boxSizing: 'border-box',
  transition: 'background 0.1s',
};

const SEPARATOR_STYLE: React.CSSProperties = {
  height: 1,
  background: 'rgba(148, 163, 184, 0.2)',
  margin: '4px 8px',
};

const SHORTCUT_STYLE: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 12,
  color: '#94a3b8',
  letterSpacing: '0.5px',
};

const SUBMENU_ARROW: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 10,
  color: '#94a3b8',
};

// ==================== 子菜单组件 ====================

interface SubMenuProps {
  item: DropdownMenuItem;
  depth: number;
  onItemSelect: (key: string) => void;
  onCloseAll: () => void;
}

const SubMenu: React.FC<SubMenuProps> = ({ item, depth, onItemSelect, onCloseAll }) => {
  const [subOpen, setSubOpen] = useState(false);
  const subRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => setSubOpen(true), 120);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => setSubOpen(false), 200);
  }, []);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={subRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={subOpen}
        style={{
          ...MENU_ITEM_STYLE,
          ...(item.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
          ...(item.danger ? { color: '#ef4444' } : {}),
        }}
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled) return;
          if (!subOpen) {
            setSubOpen(true);
          }
        }}
      >
        {item.icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>}
        <span>{item.label}</span>
        {item.shortcut && <span style={SHORTCUT_STYLE}>{item.shortcut}</span>}
        {item.children && <span style={SUBMENU_ARROW}>▶</span>}
      </button>
      {subOpen && item.children && (
        <div
          style={{
            ...MENU_PANEL,
            top: depth > 0 ? 0 : -6,
            left: '100%',
            marginLeft: 4,
          }}
          onMouseEnter={() => {
            if (leaveTimerRef.current) {
              clearTimeout(leaveTimerRef.current);
              leaveTimerRef.current = null;
            }
          }}
        >
          {item.children.map((child, idx) => renderEntry(child, idx, depth + 1, onItemSelect, onCloseAll))}
        </div>
      )}
    </div>
  );
};

// ==================== 渲染单个条目 ====================

function renderEntry(
  entry: DropdownMenuEntry,
  index: number,
  depth: number,
  onItemSelect: (key: string) => void,
  onCloseAll: () => void,
): React.ReactNode {
  if (entry.kind === 'separator') {
    return <div key={`sep-${index}`} style={SEPARATOR_STYLE} role="separator" />;
  }

  const item = entry as DropdownMenuItem;

  if (item.children && item.children.length > 0) {
    return (
      <SubMenu
        key={item.key}
        item={item}
        depth={depth}
        onItemSelect={onItemSelect}
        onCloseAll={onCloseAll}
      />
    );
  }

  return (
    <button
      key={item.key}
      role="menuitem"
      style={{
        ...MENU_ITEM_STYLE,
        ...(item.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
        ...(item.danger ? { color: '#ef4444' } : {}),
      }}
      disabled={item.disabled}
      onClick={() => {
        if (item.disabled) return;
        onItemSelect(item.key);
        onCloseAll();
        item.onSelect?.();
      }}
    >
      {item.icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>}
      <span>{item.label}</span>
      {item.shortcut && <span style={SHORTCUT_STYLE}>{item.shortcut}</span>}
    </button>
  );
}

// ==================== 主组件 ====================

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  onOpenChange,
  defaultOpen = false,
  width,
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen(prev => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [disabled, onOpenChange]);

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  // 点击菜单外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  // 对齐样式
  const alignStyles: React.CSSProperties = {};
  if (align === 'start') alignStyles.left = 0;
  else if (align === 'end') alignStyles.right = 0;
  else if (align === 'center') alignStyles.left = '50%';

  const sideStyles: React.CSSProperties = {};
  if (side === 'bottom') {
    sideStyles.top = '100%';
    sideStyles.marginTop = 6;
  } else {
    sideStyles.bottom = '100%';
    sideStyles.marginBottom = 6;
  }

  return (
    <div ref={containerRef} style={MENU_WRAPPER} className={className}>
      <button
        type="button"
        style={{
          ...TRIGGER_BASE,
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
      >
        {trigger}
        <span
          style={{
            fontSize: 10,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            ...MENU_PANEL,
            ...alignStyles,
            ...sideStyles,
            ...(align === 'center' ? { transform: 'translateX(-50%)' } : {}),
            ...(width ? { width, minWidth: width, maxWidth: width } : {}),
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
              暂无菜单项
            </div>
          ) : (
            items.map((entry, idx) => renderEntry(entry, idx, 0, () => {}, close))
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
