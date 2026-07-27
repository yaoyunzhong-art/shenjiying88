'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import { Button, Card, Empty, Input, Modal, PageShell, Select, Space, Statistic, Table, Tabs, Tag } from '@m5/ui'
import { EVENT_STATUS_META, type EventsSnapshot, type EventStatus, type StoreEvent } from './events-data'

const DIAGNOSTIC_COLORS = {
  stable: 'green',
  watch: 'orange',
  risk: 'red',
} as const

export default function EventsClient({ snapshot }: { snapshot: EventsSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeKey, setActiveKey] = useState('list')
  const [detailEvent, setDetailEvent] = useState<StoreEvent | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const typeOptions = useMemo(() => ['all', ...new Set(snapshot.events.map((item) => item.type))], [snapshot.events])
  const filteredEvents = useMemo(
    () =>
      snapshot.events.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        return true
      }),
    [snapshot.events, statusFilter, typeFilter],
  )
  const upcomingEvents = useMemo(
    () => snapshot.events.filter((item) => item.status === 'published' || item.status === 'running'),
    [snapshot.events],
  )

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '活动', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 120 },
    { title: '日期', dataIndex: 'date', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: EventStatus) => <Tag color={EVENT_STATUS_META[value].color}>{EVENT_STATUS_META[value].label}</Tag>,
    },
    { title: '参与人数', dataIndex: 'participants', width: 110, render: (value: number) => `${value} 人` },
    { title: '预算', dataIndex: 'budget', width: 120, render: (value: number) => `¥${value.toLocaleString()}` },
    { title: '负责人', dataIndex: 'owner', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: StoreEvent) => (
        <Space size="small">
          <Button size="small" onClick={() => setDetailEvent(record)}>
            详情
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => message.info(`${record.name} 发布链路仍处于结构固证演示态。`)}
          >
            发布
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="活动管理" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card size="small">
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>活动管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              活动台账 · 发布状态 · 预算跟踪 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('活动报表导出仍处于结构固证演示态。')}>导出报表</Button>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              创建活动
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="本月活动" value={snapshot.summary.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="待发布" value={snapshot.summary.published} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="进行中" value={snapshot.summary.running} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总预算" value={snapshot.summary.totalBudget.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="结构固证、审批链路与 ROI 归因状态">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.title}</span>
                  <Tag color={DIAGNOSTIC_COLORS[item.status]}>{item.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[
              {
                key: 'list',
                label: '活动列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                      <span style={{ color: '#94a3b8' }}>状态:</span>
                      <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as EventStatus | 'all')}
                        style={{ width: 140 }}
                        options={[
                          { value: 'all', label: '全部状态' },
                          { value: 'draft', label: '草稿' },
                          { value: 'published', label: '已发布' },
                          { value: 'running', label: '进行中' },
                          { value: 'completed', label: '已完成' },
                          { value: 'cancelled', label: '已取消' },
                        ]}
                      />
                      <span style={{ color: '#94a3b8' }}>类型:</span>
                      <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        style={{ width: 180 }}
                        options={typeOptions.map((item) => ({
                          value: item,
                          label: item === 'all' ? '全部类型' : item,
                        }))}
                      />
                      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
                        共 {filteredEvents.length} 个活动
                      </span>
                    </Space>
                    {filteredEvents.length ? (
                      <Table dataSource={filteredEvents} columns={columns} rowKey="id" pagination={{ pageSize: 6 }} />
                    ) : (
                      <Empty description="无匹配活动" />
                    )}
                  </>
                ),
              },
              {
                key: 'upcoming',
                label: `待执行(${upcomingEvents.length})`,
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {upcomingEvents.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                              {item.date} · {item.channel} · 负责人 {item.owner}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{item.objective}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag color={EVENT_STATUS_META[item.status].color}>{EVENT_STATUS_META[item.status].label}</Tag>
                            <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 8 }}>
                              预算 ¥{item.budget.toLocaleString()}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                              预估参与 {item.participants} 人
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · refreshPath {snapshot.refreshPath} · {snapshot.note}
          </div>
        </Card>

        <Modal
          title="创建活动"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onOk={() => {
            message.success('活动草稿已创建（演示态）')
            setCreateOpen(false)
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <Input placeholder="活动类型" />
            <Input placeholder="计划日期" />
            <Input.TextArea rows={4} placeholder="活动目标与执行说明" />
          </Space>
        </Modal>

        <Modal
          title={`活动详情 - ${detailEvent?.name ?? ''}`}
          open={Boolean(detailEvent)}
          onCancel={() => setDetailEvent(null)}
          footer={<Button onClick={() => setDetailEvent(null)}>关闭</Button>}
        >
          {detailEvent ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>编号: {detailEvent.id}</div>
              <div>类型: {detailEvent.type}</div>
              <div>日期: {detailEvent.date}</div>
              <div>负责人: {detailEvent.owner}</div>
              <div>渠道: {detailEvent.channel}</div>
              <div>参与人数: {detailEvent.participants} 人</div>
              <div>预算: ¥{detailEvent.budget.toLocaleString()}</div>
              <div>状态: {EVENT_STATUS_META[detailEvent.status].label}</div>
              <div style={{ gridColumn: '1 / span 2' }}>目标: {detailEvent.objective}</div>
            </div>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  )
}
