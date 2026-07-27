'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@m5/ui'
import { getCachedAdminUser, hasAdminPermission } from '../lib/admin-session'
import type { ConfigModule, SettingCategory, SettingsSnapshot } from './settings-page-data'
import { CATEGORY_LABEL, CATEGORY_ORDER, STATUS_COLOR, STATUS_LABEL } from './settings-page-data'

const styles = {
  page: { padding: 32, maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, maxWidth: 760 },
  refreshButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.45)',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  sessionCard: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18, marginBottom: 20 },
  tabBar: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  moduleCard: {
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.45)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    textDecoration: 'none',
  },
  moduleName: { fontSize: 16, fontWeight: 700, color: '#f8fafc' },
  moduleDescription: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto' },
  badge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  itemCount: { fontSize: 12, color: '#64748b' },
  empty: { padding: 32, textAlign: 'center' as const, color: '#94a3b8' },
}

function buildTabItems(modules: ConfigModule[]) {
  return CATEGORY_ORDER.map((key) => ({
    key,
    label: CATEGORY_LABEL[key],
    count: modules.filter((item) => item.category === key).length,
  }))
}

export default function SettingsClient({ snapshot }: { snapshot: SettingsSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('basic')
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCachedAdminUser>>(null)

  useEffect(() => {
    setCurrentUser(getCachedAdminUser())
  }, [])

  const summary = useMemo(() => {
    const configuredCount = snapshot.modules.filter((item) => item.status === 'configured').length
    const partialCount = snapshot.modules.filter((item) => item.status === 'partial').length
    const pendingCount = snapshot.modules.filter((item) => item.status === 'pending').length
    const accessibleModuleCount = snapshot.modules.filter((item) => hasAdminPermission(currentUser, item.requiredPermission)).length
    return { totalModules: snapshot.modules.length, configuredCount, partialCount, pendingCount, accessibleModuleCount }
  }, [currentUser, snapshot.modules])

  const filteredModules = useMemo(() => snapshot.modules.filter((item) => item.category === activeCategory), [activeCategory, snapshot.modules])
  const tabItems = useMemo(() => buildTabItems(snapshot.modules), [snapshot.modules])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>设置中心</h1>
          <p style={styles.subtitle}>
            当前目录、状态摘要和权限缺口均来自服务端快照。客户端只负责筛选与交互，刷新动作统一回到
            `loadSettingsSnapshot()`。
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>配置模块总数</div>
          <div style={styles.cardValue}>{summary.totalModules}</div>
          <div style={styles.cardHint}>覆盖基础、通知、安全与高级四类设置。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已配置</div>
          <div style={styles.cardValue}>{summary.configuredCount}</div>
          <div style={styles.cardHint}>说明本地快照已给出明确合同。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>部分配置</div>
          <div style={styles.cardValue}>{summary.partialCount}</div>
          <div style={styles.cardHint}>等待真实上游接入后替换 fallback。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>可访问模块</div>
          <div style={styles.cardValue}>{summary.accessibleModuleCount}</div>
          <div style={styles.cardHint}>基于管理员本地 session 的 permissions 计算。</div>
        </div>
      </div>

      <div style={styles.sessionCard}>
        {currentUser ? (
          <>
            <div style={{ ...styles.moduleName, fontSize: 14 }}>当前会话角色：{currentUser.role}</div>
            <div style={styles.moduleDescription}>
              已识别 {currentUser.permissions.length} 项权限，可访问 {summary.accessibleModuleCount}/
              {summary.totalModules} 个配置模块。
            </div>
          </>
        ) : (
          <>
            <div style={{ ...styles.moduleName, fontSize: 14 }}>未检测到管理员会话</div>
            <div style={styles.moduleDescription}>当前展示的是服务端快照目录预览。登录后会依据本地 session 动态判断模块可见性。</div>
          </>
        )}
      </div>

      <div style={styles.tabBar}>
        <Tabs
          items={tabItems}
          activeKey={activeCategory}
          onChange={(key: string) => setActiveCategory(key as SettingCategory)}
          variant="underline"
          size="md"
        />
      </div>

      <div>
        <h2 style={styles.sectionTitle}>{CATEGORY_LABEL[activeCategory]}</h2>
        <div style={styles.grid}>
          {filteredModules.length > 0 ? (
            filteredModules.map((module) => {
              const canAccess = hasAdminPermission(currentUser, module.requiredPermission)
              const statusColor = STATUS_COLOR[module.status]
              const badgeStyle = { ...styles.badge, color: statusColor, background: `${statusColor}15` }
              const cardStyle = { ...styles.moduleCard, opacity: canAccess ? 1 : 0.6, cursor: canAccess ? 'pointer' : 'not-allowed' }
              const content = (
                <>
                  <div style={styles.moduleName}>{module.label}</div>
                  <div style={styles.moduleDescription}>{module.description}</div>
                  <div style={styles.footer}>
                    <span style={badgeStyle}>{STATUS_LABEL[module.status]}</span>
                    <div style={{ display: 'grid', justifyItems: 'end', gap: 4 }}>
                      <span style={styles.itemCount}>{module.itemCount} 项设置</span>
                      <span style={{ ...styles.itemCount, color: canAccess ? '#94a3b8' : '#f59e0b' }}>
                        {canAccess ? `权限: ${module.requiredPermission}` : `缺少 ${module.requiredPermission}`}
                      </span>
                    </div>
                  </div>
                </>
              )

              return canAccess ? (
                <Link key={module.key} href={module.href} style={cardStyle}>
                  {content}
                </Link>
              ) : (
                <div key={module.key} style={cardStyle} aria-disabled="true">
                  {content}
                </div>
              )
            })
          ) : (
            <div style={styles.empty}>该分类下暂无配置模块</div>
          )}
        </div>
      </div>
    </div>
  )
}
