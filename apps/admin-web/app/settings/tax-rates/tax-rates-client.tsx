"use client"

import type * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import SnapshotRefreshButton from '../../components/snapshot-refresh-button'
import type {
  TaxRatePreview,
  TaxRatesSnapshotDelivery,
  TaxRuleItem,
} from './tax-rates-data'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

export default function TaxRatesClient({
  snapshot,
}: {
  snapshot: TaxRatesSnapshotDelivery
}) {
  const [rates, setRates] = useState<TaxRatePreview[]>(snapshot.rates)
  const [rules, setRules] = useState<TaxRuleItem[]>(snapshot.rules)
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();

  useEffect(() => {
    setRates(snapshot.rates)
    setRules(snapshot.rules)
  }, [snapshot.rates, snapshot.rules])

  const summary = useMemo(
    () => ({
      categories: rates.length,
      invoiceModes: new Set(rates.map((item) => item.invoiceMode)).size,
      preferentialRateCount: rates.filter((item) => item.taxRate !== '13%').length,
    }),
    [rates],
  )

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <h1 style={titleStyle}>税率配置</h1>
          <p style={subtitleStyle}>
            首屏读取服务端税率快照，客户端只保留展示层与刷新入口，避免继续由页面本身伪造 loading。
          </p>
          <div style={metaStyle}>
            Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel} · generatedAt{' '}
            {snapshot.generatedAt}
          </div>
        </div>
        <SnapshotRefreshButton
  onRefresh={handleRefresh}
  isRefreshing={isRefreshing}
  variant="light"
  idleLabel="刷新快照"
  loadingLabel="刷新中..."
/>
      </section>

      {snapshot.error ? <section style={warningStyle}>{snapshot.error}</section> : null}

      <section style={statGridStyle}>
        <StatCard label="品类数" value={String(summary.categories)} detail="当前治理样本覆盖的品类" />
        <StatCard label="开票模式" value={String(summary.invoiceModes)} detail="普通票 / 专票组合" />
        <StatCard label="差异税率" value={String(summary.preferentialRateCount)} detail="非 13% 的差异配置" />
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>品类税率表</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>品类</th>
              <th style={thStyle}>税率</th>
              <th style={thStyle}>税种</th>
              <th style={thStyle}>生效日期</th>
              <th style={thStyle}>开票模式</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((item) => (
              <tr key={item.category}>
                <td style={tdStrongStyle}>{item.category}</td>
                <td style={tdStyle}>{item.taxRate}</td>
                <td style={tdStyle}>{item.taxType}</td>
                <td style={tdStyle}>{item.effectiveDate}</td>
                <td style={tdStyle}>{item.invoiceMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>税务规则</div>
        <div style={ruleListStyle}>
          {rules.map((item) => (
            <div key={item.key} style={ruleItemStyle}>
              <span style={ruleKeyStyle}>{item.key}</span>
              <span style={ruleValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={hintStyle}>
          温馨提示: 税率变更需提前 7 天配置生效日期，切换前创建的历史订单继续使用原税率。
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={statDetailStyle}>{detail}</div>
    </article>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 16,
}
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }
const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#475569',
}
const metaStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const warningStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(245, 158, 11, 0.3)',
  background: 'rgba(255, 247, 237, 0.9)',
  color: '#9a3412',
  fontSize: 13,
}
const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}
const statCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 16,
}
const statLabelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const statValueStyle: React.CSSProperties = { marginTop: 8, fontSize: 24, fontWeight: 700, color: '#0f172a' }
const statDetailStyle: React.CSSProperties = { marginTop: 6, fontSize: 12, color: '#475569' }
const panelStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 18,
}
const sectionTitleStyle: React.CSSProperties = { marginBottom: 14, fontSize: 16, fontWeight: 700, color: '#0f172a' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 12,
  color: '#64748b',
  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
}
const tdStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: 13,
  color: '#334155',
  borderBottom: '1px solid rgba(241, 245, 249, 0.9)',
}
const tdStrongStyle: React.CSSProperties = { ...tdStyle, fontWeight: 600, color: '#0f172a' }
const ruleListStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const ruleItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 12px',
  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
}
const ruleKeyStyle: React.CSSProperties = { fontSize: 13, color: '#64748b' }
const ruleValueStyle: React.CSSProperties = { fontSize: 13, color: '#0f172a', fontWeight: 600 }
const hintStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(59, 130, 246, 0.08)',
  color: '#1d4ed8',
  fontSize: 13,
  lineHeight: 1.6,
}
