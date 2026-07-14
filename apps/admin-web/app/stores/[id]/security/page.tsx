// 🛡️ 安防管理 · 监控/门禁/告警
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, message, Modal, Progress, Divider, Timeline, Empty } from '@m5/ui';

interface Alert { id: string; type: string; location: string; time: string; severity: 'low' | 'medium' | 'high' | 'critical'; status: 'pending' | 'handled' | 'ignored'; handler?: string; category: string; resolvedAt?: string; }
const ALERTS: Alert[] = [
  { id: 'AL-001', type: '门禁异常', location: '后门', time: '2026-07-13 23:15', severity: 'high', status: 'pending', category: '门禁' },
  { id: 'AL-002', type: '烟雾告警', location: '机房', time: '2026-07-13 22:00', severity: 'critical', status: 'pending', category: '消防' },
  { id: 'AL-003', type: '监控掉线', location: 'C区', time: '2026-07-13 21:30', severity: 'medium', status: 'handled', handler: '张三', category: '监控', resolvedAt: '2026-07-13 22:10' },
  { id: 'AL-004', type: '异常闯入', location: '仓库', time: '2026-07-13 03:00', severity: 'critical', status: 'handled', handler: '保安队', category: '门禁', resolvedAt: '2026-07-13 03:25' },
  { id: 'AL-005', type: '设备移位', location: 'D区', time: '2026-07-12 18:00', severity: 'low', status: 'ignored', category: '设备' },
  { id: 'AL-006', type: '门未关闭', location: '消防通道', time: '2026-07-12 14:00', severity: 'medium', status: 'pending', category: '门禁' },
  { id: 'AL-007', type: '视频存储告警', location: 'NVR', time: '2026-07-12 10:00', severity: 'high', status: 'handled', handler: '李四', category: '监控', resolvedAt: '2026-07-12 11:30' },
  { id: 'AL-008', type: '异常登录', location: 'POS系统', time: '2026-07-11 23:00', severity: 'high', status: 'pending', category: '系统' },
  { id: 'AL-009', type: '电力波动', location: '总配电室', time: '2026-07-11 15:30', severity: 'medium', status: 'handled', handler: '赵工', category: '电力', resolvedAt: '2026-07-11 16:00' },
  { id: 'AL-010', type: '温感告警', location: '服务器间', time: '2026-07-10 14:00', severity: 'critical', status: 'handled', handler: 'IT部', category: '环境', resolvedAt: '2026-07-10 14:20' },
  { id: 'AL-011', type: 'UPS告警', location: '弱电间', time: '2026-07-10 08:00', severity: 'high', status: 'ignored', category: '电力' },
  { id: 'AL-012', type: '巡更超时', location: 'B区', time: '2026-07-09 22:00', severity: 'low', status: 'handled', handler: '王五', category: '巡检', resolvedAt: '2026-07-09 22:10' },
];
const SCFG: Record<string, { color: string; label: string }> = { critical: { color: 'red', label: '严重' }, high: { color: 'orange', label: '高' }, medium: { color: 'blue', label: '中' }, low: { color: 'default', label: '低' } };
const STCFG: Record<string, { color: string; label: string }> = { pending: { color: 'red', label: '待处理' }, handled: { color: 'green', label: '已处理' }, ignored: { color: 'default', label: '忽略' } };

const CAMERA_STATUS = [
  { id: 'CAM-01', name: '入口', status: 'online', lastCheck: '1分钟前' },
  { id: 'CAM-02', name: '收银台', status: 'online', lastCheck: '30秒前' },
  { id: 'CAM-03', name: 'A区', status: 'online', lastCheck: '2分钟前' },
  { id: 'CAM-04', name: 'B区', status: 'offline', lastCheck: '15分钟前' },
  { id: 'CAM-05', name: 'C区', status: 'online', lastCheck: '1分钟前' },
  { id: 'CAM-06', name: '仓库', status: 'online', lastCheck: '3分钟前' },
  { id: 'CAM-07', name: '出口', status: 'error', lastCheck: '5分钟前' },
  { id: 'CAM-08', name: '机房', status: 'online', lastCheck: '30秒前' },
];

