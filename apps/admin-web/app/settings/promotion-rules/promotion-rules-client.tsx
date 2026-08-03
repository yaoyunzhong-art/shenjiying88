'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { PromotionRuleStatus, PromotionRulesSnapshot } from './promotion-rules-data'
import { filterPromotionRules } from './promotion-rules-data'

const styles = {
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
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, marginBottom: 20 },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  chip: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
  }),
  input: { width: 260, padding: '8px 12px', fontSize: 14, background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, color: '#f1f5f9' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  typeCard: { borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 16 },
  typeName: { fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 6 },
  typeDesc: { fontSize: 12, color: '#94a3b8', lineHeight: 1.6 },
  empty: { padding: 32, textAlign: 'center' as const, color: '#94a3b8' },
} as const

function getStatusLabel(status: PromotionRuleStatus) {
  if (status === 'active') return '进行中'
  if (status === 'scheduled') return '待生效'
  return '草稿'
}

export default function PromotionRulesClient({ snapshot }: { snapshot: PromotionRulesSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activeStatus, setActiveStatus] = useState<PromotionRuleStatus | 'all'>('all')
  const [searchText, setSearchText] = useState('')

  const filteredRules = useMemo(
    () => filterPromotionRules(snapshot.rules, activeStatus, searchText),
    [activeStatus, searchText, snapshot.rules],
  )

  const activeCount = useMemo(
    () => snapshot.rules.filter((rule) => rule.status === 'active').length,
    [snapshot.rules],
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>促销规则设置</h1>
          <p style={styles.subtitle}>
            规则目录、类型说明和状态统计均来自服务端快照，客户端只承接筛选和刷新交互，刷新动作统一回到
            `loadPromotionRulesSnapshot()`。
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

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>规则总数</div>
          <div style={styles.cardValue}>{snapshot.rules.length}</div>
          <div style={styles.cardHint}>覆盖满减、折扣、包邮和秒杀样本。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>进行中规则</div>
          <div style={styles.cardValue}>{activeCount}</div>
          <div style={styles.cardHint}>当前仍在执行窗口内的促销规则。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>促销类型</div>
          <div style={styles.cardValue}>{snapshot.promotionTypes.length}</div>
          <div style={styles.cardHint}>用于校验壳层后的规则类型说明区。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>当前筛选结果</div>
          <div style={styles.cardValue}>{filteredRules.length}</div>
          <div style={styles.cardHint}>状态和搜索条件均由客户端即时计算。</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.chips}>
          {(['all', 'active', 'scheduled', 'draft'] as const).map((status) => (
            <span key={status} style={styles.chip(activeStatus === status)} onClick={() => setActiveStatus(status)}>
              {status === 'all' ? '全部' : getStatusLabel(status)}
            </span>
          ))}
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="搜索规则名称 / 类型 / 条件..."
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>当前活动规则</h2>
        <p style={styles.sectionText}>用于承载当前规则清单和有效期样本，后续真实链路可替换为活动中心规则快照。</p>
        {filteredRules.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>规则名称</th>
                <th style={styles.th}>类型</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>有效期</th>
                <th style={styles.th}>条件</th>
                <th style={styles.th}>归属团队</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{rule.name}</td>
                  <td style={styles.td}>{rule.type}</td>
                  <td style={styles.td}>{getStatusLabel(rule.status)}</td>
                  <td style={styles.td}>{rule.period}</td>
                  <td style={styles.td}>{rule.condition}</td>
                  <td style={styles.td}>{rule.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>当前筛选条件下暂无促销规则</div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>促销类型说明</h2>
        <div style={styles.typeGrid}>
          {snapshot.promotionTypes.map((item) => (
            <div key={item.name} style={styles.typeCard}>
              <div style={styles.typeName}>{item.name}</div>
              <div style={styles.typeDesc}>{item.description}</div>
              <div style={{ ...styles.typeDesc, marginTop: 8 }}>适用渠道: {item.channel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
