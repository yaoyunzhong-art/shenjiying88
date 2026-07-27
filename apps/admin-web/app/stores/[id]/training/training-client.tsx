'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
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
import type { TrainingCourse, TrainingSnapshot } from './training-data'

const STATUS_CFG: Record<TrainingCourse['status'], { color: string; label: string }> = {
  planned: { color: 'default', label: '计划' },
  ongoing: { color: 'blue', label: '进行中' },
  completed: { color: 'green', label: '已完成' },
}

export default function TrainingClient({
  snapshot,
}: {
  snapshot: TrainingSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [statusFilter, setStatusFilter] = useState<TrainingCourse['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [tabKey, setTabKey] = useState('courses')
  const [showCreate, setShowCreate] = useState(false)

  const trainingTypes = useMemo(
    () => Array.from(new Set(snapshot.courses.map((course) => course.type))),
    [snapshot.courses]
  )

  const filteredCourses = useMemo(() => {
    return snapshot.courses.filter((course) => {
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter
      const matchesType = typeFilter === 'all' || course.type === typeFilter
      return matchesStatus && matchesType
    })
  }, [snapshot.courses, statusFilter, typeFilter])

  function handleMockCreate() {
    message.info('当前为 mock 快照，创建培训仅做结构演示。')
    setShowCreate(false)
    handleRefresh()
  }

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '课程名称', dataIndex: 'name', width: 180 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    { title: '讲师', dataIndex: 'trainer', width: 100 },
    { title: '教室', dataIndex: 'room', width: 110 },
    { title: '日期', dataIndex: 'date', width: 120 },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 90,
      render: (value: number) => `${value}h`,
    },
    {
      title: '参训',
      dataIndex: 'attendees',
      width: 90,
      render: (value: number) => `${value}人`,
    },
    {
      title: '通过率',
      dataIndex: 'passRate',
      width: 100,
      render: (value: number) =>
        value ? (
          <span style={{ color: '#34d399', fontWeight: 600 }}>{value}%</span>
        ) : (
          <span style={{ color: '#64748b' }}>-</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: TrainingCourse['status']) => (
        <Tag color={STATUS_CFG[value].color}>{STATUS_CFG[value].label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: TrainingCourse) => (
        <Space size="small">
          <Button size="small" onClick={() => message.info(`当前课程 ${record.name} 仍为 mock 演示态。`)}>
            详情
          </Button>
          {record.status !== 'completed' && (
            <Button size="small" onClick={() => message.info('签到链路尚未接入真实培训控制面。')}>
              签到
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>培训管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              培训计划 · 课程考核 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={() => handleRefresh()} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 创建培训
            </Button>
          </Space>
        </div>

        {snapshot.error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        )}

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总课程" value={snapshot.summary.totalCourses} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="已完成" value={snapshot.summary.completedCourses} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="进行中" value={snapshot.summary.ongoingCourses} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="计划中" value={snapshot.summary.plannedCourses} valueStyle={{ color: '#94a3b8' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="平均通过率" value={snapshot.summary.averagePassRate} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="参训总人次" value={snapshot.summary.totalAttendees} />
            </Card>
          </Col>
        </Row>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，
            创建、签到与导出仍为假写或假读演示，刷新统一通过 router.refresh() 重新拉取快照。
          </div>
        </Card>

        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={[
            {
              key: 'courses',
              label: `课程列表(${snapshot.courses.length})`,
              children: (
                <Card>
                  <Space style={{ marginBottom: 12, width: '100%', gap: 8 }} wrap>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 120 }}
                      options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'planned', label: '计划' },
                        { value: 'ongoing', label: '进行中' },
                        { value: 'completed', label: '已完成' },
                      ]}
                    />
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>类型:</span>
                    <Select
                      value={typeFilter}
                      onChange={setTypeFilter}
                      style={{ width: 120 }}
                      options={[
                        { value: 'all', label: '全部类型' },
                        ...trainingTypes.map((type) => ({ value: type, label: type })),
                      ]}
                    />
                    <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
                      共 {filteredCourses.length} 门课程
                    </span>
                  </Space>
                  <Table
                    dataSource={filteredCourses}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </Card>
              ),
            },
            {
              key: 'distribution',
              label: '能力画像',
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="课程类型分布">
                      {snapshot.typeDistribution.map((item) => (
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
                            <span style={{ color: '#e2e8f0' }}>{item.count} 门</span>
                            <span style={{ color: '#94a3b8' }}>{item.attendees} 人次</span>
                          </Space>
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="讲师负载">
                      {snapshot.trainerDistribution.map((item) => (
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
                            <span style={{ color: '#e2e8f0' }}>{item.count} 门</span>
                            <span style={{ color: '#94a3b8' }}>{item.attendees} 人次</span>
                          </Space>
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'diagnostics',
              label: '诊断面板',
              children: (
                <Card title="诊断与结构固证">
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
              ),
            },
          ]}
        />

        <Card size="small">
          <Space>
            <Button onClick={() => message.info('培训计划导出仍处于 mock 演示态。')}>培训计划</Button>
            <Button onClick={() => message.info('考核记录仍处于 mock 演示态。')}>考核记录</Button>
            <Button onClick={() => message.info('导出链路仍处于 mock 演示态。')}>导出</Button>
          </Space>
        </Card>

        <Modal
          title="创建培训"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
          width={500}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="课程名称" />
            <Input placeholder="讲师" />
            <Select
              placeholder="类型"
              style={{ width: '100%' }}
              options={[
                { value: '入职', label: '入职培训' },
                { value: '技能', label: '技能培训' },
                { value: '安全', label: '安全培训' },
                { value: '服务', label: '服务培训' },
              ]}
            />
            <Input placeholder="日期" type="date" />
            <Input placeholder="时长(小时)" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
