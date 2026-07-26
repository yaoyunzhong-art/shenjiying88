'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { buildActorHeaders } from '@m5/sdk'
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
import {
  SCHEDULING_STATUS_MAP,
  SHIFT_TIME_MAP,
  type CleanScheduleItem,
  type SchedulingSnapshotDelivery,
  type SchedulingStatus,
} from './scheduling-data'

const SHIFT_COLORS: Record<string, string> = {
  早班: '#6366f1',
  中班: '#f59e0b',
  晚班: '#8b5cf6',
}

const SCHEDULING_PAGE_ACTOR = {
  actorId: 'admin-store-scheduling',
  actorType: 'employee-user',
  actorName: 'Admin Store Scheduling',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['logistics.schedule.read', 'logistics.schedule.write'],
  authenticated: true,
} as const

const DEFAULT_TENANT_ID = 'tenant-p30'

export default function SchedulingClient({
  snapshot,
}: {
  snapshot: SchedulingSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [shiftFilter, setShiftFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<SchedulingStatus | 'all'>('all')
  const [tabKey, setTabKey] = useState('list')
  const [showCreate, setShowCreate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assigneeName, setAssigneeName] = useState('新排班人员')
  const [assigneeId, setAssigneeId] = useState('cleaner-new')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10))
  const [draftShift, setDraftShift] = useState('早班')

  const buildSchedulingHeaders = (contentType?: string) => ({
    ...buildActorHeaders({
      ...SCHEDULING_PAGE_ACTOR,
      tenantId: DEFAULT_TENANT_ID,
    }),
    ...(contentType ? { 'Content-Type': contentType } : {}),
  })

  const filteredSchedules = useMemo(() => {
    return snapshot.schedules.filter((item) => {
      const matchesShift = shiftFilter === 'all' || item.shiftName === shiftFilter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      return matchesShift && matchesStatus
    })
  }, [shiftFilter, snapshot.schedules, statusFilter])

  const shiftStats = useMemo(() => {
    const stats: Record<string, number> = { 早班: 0, 中班: 0, 晚班: 0 }
    snapshot.schedules.forEach((item) => {
      if (stats[item.shiftName] !== undefined) {
        stats[item.shiftName] += 1
      }
    })
    return stats
  }, [snapshot.schedules])

  const groupedByArea = useMemo(() => {
    const groups = new Map<string, CleanScheduleItem[]>()
    filteredSchedules.forEach((item) => {
      const areaName = item.areaName ?? '待分配区域'
      const list = groups.get(areaName) ?? []
      list.push(item)
      groups.set(areaName, list)
    })
    return Array.from(groups.entries())
  }, [filteredSchedules])

  async function handleCreateSchedule() {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: buildSchedulingHeaders('application/json'),
        body: JSON.stringify({
          tenantId: DEFAULT_TENANT_ID,
          storeId: snapshot.storeId,
          assigneeId,
          assigneeName,
          shiftName: draftShift,
          shiftTime: SHIFT_TIME_MAP[draftShift] ?? '08:00-14:00',
          scheduledDate,
        }),
      })

      if (!response.ok) {
        throw new Error('创建排班失败')
      }

      message.success('排班创建成功')
      setShowCreate(false)
      startRefresh(() => router.refresh())
    } catch {
      message.error('创建排班失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCheckIn(item: CleanScheduleItem) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/logistics/clean-schedules/${item.id}/check-in`, {
        method: 'POST',
        headers: buildSchedulingHeaders('application/json'),
        body: JSON.stringify({
          tenantId: DEFAULT_TENANT_ID,
          cleanerId: item.assigneeId,
          cleanerName: item.assigneeName,
          checkedInAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('签到失败')
      }

      message.success('签到成功')
      startRefresh(() => router.refresh())
    } catch {
      message.error('签到失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      title: '排班人员',
      dataIndex: 'assigneeName',
      render: (value: string, record: CleanScheduleItem) => (
        <Space direction="vertical" size={0}>
          <span style={{ color: '#e2e8f0' }}>{value}</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{record.assigneeId}</span>
        </Space>
      ),
    },
    {
      title: '班次',
      dataIndex: 'shiftName',
      width: 100,
      render: (value: string) => (
        <Tag color={SHIFT_COLORS[value] ?? 'default'} size="small">
          {value}
        </Tag>
      ),
    },
    { title: '时间段', dataIndex: 'shiftTime', width: 120 },
    { title: '日期', dataIndex: 'scheduledDate', width: 120 },
    {
      title: '清洁区域',
      dataIndex: 'areaName',
      width: 140,
      render: (value?: string) => value ?? '待分配区域',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: SchedulingStatus) => (
        <Tag color={SCHEDULING_STATUS_MAP[value].color} size="small">
          {SCHEDULING_STATUS_MAP[value].label}
        </Tag>
      ),
    },
    {
      title: '签到时间',
      dataIndex: 'checkInAt',
      width: 140,
      render: (value?: string) =>
        value ? new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CleanScheduleItem) => (
        <Space size="small">
          {record.status !== 'checked_in' && (
            <Button
              size="small"
              type="primary"
              disabled={isSubmitting}
              onClick={() => void handleCheckIn(record)}
            >
              签到
            </Button>
          )}
          <Button size="small" ghost>
            调班
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'list',
      label: '排班列表',
      children: (
        <Card>
          <Space style={{ marginBottom: 12, width: '100%', gap: 8 }} wrap>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>班次:</span>
            <Select
              value={shiftFilter}
              onChange={setShiftFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部' },
                { value: '早班', label: '早班' },
                { value: '中班', label: '中班' },
                { value: '晚班', label: '晚班' },
              ]}
            />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'scheduled', label: '待签到' },
                { value: 'assigned', label: '已分区' },
                { value: 'checked_in', label: '已签到' },
              ]}
            />
            <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
              共 {filteredSchedules.length} 条
            </span>
          </Space>

          {filteredSchedules.length === 0 ? (
            <Empty description="暂无排班数据" />
          ) : (
            <Table
              dataSource={filteredSchedules}
              columns={columns as Parameters<typeof Table>[0]['columns']}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'areas',
      label: '区域视图',
      children: (
        <Row gutter={16}>
          {groupedByArea.length === 0 ? (
            <Col span={24}>
              <Card>
                <Empty description="暂无排班" />
              </Card>
            </Col>
          ) : (
            groupedByArea.map(([areaName, items]) => (
              <Col key={areaName} span={8}>
                <Card
                  title={areaName}
                  extra={<span style={{ color: '#94a3b8' }}>{items.length} 人</span>}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(148,163,184,0.08)',
                      }}
                    >
                      <Space direction="vertical" size={0}>
                        <span style={{ color: '#e2e8f0' }}>{item.assigneeName}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>
                          {item.shiftName} · {item.shiftTime}
                        </span>
                      </Space>
                      <Tag color={SCHEDULING_STATUS_MAP[item.status].color}>
                        {SCHEDULING_STATUS_MAP[item.status].label}
                      </Tag>
                    </div>
                  ))}
                </Card>
              </Col>
            ))
          )}
        </Row>
      ),
    },
    {
      key: 'stats',
      label: '统计分析',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="班次分布">
              {(['早班', '中班', '晚班'] as const).map((shiftName) => (
                <div
                  key={shiftName}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                  }}
                >
                  <Tag color={SHIFT_COLORS[shiftName]}>{shiftName}</Tag>
                  <span style={{ color: '#e2e8f0' }}>{shiftStats[shiftName] ?? 0} 人</span>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="状态分布">
              {(Object.keys(SCHEDULING_STATUS_MAP) as SchedulingStatus[]).map((statusKey) => {
                const count = snapshot.schedules.filter((item) => item.status === statusKey).length
                return (
                  <div
                    key={statusKey}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                    }}
                  >
                    <Tag color={SCHEDULING_STATUS_MAP[statusKey].color}>
                      {SCHEDULING_STATUS_MAP[statusKey].label}
                    </Tag>
                    <span style={{ color: '#e2e8f0' }}>{count} 人</span>
                  </div>
                )
              })}
            </Card>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>门店排班</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              清洁排班 · 区域分配 · Delivery {snapshot.deliveryMode}
            </span>
          </div>
          <Space>
            <Button
              onClick={() => startRefresh(() => router.refresh())}
              loading={isRefreshing}
              disabled={isSubmitting}
            >
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button>导出排班表</Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 新建排班
            </Button>
          </Space>
        </div>

        {snapshot.error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {snapshot.error}
          </div>
        )}

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总排班" value={snapshot.stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="待签到" value={snapshot.stats.scheduled} valueStyle={{ color: '#6366f1' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已分区" value={snapshot.stats.assigned} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已签到" value={snapshot.stats.checkedIn} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="排班覆盖率" value={snapshot.stats.coverageRate} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="早班" value={shiftStats['早班'] ?? 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="中班" value={shiftStats['中班'] ?? 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="晚班" value={shiftStats['晚班'] ?? 0} />
            </Card>
          </Col>
        </Row>

        <Card size="small">
          <div style={{ color: '#94a3b8', fontSize: 12 }}>
            当前列表由服务端快照透传，创建与签到动作通过客户端触发 route proxy 后再使用
            {' '}
            router.refresh()
            {' '}
            拉取最新快照。
          </div>
        </Card>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={tabItems} />

        <Card size="small">
          <Space>
            <Button>调班申请</Button>
            <Button>区域重分配</Button>
            <Button>考勤异常</Button>
          </Space>
        </Card>

        <Modal
          title="新建排班"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={() => void handleCreateSchedule()}
          confirmLoading={isSubmitting}
          width={480}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="员工姓名"
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
            />
            <Input
              placeholder="员工编号"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            />
            <Input
              placeholder="日期"
              type="date"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
            />
            <Select
              value={draftShift}
              onChange={setDraftShift}
              style={{ width: '100%' }}
              options={[
                { value: '早班', label: '早班 (08:00-14:00)' },
                { value: '中班', label: '中班 (14:00-20:00)' },
                { value: '晚班', label: '晚班 (15:00-22:00)' },
              ]}
            />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
