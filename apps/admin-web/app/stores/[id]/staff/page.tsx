// 👥 员工管理 · 排班/考勤/绩效
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Avatar, Badge, Progress, DatePicker, Divider, Empty, Tabs } from '@m5/ui';

interface Employee { id: string; name: string; role: string; status: 'on' | 'off' | 'leave'; phone: string; shift: string; joinDate: string; skills: string[]; performance?: string; attendance?: number; emergency?: string; }
const STATUS_CFG: Record<string, { color: string; label: string }> = { on: { color: 'green', label: '在岗' }, off: { color: 'default', label: '休息' }, leave: { color: 'orange', label: '请假' } };
const EMP: Employee[] = [
  { id: 'E001', name: '张三', role: '店长', status: 'on', phone: '138****1100', shift: '09:00-18:00', joinDate: '2024-03', skills: ['管理', '收银'], performance: 'A', attendance: 98, emergency: '李丽 138****0099' },
  { id: 'E002', name: '李四', role: '收银员', status: 'on', phone: '138****2200', shift: '09:00-18:00', joinDate: '2024-05', skills: ['收银', '接待'], performance: 'B', attendance: 95, emergency: '王刚 138****0088' },
  { id: 'E003', name: '王五', role: '导玩员', status: 'on', phone: '138****3300', shift: '14:00-22:00', joinDate: '2024-06', skills: ['设备引导', '活动'], performance: 'A', attendance: 97, emergency: '赵母 138****0077' },
  { id: 'E004', name: '赵六', role: '技术员', status: 'leave', phone: '138****4400', shift: '09:00-18:00', joinDate: '2024-04', skills: ['维修', '巡检'], performance: 'A', attendance: 100, emergency: '刘姐 138****0066' },
  { id: 'E005', name: '刘七', role: '收银员', status: 'off', phone: '138****5500', shift: '14:00-22:00', joinDate: '2024-07', skills: ['收银'], performance: 'B', attendance: 92, emergency: '刘父 138****0055' },
  { id: 'E006', name: '陈八', role: '保洁', status: 'on', phone: '138****6600', shift: '06:00-15:00', joinDate: '2024-02', skills: ['清洁'], performance: 'A', attendance: 99, emergency: '陈子 138****0044' },
  { id: 'E007', name: '周九', role: '导玩员', status: 'on', phone: '138****7700', shift: '09:00-18:00', joinDate: '2024-08', skills: ['设备引导', '销售'], performance: 'B', attendance: 94, emergency: '周某某 138****0033' },
  { id: 'E008', name: '吴十', role: '收银员', status: 'on', phone: '138****8800', shift: '06:00-15:00', joinDate: '2024-09', skills: ['收银', '接待'], performance: 'B', attendance: 90, emergency: '吴某某 138****0022' },
  { id: 'E009', name: '郑一', role: '导玩员', status: 'off', phone: '138****9900', shift: '14:00-22:00', joinDate: '2024-10', skills: ['活动', '销售'], performance: 'C', attendance: 85, emergency: '郑某某 138****0011' },
];

const ROLES = ['全部', '店长', '收银员', '导玩员', '技术员', '保洁'];

