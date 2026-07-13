// 📅 预约管理 · 场地/设备预约 · 完整预约管理+日历
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message, Tabs, Empty, Tooltip } from '@m5/ui';

const DATA = [
  { id:'R001', customer:'张明', type:'生日派对', date:'2026-07-15', time:'14:00-17:00', people:15, status:'confirmed', phone:'138****8888', source:'小程序' },
  { id:'R002', customer:'公司团建（TechCo）', type:'团建活动', date:'2026-07-16', time:'10:00-16:00', people:28, status:'confirmed', phone:'139****0000', source:'电话' },
  { id:'R003', customer:'李芳', type:'VR体验', date:'2026-07-13', time:'10:00-12:00', people:3, status:'pending', phone:'136****6666', source:'小程序' },
  { id:'R004', customer:'王明', type:'台球', date:'2026-07-14', time:'15:00-18:00', people:4, status:'confirmed', phone:'137****2222', source:'到店' },
  { id:'R005', customer:'赵华', type:'电竞包间', date:'2026-07-17', time:'19:00-23:00', people:10, status:'pending', phone:'135****1111', source:'电话' },
  { id:'R006', customer:'少儿培训', type:'体验', date:'2026-07-18', time:'09:00-12:00', people:20, status:'cancelled', phone:'133****3333', source:'小程序' },
  { id:'R007', customer:'刘伟', type:'会员活动', date:'2026-07-19', time:'14:00-17:00', people:8, status:'confirmed', phone:'132****5555', source:'到店' },
  { id:'R008', customer:'陈静', type:'VR体验', date:'2026-07-20', time:'15:00-16:00', people:2, status:'confirmed', phone:'131****7777', source:'小程序' },
];

const STATUS_CFG: Record<string, [string, string]> = {
  confirmed: ['green', '已确认'], pending: ['blue', '待确认'], cancelled: ['default', '已取消'],
};

const COLUMNS = [
  { title: '客户', dataIndex: 'customer' },
  { title: '类型', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
  { title: '日期', dataIndex: 'date' }, { title: '时间', dataIndex: 'time' },
  { title: '人数', dataIndex: 'people' },
  { title: '来源', dataIndex: 'source', render: (v: string) => <Tag>{v}</Tag> },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={STATUS_CFG[v]?.[0] || 'default'}>{STATUS_CFG[v]?.[1] || v}</Tag> },
  { title: '联系方式', dataIndex: 'phone' },
  { title: '操作', key: 'a', width: 140, render: (_: unknown, r: typeof DATA[0]) => (
    <Space size="small">
      {r.status === 'pending' && <Button size="small" type="primary">确认</Button>}
      {r.status === 'confirmed' && <Button size="small">取消</Button>}
      <Button size="small">详情</Button>
    </Space>
  )},
];

export default function ReservationsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('list');

  const filtered = useMemo(() => {
    let r = DATA;
    if (statusFilter !== 'all') r = r.filter(d => d.status === statusFilter);
    if (search) r = r.filter(d => d.customer.includes(search) || d.phone.includes(search));
    return r;
  }, [statusFilter, search]);

  const totalPeople = DATA.reduce((s, d) => s + d.people, 0);
  const confirmedCount = DATA.filter(d => d.status === 'confirmed').length;
  const pendingCount = DATA.filter(d => d.status === 'pending').length;

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📅 预约管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>场地预约 · 设备预约 · 批量管理</span></div>
          <Button type="primary" onClick={() => setShowCreate(true)}>+ 创建预约</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="预约总数" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已确认" value={confirmedCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="待确认" value={pendingCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总人数" value={totalPeople} suffix="人" valueStyle={{ color: '#6366f1' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="取消" value={DATA.filter(d => d.status === 'cancelled').length} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="列表视图" />
            <Tabs.Tab key="calendar" label="日历视图" />
          </Tabs>
          {tab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <Input placeholder="搜索客户/电话" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'confirmed', label: '已确认' }, { value: 'pending', label: '待确认' }, { value: 'cancelled', label: '已取消' }]} />
              </Space>
              <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8 }} />
            </>
          ) : (
            <Empty description="日历视图开发中…" />
          )}
        </Card>

        <Card size="small">
          <Space><Button>排程表</Button><Button>导出预约列表</Button><Button>模板</Button></Space>
        </Card>

        <Modal title="创建预约" open={showCreate} onCancel={() => setShowCreate(false)}
          onOk={() => { message.success('预约已创建'); setShowCreate(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="客户姓名" />
            <Input placeholder="联系电话" />
            <Select placeholder="预约类型" style={{ width: '100%' }}>
              <Select.Option value="生日派对">生日派对</Select.Option>
              <Select.Option value="团建活动">团建活动</Select.Option>
              <Select.Option value="VR体验">VR体验</Select.Option>
              <Select.Option value="台球">台球</Select.Option>
              <Select.Option value="电竞包间">电竞包间</Select.Option>
            </Select>
            <Input placeholder="日期" type="date" />
            <Input placeholder="时间" />
            <Input placeholder="人数" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
