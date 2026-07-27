'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
  Empty,
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
import type { FinanceSnapshot, FinanceTransaction, FinanceTransactionType } from './finance-data'

const STATUS_LABELS: Record<FinanceTransaction['status'], string> = {
  settled: '已结算',
  pending: '待结算',
}

export default function FinanceClient({
  snapshot,
}: {
  snapshot: FinanceSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabKey, setTabKey] = useState('overview')
  const [typeFilter, setTypeFilter] = useState<FinanceTransactionType | 'all'>('all')
  const [showSettle, setShowSettle] = useState(false)

  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') {
      return snapshot.transactions
    }

    return snapshot.transactions.filter((item) => item.type === typeFilter)
  }, [snapshot.transactions, typeFilter])

  const transactionColumns: Parameters<typeof Table>[0]['columns'] = [
    { title: '日期', dataIndex: 'date' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (value: FinanceTransaction['type']) => (
        <Tag color={value === '营收' ? 'green' : 'red'}>{value}</Tag>
      ),
    },
    { title: '分类', dataIndex: 'category' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
          ¥{Math.abs(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'method',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: FinanceTransaction['status']) => (
        <Tag color={value === 'settled' ? 'default' : 'blue'}>{STATUS_LABELS[value]}</Tag>
      ),
    },
  ]

  

  function handleMockSettlement() {
    message.success('日结完成（mock）')
    setShowSettle(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>财务管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              营收 · 支出 · 对账 · 结算 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => setShowSettle(true)}>日结</Button>
            <Button
              type="primary"
              onClick={() => message.info('月报导出仍处于 mock 演示态。')}
            >
              月报
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
            拆层，日结、报表导出等写动作仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总收入" value={snapshot.summary.totalIncome.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总支出" value={snapshot.summary.totalExpense.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="利润" value={snapshot.summary.netProfit.toLocaleString()} prefix="¥" valueStyle={{ color: snapshot.summary.netProfit >= 0 ? '#34d399' : '#f87171' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="流水笔数" value={snapshot.summary.transactionCount} suffix="笔" valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日营收" value={snapshot.summary.todayRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="本月累计" value={snapshot.summary.monthlyRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="支出" value={snapshot.summary.totalExpense.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="净利" value={snapshot.summary.netProfit.toLocaleString()} prefix="¥" valueStyle={{ color: snapshot.summary.netProfit >= 0 ? '#34d399' : '#f87171' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="待结算" value={snapshot.summary.pendingSettle.toLocaleString()} prefix="¥" valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="营收笔数" value={snapshot.summary.incomeCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="支出笔数" value={snapshot.summary.expenseCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="毛利率" value={snapshot.summary.grossMargin} suffix="%" valueStyle={{ color: snapshot.summary.netProfit >= 0 ? '#34d399' : '#f87171' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'overview',
                label: '总览',
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small" title="收入结构">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {snapshot.incomeBreakdown.map((item) => (
                            <div key={item.label}>
                              <div>
                                <span style={{ color: '#94a3b8' }}>{item.label}:</span>
                                <span style={{ float: 'right' }}>
                                  ¥{item.amount.toLocaleString()} ({item.percent}%)
                                </span>
                              </div>
                              <Progress percent={item.percent} size="small" strokeColor={item.color} />
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="支出结构">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {snapshot.expenseBreakdown.map((item) => (
                            <div key={item.label}>
                              <div>
                                <span style={{ color: '#94a3b8' }}>{item.label}:</span>
                                <span style={{ float: 'right' }}>
                                  ¥{item.amount.toLocaleString()} ({item.percent}%)
                                </span>
                              </div>
                              <Progress percent={item.percent} size="small" strokeColor={item.color} />
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'detail',
                label: '明细',
                children: (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>类型:</span>
                      <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部' },
                          { value: '营收', label: '营收' },
                          { value: '支出', label: '支出' },
                        ]}
                      />
                    </Space>
                    <Table
                      dataSource={filteredTransactions}
                      columns={transactionColumns}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                    />
                  </>
                ),
              },
              {
                key: 'reports',
                label: '报表',
                children: (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    <Button style={{ width: 200 }} onClick={() => message.info('月度报表仍处于 mock 演示态。')}>
                      导出月度报表
                    </Button>
                    <Button style={{ width: 200 }} onClick={() => message.info('对账单导出仍处于 mock 演示态。')}>
                      导出对账单
                    </Button>
                    <Button style={{ width: 200 }} onClick={() => message.info('季度分析仍处于 mock 演示态。')}>
                      查看季度分析
                    </Button>
                    <Empty description="更多报表开发中…" />
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title="日结确认"
          open={showSettle}
          onCancel={() => setShowSettle(false)}
          onOk={handleMockSettlement}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>今日营收: ¥{snapshot.summary.todayRevenue.toLocaleString()}</div>
            <div>今日支出: ¥0</div>
            <div>待结算: ¥{snapshot.summary.pendingSettle.toLocaleString()}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>日结将生成当日财务报表并锁定结算</div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
