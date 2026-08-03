'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Col, Row, message } from 'antd'
import {
  Button,
  Card,
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
import type { MemberRecord, MembersSnapshot, MemberStatus, MemberTier } from './members-data'

const MEMBER_STATUS_LABELS: Record<MemberStatus, [string, string]> = {
  active: ['green', '正常'],
  inactive: ['default', '流失'],
  frozen: ['red', '冻结'],
}

export default function MembersClient({
  snapshot,
}: {
  snapshot: MembersSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<MemberTier | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all')
  const [tabKey, setTabKey] = useState('list')
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const levelMap = useMemo(
    () => Object.fromEntries(snapshot.levels.map((item) => [item.key, item])),
    [snapshot.levels]
  )

  const filteredMembers = useMemo(() => {
    const keyword = search.trim()

    return snapshot.members.filter((item) => {
      const matchesKeyword =
        !keyword || item.name.includes(keyword) || item.phone.includes(keyword) || item.id.includes(keyword)
      const matchesTier = tierFilter === 'all' || item.tier === tierFilter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      return matchesKeyword && matchesTier && matchesStatus
    })
  }, [search, snapshot.members, statusFilter, tierFilter])

  const topMembers = useMemo(
    () => [...snapshot.members].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    [snapshot.members]
  )

  const memberColumns: Parameters<typeof Table>[0]['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      render: (value: string, record: MemberRecord) => (
        <Button type="link" onClick={() => setSelectedMember(record)}>
          {value}
        </Button>
      ),
    },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: '等级',
      dataIndex: 'tier',
      render: (value: MemberTier) => (
        <Tag color={levelMap[value]?.color ?? 'default'}>{levelMap[value]?.label ?? value}</Tag>
      ),
    },
    {
      title: '积分',
      dataIndex: 'points',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '累计消费',
      dataIndex: 'totalSpent',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    { title: '最后到店', dataIndex: 'lastVisit' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: MemberStatus) => (
        <Tag color={MEMBER_STATUS_LABELS[value][0]}>{MEMBER_STATUS_LABELS[value][1]}</Tag>
      ),
    },
  ]

  

  function handleMockCreate() {
    message.success('会员创建成功（mock）')
    setShowCreate(false)
    handleRefresh()
  }

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>会员管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              会员列表 · 等级分布 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </span>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('批量导入仍处于 mock 演示态。')}>批量导入</Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              新增会员
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
            拆层，会员创建、积分与余额变更仍为 mock 演示，刷新统一通过 router.refresh() 回源。
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="总会员" value={snapshot.summary.totalMembers} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="活跃会员"
                value={snapshot.summary.activeMembers}
                valueStyle={{ color: '#34d399' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="本月新增"
                value={snapshot.summary.newThisMonth}
                valueStyle={{ color: '#60a5fa' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="7天活跃"
                value={snapshot.summary.active7d}
                valueStyle={{ color: '#fbbf24' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="总积分"
                value={snapshot.summary.totalPoints.toLocaleString()}
                valueStyle={{ color: '#a78bfa' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="总余额"
                value={snapshot.summary.totalBalance.toLocaleString()}
                prefix="¥"
                valueStyle={{ color: '#34d399' }}
              />
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
                label: '会员列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                      <Input
                        placeholder="搜索姓名/手机号/会员ID"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={{ width: 260 }}
                        allowClear
                      />
                      <Select
                        value={tierFilter}
                        onChange={setTierFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部等级' },
                          ...snapshot.levels.map((item) => ({ value: item.key, label: item.label })),
                        ]}
                      />
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                        options={[
                          { value: 'all', label: '全部状态' },
                          { value: 'active', label: '正常' },
                          { value: 'inactive', label: '流失' },
                          { value: 'frozen', label: '冻结' },
                        ]}
                      />
                      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                        共 {filteredMembers.length} 条
                      </span>
                    </Space>
                    <Table
                      dataSource={filteredMembers}
                      columns={memberColumns}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                    />
                  </>
                ),
              },
              {
                key: 'levels',
                label: '等级分布',
                children: (
                  <Row gutter={[16, 16]}>
                    {snapshot.summary.tierDistribution.map((item) => (
                      <Col key={item.tier} span={8}>
                        <Card size="small">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <Tag color={item.color}>{item.label}</Tag>
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.count} 人</span>
                          </div>
                          <Progress
                            percent={
                              snapshot.summary.totalMembers
                                ? Math.round((item.count / snapshot.summary.totalMembers) * 100)
                                : 0
                            }
                            strokeColor={item.color}
                            size="small"
                          />
                          <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>
                            升级门槛: {levelMap[item.tier]?.minPoints.toLocaleString()} 分
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ),
              },
              {
                key: 'analytics',
                label: '数据分析',
                children: topMembers.length === 0 ? (
                  <Empty description="暂无会员数据" />
                ) : (
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    {topMembers.map((item, index) => (
                      <Card key={item.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                              #{index + 1} {item.name}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>
                              最近到店: {item.lastVisit} · 累计到店 {item.totalVisits} 次
                            </div>
                          </div>
                          <div style={{ color: '#fbbf24' }}>¥{item.totalSpent.toLocaleString()}</div>
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
          title={`会员详情 - ${selectedMember?.name ?? ''}`}
          open={!!selectedMember}
          onCancel={() => setSelectedMember(null)}
          footer={null}
        >
          {selectedMember && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>会员ID: {selectedMember.id}</div>
              <div>等级: {levelMap[selectedMember.tier]?.label}</div>
              <div>手机号: {selectedMember.phone}</div>
              <div>积分: {selectedMember.points.toLocaleString()}</div>
              <div>余额: ¥{selectedMember.balance.toLocaleString()}</div>
              <div>累计消费: ¥{selectedMember.totalSpent.toLocaleString()}</div>
              <div>标签: {selectedMember.tags?.join(' / ') || '无'}</div>
              <Space>
                <Button onClick={() => message.info('积分操作仍处于 mock 演示态。')}>积分操作</Button>
                <Button onClick={() => message.info('余额操作仍处于 mock 演示态。')}>余额操作</Button>
              </Space>
            </Space>
          )}
        </Modal>

        <Modal
          title="新增会员"
          open={showCreate}
          onCancel={() => setShowCreate(false)}
          onOk={handleMockCreate}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="会员姓名" />
            <Input placeholder="手机号" />
            <Select
              placeholder="会员等级"
              style={{ width: '100%' }}
              options={snapshot.levels.map((item) => ({ value: item.key, label: item.label }))}
            />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