export default function SecurityPage() {
  const [filter, setFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [detailModal, setDetailModal] = useState<Alert | null>(null);

  const categories = useMemo(() => [...new Set(ALERTS.map(a => a.category))], []);
  const pendingCount = ALERTS.filter(a => a.status === 'pending').length;
  const criticalCount = ALERTS.filter(a => a.severity === 'critical').length;
  const handledCount = ALERTS.filter(a => a.status === 'handled').length;
  const cameraOnline = CAMERA_STATUS.filter(c => c.status === 'online').length;

  const filtered = ALERTS.filter(a =>
    (filter === 'all' || a.status === filter) &&
    (sevFilter === 'all' || a.severity === sevFilter) &&
    (catFilter === 'all' || a.category === catFilter)
  );

  const timelineEvents = ALERTS.filter(a => a.status === 'handled' && a.handler)
    .sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

  const cols = [
    { title: '告警类型', dataIndex: 'type', width: 130, render: (v: string, r: Alert) => <Space><Tag color={SCFG[r.severity]?.color} size="small">{r.category}</Tag><span style={{ fontWeight: 500 }}>{v}</span></Space> },
    { title: '位置', dataIndex: 'location', width: 100 }, { title: '时间', dataIndex: 'time', width: 150 },
    { title: '严重度', dataIndex: 'severity', width: 80, render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={STCFG[v]?.color}>{STCFG[v]?.label}</Tag> },
    { title: '处理人', dataIndex: 'handler', width: 80, render: (v?: string) => v || '-' },
    { title: '操作', key: 'a', width: 180, render: (_: unknown, r: Alert) => <Space size="small">
      {r.status === 'pending' && <><Button size="small" type="primary" onClick={() => message.success('已标记处理')}>处理</Button><Button size="small" onClick={() => message.success('已忽略')}>忽略</Button></>}
      <Button size="small" onClick={() => setDetailModal(r)}>详情</Button>
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🛡️ 安防管理</h2>
          <Space><Button type="primary">视频监控</Button><Button>门禁管理</Button><Button>告警规则</Button></Space>
        </div>

        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="待处理" value={pendingCount} valueStyle={{ color: '#f87171' }} suffix={
            <span style={{ fontSize: 12, color: '#94a3b8' }}>/ {ALERTS.length}</span>
          } /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="严重告警" value={criticalCount} valueStyle={{ color: '#ef4444', fontWeight: 700 }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="已处理" value={handledCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="监控在线" value={`${cameraOnline}/${CAMERA_STATUS.length}`} valueStyle={{ color: cameraOnline === CAMERA_STATUS.length ? '#34d399' : '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="高严重度% " value={ALERTS.length > 0 ? Math.round((ALERTS.filter(a => a.severity === 'high' || a.severity === 'critical').length / ALERTS.length) * 100) : 0} suffix="%" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="处理率" value={ALERTS.length > 0 ? Math.round((handledCount / ALERTS.length) * 100) : 0} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card title="告警列表">
              <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={filter} onChange={setFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待处理' }, { value: 'handled', label: '已处理' }, { value: 'ignored', label: '已忽略' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>严重度:</span>
                <Select value={sevFilter} onChange={setSevFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部' }, { value: 'critical', label: '严重' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>分类:</span>
                <Select value={catFilter} onChange={setCatFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部' }, ...categories.map(c => ({ value: c, label: c }))]} />
                <Button size="small" style={{ marginLeft: 'auto' }}>批量处理</Button>
              </Space>
              {filtered.length === 0 ? <Empty description="无匹配告警" /> :
                <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true }} />
              }
            </Card>
          </Col>
          <Col span={8}>
            <Card title="监控状态" style={{ marginBottom: 16 }}>
              <Row gutter={[8, 8]}>
                {CAMERA_STATUS.map(cam => (
                  <Col key={cam.id} span={12}>
                    <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(148,163,184,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#e2e8f0', fontSize: 13 }}>{cam.name}</span>
                      <Tag color={cam.status === 'online' ? 'green' : cam.status === 'offline' ? 'red' : 'orange'} size="small">
                        {cam.status === 'online' ? '在线' : cam.status === 'offline' ? '离线' : '异常'}
                      </Tag>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
            <Card title="最近处理记录">
              <Timeline style={{ marginTop: 8 }}>
                {timelineEvents.map(e => (
                  <Timeline.Item key={e.id} color={SCFG[e.severity]?.color}>
                    <div style={{ color: '#e2e8f0', fontSize: 13 }}>{e.type} — {e.location}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{e.handler} · {e.resolvedAt}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>

        <Modal title={`告警详情 - ${detailModal?.id || ''}`} open={!!detailModal} onCancel={() => setDetailModal(null)} footer={<Button onClick={() => setDetailModal(null)}>关闭</Button>}>
          {detailModal && <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>类型</div><div style={{ color: '#e2e8f0' }}>{detailModal.type}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>位置</div><div style={{ color: '#e2e8f0' }}>{detailModal.location}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>时间</div><div style={{ color: '#e2e8f0' }}>{detailModal.time}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>严重度</div><Tag color={SCFG[detailModal.severity]?.color}>{SCFG[detailModal.severity]?.label}</Tag></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>状态</div><Tag color={STCFG[detailModal.status]?.color}>{STCFG[detailModal.status]?.label}</Tag></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>处理人</div><span style={{ color: '#e2e8f0' }}>{detailModal.handler || '-'}</span></div>
            </div>
            <Divider />
            <div style={{ color: '#94a3b8', fontSize: 12 }}>历史处理建议</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>建议立即派单到对应班组处理。告警类型：{detailModal.category}，可转至运维工单系统。</div>
          </Space>}
        </Modal>
      </Space>
    </PageShell>
  );
}
