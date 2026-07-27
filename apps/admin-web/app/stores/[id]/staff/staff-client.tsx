'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Row, message } from 'antd'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
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
import type { Employee, EmployeeStatus, StaffSnapshot } from './staff-data'

const STATUS_LABELS: Record<EmployeeStatus, { color: string; label: string }> = {
  on: { color: 'green', label: '在岗' },
  off: { color: 'default', label: '休息' },
  leave: { color: 'orange', label: '请假' },
}

export default function StaffClient({
  snapshot,
}: {
  snapshot: StaffSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null)
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const filteredEmployees = useMemo(() => {
    return snapshot.employees.filter(
      (item) =>
        (statusFilter === 'all' || item.status === statusFilter) &&
        (roleFilter === '全部' || item.role === roleFilter) &&
        (!searchText || item.name.includes(searchText) || item.phone.includes(searchText))
    )
  }, [roleFilter, searchText, snapshot.employees, statusFilter])

  const columns: Parameters<typeof Table>[0]['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      render: (value: string, record: Employee) => (
        <Space>
          <Avatar size="small" style={{ background: record.role === '店长' ? '#6366f1' : '#334155' }}>
            {value[0]}
          </Avatar>
          <Button type="link" onClick={() => setDetailEmployee(record)}>
            {value}
          </Button>
          <Tag color={record.role === '店长' ? 'purple' : record.role === '收银员' ? 'blue' : 'default'}>
            {record.role}
          </Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: EmployeeStatus) => (
        <Badge color={STATUS_LABELS[value].color} text={STATUS_LABELS[value].label} />
      ),
    },
    { title: '电话', dataIndex: 'phone' },
    { title: '班次', dataIndex: 'shift' },
    {
      title: '出勤率',
      dataIndex: 'attendance',
      render: (value?: number) =>
        value != null ? (
          <Progress
            percent={value}
            size="small"
            strokeColor={value >= 95 ? '#34d399' : value >= 85 ? '#f59e0b' : '#ef4444'}
          />
        ) : (
          '-'
        ),
    },
    {
      title: '技能',
      dataIndex: 'skills',
      render: (value: string[]) => <Space size={4}>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space>,
    },
    {
      title: '绩效',
      dataIndex: 'performance',
      render: (value?: string) =>
        value ? <Tag color={value === 'A' ? 'green' : value === 'B' ? 'blue' : 'orange'}>{value}</Tag> : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Employee) => (
        <Space size="small">
          <Button size="small" onClick={() => setDetailEmployee(record)}>
            详情
          </Button>
          {record.status !== 'leave' ? (
            <Button size="small" type="primary" ghost onClick={() => message.info(`${record.name} 排班仍处于 mock 演示态。`)}>
              排班
            </Button>
          ) : null}
          <Button size="small" onClick={() => message.info(`${record.name} 考勤仍处于 mock 演示态。`)}>
            考勤
          </Button>
        </Space>
      ),
    },
  ]

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>员工管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              排班 · 考勤 · 绩效 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('导出排班表仍处于 mock 演示态。')}>导出排班表</Button>
            <Button type="primary" onClick={() => setShowAdd(true)}>
              添加员工
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
            拆层，员工增删改、排班发布与考勤回写仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总人数" value={snapshot.summary.totalEmployees} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="在岗" value={snapshot.summary.onDuty} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="请假" value={snapshot.summary.leaveCount} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="平均出勤率" value={snapshot.summary.avgAttendance} suffix="%" valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="今日排班" value={snapshot.summary.scheduledToday} suffix="人" valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="角色数" value={snapshot.summary.roleCount} suffix="种" />
            </Card>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'list', label: '员工列表' },
            { key: 'stats', label: '统计分析' },
          ]}
        />

        {activeTab === 'list' ? (
          <Card>
            <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
              <Input.Search
                placeholder="搜索姓名/电话"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                style={{ width: 220 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'on', label: '在岗' },
                  { value: 'off', label: '休息' },
                  { value: 'leave', label: '请假' },
                ]}
              />
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 120 }}
                options={snapshot.roles.map((item) => ({ value: item, label: item === '全部' ? '全部角色' : item }))}
              />
              <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
                共 {filteredEmployees.length} 人
              </span>
            </Space>
            {filteredEmployees.length ? (
              <Table dataSource={filteredEmployees} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
            ) : (
              <Empty description="无匹配员工" />
            )}
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="角色分布">
                {snapshot.roleDistribution.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>{item.label}</span>
                    <Space>
                      <Progress percent={Math.round((item.count / snapshot.employees.length) * 100)} size="small" style={{ width: 120 }} />
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.count} 人</span>
                    </Space>
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="今日排班">
                {snapshot.todaySchedule.map((item) => (
                  <div
                    key={item.shift}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>{item.shift}</span>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{item.count} 人</span>
                  </div>
                ))}
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>今日值班总计</span>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: 18 }}>{snapshot.summary.scheduledToday} 人</span>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        <Modal
          title="添加员工"
          open={showAdd}
          onCancel={() => setShowAdd(false)}
          onOk={() => {
            message.success('员工已添加（mock）')
            setShowAdd(false)
            handleRefresh()
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input placeholder="姓名" />
              <Input placeholder="手机号" />
              <Select
                placeholder="角色"
                options={snapshot.roles.filter((item) => item !== '全部').map((item) => ({ value: item, label: item }))}
              />
              <Select
                placeholder="班次"
                options={snapshot.todaySchedule.map((item) => ({ value: item.shift, label: item.shift }))}
              />
              <Input placeholder="紧急联系人" style={{ gridColumn: '1 / -1' }} />
            </div>
          </Space>
        </Modal>

        <Modal
          title={`员工详情 - ${detailEmployee?.name ?? ''}`}
          open={Boolean(detailEmployee)}
          onCancel={() => setDetailEmployee(null)}
          footer={<Button onClick={() => setDetailEmployee(null)}>关闭</Button>}
        >
          {detailEmployee ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>姓名</div>
                  <div style={{ color: '#e2e8f0' }}>{detailEmployee.name}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>角色</div>
                  <Tag>{detailEmployee.role}</Tag>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>电话</div>
                  <div style={{ color: '#e2e8f0' }}>{detailEmployee.phone}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>班次</div>
                  <div style={{ color: '#e2e8f0' }}>{detailEmployee.shift}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>入职</div>
                  <div style={{ color: '#e2e8f0' }}>{detailEmployee.joinDate}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>绩效</div>
                  <Tag color={detailEmployee.performance === 'A' ? 'green' : 'blue'}>{detailEmployee.performance}</Tag>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>紧急联系人</div>
                  <div style={{ color: '#e2e8f0' }}>{detailEmployee.emergency}</div>
                </div>
              </div>
            </Space>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  )
}
