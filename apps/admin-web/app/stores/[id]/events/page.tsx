// 📅 活动管理 · 门店活动创建/审批/发布 · 看板+列表+日历视图
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, Input, message, Tabs, DatePicker, Empty, Tooltip, Badge, Popconfirm } from '@m5/ui';

interface Event {
  id: string; name: string; type: string; date: string; time: string;
  location: string; budget: number; status: 'draft' | 'approved' | 'published' | 'completed' | 'cancelled';
  attendees?: number; description?: string; organizer?: string; createTime?: string;
}

const DATA: Event[] = [
  { id: 'EVT-001', name: '暑期亲子活动', type: '主题活动', date: '2026-07-20', time: '14:00-17:00', location: '大厅', budget: 5000, status: 'approved', attendees: 30, description: '亲子互动游戏+手工DIY', organizer: '市场部', createTime: '2026-07-01' },
  { id: 'EVT-002', name: '电竞赛季赛', type: '竞技', date: '2026-07-15', time: '18:00-21:00', location: '主机区', budget: 8000, status: 'published', attendees: 45, description: '热门电竞项目淘汰赛', organizer: '运营部', createTime: '2026-06-28' },
  { id: 'EVT-003', name: '生日派对特惠', type: '促销', date: '2026-07-25', time: '10:00-22:00', location: '全场', budget: 2000, status: 'draft', description: '生日当天消费享8折', organizer: '市场部', createTime: '2026-07-06' },
  { id: 'EVT-004', name: 'VR体验日', type: '体验', date: '2026-07-18', time: '10:00-18:00', location: 'VR区', budget: 3000, status: 'published', attendees: 80, description: '免费VR限时体验活动', organizer: '技术部', createTime: '2026-07-05' },
  { id: 'EVT-005', name: '会员回馈月', type: '会员', date: '2026-08-01', time: '全天', location: '全场', budget: 10000, status: 'draft', description: '会员消费双倍积分', organizer: '运营部', createTime: '2026-07-12' },
  { id: 'EVT-006', name: '台球友谊赛', type: '竞技', date: '2026-07-22', time: '14:00-18:00', location: '台球区', budget: 1500, status: 'completed', attendees: 24, description: '台球爱好者友谊赛', organizer: '导玩组', createTime: '2026-07-02' },
  { id: 'EVT-007', name: '安全消防培训', type: '培训', date: '2026-07-16', time: '09:00-11:00', location: '培训室', budget: 500, status: 'approved', description: '全员消防安全培训', organizer: '安监部', createTime: '2026-07-08' },
  { id: 'EVT-008', name: '新员工入职会', type: '内部', date: '2026-07-19', time: '10:00-11:30', location: '会议室', budget: 0, status: 'published', attendees: 12, description: '本月新员工入职培训', organizer: '人事部', createTime: '2026-07-10' },
  { id: 'EVT-009', name: '七夕主题活动', type: '主题活动', date: '2026-08-10', time: '14:00-22:00', location: '大厅', budget: 6000, status: 'draft', description: '七夕情侣套餐·拍照打卡', organizer: '市场部', createTime: '2026-07-13' },
  { id: 'EVT-010', name: '暑期夏令营', type: '主题活动', date: '2026-08-05', time: '09:00-17:00', location: '全场', budget: 12000, status: 'draft', description: '学生暑期畅玩日', organizer: '运营部', createTime: '2026-07-13' },
];

const SCFG: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' }, approved: { color: 'blue', label: '已审核' },
  published: { color: 'green', label: '已发布' }, completed: { color: 'default', label: '已完成' },
  cancelled: { color: 'red', label: '已取消' },
};

