// 👥 排班管理 · 员工排班/班次/考勤 · 完整排班管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tooltip } from '@m5/ui';

interface Staff {
  id: string; name: string; role: string; shift: string;
  time: string; date: string; status: 'working' | 'off' | 'late' | 'leave';
}

const STAFF: Staff[] = [
  { id: 'E01', name: '张三', role: '店长', shift: '早班', time: '08:00-14:00', date: '2026-07-13', status: 'working' },
  { id: 'E02', name: '李四', role: '收银员', shift: '中班', time: '14:00-20:00', date: '2026-07-13', status: 'working' },
  { id: 'E03', name: '王五', role: '导玩员', shift: '早班', time: '08:00-14:00', date: '2026-07-13', status: 'working' },
  { id: 'E04', name: '赵六', role: '导玩员', shift: '晚班', time: '15:00-22:00', date: '2026-07-13', status: 'working' },
  { id: 'E05', name: '钱七', role: '保洁', shift: '早班', time: '07:00-15:00', date: '2026-07-13', status: 'working' },
  { id: 'E06', name: '孙八', role: '收银员', shift: '中班', time: '12:00-18:00', date: '2026-07-13', status: 'off' },
  { id: 'E07', name: '周九', role: '导玩员', shift: '晚班', time: '16:00-23:00', date: '2026-07-13', status: 'late' },
  { id: 'E08', name: '吴十', role: '设备维护', shift: '早班', time: '08:00-16:00', date: '2026-07-13', status: 'working' },
];

const STATUS_CFG: Record<string, [string, string]> = {
  working: ['green', '在岗'], off: ['default', '休息'], late: ['orange', '迟到'], leave: ['red', '请假'],
};
const ROLE_COLORS: Record<string, string> = { 店长: '#6366f1', 收银员: '#10b981', 导玩员: '#f59e0b', 保洁: '#6b7280', 设备维护: '#8b5cf6' };
const SHIFT_COLORS: Record<string, string> = { 早班: '#6366f1', 中班: '#f59e0b', 晚班: '#8b5cf6' };

export default function SchedulingPage() {
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showShift, setShowShift] = useState(false);

  const filtered = useMemo(() => {
    let r = STAFF;
    if (shiftFilter !== 'all') r = r.filter(s => s.shift === shiftFilter);
    if (statusFilter !== 'all') r = r.filter(s => s.status === statusFilter);
    return r;
  }, [shiftFilter, statusFilter]);

  const cols = [
    { title: '姓名', dataIndex: 'name' },
    { title: '角色', dataIndex: 'role', render: (v: string) => <Tag color={ROLE_COLORS[v] || 'default'}>{v}</Tag> },
    { title: '班次', dataIndex: 'shift', render: (v: string) => <Tag color={SHIFT_COLORS[v] || 'default'}>{v}</Tag> },
    { title: '时间', dataIndex: 'time' },
    { title: '日期', dataIndex: 'date' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={STATUS_CFG[v]?.[0] || 'default'}>{STATUS_CFG[v]?.[1] || v}</Tag> },
  ];

  const onDuty = STAFF.filter(s => s.status === 'working').length;

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>👥 排班管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>员工排班 · 班次 · 考勤</span></div>
          <Button type="primary" onClick={() => setShowShift(true)}>+ 排班表</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="今日排班" value={STAFF.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="在岗" value={onDuty} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="迟到" value={STAFF.filter(s => s.status === 'late').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="休息/请假" value={STAFF.filter(s => s.status === 'off' || s.status === 'leave').length} valueStyle={{ color: '#64748b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="到岗率" value={Math.round(onDuty / STAFF.length * 100)} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        <Card>
          <Space style={{ marginBottom: 12, gap: 8 }} wrap>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>班次:</span>
            <Select value={shiftFilter} onChange={setShiftFilter} style={{ width: 110 }}
              options={[{ value: 'all', label: '全部' }, { value: '早班', label: '早班' }, { value: '中班', label: '中班' }, { value: '晚班', label: '晚班' }]} />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 110 }}
              options={[{ value: 'all', label: '全部' }, { value: 'working', label: '在岗' }, { value: 'off', label: '休息' }, { value: 'late', label: '迟到' }, { value: 'leave', label: '请假' }]} />
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8 }} />
        </Card>

        <Card size="small">
          <Space><Button>调班申请</Button><Button>考勤统计</Button><Button>导出排班表</Button></Space>
        </Card>

        <Modal title="排班管理" open={showShift} onCancel={() => setShowShift(false)}
          onOk={() => { message.success('排班已保存'); setShowShift(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="选择日期" type="date" />
            <Select placeholder="选择班次" style={{ width: '100%' }}>
              <Select.Option value="early">早班(08:00-14:00)</Select.Option>
              <Select.Option value="mid">中班(14:00-20:00)</Select.Option>
              <Select.Option value="late">晚班(15:00-22:00)</Select.Option>
            </Select>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
