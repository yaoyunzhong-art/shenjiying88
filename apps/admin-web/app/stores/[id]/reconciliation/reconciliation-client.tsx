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
  Tooltip,
} from '@m5/ui'
import type {
  ReconciliationRecord,
  ReconciliationSnapshot,
  ReconciliationStatus,
} from './reconciliation-data'

function formatDiff(value: number) {
  if (value === 0) {
    return <span style={{ color: '#34d399', fontWeight: 600 }}>✓</span>
  }

  return (
    <span style={{ color: '#f87171', fontWeight: 600 }}>
      {value > 0 ? `+${value}` : `${value}`}
    </span>
  )
}

export default function ReconciliationClient({
  snapshot,
}: {
  snapshot: ReconciliationSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [showPerform, setShowPerform] = useState(false)
  const [showDetail, setShowDetail] = useState<ReconciliationRecord | null>(null)
  const [tabKey, setTabKey] = useState('list')

  const filteredRecords = useMemo(() => {
    return snapshot.records.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesMethod = methodFilter === 'all' || item.method === methodFilter
      return matchesStatus && matchesMethod
    })
  }, [methodFilter, snapshot.records, statusFilter])

  const detailColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '日期', dataIndex: 'date', width: 100 },
    {
      title: '实收',
      dataIndex: 'income',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '系统',
      dataIndex: 'system',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '差额',
      dataIndex: 'diff',
      render: (value: number, record: ReconciliationRecord) => (
        <Tooltip title={record.note || (value === 0 ? '无差异' : '差异详情')}>
          {formatDiff(value)}
        </Tooltip>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'method',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: ReconciliationStatus) => (
        <Tag color={value === 'match' ? 'green' : 'orange'}>
          {value === 'match' ? '一致' : '差异'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: ReconciliationRecord) => (
        <Space size="small">
          {record.status === 'diff' && (
            <Button size="small" type="primary" onClick={() => setShowDetail(record)}>
              处理差异
            </Button>
          )}
          <Button size="small" onClick={() => setShowDetail(record)}>
            查看
          </Button>
        </Space>
      ),
    },
  ]

  const methodSummaryColumns: Parameters<typeof Table>[0]['columns'] = [
    {
      title: '支付方式',
      dataIndex: 'method',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    { title: '笔数', dataIndex: 'count' },
    {
      title: '实收总计',
      dataIndex: 'totalIncome',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '系统总计',
      dataIndex: 'totalSystem',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '差异总额',
      dataIndex: 'diffTotal',
      render: (value: number) => (
        <span style={{ color: value !== 0 ? '#f87171' : '#34d399' }}>¥{value.toLocaleString()}</span>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function handlePerform() {
    message.success(`对账完成（mock），发现 ${snapshot.summary.diffCount} 条差异记录`)
    setShowPerform(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fafafa', margin: 0 }}>对账管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              支付对账 · 差异处理 · 日报生成 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowPerform(true)}>
              + 执行对账
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
            拆层，执行对账、差异处理与报告导出仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="对账单数" value={snapshot.records.length} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="一致" value={snapshot.summary.matchCount} valueStyle={{ color: '#34d399' }} suffix={`/ ${snapshot.records.length} (${snapshot.summary.matchRate}%)`} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="差异" value={snapshot.summary.diffCount} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="差异总额" value={snapshot.summary.diffTotal.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="净差异率" value={snapshot.summary.diffRate} suffix="%" valueStyle={{ color: snapshot.summary.diffRate > 1 ? '#f87171' : '#34d399' }} />
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
                label: '明细列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 110 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: 'match', label: '一致' },
                          { value: 'diff', label: '差异' },
                        ]}
                      />
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>支付方式:</span>
                      <Select
                        value={methodFilter}
                        onChange={setMethodFilter}
                        style={{ width: 110 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: '微信', label: '微信' },
                          { value: '支付宝', label: '支付宝' },
                          { value: '现金', label: '现金' },
                        ]}
                      />
                      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                        实收总计: ¥{snapshot.summary.totalIncome.toLocaleString()} / 系统总计: ¥
                        {snapshot.summary.totalSystem.toLocaleString()}
                      </span>
                    </Space>
                    <Table
                      dataSource={filteredRecords}
                      columns={detailColumns}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </>
                ),
              },
              {
                key: 'summary',
                label: '汇总统计',
                children: (
                  <Table
                    dataSource={snapshot.methodSummary}
                    columns={methodSummaryColumns}
                    rowKey="method"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'tools',
                label: '工具',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
                    <Card size="small">
                      <Space>
                        <Button type="primary" onClick={() => setShowPerform(true)}>
                          执行自动对账
                        </Button>
                        <Button onClick={() => message.info('差异报告导出仍处于 mock 演示态。')}>
                          导出差异报告
                        </Button>
                        <Button onClick={() => message.info('历史对账仍处于 mock 演示态。')}>
                          历史对账
                        </Button>
                      </Space>
                    </Card>
                    <Card size="small">
                      <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                        <div style={{ fontWeight: 500 }}>对账规则配置</div>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Input placeholder="差异阈值(¥)" defaultValue="10" size="small" />
                          </Col>
                          <Col span={6}>
                            <Input placeholder="自动确认天数" defaultValue="7" size="small" />
                          </Col>
                          <Col span={6}>
                            <Button size="small" onClick={() => message.info('规则保存仍处于 mock 演示态。')}>
                              保存配置
                            </Button>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title="执行对账"
          open={showPerform}
          onCancel={() => setShowPerform(false)}
          onOk={handlePerform}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8' }}>将拉取昨日订单数据与银行流水逐一对账，预计耗时 2-5 分钟</div>
            <Select
              placeholder="选择支付通道"
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: '全部通道' },
                { value: 'wechat', label: '微信支付' },
                { value: 'alipay', label: '支付宝' },
              ]}
            />
          </Space>
        </Modal>

        <Modal
          title="差异详情"
          open={!!showDetail}
          onCancel={() => setShowDetail(null)}
          footer={null}
        >
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>单号:</span> {showDetail.id}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>日期:</span> {showDetail.date}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>实收:</span> ¥{showDetail.income.toLocaleString()}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>系统记录:</span> ¥{showDetail.system.toLocaleString()}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>差额:</span>{' '}
                <span
                  style={{
                    color: showDetail.diff !== 0 ? '#f87171' : '#34d399',
                    fontWeight: 600,
                  }}
                >
                  {showDetail.diff}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>备注:</span> {showDetail.note || '无'}
              </div>
              <Input.TextArea placeholder="处理说明…" rows={3} />
              <Space>
                <Button type="primary" onClick={() => message.info('标记已处理仍处于 mock 演示态。')}>
                  标记已处理
                </Button>
                <Button onClick={() => message.info('提交审核仍处于 mock 演示态。')}>
                  提交审核
                </Button>
              </Space>
            </Space>
          )}
        </Modal>
      </Space>
    </PageShell>
  )
}
