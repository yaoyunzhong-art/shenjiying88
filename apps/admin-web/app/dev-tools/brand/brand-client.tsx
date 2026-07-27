'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageShell, Space, Statistic, Table, Tag } from '@m5/ui'
import type { BrandRecord, BrandSnapshot } from './brand-data'

const refreshCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.3)',
  padding: 12,
  color: '#cbd5e1',
  fontSize: 12,
} as const

const refreshButtonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const

function renderStatus(status: BrandRecord['status']) {
  if (status === 'active') return <Tag variant="success">已激活</Tag>
  if (status === 'pending') return <Tag variant="warning">待审核</Tag>
  return <Tag variant="error">已过期</Tag>
}

export default function BrandClient({ snapshot }: { snapshot: BrandSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => snapshot.brands.filter((brand) => !search.trim() || brand.name.includes(search.trim())),
    [snapshot.brands, search],
  )

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="品牌运营">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={refreshCardStyle}>
          <div>
            客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
          </div>
          <button type="button" onClick={handleRefresh} style={refreshButtonStyle}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>品牌运营</h2>
          <Button variant="primary">+ 新建品牌</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <Card><Statistic label="品牌数" value={snapshot.brands.length} /></Card>
          <Card><Statistic label="活跃" value={snapshot.brands.filter((brand) => brand.status === 'active').length} variant="success" /></Card>
          <Card><Statistic label="总模板" value={snapshot.brands.reduce((sum, brand) => sum + brand.templates, 0)} /></Card>
          <Card><Statistic label="总活动" value={snapshot.brands.reduce((sum, brand) => sum + brand.campaigns, 0)} /></Card>
          <Card><Statistic label="邮件模板" value={snapshot.brands.reduce((sum, brand) => sum + brand.emailCount, 0)} /></Card>
        </div>

        <Card>
          <Input
            placeholder="搜索品牌"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 220, marginBottom: 12 }}
          />
          <Table
            rows={filtered}
            rowKey={(row: BrandRecord) => row.id}
            columns={[
              { key: 'name', header: '品牌名', render: (row: BrandRecord) => row.name },
              { key: 'domain', header: '域名', render: (row: BrandRecord) => row.domain },
              { key: 'status', header: '状态', render: (row: BrandRecord) => renderStatus(row.status) },
              { key: 'templates', header: '模板', render: (row: BrandRecord) => String(row.templates) },
              { key: 'campaigns', header: '活动', render: (row: BrandRecord) => String(row.campaigns) },
              { key: 'emailCount', header: '邮箱', render: (row: BrandRecord) => String(row.emailCount) },
              { key: 'created', header: '创建', render: (row: BrandRecord) => row.created },
              {
                key: 'actions',
                header: '操作',
                render: () => (
                  <Space>
                    <Button size="sm">管理</Button>
                    <Button size="sm" disabled>配置</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </PageShell>
  )
}
