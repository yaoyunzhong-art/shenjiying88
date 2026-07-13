// \u{1F5A5}\uFE0F 设备管理 · 设备清单/状态/维护 (P-42)
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Modal, Input, message } from '@m5/ui';

type DevStatus = 'online' | 'offline' | 'maintenance' | 'fault';
interface Device {
  id: string; name: string; type: string; location: string;
  status: DevStatus; lastMaintenance: string; nextMaintenance: string;
  usageHours: number; ip?: string; vendor?: string;
}

const STATUS_CFG: Record<DevStatus, { color: string; label: string }> = {
  online: { color: 'green', label: '在线' },
  offline: { color: 'default', label: '离线' },
  maintenance: { color: 'orange', label: '维护中' },
  fault: { color: 'red', label: '故障' },
};

const DEVICES: Device[] = [
  { id: 'DEV-001', name: 'VR-01', type: 'VR设备', location: 'A区-VR体验区', status: 'online', lastMaintenance: '2026-07-01', nextMaintenance: '2026-08-01', usageHours: 1860, ip: '192.168.1.21', vendor: 'PICO' },
  { id: 'DEV-002', name: 'PS5-01', type: '游戏主机', location: 'B区-主机区', status: 'online', lastMaintenance: '2026-06-15', nextMaintenance: '2026-07-15', usageHours: 3200, ip: '192.168.1.31' },
  { id: 'DEV-003', name: '赛车模拟器', type: '模拟设备', location: 'C区-竞赛区', status: 'maintenance', lastMaintenance: '2026-07-10', nextMaintenance: '2026-07-17', usageHours: 980, vendor: 'NLR' },
  { id: 'DEV-004', name: '投篮机-01', type: '彩票机', location: 'D区-娱乐区', status: 'online', lastMaintenance: '2026-06-20', nextMaintenance: '2026-07-20', usageHours: 4500 },
  { id: 'DEV-005', name: 'SPR-01主机', type: '服务器', location: '机房', status: 'online', lastMaintenance: '2026-06-01', nextMaintenance: '2026-07-20', usageHours: 8760, ip: '192.168.1.10', vendor: 'Dell' },
  { id: 'DEV-006', name: '收银POS-01', type: 'POS机', location: '前台收银台', status: 'fault', lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', usageHours: 5800, ip: '192.168.1.100' },
  { id: 'DEV-007', name: '台球桌-01', type: '台球桌', location: 'B区-台球区', status: 'offline', lastMaintenance: '2026-06-25', nextMaintenance: '2026-07-25', usageHours: 1200 },
  { id: 'DEV-008', name: '空调-01', type: '环境', location: '大厅', status: 'online', lastMaintenance: '2026-05-01', nextMaintenance: '2026-08-01', usageHours: 7200 },
  { id: 'DEV-009', name: '打印机', type: '外设', location: '前台', status: 'online', lastMaintenance: '2026-06-30', nextMaintenance: '2026-09-30', usageHours: 400 },
  { id: 'DEV-010', name: '音响系统', type: '音频', location: '大厅', status: 'online', lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01', usageHours: 3600 },
];

const stats = {
  total: DEVICES.length,
  online: DEVICES.filter(d => d.status === 'online').length,
  offline: DEVICES.filter(d => d.status === 'offline').length,
  fault: DEVICES.filter(d => d.status === 'fault').length,
  maintenance: DEVICES.filter(d => d.status === 'maintenance').length,
};

export default function DevicesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<DevStatus | ''>('');
  const filtered = filter ? DEVICES.filter(d => d.status === filter) : DEVICES;

  const COLUMNS = [
    { title: '编号', dataIndex: 'id', width: 90 },
    { title: '设备名称', dataIndex: 'name', render: (v: string, r: Device) => <span>{v}<span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>{r.type}</span></span> },
    { title: '位置', dataIndex: 'location', width: 140 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: DevStatus) => <Tag color={STATUS_CFG[v].color}>{STATUS_CFG[v].label}</Tag> },
    { title: '上次维护', dataIndex: 'lastMaintenance', width: 100 },
    { title: '下次维护', dataIndex: 'nextMaintenance', width: 100 },
    { title: '运行时长', dataIndex: 'usageHours', width: 90, render: (v: number) => `${(v / 24).toFixed(0)}天` },
    { title: 'IP地址', dataIndex: 'ip', width: 120, render: (v?: string) => v || '-' },
    { title: '操作', key: 'actions', width: 120, render: (_: unknown, r: Device) => <Space size="small"><Button size="small">维护</Button><Button size="small" danger={r.status === 'fault'}>报修</Button></Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🖥️ 设备管理</h2>
          <Button type="primary" onClick={() => setShowAdd(true)}>添加设备</Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总设备" value={stats.total} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="在线" value={stats.online} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="离线" value={stats.offline} valueStyle={{ color: '#94a3b8' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="维护中" value={stats.maintenance} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="故障" value={stats.fault} valueStyle={{ color: '#f87171' }} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ marginBottom: 12, width: '100%' }}>
            <span style={{ color: '#94a3b8' }}>状态:</span>
            <Select style={{ width: 120 }} placeholder="全部" allowClear value={filter || undefined} onChange={v => setFilter((v || '') as DevStatus | '')}>
              {Object.entries(STATUS_CFG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
            </Select>
            <Button style={{ marginLeft: 'auto' }}>导出设备清单</Button>
          </Space>
          <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false} />
        </Card>
        <Modal title="添加设备" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('设备添加成功'); setShowAdd(false); }} okText="添加">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="设备名称" /><Input placeholder="设备类型" /><Input placeholder="位置" /><Input placeholder="IP地址(可选)" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
