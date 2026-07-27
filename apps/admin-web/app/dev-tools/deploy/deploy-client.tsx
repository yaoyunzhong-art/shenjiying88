'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Modal, PageShell, Select, Space, Statistic, Table, Tag } from '@m5/ui'
import type { DeploymentRecord, DeploySnapshot } from './deploy-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

function renderEnvTag(env: DeploymentRecord['env']) {
  const variant = env === 'production' ? 'error' : env === 'staging' ? 'primary' : 'default'
  return <Tag variant={variant as 'error' | 'primary' | 'default'}>{env}</Tag>
}

function renderStatusTag(status: DeploymentRecord['status']) {
  const mapping = {
    success: { label: '成功', variant: 'success' },
    failed: { label: '失败', variant: 'error' },
    rolling: { label: '部署中', variant: 'primary' },
    rollback: { label: '回滚', variant: 'warning' },
  } as const
  const item = mapping[status]
  return <Tag variant={item.variant}>{item.label}</Tag>
}

export default function DeployClient({ snapshot }: { snapshot: DeploySnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [envFilter, setEnvFilter] = useState('all')
  const [showDeploy, setShowDeploy] = useState(false)

  const filtered = useMemo(
    () => (envFilter === 'all' ? snapshot.deployments : snapshot.deployments.filter((item) => item.env === envFilter)),
    [envFilter, snapshot.deployments],
  )
  const productionDeployments = useMemo(
    () => snapshot.deployments.filter((item) => item.env === 'production'),
    [snapshot.deployments],
  )
  const successRate = useMemo(() => {
    if (productionDeployments.length === 0) return 0
    return Math.round(
      (productionDeployments.filter((item) => item.status === 'success').length /
        productionDeployments.length) *
        100,
    )
  }, [productionDeployments])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="部署管理 (P-53)">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          extra={<>环境过滤: {envFilter}</>}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>部署管理 (P-53)</h2>
          <Button variant="primary" onClick={() => setShowDeploy(true)}>+ 新建部署</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 16 }}>
          <Card><Statistic label="部署记录" value={snapshot.deployments.length} /></Card>
          <Card><Statistic label="生产上线" value={productionDeployments.length} /></Card>
          <Card><Statistic label="成功率" value={`${successRate}%`} variant="success" /></Card>
          <Card><Statistic label="回滚数" value={snapshot.deployments.filter((item) => item.status === 'rollback').length} variant="danger" /></Card>
          <Card><Statistic label="失败数" value={snapshot.deployments.filter((item) => item.status === 'failed').length} variant="danger" /></Card>
          <Card><Statistic label="进行中" value={snapshot.deployments.filter((item) => item.status === 'rolling').length} variant="warning" /></Card>
          <Card><Statistic label="总commits" value={snapshot.deployments.reduce((sum, item) => sum + item.commits, 0)} /></Card>
          <Card><Statistic label="平均时长" value="11min" /></Card>
        </div>

        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Select
              value={envFilter}
              onChange={(value) => setEnvFilter(String(value))}
              style={{ width: 120 }}
              options={snapshot.envOptions}
            />
          </Space>
          <Table
            rows={filtered}
            rowKey={(row: DeploymentRecord) => row.id}
            columns={[
              { key: 'name', header: '名称', render: (row: DeploymentRecord) => row.name },
              { key: 'version', header: '版本', render: (row: DeploymentRecord) => <Tag>{row.version}</Tag> },
              { key: 'env', header: '环境', render: (row: DeploymentRecord) => renderEnvTag(row.env) },
              { key: 'status', header: '状态', render: (row: DeploymentRecord) => renderStatusTag(row.status) },
              { key: 'time', header: '时间', render: (row: DeploymentRecord) => row.time },
              { key: 'duration', header: '时长', render: (row: DeploymentRecord) => row.duration },
              { key: 'deployer', header: '部署人', render: (row: DeploymentRecord) => row.deployer },
              {
                key: 'actions',
                header: '操作',
                render: (row: DeploymentRecord) => (
                  <Space>
                    <Button size="sm">详情</Button>
                    <Button size="sm" disabled={row.status !== 'success'}>回滚</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Modal title="新建部署" open={showDeploy} onClose={() => setShowDeploy(false)}>
          <Space style={{ width: '100%', flexDirection: 'column' }}>
            <Input placeholder="版本号 (如v2.4.0)" />
            <Select
              placeholder="目标环境"
              options={snapshot.envOptions.filter((option) => option.value !== 'all')}
              style={{ width: '100%' }}
            />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
