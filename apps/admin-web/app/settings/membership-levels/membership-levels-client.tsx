'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { MembershipLevelsSnapshot } from './membership-levels-data'
import { summarizeMembershipLevels } from './membership-levels-data'

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
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 },
  levelGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 },
  levelCard: (active: boolean) => ({
    borderRadius: 12,
    border: `1px solid ${active ? '#60a5fa' : 'rgba(148, 163, 184, 0.12)'}`,
    background: active ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.45)',
    padding: 16,
    cursor: 'pointer',
  }),
  levelName: { fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 8 },
  levelText: { fontSize: 12, color: '#94a3b8', lineHeight: 1.6 },
  ruleList: { display: 'grid', gap: 12 },
  ruleItem: { borderRadius: 12, background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.12)', padding: 16 },
} as const

export default function MembershipLevelsClient({ snapshot }: { snapshot: MembershipLevelsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activeLevel, setActiveLevel] = useState<number>(snapshot.levels[0]?.level ?? 1)

  const summary = useMemo(() => summarizeMembershipLevels(snapshot.levels), [snapshot.levels])
  const selectedLevel = useMemo(
    () => snapshot.levels.find((item) => item.level === activeLevel) ?? snapshot.levels[0],
    [activeLevel, snapshot.levels],
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>会员等级设置</h1>
          <p style={styles.subtitle}>
            等级定义、权益描述和升降级规则来自服务端快照。客户端仅负责等级切换与刷新交互，刷新动作统一回到
            `loadMembershipLevelsSnapshot()`。
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
          <div style={styles.cardLabel}>等级层级数</div>
          <div style={styles.cardValue}>{summary.totalLevels}</div>
          <div style={styles.cardHint}>当前本地快照包含四档会员等级。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>最高积分门槛</div>
          <div style={styles.cardValue}>{summary.highestThreshold.toLocaleString()}</div>
          <div style={styles.cardHint}>钻石档位对应的积分阈值。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>专属服务等级</div>
          <div style={styles.cardValue}>{summary.exclusiveServiceCount}</div>
          <div style={styles.cardHint}>具备专属客服或 VIP 通道的层级数。</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>治理规则数</div>
          <div style={styles.cardValue}>{snapshot.rules.length}</div>
          <div style={styles.cardHint}>用于说明升级、降级和权益刷新机制。</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>等级定义</h2>
        <p style={styles.sectionText}>点击不同等级可查看对应积分门槛、折扣合同和服务说明。</p>
        <div style={styles.levelGrid}>
          {snapshot.levels.map((item) => (
            <button
              key={item.level}
              type="button"
              style={styles.levelCard(activeLevel === item.level)}
              onClick={() => setActiveLevel(item.level)}
            >
              <div style={styles.levelName}>Lv.{item.level} {item.name}</div>
              <div style={styles.levelText}>积分门槛: {item.minPoints.toLocaleString()}</div>
              <div style={styles.levelText}>折扣: {item.discount}</div>
              <div style={styles.levelText}>服务: {item.serviceLevel}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedLevel ? (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>当前等级详情</h2>
          <p style={styles.sectionText}>用于验证壳层化后仍能展示等级权益摘要。</p>
          <div style={styles.ruleItem}>
            <div style={styles.levelName}>
              Lv.{selectedLevel.level} {selectedLevel.name}
            </div>
            <div style={styles.levelText}>最低积分: {selectedLevel.minPoints.toLocaleString()}</div>
            <div style={styles.levelText}>折扣合同: {selectedLevel.discount}</div>
            <div style={styles.levelText}>权益说明: {selectedLevel.benefits}</div>
            <div style={styles.levelText}>服务等级: {selectedLevel.serviceLevel}</div>
          </div>
        </div>
      ) : null}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>升降级规则</h2>
        <div style={styles.ruleList}>
          {snapshot.rules.map((rule) => (
            <div key={rule.title} style={styles.ruleItem}>
              <div style={styles.levelName}>{rule.title}</div>
              <div style={styles.levelText}>{rule.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
