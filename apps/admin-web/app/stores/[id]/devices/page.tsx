// 🖥️ 设备管理 · 设备清单/状态/维护 (P-42)
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Modal, Input, message, Progress, Empty, Divider, Timeline } from '@m5/ui';

type DevStatus = 'online' | 'offline' | 'maintenance' | 'fault';
interface Device {
  id: string; name: string; type: string; location: string;
  status: DevStatus; lastMaintenance: string; nextMaintenance: string;
  usageHours: number; ip?: string; vendor?: string; purchaseDate?: string; warranty?: string;
}

const STATUS_CFG: Record<DevStatus, { color: string; label: string }> = {
  online: { color: 'green', label: '在线' },
  offline: { color: 'default', label: '离线' },
  maintenance: { color: 'orange', label: '维护中' },
  fault: { color: 'red', label: '故障' },
};

const MAINT_TYPES = ['全检', '清洁', '固件升级', '零部件更换', '校准'];
const MAINT_LOG = [
  { id:'M-01', dev:'VR-01', type:'固件升级', time:'2026-07-10 09:00', tech:'赵六', note:'固件升级至v3.2.1' },
  { id:'M-02', dev:'赛车模拟器', type:'零部件更换', time:'2026-07-10 14:00', tech:'赵六', note:'踏板弹簧更换' },
  { id:'M-03', dev:'PS5-01', type:'清洁', time:'2026-07-08 10:00', tech:'清洁组', note:'全面清灰+散热检查' },
  { id:'M-04', dev:'投篮机-01', type:'校准', time:'2026-07-05 15:00', tech:'赵六', note:'传感器校准' },
  { id:'M-05', dev:'收银POS-01', type:'全检', time:'2026-06-28 11:00', tech:'IT部', note:'系统重置+外设测试' },
];

