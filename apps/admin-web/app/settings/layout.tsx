// @ts-nocheck
'use client';

/**
 * 系统设置 - 侧边栏布局
 * 提供 settings/ 下的统一导航，支持左侧快速切换设置子页面
 * 角色: 系统管理员 / 运营主管
 */

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================
// 导航项定义
// ============================================================
interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'settings-home', label: '设置总览', href: '/settings', icon: '🏠', description: '全局配置概览' },
  { key: 'payment-config', label: '支付配置', href: '/settings/payment-config', icon: '💳', description: '支付通道与结算' },
  { key: 'membership-levels', label: '会员等级', href: '/settings/membership-levels', icon: '🏅', description: '等级与权益' },
  { key: 'security', label: '安全设置', href: '/settings/security', icon: '🔒', description: '安全策略' },
  { key: 'permissions', label: '权限管理', href: '/settings/permissions', icon: '🔑', description: '角色与权限' },
  { key: 'promotion-rules', label: '促销规则', href: '/settings/promotion-rules', icon: '🎁', description: '促销活动配置' },
  { key: 'tax-rates', label: '税率配置', href: '/settings/tax-rates', icon: '🧾', description: '税率与税务' },
  { key: 'system-config', label: '系统配置', href: '/settings/system-config', icon: '⚙️', description: '全局参数' },
  { key: 'venue-config', label: '场馆配置', href: '/settings/venue-config', icon: '🏟', description: '场馆运营参数' },
  { key: 'notifications', label: '通知设置', href: '/settings/notifications', icon: '🔔', description: '通知规则' },
  { key: 'notification-templates', label: '通知模板', href: '/settings/notification-templates', icon: '📋', description: '消息模板' },
  { key: 'workflow', label: '工作流', href: '/settings/workflow', icon: '🔄', description: '审批与自动化' },
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
    overflowY: 'auto' as const,
  },
  sidebarHeader: {
    padding: '18px 16px 12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '0.3px',
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  navSection: {
    padding: '10px 14px 4px',
    fontSize: 10,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  navList: {
    flex: 1,
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    color: active ? '#93c5fd' : '#94a3b8',
    background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: active ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    transition: 'all 0.15s ease',
  }),
  navItemIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  navItemLabel: {
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  sidebarFooter: {
    padding: '12px 16px',
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

// ============================================================
// Layout 组件
// ============================================================
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 根据路径匹配当前激活的导航项
  const activeKey = pathname === '/settings'
    ? 'settings-home'
    : NAV_ITEMS.find(item => item.href === pathname)?.key || 'settings-home';

  return (
    <div style={styles.wrapper}>
      {/* 左侧边栏 */}
      <div style={styles.sidebar}>
        {/* 头部 */}
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>⚙️ 系统设置</div>
          <div style={styles.sidebarSubtitle}>{NAV_ITEMS.length} 个配置模块</div>
        </div>

        {/* 导航列表 */}
        <nav style={styles.navList}>
          <div style={styles.navSection}>📌 设置中心</div>
          {NAV_ITEMS.map(item => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                style={styles.navItem(isActive)}
                title={item.description}
              >
                <span style={styles.navItemIcon}>{item.icon}</span>
                <span style={styles.navItemLabel}>{item.label}</span>
                {isActive && <span style={styles.activeDot} />}
              </Link>
            );
          })}
        </nav>

        {/* 底部 */}
        <div style={styles.sidebarFooter}>
          设置中心 · v2.0 · {NAV_ITEMS.length} 模块
        </div>
      </div>

      {/* 主内容区 */}
      <div style={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
