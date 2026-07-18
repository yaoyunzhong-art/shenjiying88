'use client';

/**
 * settings/page.tsx — 设置中心首页
 *
 * 设置总览面板，展示各配置模块的状态摘要与快速入口
 * 包含：配置统计、分类Tab切换、设置项列表
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs } from '@m5/ui';

// ============================================================
// 设置分类类型
// ============================================================
type SettingCategory = 'basic' | 'notification' | 'security' | 'advanced';

interface TabItem {
  key: SettingCategory;
  label: string;
  count: number;
}

// ============================================================
// 配置模块概览数据
// ============================================================
interface ConfigModule {
  key: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  status: 'configured' | 'partial' | 'pending';
  category: SettingCategory;
  itemCount?: number;
}

const MODULES: ConfigModule[] = [
  { key: 'payment-config', label: '支付配置', href: '/settings/payment-config', icon: '💳', description: '管理支付通道与结算参数，支持微信支付、支付宝、银联等多种支付方式', status: 'configured', category: 'basic', itemCount: 3 },
  { key: 'membership-levels', label: '会员等级', href: '/settings/membership-levels', icon: '🏅', description: '定义会员等级体系与权益配置，包括升降级规则与折扣策略', status: 'configured', category: 'basic', itemCount: 4 },
  { key: 'promotion-rules', label: '促销规则', href: '/settings/promotion-rules', icon: '🎁', description: '配置满减、折扣、赠品等促销活动规则与触发条件', status: 'partial', category: 'basic', itemCount: 2 },
  { key: 'tax-rates', label: '税率配置', href: '/settings/tax-rates', icon: '🧾', description: '设置各商品品类的税率标准与税务计算规则', status: 'partial', category: 'basic', itemCount: 4 },
  { key: 'system-config', label: '系统配置', href: '/settings/system-config', icon: '⚙️', description: '全局系统参数、运行配置与品牌基础信息设置', status: 'configured', category: 'basic', itemCount: 8 },
  { key: 'venue-config', label: '场馆配置', href: '/settings/venue-config', icon: '🏟', description: '管理场馆运营参数、设施配置与营业时间设置', status: 'configured', category: 'basic', itemCount: 3 },
  { key: 'notifications', label: '通知设置', href: '/settings/notifications', icon: '🔔', description: '配置通知规则、推送渠道、频率限制与静默时段', status: 'partial', category: 'notification', itemCount: 3 },
  { key: 'notification-templates', label: '通知模板', href: '/settings/notification-templates', icon: '📋', description: '管理各业务场景的通知消息模板，支持变量占位符', status: 'configured', category: 'notification', itemCount: 5 },
  { key: 'security', label: '安全设置', href: '/settings/security', icon: '🔒', description: '密码策略、登录保护、IP白名单与安全审计配置', status: 'configured', category: 'security', itemCount: 5 },
  { key: 'permissions', label: '权限管理', href: '/settings/permissions', icon: '🔑', description: '管理用户角色与权限矩阵，支持角色继承与资源级授权', status: 'configured', category: 'security', itemCount: 6 },
  { key: 'workflow', label: '工作流配置', href: '/settings/workflow', icon: '🔄', description: '配置审批工作流与自动化流程节点，支持条件分支与多人审批', status: 'pending', category: 'advanced', itemCount: 1 },
];

// ============================================================
// Tab 定义
// ============================================================
const CATEGORY_LABEL: Record<SettingCategory, string> = {
  basic: '基础设置',
  notification: '通知设置',
  security: '安全设置',
  advanced: '高级设置',
};

const CATEGORY_ORDER: SettingCategory[] = ['basic', 'notification', 'security', 'advanced'];

function buildTabItems(): TabItem[] {
  return CATEGORY_ORDER.map(key => ({
    key,
    label: CATEGORY_LABEL[key],
    count: MODULES.filter(m => m.category === key).length,
  }));
}

// ============================================================
// 状态映射
// ============================================================
const STATUS_LABEL: Record<string, string> = {
  configured: '已配置',
  partial: '部分配置',
  pending: '待配置',
};

const STATUS_COLOR: Record<string, string> = {
  configured: '#22c55e',
  partial: '#eab308',
  pending: '#ef4444',
};

// ============================================================
// 样式
// ============================================================
const styles = {
  page: {
    padding: 32,
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: (bg: string) => ({
    background: bg,
    borderRadius: 12,
    padding: '20px 24px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  }),
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  tabBar: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    marginBottom: 40,
  },
  moduleCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  moduleIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  moduleFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
  },
  statusBadge: (color: string) => ({
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: `${color}15`,
    padding: '2px 10px',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }),
  statusDot: (color: string) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    display: 'inline-block',
  }),
  itemCount: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: 40,
    color: '#64748b',
    fontSize: 14,
  },
};

// ============================================================
// 页面组件
// ============================================================
export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('basic');

  const totalModules = MODULES.length;
  const configuredCount = MODULES.filter(m => m.status === 'configured').length;
  const partialCount = MODULES.filter(m => m.status === 'partial').length;
  const pendingCount = MODULES.filter(m => m.status === 'pending').length;

  const filteredModules = MODULES.filter(m => m.category === activeCategory);
  const tabItems = buildTabItems();

  return (
    <div style={styles.page}>
      {/* 页面头部 */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ 设置中心</h1>
        <p style={styles.subtitle}>
          系统全局配置管理面板。管理支付、会员、安全、通知等 {totalModules} 个配置模块，
          每个模块支持独立的参数配置与状态监控。
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={styles.statsRow}>
        <div style={styles.statCard('rgba(30, 41, 59, 0.8)')}>
          <div style={styles.statLabel}>配置模块总数</div>
          <div style={styles.statValue}>{totalModules}</div>
        </div>
        <div style={styles.statCard('rgba(34, 197, 94, 0.08)')}>
          <div style={styles.statLabel}>已完全配置</div>
          <div style={{ ...styles.statValue, color: '#22c55e' }}>{configuredCount}</div>
        </div>
        <div style={styles.statCard('rgba(234, 179, 8, 0.08)')}>
          <div style={styles.statLabel}>部分配置</div>
          <div style={{ ...styles.statValue, color: '#eab308' }}>{partialCount}</div>
        </div>
        <div style={styles.statCard('rgba(239, 68, 68, 0.08)')}>
          <div style={styles.statLabel}>待配置</div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>{pendingCount}</div>
        </div>
      </div>

      {/* 分类 Tab */}
      <div style={styles.tabBar}>
        <Tabs
          items={tabItems}
          activeKey={activeCategory}
          onChange={(key: string) => setActiveCategory(key as SettingCategory)}
          variant="underline"
          size="md"
        />
      </div>

      {/* 当前分类下的配置模块列表 */}
      <div>
        <h2 style={styles.sectionTitle}>
          📋 {CATEGORY_LABEL[activeCategory]}
        </h2>
        <div style={styles.grid}>
          {filteredModules.length > 0 ? (
            filteredModules.map(mod => (
              <Link
                key={mod.key}
                href={mod.href}
                style={styles.moduleCard}
              >
                <div style={styles.moduleHeader}>
                  <span style={styles.moduleIcon}>{mod.icon}</span>
                  <span style={styles.moduleName}>{mod.label}</span>
                </div>
                <div style={styles.moduleDescription}>{mod.description}</div>
                <div style={styles.moduleFooter}>
                  <span style={styles.statusBadge(STATUS_COLOR[mod.status])}>
                    <span style={styles.statusDot(STATUS_COLOR[mod.status])} />
                    {STATUS_LABEL[mod.status]}
                  </span>
                  {mod.itemCount !== undefined && (
                    <span style={styles.itemCount}>{mod.itemCount} 项设置</span>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div style={styles.emptyText}>
              该分类下暂无配置模块
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
