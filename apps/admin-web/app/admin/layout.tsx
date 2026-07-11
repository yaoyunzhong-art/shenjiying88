// @ts-nocheck
'use client';

/**
 * 管理后台 - 侧边栏布局
 * 提供 admin 下的统一导航
 */

import { useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================
// 导航项
// ============================================================
interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '全局仪表盘', href: '/admin/dashboard', icon: '📊' },
  { key: 'tenants', label: '租户管理', href: '/admin/tenants', icon: '🏢' },
];

// ============================================================
// 样式
// ============================================================
const SIDEBAR_WIDTH = 220;

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    background: 'rgba(15, 23, 42, 0.95)',
    borderRight: '1px solid rgba(148, 163, 184, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 50,
  },
  sidebarHeader: {
    padding: '20px 18px 14px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '0.5px',
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  navList: {
    flex: 1,
    padding: '10px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
  },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    textDecoration: 'none',
    color: active ? '#93c5fd' : '#94a3b8',
    background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: active ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  }),
  sidebarFooter: {
    padding: '14px 18px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    fontSize: 11,
    color: '#475569',
  },
  mainContent: {
    marginLeft: SIDEBAR_WIDTH,
    flex: 1,
    minHeight: '100vh',
  },
  collapseToggle: {
    position: 'absolute' as const,
    bottom: 16,
    right: 10,
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 18,
    padding: '4px 8px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeKey = pathname?.startsWith('/admin/tenants') ? 'tenants' : 'dashboard';

  const sidebarWidth = collapsed ? 56 : SIDEBAR_WIDTH;

  return (
    <div style={{ ...styles.wrapper }}>
      {/* 侧边栏 */}
      <div
        style={{
          ...styles.sidebar,
          width: sidebarWidth,
          transition: 'width 0.2s ease',
        }}
      >
        {/* 头部 */}
        <div style={styles.sidebarHeader}>
          {collapsed ? (
            <div style={{ fontSize: 20, textAlign: 'center' }}>⚙️</div>
          ) : (
            <>
              <div style={styles.sidebarTitle}>⚙️ 管理后台</div>
              <div style={styles.sidebarSubtitle}>总部运营管理</div>
            </>
          )}
        </div>

        {/* 导航 */}
        <nav style={styles.navList}>
          {NAV_ITEMS.map(item => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                style={styles.navItem(isActive)}
                title={collapsed ? item.label : undefined}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 底部 */}
        {!collapsed && (
          <div style={styles.sidebarFooter}>
            ShenJiYing Admin 3.8.2
          </div>
        )}

        {/* 折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={styles.collapseToggle}
          title={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* 主内容区 */}
      <div
        style={{
          ...styles.mainContent,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
