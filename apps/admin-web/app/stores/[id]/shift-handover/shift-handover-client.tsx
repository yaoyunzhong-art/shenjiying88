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
import type {
  HandoverRecord,
  HandoverStatus,
  ShiftHandoverSnapshot,
} from './shift-handover-data'

export default function ShiftHandoverClient({
  snapshot,
}: {
  snapshot: ShiftHandoverSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState('list')
  const [showStart, setShowStart] = useState(false)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') {
      return snapshot.handovers
    }

    return snapshot.handovers.filter((item) => item.status === statusFilter)
  }, [snapshot.handovers, statusFilter])

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '交班人', dataIndex: 'from' },
    { title: '接班人', dataIndex: 'to' },
    {
      title: '现金',
      dataIndex: 'cash',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '差额',
      dataIndex: 'cashDiff',
      render: (value: number) => (
        <span style={{ color: value < 0 ? '#f87171' : value > 0 ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
          {value === 0 ? '-' : `${value > 0 ? '+' : '-'}¥${Math.abs(value)}`}
        </span>
      ),
    },
    { title: '设备状态', dataIndex: 'devices' },
    { title: '钥匙', dataIndex: 'keys' },
    { title: '备注', dataIndex: 'note', render: (value: string) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: HandoverStatus) => (
        <Tag color={value === 'normal' ? 'green' : 'orange'}>{value === 'normal' ? '正常' : '差异'}</Tag>
      ),
    },
    { title: '时间', dataIndex: 'time' },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>交接班</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              收银 · 设备 · 钥匙 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowStart(true)}>
              开始交接
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
            拆层，交班发起与签收仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="交接记录" value={snapshot.summary.totalRecords} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="现金总额" value={snapshot.summary.totalCash.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="正常" value={snapshot.summary.normalCount} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="差异" value={snapshot.summary.diffCount} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="差异总额" value={snapshot.summary.totalCashDiff.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'list',
                label: '交接记录',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }}>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: 'normal', label: '正常' },
                          { value: 'diff', label: '差异' },
                        ]}
                      />
                    </Space>
                    <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
                  </>
                ),
              },
              {
                key: 'my',
                label: '我的交接',
                children: <Empty description="需登录查看个人交接记录" />,
              },
              {
                key: 'rules',
                label: '交接规则',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {snapshot.rules.map((item, index) => (
                      <Card key={item} size="small" title={`规则 ${index + 1}`}>
                        {item}
                      </Card>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title="开始交接"
          open={showStart}
          onCancel={() => setShowStart(false)}
          onOk={() => {
            message.success('交接流程已启动（mock）')
            setShowStart(false)
            handleRefresh()
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="交班人"
              options={[
                { value: 'zhangsan', label: '张三(早班)' },
                { value: 'lisi', label: '李四(中班)' },
                { value: 'wangwu', label: '王五(晚班)' },
              ]}
            />
            <Select
              placeholder="接班人"
              options={[
                { value: 'zhangsan', label: '张三(早班)' },
                { value: 'lisi', label: '李四(中班)' },
                { value: 'wangwu', label: '王五(晚班)' },
              ]}
            />
            <Input placeholder="交接现金 ¥" type="number" />
            <Input placeholder="设备状态" />
            <Input placeholder="钥匙编号" />
            <Input placeholder="备注" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
