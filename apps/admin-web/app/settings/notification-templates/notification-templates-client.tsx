'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react'
import { useMemo, useTransition } from 'react'
import type { NotificationTemplatesSnapshotDelivery } from './notification-templates-data'

const styles: Record<string, CSSProperties> = {
  page: { padding: 32, maxWidth: 1120, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, maxWidth: 780 },
  refreshButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.45)',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  error: {
    marginBottom: 16,
    borderRadius: 12,
    border: '1px solid rgba(245, 158, 11, 0.35)',
    background: 'rgba(245, 158, 11, 0.12)',
    padding: '12px 16px',
    fontSize: 13,
    color: '#fde68a',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' },
  td: { padding: '14px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)', verticalAlign: 'top' },
  code: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  tag: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  rulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  ruleCard: { borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '14px 16px', background: 'rgba(15, 23, 42, 0.35)' },
  ruleKey: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  ruleValue: { fontSize: 14, color: '#f8fafc', lineHeight: 1.6 },
}

function statusStyle(enabled: boolean): CSSProperties {
  return enabled
    ? { color: '#86efac', background: 'rgba(34, 197, 94, 0.12)' }
    : { color: '#cbd5e1', background: 'rgba(148, 163, 184, 0.12)' }
}

export default function NotificationTemplatesClient({
  snapshot,
}: {
  snapshot: NotificationTemplatesSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const summary = useMemo(() => {
    const enabledTemplates = snapshot.templates.filter((template) => template.enabled).length
    const totalVariables = snapshot.templates.reduce(
      (count, template) => count + template.variables.length,
      0
    )
    return {
      totalTemplates: snapshot.templates.length,
      enabledTemplates,
      variableRules: snapshot.variableRules.length,
      totalVariables,
    }
  }, [snapshot])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>通知模板</h1>
          <p style={styles.subtitle}>
            首屏模板列表已经切换为服务端快照驱动，优先尝试读取 `notifications/templates`，失败时显式回退到本地样本，避免旧版客户端假加载掩盖来源态。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      {snapshot.error && <div style={styles.error}>{snapshot.error}</div>}

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>模板总数</div>
          <div style={styles.cardValue}>{summary.totalTemplates}</div>
          <div style={styles.cardHint}>服务端快照当前暴露的模板数</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已启用模板</div>
          <div style={styles.cardValue}>{summary.enabledTemplates}</div>
          <div style={styles.cardHint}>当前允许运行的模板版本数</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>变量规则</div>
          <div style={styles.cardValue}>{summary.variableRules}</div>
          <div style={styles.cardHint}>模板编写和占位符治理规则</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>变量引用</div>
          <div style={styles.cardValue}>{summary.totalVariables}</div>
          <div style={styles.cardHint}>当前模板列表中的变量引用总量</div>
        </div>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>通知模板列表</div>
        <div style={styles.sectionText}>各业务场景模板按渠道拆分展示，版本信息当前由快照层统一维护。</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>场景</th>
              <th style={styles.th}>渠道</th>
              <th style={styles.th}>作用域</th>
              <th style={styles.th}>语言与定位</th>
              <th style={styles.th}>模板名称</th>
              <th style={styles.th}>变量</th>
              <th style={styles.th}>版本</th>
              <th style={styles.th}>状态</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.templates.map((template) => (
              <tr key={template.id}>
                <td style={styles.td}>
                  <div>{template.scene}</div>
                  <div style={styles.code}>{template.code}</div>
                </td>
                <td style={styles.td}>
                  <div>{template.channel}</div>
                  <div style={styles.code}>{template.channelCode}</div>
                </td>
                <td style={styles.td}>
                  <div>{template.scopeLabel}</div>
                  <div style={styles.code}>{template.scopeType}</div>
                </td>
                <td style={styles.td}>
                  <div>{template.locale}</div>
                  <div style={styles.code}>
                    {[template.tenantId, template.brandId, template.storeId, template.marketCode]
                      .filter(Boolean)
                      .join(' · ') || '未显式绑定'}
                  </div>
                </td>
                <td style={styles.td}>
                  <div>{template.titleTemplate}</div>
                  <div style={styles.code}>{template.bodyTemplate}</div>
                </td>
                <td style={styles.td}>{template.variables.join(', ') || '无变量'}</td>
                <td style={styles.td}>
                  {template.version === null ? 'API未提供' : `v${template.version}`}
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.tag, ...statusStyle(template.enabled) }}>
                    {template.enabled ? '启用' : '停用'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>变量使用规范</div>
        <div style={styles.sectionText}>变量规则由快照层透出，避免模板编辑说明散落在客户端硬编码中。</div>
        <div style={styles.rulesGrid}>
          {snapshot.variableRules.map((rule) => (
            <div key={rule.key} style={styles.ruleCard}>
              <div style={styles.ruleKey}>{rule.key}</div>
              <div style={styles.ruleValue}>{rule.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
