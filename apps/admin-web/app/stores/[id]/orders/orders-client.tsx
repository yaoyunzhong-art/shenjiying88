'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Row, Col, message } from 'antd'
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
  Tooltip,
} from '@m5/ui'
import type { StoreOrdersSnapshotDelivery, StoreOrder } from './orders-data'

const STATUS_CONFIG: Record<StoreOrder['status'], { color: string; label: string }> = {
  completed: { color: 'green', label: '已完成' },
  pending: { color: 'blue', label: '待处理' },
  refunded: { color: 'orange', label: '已退款' },
  cancelled: { color: 'default', label: '已取消' },
}

const METHOD_TAG: Record<string, string> = {
  微信: 'green',
  支付宝: 'blue',
  现金: 'orange',
  刷卡: 'purple',
  其他: 'default',
}

export default function StoreOrdersClient({
  snapshot,
}: {
  snapshot: StoreOrdersSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [showRefund, setShowRefund] = useState<StoreOrder | null>(null)
  const [showDetail, setShowDetail] = useState<StoreOrder | null>(null)

  const filteredOrders = useMemo(() => {
    return snapshot.orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesMethod = methodFilter === 'all' || order.method === methodFilter
      const keyword = search.trim()
      const matchesSearch =
        keyword.length === 0 ||
        order.customer.includes(keyword) ||
        order.id.includes(keyword) ||
        order.items.includes(keyword) ||
        order.contact?.includes(keyword)
      return matchesStatus && matchesMethod && matchesSearch
    })
  }, [methodFilter, search, snapshot.orders, statusFilter])

  const totalRevenue = useMemo(
    () => snapshot.summary.completedRevenue,
    [snapshot.summary.completedRevenue]
  )
  const refundedTotal = useMemo(
    () => snapshot.summary.refundedAmount,
    [snapshot.summary.refundedAmount]
  )

  const columns = [
    { title: '单号', dataIndex: 'id', width: 110 },
    {
      title: '客户',
      dataIndex: 'customer',
      render: (value: string, record: StoreOrder) => (
        <Tooltip title={record.contact || ''}>
          <span>{value}</span>
        </Tooltip>
      ),
    },
    { title: '商品', dataIndex: 'items' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '支付方式',
      dataIndex: 'method',
      render: (value: string) => <Tag color={METHOD_TAG[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: StoreOrder['status']) => (
        <Tag color={STATUS_CONFIG[value].color}>{STATUS_CONFIG[value].label}</Tag>
      ),
    },
    { title: '时间', dataIndex: 'time', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: StoreOrder) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => setShowDetail(record)}>
              确认
            </Button>
          )}
          {record.status === 'completed' && (
            <Button size="small" onClick={() => setShowRefund(record)}>
              退款
            </Button>
          )}
          <Button size="small" onClick={() => setShowDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fafafa', margin: 0 }}>订单管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
              门店 {snapshot.storeId} · Delivery {snapshot.deliveryMode} · source{' '}
              {snapshot.sourceLabel} · generatedAt {snapshot.generatedAt}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
              总单量 {snapshot.summary.total} · 已完成 {snapshot.summary.completed} · 待处理{' '}
              {snapshot.summary.pending} · 已退款 {snapshot.summary.refunded}
            </div>
          </div>
          <Button
            type="default"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总订单" value={snapshot.summary.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已完成"
                value={snapshot.summary.completed}
                valueStyle={{ color: '#34d399' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待处理"
                value={snapshot.summary.pending}
                valueStyle={{ color: '#60a5fa' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="退款总计"
                value={refundedTotal.toLocaleString()}
                prefix="¥"
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          {snapshot.error && (
            <div
              style={{
                color: '#fdba74',
                background: 'rgba(251, 146, 60, 0.12)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 12,
              }}
            >
              {snapshot.error}
            </div>
          )}
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
            当前列表由服务端快照透传，交易主链优先读取真实订单接口，失败时回退门店样本。
          </div>
          <Space style={{ width: '100%', marginBottom: 12, flexWrap: 'wrap', gap: 8 }} wrap>
            <Input.Search
              placeholder="搜索单号/客户/手机/商品"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'completed', label: '已完成' },
                { value: 'pending', label: '待处理' },
                { value: 'refunded', label: '已退款' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
            <Select
              value={methodFilter}
              onChange={setMethodFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部方式' },
                { value: '微信', label: '微信' },
                { value: '支付宝', label: '支付宝' },
                { value: '现金', label: '现金' },
                { value: '刷卡', label: '刷卡' },
              ]}
            />
            <div style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: 12 }}>
              已完成营收 ¥{totalRevenue.toLocaleString()}
            </div>
          </Space>
          <Table
            dataSource={filteredOrders}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              pageSizeOptions: ['8', '16', '24'],
            }}
          />
        </Card>

        <Modal
          title="确认退款"
          open={!!showRefund}
          onCancel={() => setShowRefund(null)}
          onOk={() => {
            message.success('退款处理完成')
            setShowRefund(null)
          }}
        >
          {showRefund && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>订单: {showRefund.id}</div>
              <div>客户: {showRefund.customer}</div>
              <div>金额: ¥{showRefund.amount.toLocaleString()}</div>
              <div>商品: {showRefund.items}</div>
              <Input placeholder="退款原因 *" />
            </Space>
          )}
        </Modal>

        <Modal title="订单详情" open={!!showDetail} onCancel={() => setShowDetail(null)} footer={null}>
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>单号: {showDetail.id}</div>
              <div>
                客户: {showDetail.customer}
                {showDetail.contact ? ` (${showDetail.contact})` : ''}
              </div>
              <div>商品: {showDetail.items}</div>
              <div>金额: ¥{showDetail.amount.toLocaleString()}</div>
              <div>支付方式: {showDetail.method}</div>
              <div>时间: {showDetail.time}</div>
              <div>备注: {showDetail.note || '无'}</div>
              {showDetail.status === 'pending' && (
                <Button
                  type="primary"
                  onClick={() => {
                    message.success('订单已确认')
                    setShowDetail(null)
                  }}
                >
                  确认订单
                </Button>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </PageShell>
  )
}
