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
  Tabs,
  Tag,
} from '@m5/ui'
import type { PurchaseRecord, PurchaseStatus, PurchasingSnapshot } from './purchasing-data'

const STATUS_LABELS: Record<PurchaseStatus, [string, string]> = {
  pending: ['default', '待下单'],
  ordered: ['blue', '已下单'],
  partial: ['orange', '部分到货'],
  received: ['green', '已到货'],
}

export default function PurchasingClient({
  snapshot,
}: {
  snapshot: PurchasingSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tabKey, setTabKey] = useState('list')
  const [showCreate, setShowCreate] = useState(false)

  const categories = useMemo(
    () => Array.from(new Set(snapshot.purchases.map((item) => item.category))),
    [snapshot.purchases]
  )

  const filteredPurchases = useMemo(() => {
    return snapshot.purchases.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

      return matchesStatus && matchesCategory
    })
  }, [categoryFilter, snapshot.purchases, statusFilter])

  const purchaseColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '单号', dataIndex: 'id' },
    { title: '供应商', dataIndex: 'supplier' },
    { title: '物品', dataIndex: 'items' },
    { title: '分类', dataIndex: 'category', render: (value: string) => <Tag>{value}</Tag> },
    { title: '金额', dataIndex: 'total', render: (value: number) => `¥${value.toLocaleString()}` },
    { title: '下单时间', dataIndex: 'created' },
    { title: '预期到货', dataIndex: 'expected' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: PurchaseStatus) => <Tag color={STATUS_LABELS[value][0]}>{STATUS_LABELS[value][1]}</Tag>,
    },
    { title: '签收人', dataIndex: 'receiver', render: (value?: string) => value || '-' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: PurchaseRecord) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => message.info(`${record.id} 下单仍为 mock 演示态。`)}>
              下单
            </Button>
          )}
          {(record.status === 'ordered' || record.status === 'partial') && (
            <Button size="small" onClick={() => message.info(`${record.id} 收货仍为 mock 演示态。`)}>
              收货
            </Button>
          )}
          <Button size="small" onClick={() => message.info(`${record.id} 催单仍为 mock 演示态。`)}>
            催单
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handleMockCreate() {
    message.success('采购单已创建（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>采购管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              采购单列表 · 供应商台账 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              新建采购单
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
            拆层，下单、收货与取消仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总采购单" value={snapshot.summary.totalOrders} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="待收货" value={snapshot.summary.pendingOrders} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="已到货" value={snapshot.summary.receivedOrders} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="采购总额" value={snapshot.summary.totalAmount.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="待付款" value={snapshot.summary.pendingAmount.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} />
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
                label: '采购单列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部状态' },
                          { value: 'pending', label: '待下单' },
                          { value: 'ordered', label: '已下单' },
                          { value: 'partial', label: '部分到货' },
                          { value: 'received', label: '已到货' },
                        ]}
                      />
                      <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部分类' },
                          ...categories.map((item) => ({ value: item, label: item })),
                        ]}
                      />
                    </Space>
                    <Table
                      dataSource={filteredPurchases}
                      columns={purchaseColumns}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                    />
                  </>
                ),
              },
              {
                key: 'suppliers',
                label: '供应商台账',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {snapshot.suppliers.map((item) => (
                      <Card key={item.name} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>{item.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>
                            合作 {item.cooperationCount} 次 · {item.rating}
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

        <Modal
          title="新建采购单"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="供应商" />
            <Input placeholder="物品描述" />
            <Select
              placeholder="分类"
              style={{ width: '100%' }}
              options={categories.map((item) => ({ value: item, label: item }))}
            />
            <Input placeholder="金额" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
