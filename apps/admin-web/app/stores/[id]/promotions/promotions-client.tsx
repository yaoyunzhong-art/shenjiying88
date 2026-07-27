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
  Progress,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from '@m5/ui'
import type { PromotionRecord, PromotionsSnapshot, PromotionStatus } from './promotions-data'

const STATUS_LABELS: Record<PromotionStatus, [string, string]> = {
  active: ['green', '进行中'],
  scheduled: ['blue', '待开始'],
  ended: ['default', '已结束'],
  draft: ['default', '草稿'],
}

const TYPE_COLORS: Record<string, string> = {
  折扣: '#10b981',
  满减: '#f59e0b',
  满赠: '#8b5cf6',
  套餐: '#6366f1',
}

export default function PromotionsClient({
  snapshot,
}: {
  snapshot: PromotionsSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [tabKey, setTabKey] = useState('list')
  const [showCreate, setShowCreate] = useState(false)

  const filteredPromotions = useMemo(() => {
    const keyword = search.trim()

    return snapshot.promotions.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesKeyword =
        !keyword || item.name.includes(keyword) || item.scope.includes(keyword) || item.type.includes(keyword)

      return matchesStatus && matchesKeyword
    })
  }, [search, snapshot.promotions, statusFilter])

  const promotionsColumns: Parameters<typeof Table>[0]['columns'] = [
    {
      title: '活动名称',
      dataIndex: 'name',
      render: (value: string, record: PromotionRecord) => (
        <>
          <div style={{ fontWeight: 500 }}>{value}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.targetGoal || '目标待补充'}</div>
        </>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (value: string) => <Tag color={TYPE_COLORS[value] ?? 'default'}>{value}</Tag>,
    },
    { title: '优惠', dataIndex: 'discount' },
    { title: '范围', dataIndex: 'scope' },
    {
      title: '周期',
      key: 'period',
      render: (_: unknown, record: PromotionRecord) => `${record.start} ~ ${record.end}`,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '已消耗',
      dataIndex: 'used',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '消耗率',
      key: 'usageRate',
      render: (_: unknown, record: PromotionRecord) => (
        <Progress
          percent={record.budget ? Math.round((record.used / record.budget) * 100) : 0}
          size="small"
          strokeColor={record.budget && record.used / record.budget > 0.7 ? '#f59e0b' : '#34d399'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: PromotionStatus) => <Tag color={STATUS_LABELS[value][0]}>{STATUS_LABELS[value][1]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: PromotionRecord) => (
        <Space size="small">
          {record.status === 'draft' && (
            <Button size="small" type="primary" onClick={() => message.info(`${record.id} 发布仍为 mock 演示态。`)}>
              发布
            </Button>
          )}
          {record.status === 'active' && (
            <Button size="small" onClick={() => message.info(`${record.id} 结束仍为 mock 演示态。`)}>
              结束
            </Button>
          )}
          <Button size="small" onClick={() => message.info(`${record.id} 详情仍为 mock 演示态。`)}>
            查看
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handleMockCreate() {
    message.success('促销活动已创建（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>促销管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              活动列表 · 活动分析 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              新建促销
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
            拆层，发布、结束与创建活动仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="活动数" value={snapshot.summary.totalCount} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="进行中" value={snapshot.summary.activeCount} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="待开始" value={snapshot.summary.scheduledCount} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="总预算" value={snapshot.summary.totalBudget.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="使用率" value={snapshot.summary.usageRate} suffix="%" valueStyle={{ color: '#f59e0b' }} />
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
                label: '活动列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <Input
                        placeholder="搜索活动/范围/类型"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={{ width: 240 }}
                        allowClear
                      />
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 140 }}
                        options={[
                          { value: 'all', label: '全部状态' },
                          { value: 'active', label: '进行中' },
                          { value: 'scheduled', label: '待开始' },
                          { value: 'ended', label: '已结束' },
                          { value: 'draft', label: '草稿' },
                        ]}
                      />
                    </Space>
                    <Table
                      dataSource={filteredPromotions}
                      columns={promotionsColumns}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                    />
                  </>
                ),
              },
              {
                key: 'analytics',
                label: '活动分析',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {snapshot.promotions.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>{item.targetGoal || '默认目标: 提升转化率'}</div>
                          </div>
                          <div style={{ width: 160 }}>
                            <Progress
                              percent={item.budget ? Math.round((item.used / item.budget) * 100) : 0}
                              size="small"
                              strokeColor={TYPE_COLORS[item.type] ?? '#34d399'}
                            />
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
          title="新建促销"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <Select
              placeholder="活动类型"
              style={{ width: '100%' }}
              options={[
                { value: '折扣', label: '折扣' },
                { value: '满减', label: '满减' },
                { value: '满赠', label: '满赠' },
                { value: '套餐', label: '套餐' },
              ]}
            />
            <Input placeholder="预算" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
