'use client';

import React from 'react';

export interface SideNavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: number;
  children?: SideNavItem[];
  disabled?: boolean;
}

export interface SideNavigationProps {
  items: SideNavItem[];
  activeKey: string;
  onNavigate: (key: string, item: SideNavItem) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

interface NavItemProps {
  item: SideNavItem;
  activeKey: string;
  collapsed: boolean;
  depth: number;
  onNavigate: (key: string, item: SideNavItem) => void;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
}

function NavItem({
  item,
  activeKey,
  collapsed,
  depth,
  onNavigate,
  expandedKeys,
  onToggleExpand,
}: NavItemProps) {
  const isActive = activeKey === item.key;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedKeys.has(item.key);

  const handleClick = () => {
    if (item.disabled) return;
    if (hasChildren) {
      onToggleExpand(item.key);
    } else {
      onNavigate(item.key, item);
    }
  };

  return (
    <li>
      <button
        type="button"
        disabled={item.disabled}
        onClick={handleClick}
        data-active={isActive || undefined}
        data-depth={depth}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          width: '100%',
          padding: collapsed ? '12px 0' : `10px ${12 + depth * 16}px`,
          border: 'none',
          background: isActive ? 'var(--side-nav-active-bg, #e8f0fe)' : 'transparent',
          color: isActive
            ? 'var(--side-nav-active-color, #1967d2)'
            : 'var(--side-nav-color, #5f6368)',
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          borderRadius: 0,
          textAlign: 'left',
          transition: 'background 0.15s, color 0.15s',
          opacity: item.disabled ? 0.5 : 1,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--side-nav-hover-bg, #f1f3f4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }
        }}
      >
        {item.icon && (
          <span style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.icon}
          </span>
        )}
        {!collapsed && (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        )}
        {!collapsed && item.badge != null && item.badge > 0 && (
          <span
            style={{
              background: 'var(--side-nav-badge-bg, #ea4335)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 10,
              padding: '1px 7px',
              lineHeight: '18px',
              flexShrink: 0,
            }}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {!collapsed && hasChildren && (
          <span
            style={{
              flexShrink: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 10,
            }}
          >
            ▸
          </span>
        )}
      </button>
      {!collapsed && hasChildren && isExpanded && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {item.children!.map((child) => (
            <NavItem
              key={child.key}
              item={child}
              activeKey={activeKey}
              collapsed={collapsed}
              depth={depth + 1}
              onNavigate={onNavigate}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SideNavigation({
  items,
  activeKey,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  header,
  footer,
  className,
}: SideNavigationProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    const walk = (list: SideNavItem[]) => {
      for (const item of list) {
        if (item.children) {
          // auto-expand if any child is active
          if (item.children.some((c) => c.key === activeKey || c.children?.some((cc) => cc.key === activeKey))) {
            initial.add(item.key);
          }
          walk(item.children);
        }
      }
    };
    walk(items);
    return initial;
  });

  const handleToggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <nav
      className={className}
      data-collapsed={collapsed || undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: collapsed ? 56 : 240,
        height: '100%',
        background: 'var(--side-nav-bg, #fff)',
        borderRight: '1px solid var(--side-nav-border, #e0e0e0)',
        transition: 'width 0.2s',
        overflow: 'hidden',
      }}
    >
      {header && (
        <div
          style={{
            padding: collapsed ? '12px 0' : '12px 16px',
            borderBottom: '1px solid var(--side-nav-border, #e0e0e0)',
            textAlign: collapsed ? 'center' : 'left',
          }}
        >
          {header}
        </div>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0', flex: 1, overflowY: 'auto' }}>
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            activeKey={activeKey}
            collapsed={collapsed}
            depth={0}
            onNavigate={onNavigate}
            expandedKeys={expandedKeys}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </ul>
      {footer && (
        <div
          style={{
            borderTop: '1px solid var(--side-nav-border, #e0e0e0)',
            padding: collapsed ? '8px 0' : '8px 16px',
            textAlign: collapsed ? 'center' : 'left',
          }}
        >
          {footer}
        </div>
      )}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            border: 'none',
            borderTop: '1px solid var(--side-nav-border, #e0e0e0)',
            background: 'transparent',
            padding: '8px 0',
            cursor: 'pointer',
            color: 'var(--side-nav-color, #5f6368)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          {collapsed ? '→' : '◀'}
        </button>
      )}
    </nav>
  );
}
