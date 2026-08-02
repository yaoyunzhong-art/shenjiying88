'use client';

/**
 * 🎨 AdminShell — 神机营管理后台全局框架
 * E55 UX 升级: 侧栏 + 面包屑 + ⌘K + 快捷操作 + 响应式
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SideNavigation,
  Breadcrumb,
  CommandPalette,
  SpeedDial,
  ErrorBoundary,
  ResponsiveContainer,
} from '@m5/ui';
import type { CommandItem, SpeedDialAction, SideNavItem } from '@m5/ui';
import { ADMIN_NAV_ITEMS, flattenNavItems } from './admin-nav-config';
import { FeedbackProvider } from './FeedbackProvider';

// ─── 类型 ──────────────────────────────────────────

interface AdminShellProps { children: React.ReactNode }

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

// ─── 面包屑推导 ────────────────────────────────────

function deriveBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const crumbs: BreadcrumbEntry[] = [{ label: '指挥台', href: '/' }];
  if (!pathname || pathname === '/') return crumbs;

  const segments = pathname.split('/').filter(Boolean);
  const parents: Record<string, string> = {};
  for (const item of ADMIN_NAV_ITEMS) {
    if (item.children) {
      for (const child of item.children) {
        if (child.href) parents[child.href.replace(/^\/+/, '')] = item.label;
      }
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const key = segments.slice(0, i + 1).join('/');
    const label = parents[key] ?? segments[i];
    crumbs.push({ label, href: `/${key}` });
  }
  return crumbs;
}

// ─── ⌘K 命令构建 ──────────────────────────────────

function buildCommands(_go: (href: string) => void): CommandItem[] {
  const flat = flattenNavItems(ADMIN_NAV_ITEMS);
  return [
    ...flat.map((item) => ({
      id: item.id,
      label: item.label,
      description: `前往 ${item.group} → ${item.label}`,
      group: item.group,
      icon: '📄',
      payload: { href: item.href },
    })),
    { id: 'cmd-logout', label: '退出登录', group: '系统', icon: '🚪', description: '安全退出当前账号' },
    { id: 'cmd-settings', label: '系统设置', group: '系统', icon: '⚙️', description: '配置管理参数' },
    { id: 'cmd-shortcuts', label: '快捷键帮助', group: '系统', icon: '❓', description: '查看所有快捷键' },
  ];
}

// ─── 快捷操作 ──────────────────────────────────────

const SPEED_DIAL_ACTIONS: SpeedDialAction[] = [
  { key: 'new-order', label: '新建订单', icon: '📝', onClick: () => console.log('new order') },
  { key: 'add-user', label: '添加用户', icon: '👤', onClick: () => console.log('add user') },
  { key: 'import', label: '批量导入', icon: '📥', onClick: () => console.log('import') },
  { key: 'export', label: '导出报表', icon: '📤', onClick: () => console.log('export') },
];

// ─── 组件 ──────────────────────────────────────────

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [activeKey, setActiveKey] = useState('dashboard');

  // 同步 activeKey
  React.useEffect(() => {
    if (!pathname || pathname === '/') { setActiveKey('dashboard'); return; }
    const flat = flattenNavItems(ADMIN_NAV_ITEMS);
    const match = flat.find((f) => f.href === pathname);
    if (match) setActiveKey(match.id);
  }, [pathname]);

  const breadcrumbs = useMemo(() => deriveBreadcrumbs(pathname ?? ''), [pathname]);

  const handleNavigate = useCallback((_key: string, item: SideNavItem) => {
    if (item.href) router.push(item.href);
  }, [router]);

  const handleCmdSelect = useCallback((cmd: CommandItem) => {
    if (cmd.payload && typeof cmd.payload === 'object' && 'href' in cmd.payload) {
      router.push((cmd.payload as { href: string }).href);
    }
    setCmdOpen(false);
  }, [router]);

  // ⌘K / Ctrl+K 快捷键
  React.useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands = useMemo(() => buildCommands(router.push), [router.push]);

  return (
    <ErrorBoundary>
      <FeedbackProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        {/* 左侧导航 */}
        <SideNavigation
          items={ADMIN_NAV_ITEMS}
          activeKey={activeKey}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((p) => !p)}
          header={
            !collapsed ? (
              <div style={{ padding: '16px 12px', fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>
                🏯 神机营
              </div>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 18 }}>🏯</div>
            )
          }
          footer={
            !collapsed ? (
              <div style={{ padding: '12px', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                v1.0 · E55 UX
              </div>
            ) : null
          }
        />

        {/* 右侧主内容 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* 顶部面包屑栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              borderBottom: '1px solid rgba(148,163,184,0.12)',
              background: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(12px)',
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            <Breadcrumb
              items={breadcrumbs.map((b) => ({
                key: b.href ?? b.label,
                label: b.label,
                href: b.href,
              }))}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/audit-logs"
                title="操作日志"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(148,163,184,0.08)',
                  color: '#94a3b8',
                  fontSize: 16,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  position: 'relative' as const,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(96,165,250,0.15)';
                  e.currentTarget.style.color = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148,163,184,0.08)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                🔔
                {/* 未读小红点 */}
                <span
                  style={{
                    position: 'absolute' as const,
                    top: 4,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '1px solid rgba(15,23,42,0.8)',
                  }}
                />
              </Link>
              <span
                onClick={() => setCmdOpen(true)}
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  background: 'rgba(148,163,184,0.08)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title="快捷键: ⌘K"
              >
                ⌘K
              </span>
            </div>
          </div>

          {/* 主内容区 */}
          <ResponsiveContainer>
            <main style={{ flex: 1, overflow: 'auto' }}>
              {children}
            </main>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ⌘K 命令面板 */}
      <CommandPalette
        commands={commands}
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelect={handleCmdSelect}
        placeholder="搜索页面、操作..."
        emptyMessage="未找到匹配项，试试 ⌘K 重新搜索"
      />

      {/* 快捷悬浮球 */}
      <SpeedDial actions={SPEED_DIAL_ACTIONS} />
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
