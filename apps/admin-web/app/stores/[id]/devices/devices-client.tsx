'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { Col, Row, message } from 'antd'
import { Button, Card, Empty, Input, Modal, PageShell, Progress, Select, Space, Statistic, Table, Tabs, Tag } from '@m5/ui'
import { DEVICE_STATUS_META, type DeviceStatus, type DevicesSnapshot, type StoreDevice } from './devices-data'

const DIAGNOSTIC_COLORS = {
  stable: 'green',
  watch: 'orange',
  risk: 'red',
} as const

export default function DevicesClient({ snapshot }: { snapshot: DevicesSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabKey, setTabKey] = useState('list')
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showMaint, setShowMaint] = useState<StoreDevice | null>(null)

  const deviceTypes = useMemo(() => ['all', ...new Set(snapshot.devices.map((item) => item.type))], [snapshot.devices])
  const filteredDevices = useMemo(
    () =>
      snapshot.devices.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        return true
      }),
    [snapshot.devices, statusFilter, typeFilter],
  )

  const typeDistribution = useMemo(() => {
    const counter = new Map<string, number>()
    snapshot.devices.forEach((item) => counter.set(item.type, (counter.get(item.type) ?? 0) + 1))
    return Array.from(counter.entries())
  }, [snapshot.devices])

  const columns: Parameters<typeof Table>[0]['columns'] = [
    { title: '编号', dataIndex: 'id', width: 100 },
    {
      title: '设备名称',
      dataIndex: 'name',
      render: (value: string, record: StoreDevice) => (
        <span>
          {value}
          <span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>{record.type}</span>
        </span>
      ),
    },
    { title: '位置', dataIndex: 'location' },
    { title: '状态', dataIndex: 'status', render: (value: DeviceStatus) => <Tag color={DEVICE_STATUS_META[value].color}>{DEVICE_STATUS_META[value].label}</Tag> },
    { title: '上次维护', dataIndex: 'lastMaintenance' },
    { title: '下次维护', dataIndex: 'nextMaintenance', render: (value: string) => <span style={{ color: value < '2026-07-27' ? '#f87171' : '#e2e8f0' }}>{value}</span> },
    { title: '运行时长', dataIndex: 'usageHours', render: (value: number) => `${Math.round(value / 24)}天` },
    { title: '保修', dataIndex: 'warranty', render: (value?: string) => <Tag color={value === '过期' ? 'red' : 'green'}>{value ?? '-'}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: StoreDevice) => (
        <Space size="small">
          <Button size="small" onClick={() => setShowMaint(record)}>
            维护
          </Button>
          <Button size="small" danger={record.status === 'fault'} onClick={() => message.info('报修工单仍处于演示态。')}>
            报修
          </Button>
        </Space>
      ),
    },
  ]

  

  return (
    <PageShell title="设备管理" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card size="small">
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>设备管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              资产清单 · 状态监控 · 维护记录 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => message.info('导出清单仍处于结构固证演示态。')}>导出清单</Button>
            <Button type="primary" onClick={() => setShowAdd(true)}>
              添加设备
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}><Card size="small"><Statistic title="总设备" value={snapshot.summary.total} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="在线率" value={snapshot.summary.onlinePct} suffix="%" valueStyle={{ color: snapshot.summary.onlinePct >= 80 ? '#34d399' : '#f59e0b' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="离线 / 故障" value={snapshot.summary.offline + snapshot.summary.fault} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="维护逾期" value={snapshot.summary.overdue} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        </Row>

        <Card title="来源态诊断" subtitle="结构固证、IoT 接入与工单闭环状态">
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
                key: 'list',
                label: '设备列表',
                children: (
                  <>
                    <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                      <span style={{ color: '#94a3b8' }}>状态:</span>
                      <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as DeviceStatus | 'all')}
                        style={{ width: 140 }}
                        options={[
                          { value: 'all', label: '全部状态' },
                          { value: 'online', label: '在线' },
                          { value: 'offline', label: '离线' },
                          { value: 'maintenance', label: '维护中' },
                          { value: 'fault', label: '故障' },
                        ]}
                      />
                      <span style={{ color: '#94a3b8' }}>类型:</span>
                      <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 160 }} options={deviceTypes.map((item) => ({ value: item, label: item === 'all' ? '全部类型' : item }))} />
                      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>共 {filteredDevices.length} 台设备</span>
                    </Space>
                    {filteredDevices.length ? <Table dataSource={filteredDevices} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} /> : <Empty description="无匹配设备" />}
                  </>
                ),
              },
              {
                key: 'maintenance',
                label: `维护记录(${snapshot.maintenanceLogs.length})`,
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {snapshot.maintenanceLogs.map((item) => (
                      <Card key={item.id} size="small">
                        <div style={{ color: '#e2e8f0', fontSize: 13 }}>{item.deviceName} - {item.type}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{item.technician} · {item.time}</div>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{item.note}</div>
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'stats',
                label: '统计分析',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card title="设备类型分布" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {typeDistribution.map(([type, count]) => (
                            <div key={type}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: '#e2e8f0' }}>{type}</span>
                                <span style={{ color: '#94a3b8' }}>{count}台</span>
                              </div>
                              <Progress percent={Math.round((count / snapshot.summary.total) * 100)} size="small" />
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="状态分布" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {Object.entries(DEVICE_STATUS_META).map(([status, meta]) => {
                            const count = snapshot.devices.filter((item) => item.status === status).length
                            return (
                              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Tag color={meta.color}>{meta.label}</Tag>
                                <span style={{ color: '#e2e8f0' }}>{count}台</span>
                              </div>
                            )
                          })}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
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

        <Modal title="添加设备" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('设备添加成功（演示态）'); setShowAdd(false) }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="设备名称" />
            <Input placeholder="设备类型" />
            <Input placeholder="部署位置" />
            <Input placeholder="IP 地址" />
          </Space>
        </Modal>

        <Modal title={`维护申请 - ${showMaint?.name ?? ''}`} open={Boolean(showMaint)} onCancel={() => setShowMaint(null)} onOk={() => { message.success('维护工单已创建（演示态）'); setShowMaint(null) }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8' }}>设备: {showMaint?.name} ({showMaint?.location})</div>
            <Select
              placeholder="维护类型"
              style={{ width: '100%' }}
              options={[
                { value: 'full-check', label: '全检' },
                { value: 'clean', label: '清洁' },
                { value: 'firmware', label: '固件升级' },
                { value: 'replace', label: '零部件更换' },
              ]}
            />
            <Input.TextArea rows={4} placeholder="维护说明" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  )
}
