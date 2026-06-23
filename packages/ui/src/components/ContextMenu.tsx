'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

// ==================== 类型定义 ====================

/** 菜单项分隔线 */
export interface ContextMenuSeparator {
  kind: 'separator';
}

/** 菜单项操作 */
export interface ContextMenuItem {
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
  /** 点击回调 */
  onSelect: () => void;
}

/** 菜单项类型 */
export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

/** ContextMenu 组件属性 */
export interface ContextMenuProps {
  /** 菜单项列表 */
  items: ContextMenuEntry[];
  /** 是否显示 */
  open: boolean;
  /** 菜单位置 x */
  x: number;
  /** 菜单位置 y */
  y: number;
  /** 关闭回调 */
  onClose: () => void;
  /** 自定义宽度 */
  width?: number;
}

// ==================== 样式常量 ====================

const MENU_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  minWidth: 180,
  maxWidth: 280,
  background: '#1e293b',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: 12,
  padding: '6px 0',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  backdropFilter: 'blur(8px)',
};

const ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  cursor: 'pointer',
  color: '#e2e8f0',
  fontSize: 14,
  lineHeight: '20px',
  transition: 'background 0.12s',
  userSelect: 'none',
};

const SEPARATOR_STYLE: React.CSSProperties = {
  height: 1,
  margin: '4px 12px',
  background: 'rgba(148, 163, 184, 0.18)',
};

const SHORTCUT_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginLeft: 24,
  fontFamily: 'monospace',
};

// ==================== useClickOutside ====================

function useClickOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };

    // 延迟绑定避免打开时立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', listener);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler, enabled]);
}

// ==================== ContextMenu 组件 ====================

/**
 * ContextMenu — 右键上下文菜单组件。
 *
 * 支持菜单项、分隔线、禁用状态、危险操作样式、快捷键提示。
 * 点击外部或按下 Escape 自动关闭。
 *
 * @example
 * <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, open: true }); }}>
 *   <ContextMenu
 *     open={menu.open}
 *     x={menu.x}
 *     y={menu.y}
 *     items={[
 *       { key: 'edit', label: '编辑', onSelect: () => edit() },
 *       { kind: 'separator' },
 *       { key: 'delete', label: '删除', danger: true, onSelect: () => remove() },
 *     ]}
 *     onClose={() => setMenu({ ...menu, open: false })}
 *   />
 * </div>
 */
export function ContextMenu({
  items,
  open,
  x,
  y,
  onClose,
  width = 200,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number }>({ x, y });

  // 计算菜单位置，避免溢出视口
  useEffect(() => {
    if (!open) return;

    const menuEl = menuRef.current;
    if (!menuEl) {
      setAdjustedPos({ x, y });
      return;
    }

    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > vw) {
      adjustedX = vw - rect.width - 8;
    }
    if (y + rect.height > vh) {
      adjustedY = vh - rect.height - 8;
    }
    if (adjustedX < 0) adjustedX = 8;
    if (adjustedY < 0) adjustedY = 8;

    setAdjustedPos({ x: adjustedX, y: adjustedY });
  }, [open, x, y]);

  // 点击外部关闭
  useClickOutside(menuRef, onClose, open);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 滚动时关闭
  useEffect(() => {
    if (!open) return;

    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        ...MENU_STYLE,
        left: adjustedPos.x,
        top: adjustedPos.y,
        width,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((entry) => {
        if ('kind' in entry && entry.kind === 'separator') {
          return <div key={`sep-${Math.random()}`} style={SEPARATOR_STYLE} />;
        }

        const item = entry as ContextMenuItem;
        const isDisabled = item.disabled ?? false;

        return (
          <div
            key={item.key}
            role="menuitem"
            aria-disabled={isDisabled}
            style={{
              ...ITEM_STYLE,
              color: item.danger ? '#fca5a5' : isDisabled ? '#475569' : '#e2e8f0',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
            onClick={() => {
              if (!isDisabled) {
                item.onSelect();
                onClose();
              }
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.icon && <span style={{ display: 'flex', fontSize: 16 }}>{item.icon}</span>}
              {item.label}
            </span>
            {item.shortcut && <span style={SHORTCUT_STYLE}>{item.shortcut}</span>}
          </div>
        );
      })}
    </div>
  );
}
