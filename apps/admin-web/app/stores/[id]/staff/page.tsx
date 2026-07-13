// 👥 员工管理 · 排班/考勤/绩效
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Avatar, Badge } from '@m5/ui';

interface Employee { id: string; name: string; role: string; status: 'on' | 'off' | 'leave'; phone: string; shift: string; joinDate: string; skills: string[]; }
const STATUS_CFG: Record<string, { color: string; label: string }> = { on: { color: 'green', label: '在岗' }, off: { color: 'default', label: '休息' }, leave: { color: 'orange', label: '请假' } };
const EMP: Employee[] = [
  { id: 'E001', name: '张三', role: '店长', status: 'on', phone: '138****1100', shift: '09:00-18:00', joinDate: '2024-03', skills: ['管理', '收银'] },
  { id: 'E002', name: '李四', role: '收银员', status: 'on', phone: '138****2200', shift: '09:00-18:00', joinDate: '2024-05', skills: ['收银', '接待'] },
  { id: 'E003', name: '王五', role: '导玩员', status: 'on', phone: '138****3300', shift: '14:00-22:00', joinDate: '2024-06', skills: ['设备引导', '活动'] },
  { id: 'E004', name: '赵六', role: '技术员', status: 'leave', phone: '138****4400', shift: '09:00-18:00', joinDate: '2024-04', skills: ['维修', '巡检'] },
  { id: 'E005', name: '刘七', role: '收银员', status: 'off', phone: '138****5500', shift: '14:00-22:00', joinDate: '2024-07', skills: ['收银'] },
  { id: 'E006', name: '陈八', role: '保洁', status: 'on', phone: '138****6600', shift: '06:00-15:00', joinDate: '2024-02', skills: ['清洁'] },
  { id: 'E007', name: '周九', role: '导玩员', status: 'on', phone: '138****7700', shift: '09:00-18:00', joinDate: '2024-08', skills: ['设备引导', '销售'] },
];

export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'on' | 'off' | 'leave'>('all');
  const filtered = filter === 'all' ? EMP : EMP.filter(e => e.status === filter);
  const cols = [
    { title: '姓名', dataIndex: 'name', render: (v: string, r: Employee) => <Space><Avatar size="small" style={{ background: '#334155' }}>{v[0]}</Avatar>{v}<Tag>{r.role}</Tag></Space> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Badge status="processing" color={STATUS_CFG[v]?.color || 'default'} text={STATUS_CFG[v]?.label || v} /> },
    { title: '电话', dataIndex: 'phone' }, { title: '班次', dataIndex: 'shift' },
    { title: '技能', dataIndex: 'skills', render: (v: string[]) => <Space size={4}>{v.map(s => <Tag key={s} size="small">{s}</Tag>)}</Space> },
    { title: '操作', key: 'a', width: 140, render: () => <Space size="small"><Button size="small">排班</Button><Button size="small">考勤</Button></Space> },
  ];
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 员工管理</h2>
          <Button type="primary" onClick={() => setShowAdd(true)}>添加员工</Button>
        </div>
        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="总人数" value={EMP.length} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="在岗" value={EMP.filter(e => e.status === 'on').length} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="请假" value={EMP.filter(e => e.status === 'leave').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="休息" value={EMP.filter(e => e.status === 'off').length} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Select value={filter} onChange={setFilter} style={{ width: 120 }}
              options={[{ value: 'all', label: '全部' }, { value: 'on', label: '在岗' }, { value: 'off', label: '休息' }, { value: 'leave', label: '请假' }]} />
            <Button style={{ marginLeft: 'auto' }}>导出排班表</Button>
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={false} />
        </Card>
        <Modal title="添加员工" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('员工已添加'); setShowAdd(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}><Input placeholder="姓名" /><Select placeholder="角色"><Select.Option value="店长">店长</Select.Option><Select.Option value="收银员">收银员</Select.Option><Select.Option value="导玩员">导玩员</Select.Option></Select><Input placeholder="手机号" /></Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
