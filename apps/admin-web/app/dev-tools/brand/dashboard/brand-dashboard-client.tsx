'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, PageShell, Select, Space, Statistic, Table, Tag } from '@m5/ui'
import type { BrandDashboardSnapshot, BrandMetric, RevenueRow } from './brand-dashboard-data'
import SnapshotRefreshCard from '../../../components/snapshot-refresh-card'

export default function BrandDashboardClient({ snapshot }: { snapshot: BrandDashboardSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [period, setPeriod] = useState('halfyear')

  const totalRevenue = useMemo(
    () => snapshot.revenue.reduce((sum, row) => sum + row.revenue, 0),
    [snapshot.revenue],
  )
  const totalCost = useMemo(
    () => snapshot.revenue.reduce((sum, row) => sum + row.cost, 0),
    [snapshot.revenue],
  )
  const totalLeads = useMemo(
    () => snapshot.revenue.reduce((sum, row) => sum + row.leads, 0),
    [snapshot.revenue],
  )
  const avgRoi = useMemo(
    () =>
      Math.round(
        snapshot.revenue.reduce((sum, row) => sum + Number.parseInt(row.roi, 10), 0) /
          snapshot.revenue.length,
      ),
    [snapshot.revenue],
  )

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="品牌运营看板">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          extra={<>周期过滤: {period}</>}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>品牌运营看板</h2>
          <Select
            value={period}
            onChange={(value) => setPeriod(String(value))}
            style={{ width: 120 }}
            options={[
              { value: 'halfyear', label: '近半年' },
              { value: 'year', label: '近一年' },
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <Card><Statistic label="品牌数" value={snapshot.brandMetrics.length} /></Card>
          <Card><Statistic label="总营收" value={totalRevenue.toLocaleString()} prefix="¥" variant="success" /></Card>
          <Card><Statistic label="总成本" value={totalCost.toLocaleString()} prefix="¥" /></Card>
          <Card><Statistic label="平均ROI" value={`${avgRoi}%`} variant="warning" /></Card>
          <Card><Statistic label="总线索" value={totalLeads} suffix="条" /></Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 12 }}>营收趋势</div>
            <Table
              rows={snapshot.revenue}
              rowKey={(row: RevenueRow) => row.month}
              columns={[
                { key: 'month', header: '月份', render: (row: RevenueRow) => row.month },
                { key: 'revenue', header: '营收', render: (row: RevenueRow) => `¥${row.revenue.toLocaleString()}` },
                { key: 'cost', header: '成本', render: (row: RevenueRow) => `¥${row.cost.toLocaleString()}` },
                {
                  key: 'roi',
                  header: 'ROI',
                  render: (row: RevenueRow) => (
                    <Tag variant={Number.parseInt(row.roi, 10) >= 60 ? 'success' : 'primary'}>{row.roi}</Tag>
                  ),
                },
                { key: 'leads', header: '线索', render: (row: RevenueRow) => String(row.leads) },
                { key: 'conversion', header: '转化率', render: (row: RevenueRow) => row.conversion },
              ]}
            />
          </Card>
          <Card>
            <div style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 12 }}>品牌社媒表现</div>
            {snapshot.brandMetrics.map((metric: BrandMetric) => (
              <div key={metric.brand} style={{ padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <div style={{ color: '#e2e8f0', fontSize: 13 }}>{metric.brand}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  <span>触达: {metric.reach.toLocaleString()}</span>
                  <span>互动: {metric.engagement}</span>
                  <span>{metric.sentiment}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </Space>
    </PageShell>
  )
}
