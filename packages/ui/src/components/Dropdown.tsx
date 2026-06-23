'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  /** 触发器内容 */
  trigger: React.ReactNode;
  /** 下拉菜单项 */
  items: DropdownItem[];
  /** 菜单对齐方向 */
  align?: 'left' | 'right';
  /** 触发方式 */
  triggerMode?: 'click' | 'hover';
  /** 最小宽度 */
  minWidth?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式 */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Dropdown — 下拉菜单组件。
 *
 * 提供操作菜单能力，支持分隔线、危险操作样式和禁用状态。
 * 自动处理点击外部关闭和键盘 Escape 关闭。
 *
 * @example
 * <Dropdown
 *   trigger={<button>操作</button>}
 *   items={[
 *     { key: 'edit', label: '编辑', onClick: () => {} },
 *     { key: 'delete', label: '删除', danger: true, onClick: () => {} },
 *   ]}
 * />
 */
export function Dropdown({
  trigger,
  items,
  align = 'left',
  triggerMode = 'click',
  minWidth = 160,
  disabled = false,
  className,
  style,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  const handleTriggerClick = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const handleTriggerMouseEnter = useCallback(() => {
    if (disabled || triggerMode !== 'hover') return;
    setOpen(true);
  }, [disabled, triggerMode]);

  const handleContainerMouseLeave = useCallback(() => {
    if (triggerMode !== 'hover') return;
    setOpen(false);
  }, [triggerMode]);

  const handleItemClick = useCallback(
    (item: DropdownItem) => {
      if (item.disabled) return;
      item.onClick?.();
      close();
    },
    [close]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* 触发器 */}
      <div
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerMouseEnter}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTriggerClick();
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {trigger}
      </div>

      {/* 下拉菜单 */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align === 'right' ? 'right' : 'left']: 0,
            minWidth,
            zIndex: 1001,
            borderRadius: 12,
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            padding: '6px 0',
            animation: 'dropdown-slide-in 0.12s ease-out',
          }}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={item.key || `divider-${index}`}
                  style={{
                    height: 1,
                    margin: '4px 8px',
                    background: 'rgba(148, 163, 184, 0.12)',
                  }}
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: 'transparent',
                  color: item.danger
                    ? '#fca5a5'
                    : item.disabled
                      ? '#64748b'
                      : '#e2e8f0',
                  fontSize: 13,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    (e.target as HTMLButtonElement).style.background =
                      'rgba(148, 163, 184, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background =
                    'transparent';
                }}
              >
                {item.icon ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdown-slide-in {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
