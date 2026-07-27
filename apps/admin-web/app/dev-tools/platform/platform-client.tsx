'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, PageShell, Space, Statistic, Tabs, Tag } from '@m5/ui'
import type { PlatformSnapshot } from './platform-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

export default function PlatformClient({ snapshot }: { snapshot: PlatformSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [tabKey, setTabKey] = useState('api')

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="开放平台">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={refreshCardStyle}>
          <div>
            客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath} · 当前标签: {tabKey}
          </div>
          <button type="button" onClick={handleRefresh} style={refreshButtonStyle}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>开放平台</h2>
          <Button variant="primary">开发者接入</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <Card><Statistic label="API版本" value="v3" /></Card>
          <Card><Statistic label="QPS上限" value={5000} suffix="/s" /></Card>
          <Card><Statistic label="活跃开发者" value={42} /></Card>
          <Card><Statistic label="API端点" value={156} /></Card>
          <Card><Statistic label="本月调用" value="1.2M" /></Card>
        </div>

        <Tabs
          activeKey={tabKey}
          onChange={(value) => setTabKey(String(value))}
          items={[
            { key: 'api', label: 'API管理' },
            { key: 'webhook', label: 'Webhook' },
            { key: 'logs', label: '调用日志' },
          ]}
        />

        {tabKey === 'api' && (
          <Card>
            <Space style={{ width: '100%', flexDirection: 'column' }}>
              {snapshot.docItems.map((item) => (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                  <span style={{ color: '#e2e8f0' }}>{item}</span>
                  <Space>
                    <Tag variant="success">v3</Tag>
                    <Button size="sm" variant="ghost">文档 →</Button>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        )}
        {tabKey === 'webhook' && <Card><div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Webhook配置 (开发中)</div></Card>}
        {tabKey === 'logs' && <Card><div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>调用日志 (开发中)</div></Card>}
      </Space>
    </PageShell>
  )
}
