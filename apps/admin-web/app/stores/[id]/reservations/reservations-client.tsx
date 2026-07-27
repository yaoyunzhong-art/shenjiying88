'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  PageShell,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from '@m5/ui'
import type { ReservationRecord, ReservationsSnapshot, ReservationStatus } from './reservations-data'

const STATUS_CFG: Record<ReservationStatus, [string, string]> = {
  confirmed: ['green', '已确认'],
  pending: ['blue', '待确认'],
  cancelled: ['default', '已取消'],
}

export default function ReservationsClient({
  snapshot,
}: {
  snapshot: ReservationsSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [tabKey, setTabKey] = useState('list')

  const filteredReservations = useMemo(() => {
    return snapshot.reservations.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch =
        search.trim().length === 0 ||
        item.customer.includes(search.trim()) ||
        item.phone.includes(search.trim())

      return matchesStatus && matchesSearch
    })
  }, [search, snapshot.reservations, statusFilter])

  const reservationColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '客户', dataIndex: 'customer' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    { title: '日期', dataIndex: 'date' },
    { title: '时间', dataIndex: 'time' },
    { title: '人数', dataIndex: 'people' },
    {
      title: '来源',
      dataIndex: 'source',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: ReservationRecord['status']) => (
        <Tag color={STATUS_CFG[value][0]}>{STATUS_CFG[value][1]}</Tag>
      ),
    },
    { title: '联系方式', dataIndex: 'phone' },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: ReservationRecord) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              onClick={() => message.info(`预约 ${record.id} 当前仍为 mock 确认链路。`)}
            >
              确认
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button
              size="small"
              onClick={() => message.info(`预约 ${record.id} 当前仍为 mock 取消链路。`)}
            >
              取消
            </Button>
          )}
          <Button
            size="small"
            onClick={() => message.info(`预约 ${record.id} 详情仍为 mock 演示态。`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handleMockCreate() {
    message.success('预约已创建（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>预约管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              场地预约 · 设备预约 · 排程管理 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 创建预约
            </Button>
          </Space>
        </div>

        {snapshot.error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        )}

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer
            拆层，确认、取消、创建预约仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="预约总数" value={snapshot.summary.totalCount} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="已确认" value={snapshot.summary.confirmedCount} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="待确认" value={snapshot.summary.pendingCount} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="总人数" value={snapshot.summary.totalPeople} suffix="人" valueStyle={{ color: '#6366f1' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="取消" value={snapshot.summary.cancelledCount} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'list',
                label: '列表视图',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <Input
                        placeholder="搜索客户/电话"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={{ width: 200 }}
                        allowClear
                      />
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: 'confirmed', label: '已确认' },
                          { value: 'pending', label: '待确认' },
                          { value: 'cancelled', label: '已取消' },
                        ]}
                      />
                    </Space>
                    <Table
                      dataSource={filteredReservations}
                      columns={reservationColumns}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                    />
                  </>
                ),
              },
              {
                key: 'calendar',
                label: '日历视图',
                children: <Empty description="日历视图开发中…" />,
              },
            ]}
          />
        </Card>

        <Card size="small">
          <Space>
            <Button onClick={() => message.info('排程表仍处于 mock 演示态。')}>排程表</Button>
            <Button onClick={() => message.info('导出预约列表仍处于 mock 演示态。')}>导出预约列表</Button>
            <Button onClick={() => message.info('模板管理仍处于 mock 演示态。')}>模板</Button>
          </Space>
        </Card>

        <Modal
          title="创建预约"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="客户姓名" />
            <Input placeholder="联系电话" />
            <Select
              placeholder="预约类型"
              style={{ width: '100%' }}
              options={[
                { value: '生日派对', label: '生日派对' },
                { value: '团建活动', label: '团建活动' },
                { value: 'VR体验', label: 'VR体验' },
                { value: '台球', label: '台球' },
                { value: '电竞包间', label: '电竞包间' },
              ]}
            />
            <Input placeholder="日期" type="date" />
            <Input placeholder="时间" />
            <Input placeholder="人数" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