const DEVICES: Device[] = [
  { id: 'DEV-001', name: 'VR-01', type: 'VR设备', location: 'A区-VR体验区', status: 'online', lastMaintenance: '2026-07-01', nextMaintenance: '2026-08-01', usageHours: 1860, ip: '192.168.1.21', vendor: 'PICO', purchaseDate: '2025-03', warranty: '2027-03' },
  { id: 'DEV-002', name: 'PS5-01', type: '游戏主机', location: 'B区-主机区', status: 'online', lastMaintenance: '2026-06-15', nextMaintenance: '2026-07-15', usageHours: 3200, ip: '192.168.1.31', purchaseDate: '2024-06', warranty: '2027-06' },
  { id: 'DEV-003', name: '赛车模拟器', type: '模拟设备', location: 'C区-竞赛区', status: 'maintenance', lastMaintenance: '2026-07-10', nextMaintenance: '2026-07-17', usageHours: 980, vendor: 'NLR', purchaseDate: '2025-09', warranty: '2028-09' },
  { id: 'DEV-004', name: '投篮机-01', type: '彩票机', location: 'D区-娱乐区', status: 'online', lastMaintenance: '2026-06-20', nextMaintenance: '2026-07-20', usageHours: 4500, purchaseDate: '2024-01', warranty: '2027-01' },
  { id: 'DEV-005', name: 'SPR-01主机', type: '服务器', location: '机房', status: 'online', lastMaintenance: '2026-06-01', nextMaintenance: '2026-07-20', usageHours: 8760, ip: '192.168.1.10', vendor: 'Dell', purchaseDate: '2024-01', warranty: '2027-01' },
  { id: 'DEV-006', name: '收银POS-01', type: 'POS机', location: '前台收银台', status: 'fault', lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', usageHours: 5800, ip: '192.168.1.100', purchaseDate: '2024-03', warranty: '过期' },
  { id: 'DEV-007', name: '台球桌-01', type: '台球桌', location: 'B区-台球区', status: 'offline', lastMaintenance: '2026-06-25', nextMaintenance: '2026-07-25', usageHours: 1200, purchaseDate: '2025-06', warranty: '2028-06' },
  { id: 'DEV-008', name: '空调-01', type: '环境', location: '大厅', status: 'online', lastMaintenance: '2026-05-01', nextMaintenance: '2026-08-01', usageHours: 7200, purchaseDate: '2023-06', warranty: '过期' },
  { id: 'DEV-009', name: '打印机', type: '外设', location: '前台', status: 'online', lastMaintenance: '2026-06-30', nextMaintenance: '2026-09-30', usageHours: 400, purchaseDate: '2025-10', warranty: '2027-10' },
  { id: 'DEV-010', name: '音响系统', type: '音频', location: '大厅', status: 'online', lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01', usageHours: 3600, purchaseDate: '2024-12', warranty: '2027-12' },
  { id: 'DEV-011', name: '跳绳机', type: '彩票机', location: 'D区-娱乐区', status: 'online', lastMaintenance: '2026-06-25', nextMaintenance: '2026-07-25', usageHours: 2100, purchaseDate: '2025-01', warranty: '2028-01' },
  { id: 'DEV-012', name: 'K歌机', type: '娱乐设备', location: 'C区', status: 'online', lastMaintenance: '2026-06-15', nextMaintenance: '2026-08-15', usageHours: 1500, purchaseDate: '2025-06', warranty: '2028-06' },
];

export default function DevicesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showMaint, setShowMaint] = useState<Device | null>(null);
  const [filter, setFilter] = useState<DevStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tabKey, setTabKey] = useState('list');

  const deviceTypes = useMemo(() => [...new Set(DEVICES.map(d => d.type))], []);
  const filtered = DEVICES.filter(d => {
    if (filter && d.status !== filter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    return true;
  });

  const stats = useMemo(() => ({
    total: DEVICES.length,
    online: DEVICES.filter(d => d.status === 'online').length,
    offline: DEVICES.filter(d => d.status === 'offline').length,
    fault: DEVICES.filter(d => d.status === 'fault').length,
    maintenance: DEVICES.filter(d => d.status === 'maintenance').length,
    overdue: DEVICES.filter(d => new Date(d.nextMaintenance) < new Date()).length,
  }), []);

  const typeDist = useMemo(() => {
    const m: Record<string, number> = {};
    DEVICES.forEach(d => { m[d.type] = (m[d.type] || 0) + 1; });
    return Object.entries(m);
  }, []);

  const onlinePct = Math.round((stats.online / stats.total) * 100);

  const COLUMNS = [
    { title: '编号', dataIndex: 'id', width: 90 },
    { title: '设备名称', dataIndex: 'name', width: 140, render: (v: string, r: Device) => <span>{v}<span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>{r.type}</span></span> },
    { title: '位置', dataIndex: 'location', width: 130 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: DevStatus) => <Tag color={STATUS_CFG[v].color}>{STATUS_CFG[v].label}</Tag> },
    { title: '上次维护', dataIndex: 'lastMaintenance', width: 90 },
    { title: '下次维护', dataIndex: 'nextMaintenance', width: 90, render: (v: string, r: Device) => {
      const isOverdue = new Date(v) < new Date();
      return <span style={{ color: isOverdue ? '#f87171' : '#e2e8f0' }}>{v}{isOverdue ? ' ⚠️' : ''}</span>;
    }},
    { title: '运行', dataIndex: 'usageHours', width: 70, render: (v: number) => `${(v / 24).toFixed(0)}天` },
    { title: '保修', dataIndex: 'warranty', width: 70, render: (v?: string) => <Tag size="small" color={v === '过期' ? 'red' : 'green'}>{v || '-'}</Tag> },
    { title: '操作', key: 'actions', width: 130, render: (_: unknown, r: Device) => <Space size="small">
      <Button size="small" onClick={() => setShowMaint(r)}>维护</Button>
      <Button size="small" danger={r.status === 'fault'}>报修</Button>
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🖥️ 设备管理</h2>
          <Space><Button>导出清单</Button><Button type="primary" onClick={() => setShowAdd(true)}>+ 添加设备</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={3}><Card size="small"><Statistic title="总设备" value={stats.total} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="在线率" value={onlinePct} suffix="%" valueStyle={{ color: onlinePct >= 80 ? '#34d399' : '#f59e0b' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="在线" value={stats.online} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="离线/故障" value={stats.offline + stats.fault} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="维护中" value={stats.maintenance} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="过保" value={DEVICES.filter(d => d.warranty === '过期').length} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="维护逾期" value={stats.overdue} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="设备类型" value={deviceTypes.length} /></Card></Col>
        </Row>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key:'list', label:'设备列表',
            children: <Card>
              <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8' }}>状态:</span>
                <Select style={{ width: 120 }} placeholder="全部" allowClear value={filter || undefined} onChange={v => setFilter((v || '') as DevStatus | '')}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
                </Select>
                <span style={{ color: '#94a3b8' }}>类型:</span>
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}
                  options={[{value:'all',label:'全部类型'}, ...deviceTypes.map(t => ({value:t, label:t}))]} />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>共 {filtered.length} 台设备</span>
              </Space>
              {filtered.length === 0 ? <Empty description="无匹配设备" /> :
                <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8 }} />
              }
            </Card>
          },
          { key:'maint', label:`维护记录(${MAINT_LOG.length})`,
            children: <Card>
              <Timeline>
                {MAINT_LOG.map(m => (
                  <Timeline.Item key={m.id} color="blue">
                    <div style={{ color: '#e2e8f0', fontSize: 13 }}>{m.dev} — {m.type}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{m.tech} · {m.time}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{m.note}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          },
          { key:'stats', label:'统计分析',
            children: <Row gutter={16}>
              <Col span={12}>
                <Card title="设备类型分布">
                  {typeDist.map(([t, c]) => (
                    <div key={t} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.08)' }}>
                      <span style={{color:'#e2e8f0'}}>{t}</span>
                      <Space><Progress percent={Math.round(c / DEVICES.length * 100)} size="small" style={{width:120}} /><span style={{color:'#94a3b8', fontSize:13}}>{c}台</span></Space>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="状态分布">
                  {Object.entries(STATUS_CFG).map(([k, {label}]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.08)' }}>
                      <Tag color={STATUS_CFG[k as DevStatus].color}>{label}</Tag>
                      <span style={{color:'#e2e8f0'}}>{DEVICES.filter(d => d.status === k).length}台</span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          },
        ]} />

        <Modal title="添加设备" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('设备添加成功'); setShowAdd(false); }} width={480}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input placeholder="设备名称" /><Input placeholder="设备类型" />
              <Input placeholder="位置" /><Input placeholder="IP地址" />
              <Input placeholder="供应商" /><Input placeholder="购买日期" />
            </div>
          </Space>
        </Modal>

        <Modal title={`维护申请 - ${showMaint?.name || ''}`} open={!!showMaint} onCancel={() => setShowMaint(null)} onOk={() => { message.success('维护工单已创建'); setShowMaint(null); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8', marginBottom: 8 }}>设备: {showMaint?.name} ({showMaint?.location})</div>
            <Select placeholder="维护类型" style={{ width: '100%' }}>{MAINT_TYPES.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}</Select>
            <Input.TextArea rows={4} placeholder="维护说明" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
