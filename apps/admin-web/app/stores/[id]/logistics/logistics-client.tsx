'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
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
  Tabs,
  Tag,
} from '@m5/ui'
import type {
  LogisticsReservation,
  LogisticsReservationStatus,
  LogisticsSnapshot,
  ShipmentRecord,
  ShipmentStatus,
} from './logistics-data'

const RESERVATION_STATUS_LABELS: Record<LogisticsReservationStatus, [string, string]> = {
  confirmed: ['green', '已确认'],
  pending: ['blue', '待确认'],
  in_progress: ['orange', '进行中'],
}

const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, [string, string]> = {
  pending_shipping: ['blue', '待发货'],
  in_transit: ['orange', '运输中'],
  delivered: ['green', '已签收'],
  abnormal: ['red', '异常'],
}

export default function LogisticsClient({
  snapshot,
}: {
  snapshot: LogisticsSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [shipmentFilter, setShipmentFilter] = useState<ShipmentStatus | 'all'>('all')
  const [reservationSearch, setReservationSearch] = useState('')
  const [tabKey, setTabKey] = useState('shipments')
  const [showCreate, setShowCreate] = useState(false)

  const filteredShipments = useMemo(() => {
    if (shipmentFilter === 'all') {
      return snapshot.shipments
    }

    return snapshot.shipments.filter((item) => item.status === shipmentFilter)
  }, [shipmentFilter, snapshot.shipments])

  const filteredReservations = useMemo(() => {
    const keyword = reservationSearch.trim()
    if (!keyword) {
      return snapshot.reservations
    }

    return snapshot.reservations.filter(
      (item) =>
        item.customer.includes(keyword) ||
        item.staff.includes(keyword) ||
        item.type.includes(keyword)
    )
  }, [reservationSearch, snapshot.reservations])

  const shipmentColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '运单号', dataIndex: 'trackingNo' },
    { title: '供应商', dataIndex: 'supplier' },
    { title: '物品', dataIndex: 'items' },
    { title: '数量', dataIndex: 'quantity' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: ShipmentStatus) => (
        <Tag color={SHIPMENT_STATUS_LABELS[value][0]}>{SHIPMENT_STATUS_LABELS[value][1]}</Tag>
      ),
    },
    { title: '预计到达', dataIndex: 'estimatedArrival' },
    { title: '承运商', dataIndex: 'carrier' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: ShipmentRecord) => (
        <Space size="small">
          <Button size="small" onClick={() => message.info(`${record.id} 物流详情仍为 mock 演示态。`)}>
            详情
          </Button>
          <Button size="small" onClick={() => message.info(`${record.id} 催单仍为 mock 演示态。`)}>
            催单
          </Button>
        </Space>
      ),
    },
  ]

  const reservationColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '客户', dataIndex: 'customer' },
    { title: '类型', dataIndex: 'type' },
    { title: '人数', dataIndex: 'people' },
    { title: '时间', dataIndex: 'time' },
    { title: '负责人', dataIndex: 'staff' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: LogisticsReservationStatus) => (
        <Tag color={RESERVATION_STATUS_LABELS[value][0]}>{RESERVATION_STATUS_LABELS[value][1]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: LogisticsReservation) => (
        <Button size="small" onClick={() => message.info(`${record.id} 调度详情仍为 mock 演示态。`)}>
          调度
        </Button>
      ),
    },
  ]

  

  function handleMockCreate() {
    message.success('预约已创建（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>后勤管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              预约调度 · 物流台账 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 新建预约
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
            拆层，新建预约、调度确认与异常物流处置仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总预约" value={snapshot.summary.reservationCount} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="已确认"
                value={snapshot.summary.confirmedReservations}
                valueStyle={{ color: '#34d399' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="进行中"
                value={snapshot.summary.inProgressReservations}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="待确认"
                value={snapshot.summary.pendingReservations}
                valueStyle={{ color: '#60a5fa' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="运输中"
                value={snapshot.summary.inTransitShipments}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="异常物流"
                value={snapshot.summary.abnormalShipments}
                valueStyle={{ color: '#f87171' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'shipments',
                label: '物流台账',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>物流状态:</span>
                      <Select
                        value={shipmentFilter}
                        onChange={setShipmentFilter}
                        style={{ width: 140 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: 'pending_shipping', label: '待发货' },
                          { value: 'in_transit', label: '运输中' },
                          { value: 'delivered', label: '已签收' },
                          { value: 'abnormal', label: '异常' },
                        ]}
                      />
                    </Space>
                    <Table
                      dataSource={filteredShipments}
                      columns={shipmentColumns}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                    />
                  </>
                ),
              },
              {
                key: 'reservations',
                label: '预约排程',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <Input
                        placeholder="搜索客户/负责人/类型"
                        value={reservationSearch}
                        onChange={(event) => setReservationSearch(event.target.value)}
                        style={{ width: 240 }}
                        allowClear
                      />
                      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                        预约金额: ¥{snapshot.summary.reservationAmount.toLocaleString()}
                      </span>
                    </Space>
                    <Table
                      dataSource={filteredReservations}
                      columns={reservationColumns}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title="新建预约"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="客户姓名" />
            <Input placeholder="预约类型" />
            <Input placeholder="人数" type="number" />
            <Input placeholder="预约时间" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
