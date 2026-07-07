/**
 * RolePadClient — 角色操作面板客户端组件
 * 根据当前角色加载对应的工作台视图（店长/前台/导购员）
 */
'use client';

import React from 'react';

// ── Types ───────────────────────────────────────────────────

export type SupportedPadRole = 'store_manager' | 'front_desk' | 'sales_clerk';

export interface RolePadClientProps {
  role: SupportedPadRole;
  /** 当前激活的 tab，默认 'workbench' */
  activeTab?: string;
  /** tab 切换回调 */
  onTabChange?: (tab: string) => void;
  /** Pad 屏幕分辨率提示 */
  deviceWidthHint?: number;
}

// ── Styling ─────────────────────────────────────────────────

const styles = {
  container: {
    background: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(148,163,184,0.12)',
    background: '#1e293b',
  },
  roleBadge: (role: SupportedPadRole) => ({
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background:
      role === 'store_manager' ? 'rgba(59,130,246,0.15)' :
      role === 'front_desk' ? 'rgba(16,185,129,0.15)' :
      'rgba(245,158,11,0.15)',
    color:
      role === 'store_manager' ? '#60a5fa' :
      role === 'front_desk' ? '#34d399' :
      '#fbbf24',
  }),
  tabs: {
    display: 'flex',
    gap: 4,
    padding: '12px 24px 0',
    borderBottom: '1px solid rgba(148,163,184,0.1)',
  },
  tab: (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px 8px 0 0',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? '#f1f5f9' : '#64748b',
    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  content: {
    padding: 24,
  },
  placeholder: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#64748b',
    fontSize: 14,
  },
  deviceHint: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
};

// ── Role display names ──────────────────────────────────────

const ROLE_LABELS: Record<SupportedPadRole, string> = {
  store_manager: '店长',
  front_desk: '前台',
  sales_clerk: '导购员',
};

const ROLE_TABS: Record<SupportedPadRole, string[]> = {
  store_manager: ['workbench', 'analytics', 'staff', 'settings'],
  front_desk: ['workbench', 'queue', 'checkout', 'customers'],
  sales_clerk: ['workbench', 'clients', 'scripts', 'reports'],
};

const TAB_LABELS: Record<string, string> = {
  workbench: '工作台',
  analytics: '数据分析',
  staff: '人员管理',
  settings: '设置',
  queue: '排队管理',
  checkout: '收银',
  customers: '客户',
  clients: '客户跟进',
  scripts: '推荐话术',
  reports: '报表',
};

// ── Component ───────────────────────────────────────────────

export function RolePadClient({
  role,
  activeTab = 'workbench',
  onTabChange,
  deviceWidthHint,
}: RolePadClientProps) {
  const tabs = ROLE_TABS[role];
  const roleLabel = ROLE_LABELS[role];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.roleBadge(role)}>{roleLabel}</span>
          {deviceWidthHint && (
            <div style={styles.deviceHint}>屏幕: {deviceWidthHint}px</div>
          )}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
          {roleLabel}工作台
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            style={styles.tab(tab === activeTab)}
            onClick={() => onTabChange?.(tab)}
          >
            {TAB_LABELS[tab] || tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        <div style={styles.placeholder}>
          {TAB_LABELS[activeTab] || activeTab} 面板
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
            当前角色: {roleLabel} · 对应功能将通过组件注入
          </div>
        </div>
      </div>
    </div>
  );
}
