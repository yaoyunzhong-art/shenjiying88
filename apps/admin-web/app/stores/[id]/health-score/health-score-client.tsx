'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import { Button, Card, Empty, PageShell, Progress, Space, Statistic, Table, Tabs, Tag } from '@m5/ui'
import {
  HEALTH_STATUS_META,
  HEALTH_TREND_META,
  type HealthDimension,
  type HealthDimensionStatus,
  type HealthScoreSnapshot,
} from './health-score-data'

const DIAGNOSTIC_COLORS = {
  stable: 'green',
  watch: 'orange',
  risk: 'red',
} as const

function scoreColor(score: number) {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#f59e0b'
  return '#f87171'
}

export default function HealthScoreClient({ snapshot }: { snapshot: HealthScoreSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [activeKey, setActiveKey] = useState('dashboard')

  const attentionItems = useMemo(
    () => snapshot.dimensions.filter((item) => item.status !== 'good'),
    [snapshot.dimensions],
  )

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '维度', dataIndex: 'label' },
    {
      title: '评分',
      dataIndex: 'score',
      render: (value: number) => (
        <Space>
          <Progress percent={value} size="small" style={{ width: 120 }} strokeColor={scoreColor(value)} />
          <span style={{ fontWeight: 600, color: scoreColor(value) }}>{value}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: HealthDimensionStatus) => (
        <Tag color={HEALTH_STATUS_META[value].color}>{HEALTH_STATUS_META[value].label}</Tag>
      ),
    },
    { title: '趋势', dataIndex: 'trend', render: (value: keyof typeof HEALTH_TREND_META) => HEALTH_TREND_META[value] },
    { title: '详情', dataIndex: 'detail' },
    { title: '改进建议', dataIndex: 'suggestion' },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell title="健康评分" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card size="small">
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>健康评分</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              综合评分 · 维度诊断 · 月度趋势 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('健康评分导出仍处于结构固证演示态。')}>导出评分</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Progress
                    type="dashboard"
                    percent={snapshot.summary.overall}
                    size={130}
                    strokeColor={scoreColor(snapshot.summary.overall)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}>
                      {snapshot.summary.overall}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>综合分</div>
                  </div>
                </div>
                <div style={{ color: scoreColor(snapshot.summary.overall), fontSize: 14, fontWeight: 500 }}>
                  {snapshot.summary.overall >= 80
                    ? '优秀，整体运营良好'
                    : snapshot.summary.overall >= 60
                      ? '一般，需要持续关注'
                      : '较差，需要尽快干预'}
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="良好维度"
                value={snapshot.summary.goodCount}
                suffix={`/ ${snapshot.dimensions.length}`}
                valueStyle={{ color: '#34d399' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="需关注"
                value={snapshot.summary.attentionCount}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="结构固证、指标口径与趋势回源状态">
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
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[
              {
                key: 'dashboard',
                label: '仪表盘',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={[16, 16]}>
                      {snapshot.dimensions.map((item: HealthDimension) => (
                        <Col key={item.key} span={6}>
                          <Card size="small" hoverable style={{ borderLeft: `3px solid ${scoreColor(item.score)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 500, color: '#f8fafc' }}>{item.label}</span>
                              <span style={{ color: scoreColor(item.score), fontSize: 20, fontWeight: 700 }}>
                                {item.score}
                              </span>
                            </div>
                            <Progress
                              percent={item.score}
                              size="small"
                              strokeColor={scoreColor(item.score)}
                              style={{ marginTop: 4 }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 6,
                                alignItems: 'center',
                              }}
                            >
                              <Tag color={HEALTH_STATUS_META[item.status].color}>
                                {HEALTH_STATUS_META[item.status].label}
                              </Tag>
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                {HEALTH_TREND_META[item.trend]}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{item.detail}</div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    <Card size="small" title="优先改进项">
                      {attentionItems.length ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {attentionItems.map((item) => (
                            <div key={item.key} style={{ color: '#cbd5e1', fontSize: 13 }}>
                              {item.label} ({item.score} 分): {item.suggestion}
                            </div>
                          ))}
                        </Space>
                      ) : (
                        <Empty description="暂无待改进项" />
                      )}
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'detail',
                label: '详细数据',
                children: (
                  <Table
                    dataSource={snapshot.dimensions}
                    columns={columns}
                    rowKey="key"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'history',
                label: '趋势',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {snapshot.history.map((item) => (
                      <Card key={item.period} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.period}</span>
                          <span style={{ color: scoreColor(item.score) }}>{item.score} 分</span>
                        </div>
                        <Progress percent={item.score} size="small" strokeColor={scoreColor(item.score)} />
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>{item.note}</div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · refreshPath {snapshot.refreshPath} · {snapshot.note}
          </div>
        </Card>
      </Space>
    </PageShell>
  )
}
