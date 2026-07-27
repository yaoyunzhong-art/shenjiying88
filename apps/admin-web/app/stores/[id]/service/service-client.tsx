'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
  Input,
  Modal,
  PageShell,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from '@m5/ui'
import type {
  ServiceSnapshot,
  ServiceTicket,
  TicketPriority,
  TicketStatus,
} from './service-data'

const PRIORITY_LABELS: Record<TicketPriority, { color: string; label: string }> = {
  low: { color: 'default', label: '低' },
  medium: { color: 'blue', label: '中' },
  high: { color: 'orange', label: '高' },
  urgent: { color: 'red', label: '紧急' },
}

const STATUS_LABELS: Record<TicketStatus, { color: string; label: string }> = {
  open: { color: 'red', label: '待处理' },
  processing: { color: 'blue', label: '处理中' },
  resolved: { color: 'green', label: '已解决' },
  closed: { color: 'default', label: '已关闭' },
}

export default function ServiceClient({
  snapshot,
}: {
  snapshot: ServiceSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const filteredTickets = useMemo(() => {
    return snapshot.tickets.filter(
      (item) =>
        (statusFilter === 'all' || item.status === statusFilter) &&
        (priorityFilter === 'all' || item.priority === priorityFilter) &&
        (!searchText || item.title.includes(searchText) || item.customer.includes(searchText))
    )
  }, [priorityFilter, searchText, snapshot.tickets, statusFilter])

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '工单号', dataIndex: 'id' },
    { title: '标题', dataIndex: 'title' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    { title: '客户', dataIndex: 'customer' },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (value: TicketPriority) => (
        <Tag color={PRIORITY_LABELS[value].color}>{PRIORITY_LABELS[value].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: TicketStatus) => (
        <Tag color={STATUS_LABELS[value].color}>{STATUS_LABELS[value].label}</Tag>
      ),
    },
    { title: '负责人', dataIndex: 'assignee' },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: 'SLA',
      dataIndex: 'slaHours',
      render: (value: number) => `${value}h`,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: ServiceTicket) => (
        <Space size="small">
          <Button size="small" onClick={() => message.success(`${record.id} 已进入处理流（mock）`)}>
            处理
          </Button>
          <Button size="small" onClick={() => message.info(`${record.id} 已转派（mock）`)}>
            转派
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>售后服务</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              工单 · 客诉 · 维修 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              创建工单
            </Button>
          </Space>
        </div>

        {snapshot.error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        ) : null}

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer
            拆层，工单创建、流转与派单仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总工单" value={snapshot.summary.total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="待处理" value={snapshot.summary.open} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="处理中" value={snapshot.summary.processing} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="已解决" value={snapshot.summary.resolved} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="紧急" value={snapshot.summary.urgent} valueStyle={{ color: '#ef4444' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="平均SLA" value={snapshot.summary.avgSlaHours} suffix="h" valueStyle={{ color: '#fbbf24' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Space style={{ width: '100%', marginBottom: 12, flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="搜索标题/客户"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              style={{ width: 220 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'open', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' },
                { value: 'closed', label: '已关闭' },
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部优先级' },
                { value: 'urgent', label: '紧急' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' },
              ]}
            />
            <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
              共 {filteredTickets.length} 条
            </span>
          </Space>
          <Table dataSource={filteredTickets} columns={columns} rowKey="id" pagination={{ pageSize: 6 }} />
        </Card>

        <Modal
          title="创建工单"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={() => {
            message.success('工单已创建（mock）')
            setShowCreate(false)
            handleRefresh()
          }}
          okText="创建"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="工单标题" />
            <Select
              placeholder="类型"
              options={[
                { value: '设备故障', label: '设备故障' },
                { value: '系统问题', label: '系统问题' },
                { value: '客诉', label: '客诉' },
                { value: '环境', label: '环境' },
              ]}
            />
            <Select
              placeholder="优先级"
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
            <Input placeholder="客户信息" />
            <Input.TextArea rows={3} placeholder="问题描述" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
