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
import type { MarketingCampaign, MarketingSnapshot } from './marketing-data'

const TYPE_COLORS: Record<string, string> = {
  充值: '#6366f1',
  推广: '#f59e0b',
  会员: '#8b5cf6',
  节日: '#ef4444',
  会员卡: '#10b981',
}

const STATUS_CFG: Record<string, [string, string]> = {
  active: ['green', '进行中'],
  scheduled: ['blue', '待开始'],
  ended: ['default', '已结束'],
}

export default function MarketingClient({
  snapshot,
}: {
  snapshot: MarketingSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<MarketingCampaign['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [tabKey, setTabKey] = useState('campaigns')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<MarketingCampaign | null>(null)

  const campaignTypes = useMemo(
    () => Array.from(new Set(snapshot.campaigns.map((campaign) => campaign.type))),
    [snapshot.campaigns]
  )

  const filteredCampaigns = useMemo(() => {
    return snapshot.campaigns.filter((campaign) => {
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter
      return matchesStatus && matchesType
    })
  }, [snapshot.campaigns, statusFilter, typeFilter])

  function handleMockCreate() {
    message.info('当前为 mock 快照，创建活动仅做结构演示。')
    setShowCreate(false)
    startRefresh(() => router.refresh())
  }

  const campaignColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '活动名称', dataIndex: 'name', width: 180 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (value: string) => (
        <Tag color={TYPE_COLORS[value] ?? 'default'} size="small">
          {value}
        </Tag>
      ),
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 100,
      render: (value: string) => <Tag size="small">{value}</Tag>,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      width: 100,
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '已消耗',
      dataIndex: 'used',
      width: 100,
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '消耗率',
      key: 'usage-rate',
      width: 120,
      render: (_: unknown, record: MarketingCampaign) => {
        const percent = record.budget ? Math.round((record.used / record.budget) * 100) : 0
        return (
          <Progress
            percent={percent}
            size="small"
            strokeColor={percent > 70 ? '#f59e0b' : '#34d399'}
            style={{ width: 90 }}
          />
        )
      },
    },
    { title: '投放对象', dataIndex: 'audience', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: MarketingCampaign['status']) => (
        <Tag color={STATUS_CFG[value]?.[0] ?? 'default'} size="small">
          {STATUS_CFG[value]?.[1] ?? value}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: MarketingCampaign) => (
        <Space size="small">
          <Button size="small" onClick={() => setShowDetail(record)}>
            详情
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => message.info('当前为 mock 快照，编辑动作尚未接入真实链路。')}
          >
            编辑
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
            <h2 style={{ color: '#f8fafc', margin: 0 }}>营销管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              优惠券 · 推广活动 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={() => startRefresh(() => router.refresh())} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 创建活动
            </Button>
          </Space>
        </div>

        {snapshot.error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        )}

        <Row gutter={[16, 16]}>
          <Col span={3}>
            <Card size="small">
              <Statistic title="进行中" value={snapshot.summary.activeCount} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="待启动" value={snapshot.summary.scheduledCount} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="总投入" value={snapshot.summary.totalBudget.toLocaleString()} prefix="¥" />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="已消耗" value={snapshot.summary.totalUsed.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="消耗率" value={snapshot.summary.useRate} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="优惠券" value={snapshot.summary.couponCount} suffix="种" />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="领券率" value={snapshot.summary.couponClaimRate} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="核销率" value={snapshot.summary.couponRedeemRate} suffix="%" valueStyle={{ color: '#6366f1' }} />
            </Card>
          </Col>
        </Row>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，
            创建/编辑动作仍为假写演示，刷新统一通过 router.refresh() 重新拉取快照。
          </div>
        </Card>

        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={[
            {
              key: 'campaigns',
              label: `营销活动(${snapshot.campaigns.length})`,
              children: (
                <Card>
                  <Space style={{ marginBottom: 12, gap: 8, width: '100%' }} wrap>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 120 }}
                      options={[
                        { value: 'all', label: '全部' },
                        { value: 'active', label: '进行中' },
                        { value: 'scheduled', label: '待开始' },
                        { value: 'ended', label: '已结束' },
                      ]}
                    />
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>类型:</span>
                    <Select
                      value={typeFilter}
                      onChange={setTypeFilter}
                      style={{ width: 120 }}
                      options={[
                        { value: 'all', label: '全部类型' },
                        ...campaignTypes.map((type) => ({ value: type, label: type })),
                      ]}
                    />
                    <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
                      共 {filteredCampaigns.length} 个活动
                    </span>
                  </Space>
                  <Table
                    dataSource={filteredCampaigns}
                    columns={campaignColumns}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </Card>
              ),
            },
            {
              key: 'coupons',
              label: `优惠券(${snapshot.coupons.length})`,
              children: (
                <Card>
                  <Table
                    dataSource={snapshot.coupons}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: '券名', dataIndex: 'name' },
                      {
                        title: '类型',
                        dataIndex: 'type',
                        render: (value: string) => <Tag>{value}</Tag>,
                      },
                      {
                        title: '发放/领取',
                        key: 'claim',
                        render: (_: unknown, record: MarketingSnapshot['coupons'][number]) => (
                          <>
                            {record.claimed}/{record.total}
                          </>
                        ),
                      },
                      { title: '使用数', dataIndex: 'used' },
                      { title: '核销率', dataIndex: 'rate' },
                      {
                        title: '有效期',
                        dataIndex: 'expiry',
                        render: (value: string) => (
                          <Tag color={new Date(value) < new Date() ? 'red' : 'green'} size="small">
                            {value}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </Card>
              ),
            },
            {
              key: 'evidence',
              label: '诊断与分布',
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="类型投入">
                      {snapshot.typeBreakdown.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(148,163,184,0.08)',
                          }}
                        >
                          <Tag color={TYPE_COLORS[item.label] ?? 'default'}>{item.label}</Tag>
                          <Space>
                            <span style={{ color: '#e2e8f0' }}>{item.count} 场</span>
                            <span style={{ color: '#94a3b8' }}>¥{item.usedBudget.toLocaleString()}</span>
                          </Space>
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="渠道分布">
                      {snapshot.channelBreakdown.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(148,163,184,0.08)',
                          }}
                        >
                          <span style={{ color: '#e2e8f0' }}>{item.label}</span>
                          <Space>
                            <span style={{ color: '#e2e8f0' }}>{item.count} 场</span>
                            <span style={{ color: '#94a3b8' }}>¥{item.usedBudget.toLocaleString()}</span>
                          </Space>
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={24}>
                    <Card title="诊断面板">
                      {snapshot.diagnostics.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '10px 0',
                            borderBottom: '1px solid rgba(148,163,184,0.08)',
                          }}
                        >
                          <div>
                            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.title}</div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{item.detail}</div>
                          </div>
                          <Tag
                            color={
                              item.status === 'stable'
                                ? 'success'
                                : item.status === 'watch'
                                  ? 'processing'
                                  : 'warning'
                            }
                          >
                            {item.status}
                          </Tag>
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />

        <Card size="small">
          <Space>
            <Button onClick={() => message.info('投放渠道配置仍处于 mock 演示态。')}>投放渠道</Button>
            <Button onClick={() => message.info('效果分析报告仍处于 mock 演示态。')}>效果分析报告</Button>
            <Button onClick={() => message.info('模板管理仍处于 mock 演示态。')}>模板管理</Button>
          </Space>
        </Card>

        <Modal
          title={`活动详情 - ${showDetail?.name ?? ''}`}
          open={!!showDetail}
          onCancel={() => setShowDetail(null)}
          footer={<Button onClick={() => setShowDetail(null)}>关闭</Button>}
        >
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>名称</div>
                  <div style={{ color: '#e2e8f0' }}>{showDetail.name}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>类型</div>
                  <Tag color={TYPE_COLORS[showDetail.type] ?? 'default'}>{showDetail.type}</Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>渠道</div>
                  <Tag>{showDetail.channel}</Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>状态</div>
                  <Tag color={STATUS_CFG[showDetail.status]?.[0]}>{STATUS_CFG[showDetail.status]?.[1]}</Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>预算</div>
                  <span style={{ color: '#e2e8f0' }}>¥{showDetail.budget.toLocaleString()}</span>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>已消耗</div>
                  <span style={{ color: '#f59e0b' }}>¥{showDetail.used.toLocaleString()}</span>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>ROI</div>
                  <span style={{ color: '#34d399' }}>{showDetail.roi}</span>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>对象</div>
                  <span style={{ color: '#e2e8f0' }}>{showDetail.audience}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>起止</div>
                  <span style={{ color: '#e2e8f0' }}>
                    {showDetail.start} ~ {showDetail.end}
                  </span>
                </div>
              </div>
            </Space>
          )}
        </Modal>

        <Modal
          title="创建营销活动"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
          width={520}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select
                placeholder="类型"
                style={{ width: '100%' }}
                options={[
                  { value: '推广', label: '推广' },
                  { value: '充值', label: '充值' },
                  { value: '会员', label: '会员' },
                ]}
              />
              <Select
                placeholder="渠道"
                style={{ width: '100%' }}
                options={[
                  { value: '小程序', label: '小程序' },
                  { value: '到店', label: '到店' },
                  { value: '抖音', label: '抖音' },
                ]}
              />
              <Input placeholder="预算" type="number" />
              <Input placeholder="投放对象" />
              <Input placeholder="开始日期" type="date" />
              <Input placeholder="结束日期" type="date" />
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
