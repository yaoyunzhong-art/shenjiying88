'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, PageShell, Space, Statistic, Table, Tag } from '@m5/ui'
import type { BrandRecord, BrandSnapshot } from './brand-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

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
        <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />

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
