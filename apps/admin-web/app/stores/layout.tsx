// @ts-nocheck
'use client';

/**
 * 门店管理 - 侧边栏布局
 * 提供 stores/ 下的统一导航
 * 角色: 👔店长 / 🎯运行专员 / 多门店运营
 */

import { useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

// ============================================================
// 导航项 - 全局门店管理
// ============================================================
interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
}

const GLOBAL_NAV: NavItem[] = [
  { key: 'stores', label: '门店列表', href: '/stores', icon: '🏪' },
  { key: 'overview', label: '门店概览', href: '/stores/overview', icon: '📊' },
];

// ============================================================
// 门店级导航项（在 stores/[id]/ 下显示）
// ============================================================
const STORE_NAV: NavItem[] = [
  { key: 'store-detail', label: '门店详情', href: '', icon: '📋' },
  { key: 'staff', label: '员工管理', href: '/staff', icon: '👥' },
  { key: 'devices', label: '设备管理', href: '/devices', icon: '🖥️' },
  { key: 'finance', label: '财务管理', href: '/finance', icon: '💰' },
  { key: 'inventory', label: '库存管理', href: '/inventory', icon: '📦' },
  { key: 'marketing', label: '营销管理', href: '/marketing', icon: '📢' },
  { key: 'members', label: '会员管理', href: '/members', icon: '👤' },
  { key: 'orders', label: '订单管理', href: '/orders', icon: '🧾' },
  { key: 'reports', label: '运营报表', href: '/reports', icon: '📈' },
  { key: 'promotions', label: '促销管理', href: '/promotions', icon: '🏷️' },
  { key: 'cashier', label: '收银台', href: '/cashier', icon: '💵' },
  { key: 'operations', label: '运营中心', href: '/operations', icon: '⚙️' },
  { key: 'purchasing', label: '采购管理', href: '/purchasing', icon: '📋' },
  { key: 'reconciliation', label: '对账管理', href: '/reconciliation', icon: '📊' },
  { key: 'reservations', label: '预约管理', href: '/reservations', icon: '📅' },
  { key: 'scheduling', label: '排班管理', href: '/scheduling', icon: '⏰' },
  { key: 'security', label: '安全管理', href: '/security', icon: '🔒' },
  { key: 'service', label: '服务管理', href: '/service', icon: '🎯' },
  { key: 'settings', label: '门店设置', href: '/settings', icon: '⚙️' },
  { key: 'training', label: '培训管理', href: '/training', icon: '📚' },
  { key: 'shift-handover', label: '交接班', href: '/shift-handover', icon: '🔄' },
  { key: 'audit', label: '审计日志', href: '/audit', icon: '📝' },
  { key: 'analytics', label: '数据分析', href: '/analytics', icon: '📉' },
  { key: 'events', label: '事件管理', href: '/events', icon: '🔔' },
  { key: 'inspection', label: '巡检管理', href: '/inspection', icon: '🔍' },
  { key: 'health-score', label: '健康评分', href: '/health-score', icon: '❤️' },
  { key: 'capability-access', label: '权限管理', href: '/capability-access', icon: '🔑' },
];

// ============================================================
// 样式
// ============================================================
const SIDEBAR_WIDTH = 200;

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
    overflowY: 'auto' as const,
  },
  sidebarHeader: {
    padding: '16px 14px 10px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  sidebarTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  navSection: {
    padding: '8px 8px 4px',
    fontSize: 10,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  navList: {
    flex: 1,
    padding: '4px 8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 8,
    textDecoration: 'none',
    color: active ? '#93c5fd' : '#94a3b8',
    background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: active ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    transition: 'all 0.15s ease',
  }),
  sidebarFooter: {
    padding: '10px 14px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    fontSize: 10,
    color: '#475569',
  },
  mainContent: {
    marginLeft: SIDEBAR_WIDTH,
    flex: 1,
    minHeight: '100vh',
  },
};

export default function StoresLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();

  const isStoreDetail = !!params?.id;
  const storeId = params?.id as string | undefined;

  // 判断是否在门店详情页
  const activeKey = pathname?.split('/').pop() || 'stores';

  return (
    <div style={styles.wrapper}>
      {/* 侧边栏 */}
      <div style={styles.sidebar}>
        {/* 头部 */}
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>
            {isStoreDetail ? '🏪 门店管理' : '🏪 门店列表'}
          </div>
          <div style={styles.sidebarSubtitle}>
            {isStoreDetail ? `门店 ID: ${storeId?.slice(0, 8)}` : `${STORE_NAV.length} 个功能模块`}
          </div>
        </div>

        {/* 导航 */}
        <nav style={styles.navList}>
          {isStoreDetail ? (
            <>
              <div style={styles.navSection}>📋 门店功能</div>
              {STORE_NAV.map(item => {
                const href = `/stores/${storeId}${item.href}`;
                const isActive = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <Link
                    key={item.key}
                    href={href}
                    style={styles.navItem(isActive)}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <div style={styles.navSection}>🏠 全局导航</div>
              {GLOBAL_NAV.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    style={styles.navItem(isActive)}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div style={{ ...styles.navSection, marginTop: 12 }}>📋 快捷操作</div>
              <Link
                href="/stores/new"
                style={styles.navItem(false)}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>➕</span>
                <span>新建门店</span>
              </Link>
            </>
          )}
        </nav>

        {/* 底部 */}
        <div style={styles.sidebarFooter}>
          门店管理系统 {isStoreDetail ? `· ${storeId?.slice(0, 8)}` : ''}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