const typeColors: Record<string, string> = { '主题活动': '#6366f1', '竞技': '#f59e0b', '促销': '#ec4899', '体验': '#14b8a6', '会员': '#8b5cf6', '培训': '#06b6d4', '内部': '#64748b' };

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [viewTab, setViewTab] = useState('list');

  const filtered = useMemo(() => {
    let r = DATA;
    if (filter !== 'all') r = r.filter(e => e.status === filter);
    if (typeFilter !== 'all') r = r.filter(e => e.type === typeFilter);
    return r;
  }, [filter, typeFilter]);

  const totalBudget = DATA.reduce((s, e) => s + e.budget, 0);
  const activeEvents = DATA.filter(e => e.status === 'published' || e.status === 'approved').length;
  const completedEvents = DATA.filter(e => e.status === 'completed').length;
  const totalAttendees = DATA.reduce((s, e) => s + (e.attendees || 0), 0);

  const cols = [
    { title: '活动名称', dataIndex: 'name', render: (v: string, r: Event) => <><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{r.description}</div></> },
    { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color={typeColors[v]}>{v}</Tag> },
    { title: '日期', dataIndex: 'date' },
    { title: '时间', dataIndex: 'time' },
    { title: '地点', dataIndex: 'location' },
    { title: '预算', dataIndex: 'budget', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '参与者', dataIndex: 'attendees', render: (v?: number) => v ? `${v}人` : '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    {
      title: '操作', key: 'a', width: 180,
      render: (_: unknown, r: Event) => (
        <Space size="small">
          {r.status === 'draft' && <Button size="small" type="primary">提交审核</Button>}
          {r.status === 'approved' && <Button size="small" type="primary">发布</Button>}
          {r.status === 'published' && <Popconfirm title="确认结束活动？" onConfirm={() => message.success('活动已结束')}><Button size="small">结束</Button></Popconfirm>}
          <Button size="small">查看</Button>
          {r.status === 'draft' && <Popconfirm title="确认删除？" onConfirm={() => message.success('已删除')}><Button size="small" danger>删除</Button></Popconfirm>}
        </Space>
      ),
    },
  ];

  const upcomingEvents = useMemo(() =>
    [...DATA].filter(e => e.status !== 'completed' && e.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
  []);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📅 活动管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>门店活动创建·审批·发布·统计</span></div>
          <Button type="primary" onClick={() => setShowAdd(true)}>+ 创建活动</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="本月光盘" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="进行中" value={activeEvents} valueStyle={{ color: '#34d399' }} suffix={`/ ${DATA.length}`} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已完成" value={completedEvents} valueStyle={{ color: '#94a3b8' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总预算" value={totalBudget.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="预计参与" value={totalAttendees} suffix="人" valueStyle={{ color: '#6366f1' }} /></Card></Col>
        </Row>

        {/* 即将开始 */}
        <Card title="📌 即将开始" size="small">
          <Row gutter={[12, 12]}>
            {upcomingEvents.map(evt => (
              <Col key={evt.id} span={4}>
                <Card size="small" hoverable style={{ borderLeft: `3px solid ${typeColors[evt.type] || '#6366f1'}` }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{evt.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{evt.date} {evt.time}</div>
                  <div><Tag color={typeColors[evt.type]} style={{ fontSize: 10 }}>{evt.type}</Tag> <Tag color={SCFG[evt.status]?.color} style={{ fontSize: 10 }}>{SCFG[evt.status]?.label}</Tag></div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card>
          <Tabs value={viewTab} onChange={setViewTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="列表视图" />
            <Tabs.Tab key="calendar" label="日历视图" />
          </Tabs>

          {viewTab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <Select value={filter} onChange={setFilter} style={{ width: 130 }}
                  options={[{ value: 'all', label: '全部状态' }, { value: 'draft', label: '草稿' }, { value: 'approved', label: '已审核' }, { value: 'published', label: '已发布' }, { value: 'completed', label: '已完成' }, { value: 'cancelled', label: '已取消' }]} />
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }}
                  options={[{ value: 'all', label: '全部类型' }, { value: '主题活动', label: '主题活动' }, { value: '竞技', label: '竞技' }, { value: '促销', label: '促销' }, { value: '体验', label: '体验' }, { value: '会员', label: '会员' }, { value: '培训', label: '培训' }]} />
              </Space>
              <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['8', '16', '24'] }} />
            </>
          ) : (
            <Empty description="日历视图开发中…" />
          )}
        </Card>

        <Modal title="创建活动" open={showAdd} onCancel={() => setShowAdd(false)}
          onOk={() => { message.success('活动已创建'); setShowAdd(false); }}
          width={500}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <Select placeholder="活动类型" style={{ width: '100%' }} options={[{ value: '主题活动', label: '主题活动' }, { value: '竞技', label: '竞技' }, { value: '促销', label: '促销' }, { value: '体验', label: '体验' }, { value: '会员', label: '会员' }]} />
            <Input placeholder="活动日期" type="date" />
            <Input placeholder="开始-结束时间" />
            <Input placeholder="活动地点" />
            <Input placeholder="预算" type="number" />
            <Input placeholder="活动描述" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
