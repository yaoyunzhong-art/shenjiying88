'use client'

import type { CSSProperties } from 'react'
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SecuritySnapshotDelivery } from './security-data'

const styles: Record<string, CSSProperties> = {
  page: { padding: 32, maxWidth: 1080, margin: '0 auto' },
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
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  sectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20 },
  fullSection: { marginTop: 16, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' },
  key: { fontSize: 13, color: '#94a3b8' },
  value: { fontSize: 13, color: '#f8fafc', fontWeight: 600 },
  checklist: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  checklistItem: (enabled: boolean): CSSProperties => ({
    borderRadius: 12,
    padding: '14px 16px',
    border: enabled ? '1px solid rgba(34, 197, 94, 0.28)' : '1px solid rgba(148, 163, 184, 0.12)',
    background: enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(15, 23, 42, 0.35)',
    color: enabled ? '#86efac' : '#cbd5e1',
    fontSize: 13,
  }),
}

export default function SecurityClient({
  snapshot,
}: {
  snapshot: SecuritySnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  const summary = useMemo(() => {
    const enabledCount = snapshot.complianceItems.filter((item) => item.enabled).length
    return {
      passwordRules: snapshot.passwordPolicies.length,
      loginControls: snapshot.loginProtections.length,
      enabledCount,
    }
  }, [snapshot])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>安全设置</h1>
          <p style={styles.subtitle}>
            当前首屏安全治理配置仍来自本地快照样本，页面显式展示密码策略、登录保护和合规状态，刷新动作仅重新请求服务端快照，不再由客户端假装异步加载。
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
          <div style={styles.cardLabel}>密码规则</div>
          <div style={styles.cardValue}>{summary.passwordRules}</div>
          <div style={styles.cardHint}>用于约束后台账号凭证强度</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>登录保护项</div>
          <div style={styles.cardValue}>{summary.loginControls}</div>
          <div style={styles.cardHint}>统一在快照层透出，不再由客户端拼装</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已启用合规项</div>
          <div style={styles.cardValue}>{summary.enabledCount}</div>
          <div style={styles.cardHint}>其余项需等真实上游接口补齐后再替换</div>
        </div>
      </div>

      <div style={styles.sectionGrid}>
        <section style={styles.section}>
          <div style={styles.sectionTitle}>密码策略</div>
          <div style={styles.sectionText}>覆盖复杂度、过期时长和重复密码限制。</div>
          <div style={styles.list}>
            {snapshot.passwordPolicies.map((item) => (
              <div key={item.key} style={styles.row}>
                <span style={styles.key}>{item.key}</span>
                <span style={styles.value}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>登录保护</div>
          <div style={styles.sectionText}>强调失败锁定、二次验证和异常登录告警。</div>
          <div style={styles.list}>
            {snapshot.loginProtections.map((item) => (
              <div key={item.key} style={styles.row}>
                <span style={styles.key}>{item.key}</span>
                <span style={styles.value}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={styles.fullSection}>
        <div style={styles.sectionTitle}>安全合规要求</div>
        <div style={styles.sectionText}>将当前样本中的治理启停状态完整上屏，避免“默认都已开启”的黑盒误判。</div>
        <div style={styles.checklist}>
          {snapshot.complianceItems.map((item) => (
            <div key={item.label} style={styles.checklistItem(item.enabled)}>
              {item.enabled ? '✓' : '○'} {item.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
