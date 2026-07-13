// 🛡️ 安防管理 · 监控/门禁/告警
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, message } from '@m5/ui';

interface Alert { id: string; type: string; location: string; time: string; severity: 'low' | 'medium' | 'high' | 'critical'; status: 'pending' | 'handled' | 'ignored'; handler?: string; }
const ALERTS: Alert[] = [
  { id: 'AL-001', type: '门禁异常', location: '后门', time: '2026-07-13 23:15', severity: 'high', status: 'pending' },
  { id: 'AL-002', type: '烟雾告警', location: '机房', time: '2026-07-13 22:00', severity: 'critical', status: 'pending' },
  { id: 'AL-003', type: '监控掉线', location: 'C区', time: '2026-07-13 21:30', severity: 'medium', status: 'handled', handler: '张三' },
  { id: 'AL-004', type: '异常闯入', location: '仓库', time: '2026-07-13 03:00', severity: 'critical', status: 'handled', handler: '保安队' },
  { id: 'AL-005', type: '设备移位', location: 'D区', time: '2026-07-12 18:00', severity: 'low', status: 'ignored' },
  { id: 'AL-006', type: '门未关闭', location: '消防通道', time: '2026-07-12 14:00', severity: 'medium', status: 'pending' },
  { id: 'AL-007', type: '视频存储告警', location: 'NVR', time: '2026-07-12 10:00', severity: 'high', status: 'handled', handler: '李四' },
  { id: 'AL-008', type: '异常登录', location: 'POS系统', time: '2026-07-11 23:00', severity: 'high', status: 'pending' },
];
const SCFG: Record<string, { color: string; label: string }> = { critical: { color: 'red', label: '严重' }, high: { color: 'orange', label: '高' }, medium: { color: 'blue', label: '中' }, low: { color: 'default', label: '低' } };
const STCFG: Record<string, { color: string; label: string }> = { pending: { color: 'red', label: '待处理' }, handled: { color: 'green', label: '已处理' }, ignored: { color: 'default', label: '忽略' } };

export default function SecurityPage() {
  const [filter, setFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const filtered = ALERTS.filter(a => (filter === 'all' || a.status === filter) && (sevFilter === 'all' || a.severity === sevFilter));
  const cols = [
    { title: '告警类型', dataIndex: 'type', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '位置', dataIndex: 'location' }, { title: '时间', dataIndex: 'time', width: 150 },
    { title: '严重度', dataIndex: 'severity', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={STCFG[v]?.color}>{STCFG[v]?.label}</Tag> },
    { title: '处理人', dataIndex: 'handler', render: (v?: string) => v || '-' },
    { title: '操作', key: 'a', render: (_: unknown, r: Alert) => <Space size="small">{r.status === 'pending' && <><Button size="small" type="primary">处理</Button><Button size="small">忽略</Button></>}<Button size="small">查看</Button></Space> },
  ];
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>🛡️ 安防管理</h2>
        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="待处理" value={ALERTS.filter(a => a.status === 'pending').length} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="严重" value={ALERTS.filter(a => a.severity === 'critical').length} valueStyle={{ color: '#ef4444', fontWeight: 700 }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="高" value={ALERTS.filter(a => a.severity === 'high').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="已处理" value={ALERTS.filter(a => a.status === 'handled').length} valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <span style={{ color: '#94a3b8' }}>状态:</span>
            <Select value={filter} onChange={setFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待处理' }, { value: 'handled', label: '已处理' }, { value: 'ignored', label: '忽略' }]} />
            <span style={{ color: '#94a3b8' }}>严重度:</span>
            <Select value={sevFilter} onChange={setSevFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部' }, { value: 'critical', label: '严重' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]} />
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={false} />
        </Card>
        <Card><Space><Button type="primary">视频监控</Button><Button>门禁管理</Button><Button>告警规则</Button></Space></Card>
      </Space>
    </PageShell>
  );
}
