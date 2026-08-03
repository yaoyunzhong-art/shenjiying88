'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Col, Row, message } from 'antd'
import { Button, Card, Modal, PageShell, Progress, Select, Space, Statistic, Table, Tabs, Tag } from '@m5/ui'
import type { AnalyticsSnapshot, AnalyticsTrendPoint } from './analytics-data'

const DIAGNOSTIC_COLORS = {
  stable: 'green',
  watch: 'orange',
  risk: 'red',
} as const

export default function AnalyticsClient({ snapshot }: { snapshot: AnalyticsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week')
  const [tabKey, setTabKey] = useState('revenue')
  const [detailPoint, setDetailPoint] = useState<AnalyticsTrendPoint | null>(null)

  const visibleTrends = useMemo(() => {
    if (period === 'quarter') {
      return snapshot.trends
    }
    if (period === 'month') {
      return snapshot.trends.slice(-5)
    }
    return snapshot.trends.slice(-7)
  }, [period, snapshot.trends])

  const maxRevenue = Math.max(...visibleTrends.map((item) => item.revenue))
  const maxTraffic = Math.max(...snapshot.trafficDistribution.map((item) => item.traffic))

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '日期', dataIndex: 'day', width: 90 },
    { title: '营收', dataIndex: 'revenue', render: (value: number) => `¥${value.toLocaleString()}` },
    { title: '客流', dataIndex: 'traffic', render: (value: number) => `${value}人` },
    {
      title: '设备利用率',
      dataIndex: 'deviceUsage',
      render: (value: number) => <Progress percent={value} size="small" strokeColor={value >= 85 ? '#34d399' : '#f59e0b'} />,
    },
    { title: '新会员', dataIndex: 'newMember' },
    { title: '客单价', dataIndex: 'avgOrder', render: (value: number) => `¥${value}` },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AnalyticsTrendPoint) => (
        <Button size="small" type="link" onClick={() => setDetailPoint(record)}>
          详情
        </Button>
      ),
    },
  ]

  

  return (
    <PageShell title="经营分析" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card size="small">
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>经营分析</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              营收趋势 · 客流分布 · 设备排行 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('经营分析导出仍处于结构固证演示态。')}>导出报告</Button>
            <Select
              value={period}
              onChange={(value) => setPeriod(value as 'week' | 'month' | 'quarter')}
              style={{ width: 120 }}
              options={[
                { value: 'week', label: '近7天' },
                { value: 'month', label: '近5天' },
                { value: 'quarter', label: '样本全量' },
              ]}
            />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="周期营收" value={snapshot.summary.totalRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="日均营收" value={snapshot.summary.averageRevenue.toLocaleString()} prefix="¥" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总客流" value={snapshot.summary.totalTraffic} suffix="人" valueStyle={{ color: '#6366f1' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="新增会员" value={snapshot.summary.totalNewMembers} suffix="人" valueStyle={{ color: '#8b5cf6' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="日均客流" value={snapshot.summary.averageTraffic} suffix="人" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="客单价" value={snapshot.summary.averageOrder} prefix="¥" valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="营收环比"
                value={`${snapshot.summary.trendPercent}%`}
                valueStyle={{ color: snapshot.summary.trendPercent >= 0 ? '#34d399' : '#f87171' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="头部设备利用率" value={snapshot.summary.topDeviceUsage} suffix="%" valueStyle={{ color: '#10b981' }} />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="结构固证、回源刷新与数仓接入状态">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.title}</span>
                  <Tag color={DIAGNOSTIC_COLORS[item.status]}>{item.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'revenue',
                label: '营收分析',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small" title="营收趋势">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {visibleTrends.map((item) => (
                            <div key={item.day}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: '#94a3b8' }}>{item.day}</span>
                                <span style={{ color: '#fbbf24' }}>¥{item.revenue.toLocaleString()}</span>
                              </div>
                              <Progress percent={Math.round((item.revenue / maxRevenue) * 100)} size="small" strokeColor="#fbbf24" />
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="收入结构">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {snapshot.categories.map((item) => (
                            <div key={item.category}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: '#94a3b8' }}>{item.category}</span>
                                <Space size={8}>
                                  <Tag color={item.trend === 'up' ? 'green' : item.trend === 'down' ? 'red' : 'default'}>{item.trend}</Tag>
                                  <span style={{ color: '#e2e8f0' }}>
                                    ¥{item.amount.toLocaleString()} ({item.ratio}%)
                                  </span>
                                </Space>
                              </div>
                              <Progress percent={item.ratio} size="small" strokeColor="#6366f1" />
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'traffic',
                label: '客流分析',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small" title="时段客流分布">
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
                          {snapshot.trafficDistribution.map((item) => (
                            <div key={item.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div
                                style={{
                                  height: `${Math.round((item.traffic / maxTraffic) * 100)}%`,
                                  width: '100%',
                                  minHeight: 8,
                                  borderRadius: '6px 6px 0 0',
                                  background: item.traffic >= 90 ? '#6366f1' : '#334155',
                                }}
                              />
                              <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 6 }}>{item.hour}</span>
                              <span style={{ color: '#64748b', fontSize: 10 }}>{item.traffic}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="设备使用率排行">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {snapshot.topDevices.map((item) => (
                            <div key={item.name}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: '#e2e8f0' }}>{item.name}</span>
                                <span style={{ color: '#34d399' }}>¥{item.revenue.toLocaleString()}</span>
                              </div>
                              <Progress percent={item.usage} size="small" strokeColor="#10b981" />
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
                label: '明细数据',
                children: <Table dataSource={visibleTrends} columns={columns} rowKey="day" pagination={false} />,
              },
            ]}
          />
        </Card>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · refreshPath {snapshot.refreshPath} · {snapshot.note}
          </div>
        </Card>

        <Modal title={`经营详情 - ${detailPoint?.day ?? ''}`} open={Boolean(detailPoint)} onCancel={() => setDetailPoint(null)} footer={<Button onClick={() => setDetailPoint(null)}>关闭</Button>}>
          {detailPoint ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>日期: {detailPoint.day}</div>
              <div>营收: ¥{detailPoint.revenue.toLocaleString()}</div>
              <div>客流: {detailPoint.traffic}人</div>
              <div>设备利用率: {detailPoint.deviceUsage}%</div>
              <div>新增会员: {detailPoint.newMember}人</div>
              <div>客单价: ¥{detailPoint.avgOrder}</div>
            </div>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  )
}
