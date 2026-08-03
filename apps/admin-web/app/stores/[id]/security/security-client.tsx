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
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
} from '@m5/ui'
import type {
  SecurityAlert,
  SecurityAlertSeverity,
  SecurityAlertStatus,
  SecuritySnapshot,
} from './security-data'

const SEVERITY_LABELS: Record<SecurityAlertSeverity, { color: string; label: string }> = {
  critical: { color: 'red', label: '严重' },
  high: { color: 'orange', label: '高' },
  medium: { color: 'blue', label: '中' },
  low: { color: 'default', label: '低' },
}

const STATUS_LABELS: Record<SecurityAlertStatus, { color: string; label: string }> = {
  pending: { color: 'red', label: '待处理' },
  handled: { color: 'green', label: '已处理' },
  ignored: { color: 'default', label: '忽略' },
}

export default function SecurityClient({
  snapshot,
}: {
  snapshot: SecuritySnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [statusFilter, setStatusFilter] = useState<SecurityAlertStatus | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<SecurityAlertSeverity | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [detailModal, setDetailModal] = useState<SecurityAlert | null>(null)

  const filteredAlerts = useMemo(() => {
    return snapshot.alerts.filter(
      (item) =>
        (statusFilter === 'all' || item.status === statusFilter) &&
        (severityFilter === 'all' || item.severity === severityFilter) &&
        (categoryFilter === 'all' || item.category === categoryFilter)
    )
  }, [categoryFilter, severityFilter, snapshot.alerts, statusFilter])

  const columns: Parameters<typeof Table>[0]['columns'] = [
    {
      title: '告警类型',
      dataIndex: 'type',
      render: (value: string, record: SecurityAlert) => (
        <Space>
          <Tag color={SEVERITY_LABELS[record.severity].color}>{record.category}</Tag>
          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    { title: '位置', dataIndex: 'location' },
    { title: '时间', dataIndex: 'time' },
    {
      title: '严重度',
      dataIndex: 'severity',
      render: (value: SecurityAlertSeverity) => (
        <Tag color={SEVERITY_LABELS[value].color}>{SEVERITY_LABELS[value].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: SecurityAlertStatus) => (
        <Tag color={STATUS_LABELS[value].color}>{STATUS_LABELS[value].label}</Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      render: (value?: string) => value || '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: SecurityAlert) => (
        <Space size="small">
          {record.status === 'pending' ? (
            <>
              <Button size="small" type="primary" onClick={() => handleMockAction('处理', record)}>
                处理
              </Button>
              <Button size="small" onClick={() => handleMockAction('忽略', record)}>
                忽略
              </Button>
            </>
          ) : null}
          <Button size="small" onClick={() => setDetailModal(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  

  function handleMockAction(action: string, alert: SecurityAlert) {
    message.success(`${alert.id} 已执行${action}（mock）`)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>安防管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              告警 · 门禁 · 监控 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('视频监控仍处于 mock 演示态。')}>视频监控</Button>
            <Button onClick={() => message.info('门禁管理仍处于 mock 演示态。')}>门禁管理</Button>
            <Button type="primary" onClick={() => message.info('告警规则仍处于 mock 演示态。')}>
              告警规则
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
            拆层，告警处理、门禁控制等写动作仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="待处理" value={snapshot.summary.pendingCount} valueStyle={{ color: '#f87171' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="严重告警" value={snapshot.summary.criticalCount} valueStyle={{ color: '#ef4444' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="已处理" value={snapshot.summary.handledCount} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="监控在线"
                value={`${snapshot.summary.cameraOnline}/${snapshot.cameraStatus.length}`}
                valueStyle={{ color: snapshot.summary.cameraOnline === snapshot.cameraStatus.length ? '#34d399' : '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="高严重度" value={snapshot.summary.highSeverityRate} suffix="%" valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="处理率" value={snapshot.summary.handleRate} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card title="告警列表">
              <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'pending', label: '待处理' },
                    { value: 'handled', label: '已处理' },
                    { value: 'ignored', label: '已忽略' },
                  ]}
                />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>严重度:</span>
                <Select
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'critical', label: '严重' },
                    { value: 'high', label: '高' },
                    { value: 'medium', label: '中' },
                    { value: 'low', label: '低' },
                  ]}
                />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>分类:</span>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    ...snapshot.categories.map((item) => ({ value: item, label: item })),
                  ]}
                />
                <Button style={{ marginLeft: 'auto' }} onClick={() => message.info('批量处理仍处于 mock 演示态。')}>
                  批量处理
                </Button>
              </Space>
              {filteredAlerts.length ? (
                <Table dataSource={filteredAlerts} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
              ) : (
                <Empty description="无匹配告警" />
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card title="监控状态" style={{ marginBottom: 16 }}>
              <Row gutter={[8, 8]}>
                {snapshot.cameraStatus.map((camera) => (
                  <Col key={camera.id} span={12}>
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'rgba(148, 163, 184, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#e2e8f0', fontSize: 13 }}>{camera.name}</span>
                      <Tag color={camera.status === 'online' ? 'green' : camera.status === 'offline' ? 'red' : 'orange'}>
                        {camera.status === 'online' ? '在线' : camera.status === 'offline' ? '离线' : '异常'}
                      </Tag>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
            <Card title="最近处理记录">
              <Timeline style={{ marginTop: 8 }}>
                {snapshot.timeline.map((item) => (
                  <Timeline.Item key={item.id} color={item.color}>
                    <div style={{ color: '#e2e8f0', fontSize: 13 }}>{item.title}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.subtitle}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>

        <Modal
          title={`告警详情 - ${detailModal?.id ?? ''}`}
          open={Boolean(detailModal)}
          onCancel={() => setDetailModal(null)}
          footer={<Button onClick={() => setDetailModal(null)}>关闭</Button>}
        >
          {detailModal ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>类型</div>
                  <div style={{ color: '#e2e8f0' }}>{detailModal.type}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>位置</div>
                  <div style={{ color: '#e2e8f0' }}>{detailModal.location}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>时间</div>
                  <div style={{ color: '#e2e8f0' }}>{detailModal.time}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>严重度</div>
                  <Tag color={SEVERITY_LABELS[detailModal.severity].color}>
                    {SEVERITY_LABELS[detailModal.severity].label}
                  </Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>状态</div>
                  <Tag color={STATUS_LABELS[detailModal.status].color}>{STATUS_LABELS[detailModal.status].label}</Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>处理人</div>
                  <div style={{ color: '#e2e8f0' }}>{detailModal.handler || '-'}</div>
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                历史处理建议: 建议立即派单到对应班组处理，当前告警分类为 {detailModal.category}。
              </div>
            </Space>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  )
}
