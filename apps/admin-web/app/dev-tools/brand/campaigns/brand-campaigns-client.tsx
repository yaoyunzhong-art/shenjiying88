'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Button, Card, Input, Modal, PageShell, Select, Space, Statistic, Table, Tag } from '@m5/ui'
import type { BrandCampaignsSnapshot, CampaignRecord } from './brand-campaigns-data'
import SnapshotRefreshCard from '../../../components/snapshot-refresh-card'

export default function BrandCampaignsClient({ snapshot }: { snapshot: BrandCampaignsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [channelFilter, setChannelFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = useMemo(
    () =>
      channelFilter === 'all'
        ? snapshot.campaigns
        : snapshot.campaigns.filter((campaign) => campaign.channel === channelFilter),
    [channelFilter, snapshot.campaigns],
  )
  const totalBudget = useMemo(
    () => snapshot.campaigns.reduce((sum, campaign) => sum + campaign.budget, 0),
    [snapshot.campaigns],
  )
  const totalSpent = useMemo(
    () => snapshot.campaigns.reduce((sum, campaign) => sum + campaign.spent, 0),
    [snapshot.campaigns],
  )
  const totalImpressions = useMemo(
    () => snapshot.campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0),
    [snapshot.campaigns],
  )
  const avgRoi = useMemo(
    () =>
      Math.round(
        snapshot.campaigns.reduce((sum, campaign) => sum + Number.parseInt(campaign.roi, 10), 0) /
          snapshot.campaigns.length,
      ),
    [snapshot.campaigns],
  )

  

  return (
    <PageShell title="营销活动">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          extra={<>渠道过滤: {channelFilter}</>}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>营销活动</h2>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ 创建活动</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          <Card><Statistic label="活动数" value={snapshot.campaigns.length} /></Card>
          <Card><Statistic label="总预算" value={totalBudget.toLocaleString()} prefix="¥" /></Card>
          <Card><Statistic label="已消耗" value={totalSpent.toLocaleString()} prefix="¥" variant="warning" /></Card>
          <Card><Statistic label="总曝光" value={totalImpressions.toLocaleString()} suffix="次" /></Card>
          <Card><Statistic label="平均ROI" value={`${avgRoi}%`} variant="success" /></Card>
          <Card><Statistic label="进行中" value={snapshot.campaigns.filter((campaign) => campaign.status === 'active').length} variant="success" /></Card>
        </div>

        <Card>
          <Select
            value={channelFilter}
            onChange={(value) => setChannelFilter(String(value))}
            style={{ width: 120, marginBottom: 12 }}
            options={[
              { value: 'all', label: '全部渠道' },
              ...snapshot.channels.map((channel) => ({ value: channel, label: channel })),
            ]}
          />
          <Table
            rows={filtered}
            rowKey={(row: CampaignRecord) => row.id}
            columns={[
              { key: 'name', header: '名称', render: (row: CampaignRecord) => row.name },
              { key: 'channel', header: '渠道', render: (row: CampaignRecord) => <Tag>{row.channel}</Tag> },
              { key: 'budget', header: '预算', render: (row: CampaignRecord) => `¥${row.budget.toLocaleString()}` },
              { key: 'spent', header: '已消耗', render: (row: CampaignRecord) => `¥${row.spent.toLocaleString()}` },
              { key: 'impressions', header: '曝光', render: (row: CampaignRecord) => row.impressions.toLocaleString() },
              { key: 'clicks', header: '点击', render: (row: CampaignRecord) => String(row.clicks) },
              { key: 'conversions', header: '转化', render: (row: CampaignRecord) => String(row.conversions) },
              {
                key: 'roi',
                header: 'ROI',
                render: (row: CampaignRecord) => (
                  <Tag variant={Number.parseInt(row.roi, 10) >= 60 ? 'success' : 'primary'}>{row.roi}</Tag>
                ),
              },
              {
                key: 'status',
                header: '状态',
                render: (row: CampaignRecord) => {
                  const label = row.status === 'active' ? '进行中' : row.status === 'paused' ? '已暂停' : '已结束'
                  const variant = row.status === 'active' ? 'success' : row.status === 'paused' ? 'warning' : 'default'
                  return <Tag variant={variant as 'success' | 'warning' | 'default'}>{label}</Tag>
                },
              },
              { key: 'actions', header: '操作', render: (row: CampaignRecord) => <Button size="sm" disabled={row.status === 'ended'}>分析</Button> },
            ]}
          />
        </Card>

        <Modal title="创建活动" open={showCreate} onClose={() => setShowCreate(false)}>
          <Space style={{ width: '100%', flexDirection: 'column' }}>
            <Input placeholder="活动名称" />
            <Input placeholder="预算" type="number" />
            <Select
              placeholder="渠道"
              options={snapshot.channels.map((channel) => ({ value: channel, label: channel }))}
              style={{ width: '100%' }}
            />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