export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [filter, setFilter] = useState<'all' | 'on' | 'off' | 'leave'>('all');
  const [roleFilter, setRoleFilter] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  const filtered = useMemo(() => {
    let list = filter === 'all' ? EMP : EMP.filter(e => e.status === filter);
    if (roleFilter !== '全部') list = list.filter(e => e.role === roleFilter);
    if (searchText) list = list.filter(e => e.name.includes(searchText) || e.phone.includes(searchText));
    return list;
  }, [filter, roleFilter, searchText]);

  const onDuty = EMP.filter(e => e.status === 'on');
  const avgAttendance = Math.round(EMP.reduce((s, e) => s + (e.attendance || 0), 0) / EMP.length);

  const roleDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    EMP.forEach(e => { map[e.role] = (map[e.role] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const todaySchedule = [
    { shift: '06:00-15:00', count: EMP.filter(e => e.shift === '06:00-15:00' && e.status !== 'leave').length },
    { shift: '09:00-18:00', count: EMP.filter(e => e.shift === '09:00-18:00' && e.status !== 'leave').length },
    { shift: '14:00-22:00', count: EMP.filter(e => e.shift === '14:00-22:00' && e.status !== 'leave').length },
  ];

  const cols = [
    { title: '姓名', dataIndex: 'name', width: 140, render: (v: string, r: Employee) => (
      <Space>
        <Avatar size="small" style={{ background: r.role === '店长' ? '#6366f1' : '#334155', verticalAlign: 'middle' }}>{v[0]}</Avatar>
        <a onClick={() => setShowDetail(r)} style={{ color: '#60a5fa', cursor: 'pointer' }}>{v}</a>
        <Tag color={r.role === '店长' ? 'purple' : r.role === '收银员' ? 'blue' : 'default'} size="small">{r.role}</Tag>
      </Space>
    )},
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Badge status="processing" color={STATUS_CFG[v]?.color || 'default'} text={STATUS_CFG[v]?.label || v} /> },
    { title: '电话', dataIndex: 'phone', width: 110 },
    { title: '班次', dataIndex: 'shift', width: 120 },
    { title: '出勤率', dataIndex: 'attendance', width: 100, render: (v?: number) => v != null ? <Progress percent={v} size="small" strokeColor={v >= 95 ? '#34d399' : v >= 85 ? '#f59e0b' : '#ef4444'} /> : '-' },
    { title: '技能', dataIndex: 'skills', width: 160, render: (v: string[]) => <Space size={4}>{v.map(s => <Tag key={s} size="small">{s}</Tag>)}</Space> },
    { title: '绩效', dataIndex: 'performance', width: 70, render: (v?: string) => v ? <Tag color={v === 'A' ? 'green' : v === 'B' ? 'blue' : 'orange'}>{v}</Tag> : '-' },
    { title: '操作', key: 'a', width: 160, render: (_: unknown, r: Employee) => <Space size="small">
      <Button size="small" onClick={() => setShowDetail(r)}>详情</Button>
      {r.status !== 'leave' && <Button size="small" type="primary" ghost>排班</Button>}
      <Button size="small">考勤</Button>
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 员工管理</h2>
          <Space>
            <Button onClick={() => {}}>导出排班表</Button>
            <Button type="primary" onClick={() => setShowAdd(true)}>+ 添加员工</Button>
          </Space>
        </div>

        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="总人数" value={EMP.length} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="在岗" value={onDuty.length} valueStyle={{ color: '#34d399' }} suffix={<span style={{ fontSize: 12, color: '#94a3b8' }}>/{EMP.length}</span>} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="请假" value={EMP.filter(e => e.status === 'leave').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="平均出勤率" value={avgAttendance} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="今日排班" value={todaySchedule.reduce((s, t) => s + t.count, 0)} suffix={<span style={{ fontSize: 12, color: '#94a3b8' }}>人</span>} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="角色数" value={roleDistribution.length} suffix={<span style={{ fontSize: 12, color: '#94a3b8' }}>种</span>} /></Card></Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'list', label: '员工列表' },
          { key: 'stats', label: '统计分析' },
        ]} />

        {activeTab === 'list' && <Card>
          <Space style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
            <Input.Search placeholder="搜索姓名/电话" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} />
            <Select value={filter} onChange={setFilter} style={{ width: 100 }} options={[{ value: 'all', label: '全部状态' }, { value: 'on', label: '在岗' }, { value: 'off', label: '休息' }, { value: 'leave', label: '请假' }]} />
            <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 100 }} options={ROLES.map(r => ({ value: r, label: r === '全部' ? '全部角色' : r }))} />
            <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>共 {filtered.length} 人</span>
          </Space>
          {filtered.length === 0 ? <Empty description="无匹配员工" /> :
            <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8 }} />
          }
        </Card>}

        {activeTab === 'stats' && <Row gutter={16}>
          <Col span={12}>
            <Card title="角色分布">
              {roleDistribution.map(([role, count]) => (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <span style={{ color: '#e2e8f0' }}>{role}</span>
                  <Space><Progress percent={Math.round((count / EMP.length) * 100)} size="small" style={{ width: 120 }} /><span style={{ color: '#94a3b8', fontSize: 13 }}>{count}人</span></Space>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="今日排班">
              {todaySchedule.map(s => (
                <div key={s.shift} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <span style={{ color: '#e2e8f0' }}>{s.shift}</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{s.count}人</span>
                </div>
              ))}
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>今日值班总计</span>
                <span style={{ color: '#34d399', fontWeight: 700, fontSize: 18 }}>{todaySchedule.reduce((s, t) => s + t.count, 0)}人</span>
              </div>
            </Card>
          </Col>
        </Row>}

        <Modal title="添加员工" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('员工已添加'); setShowAdd(false); }} width={480}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input placeholder="姓名" /> <Input placeholder="手机号" />
              <Select placeholder="角色" style={{ width: '100%' }}>
                <Select.Option value="店长">店长</Select.Option>
                <Select.Option value="收银员">收银员</Select.Option>
                <Select.Option value="导玩员">导玩员</Select.Option>
                <Select.Option value="技术员">技术员</Select.Option>
              </Select>
              <Select placeholder="班次" style={{ width: '100%' }}>
                <Select.Option value="09:00-18:00">09:00-18:00</Select.Option>
                <Select.Option value="14:00-22:00">14:00-22:00</Select.Option>
              </Select>
              <Input placeholder="紧急联系人" style={{ gridColumn: '1 / -1' }} />
            </div>
          </Space>
        </Modal>

        <Modal title={`员工详情 - ${showDetail?.name || ''}`} open={!!showDetail} onCancel={() => setShowDetail(null)} footer={<Button onClick={() => setShowDetail(null)}>关闭</Button>} width={500}>
          {showDetail && <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>姓名</div><div style={{ color: '#e2e8f0' }}>{showDetail.name}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>角色</div><Tag>{showDetail.role}</Tag></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>电话</div><div style={{ color: '#e2e8f0' }}>{showDetail.phone}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>班次</div><div style={{ color: '#e2e8f0' }}>{showDetail.shift}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>入职</div><div style={{ color: '#e2e8f0' }}>{showDetail.joinDate}</div></div>
              <div><div style={{ color: '#94a3b8', fontSize: 12 }}>绩效</div><Tag color={showDetail.performance === 'A' ? 'green' : 'blue'}>{showDetail.performance}</Tag></div>
              <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#94a3b8', fontSize: 12 }}>紧急联系人</div><div style={{ color: '#e2e8f0' }}>{showDetail.emergency}</div></div>
            </div>
          </Space>}
        </Modal>
      </Space>
    </PageShell>
  );
}
