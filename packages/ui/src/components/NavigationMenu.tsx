'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// --------------- NavigationMenu types ---------------
export interface NavMenuItem {
  /** Unique key */
  key: string;
  /** Display label */
  label: string;
  /** Optional href */
  href?: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Nested items for dropdown sub-menus */
  children?: NavMenuItem[];
  /** Disabled state */
  disabled?: boolean;
  /** Optional badge count */
  badge?: number;
}

export interface NavigationMenuProps {
  /** Ordered list of top-level navigation items */
  items: NavMenuItem[];
  /** Currently active item key */
  activeKey: string;
  /** Click/select handler */
  onSelect: (key: string, item: NavMenuItem) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** ARIA label */
  'aria-label'?: string;
  /** Additional class name */
  className?: string;
  /** Styling variant */
  variant?: 'default' | 'pills' | 'underline';
  /** Test id */
  'data-testid'?: string;
}

// --------------- Sub-menu dropdown ---------------
function SubMenu({
  items,
  activeKey,
  onSelect,
  onClose,
}: {
  items: NavMenuItem[];
  activeKey: string;
  onSelect: (key: string, item: NavMenuItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="menu"
      className="nav-submenu"
      data-testid="nav-submenu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: 180,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '4px 0',
        zIndex: 1000,
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          role="menuitem"
          disabled={item.disabled}
          data-active={activeKey === item.key || undefined}
          data-testid={`nav-subitem-${item.key}`}
          onClick={() => {
            if (!item.disabled) {
              onSelect(item.key, item);
              onClose();
            }
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 16px',
            textAlign: 'left',
            border: 'none',
            background: activeKey === item.key ? '#f3f4f6' : 'transparent',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            fontSize: 14,
            color: item.disabled ? '#9ca3af' : '#374151',
            opacity: item.disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (activeKey !== item.key) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }
          }}
        >
          {item.icon && (
            <span style={{ marginRight: 8, verticalAlign: 'middle' }}>
              {item.icon}
            </span>
          )}
          {item.label}
          {item.badge != null && item.badge > 0 && (
            <span
              data-testid={`nav-badge-${item.key}`}
              style={{
                marginLeft: 8,
                background: '#ef4444',
                color: '#fff',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 11,
                lineHeight: '16px',
              }}
            >
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// --------------- NavigationMenu ---------------
export function NavigationMenu({
  items,
  activeKey,
  onSelect,
  orientation = 'horizontal',
  'aria-label': ariaLabel = 'Navigation',
  className = '',
  variant = 'default',
  'data-testid': dataTestId = 'nav-menu',
}: NavigationMenuProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close sub-menu on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpenKey(null);
    }
  }, []);

  useEffect(() => {
    if (openKey) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [openKey, handleOutsideClick]);

  const isHorizontal = orientation === 'horizontal';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    alignItems: isHorizontal ? 'center' : 'stretch',
    gap: 2,
    padding: '4px 0',
    ...(variant === 'underline' ? { borderBottom: '1px solid #e5e7eb' } : {}),
  };

  const getItemStyle = (isActive: boolean, item: NavMenuItem): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      border: 'none',
      background: 'transparent',
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      fontSize: 14,
      fontWeight: isActive ? 600 : 400,
      color: item.disabled ? '#9ca3af' : isActive ? '#111827' : '#4b5563',
      opacity: item.disabled ? 0.5 : 1,
      position: 'relative',
      whiteSpace: 'nowrap',
      borderRadius: variant === 'pills' ? 6 : 0,
    };

    if (variant === 'underline' && isActive) {
      base.borderBottom = '2px solid #3b82f6';
      base.color = '#3b82f6';
    }

    if (variant === 'pills' && isActive) {
      base.background = '#eff6ff';
      base.color = '#2563eb';
    }

    return base;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      ref={menuRef}
      aria-label={ariaLabel}
      className={className}
      data-testid={dataTestId}
      style={containerStyle}
      role="navigation"
    >
      {items.map((item) => {
        const isActive = activeKey === item.key;
        const isOpen = openKey === item.key;
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div
            key={item.key}
            style={{ position: 'relative' }}
            data-testid={`nav-item-wrapper-${item.key}`}
          >
            <button
              role={hasChildren ? 'menuitem' : 'tab'}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-haspopup={hasChildren ? true : undefined}
              disabled={item.disabled}
              data-active={isActive || undefined}
              data-testid={`nav-item-${item.key}`}
              style={getItemStyle(isActive, item)}
              onClick={() => {
                if (item.disabled) return;
                if (hasChildren) {
                  setOpenKey(isOpen ? null : item.key);
                } else {
                  setOpenKey(null);
                  onSelect(item.key, item);
                }
              }}
            >
              {item.icon && (
                <span data-testid={`nav-icon-${item.key}`}>{item.icon}</span>
              )}
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span
                  data-testid={`nav-badge-${item.key}`}
                  style={{
                    marginLeft: 6,
                    background: isActive ? '#3b82f6' : '#9ca3af',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 11,
                    lineHeight: '16px',
                  }}
                >
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <span
                  data-testid={`nav-chevron-${item.key}`}
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  ▼
                </span>
              )}
            </button>
            {hasChildren && isOpen && (
              <SubMenu
                items={item.children!}
                activeKey={activeKey}
                onSelect={onSelect}
                onClose={() => setOpenKey(null)}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
