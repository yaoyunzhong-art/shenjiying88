// 👥 排班管理 · 员工排班/班次/考勤 · 完整排班管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tabs, Progress, Empty } from '@m5/ui';

interface Staff {
  id: string; name: string; role: string; shift: string;
  time: string; date: string; status: 'working' | 'off' | 'late' | 'leave';
  phone?: string; checkIn?: string;
}

const SCHEDULES: Staff[] = [
  { id: 'E01', name: '张三', role: '店长', shift: '早班', time: '08:00-14:00', date: '2026-07-13', status: 'working', phone: '138****1100', checkIn: '07:55' },
  { id: 'E02', name: '李四', role: '收银员', shift: '中班', time: '14:00-20:00', date: '2026-07-13', status: 'working', phone: '138****2200', checkIn: '13:50' },
  { id: 'E03', name: '王五', role: '导玩员', shift: '早班', time: '08:00-14:00', date: '2026-07-13', status: 'working', phone: '138****3300', checkIn: '07:58' },
  { id: 'E04', name: '赵六', role: '导玩员', shift: '晚班', time: '15:00-22:00', date: '2026-07-13', status: 'working', phone: '138****4400', checkIn: '14:45' },
  { id: 'E05', name: '钱七', role: '保洁', shift: '早班', time: '07:00-15:00', date: '2026-07-13', status: 'working', phone: '138****5500', checkIn: '06:55' },
  { id: 'E06', name: '孙八', role: '收银员', shift: '中班', time: '12:00-18:00', date: '2026-07-13', status: 'off', phone: '138****6600' },
  { id: 'E07', name: '周九', role: '导玩员', shift: '晚班', time: '16:00-23:00', date: '2026-07-13', status: 'late', phone: '138****7700', checkIn: '16:15' },
  { id: 'E08', name: '吴十', role: '设备维护', shift: '早班', time: '08:00-16:00', date: '2026-07-13', status: 'working', phone: '138****8800', checkIn: '07:50' },
  { id: 'E09', name: '郑十一', role: '导玩员', shift: '中班', time: '12:00-18:00', date: '2026-07-13', status: 'working', phone: '138****9900', checkIn: '11:55' },
  { id: 'E10', name: '陈十二', role: '收银员', shift: '早班', time: '08:00-14:00', date: '2026-07-13', status: 'leave', phone: '138****0001' },
  { id: 'E11', name: '刘十三', role: '导玩员', shift: '晚班', time: '14:00-22:00', date: '2026-07-13', status: 'working', phone: '138****0002', checkIn: '13:52' },
  { id: 'E12', name: '何十四', role: '保洁', shift: '早班', time: '06:00-14:00', date: '2026-07-13', status: 'working', phone: '138****0003', checkIn: '05:55' },
];

const SHIFTS_CONFIG = [
  { name: '早班', time: '08:00-14:00', staff: SCHEDULES.filter(s => s.shift === '早班').length, color: '#6366f1' },
  { name: '中班', time: '14:00-20:00', staff: SCHEDULES.filter(s => s.shift === '中班').length, color: '#f59e0b' },
  { name: '晚班', time: '15:00-22:00', staff: SCHEDULES.filter(s => s.shift === '晚班').length, color: '#8b5cf6' },
];

const STATUS_CFG: Record<string, [string, string]> = {
  working: ['green', '在岗'], off: ['default', '休息'], late: ['orange', '迟到'], leave: ['red', '请假'],
  absent: ['red', '缺勤'],
};
const ROLE_COLORS: Record<string, string> = { 店长: '#6366f1', 收银员: '#10b981', 导玩员: '#f59e0b', 保洁: '#6b7280', 设备维护: '#8b5cf6' };
const SHIFT_COLORS: Record<string, string> = { 早班: '#6366f1', 中班: '#f59e0b', 晚班: '#8b5cf6' };
const PAGE_STACK_STYLE = { width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' } as const;
const HEADER_STYLE = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as const;
const TITLE_STYLE = { color: '#f8fafc', margin: 0 } as const;
const FILTER_BAR_STYLE = { marginBottom: 12, gap: 8, width: '100%' } as const;
const MUTED_TEXT_STYLE = { color: '#94a3b8', fontSize: 13 } as const;
const LIST_ROW_STYLE = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' } as const;
const EMPLOYEE_NAME_STYLE = { color: '#e2e8f0' } as const;
const ANALYTICS_ROW_STYLE = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' } as const;
const ANALYTICS_VALUE_STYLE = { color: '#94a3b8', fontSize: 13 } as const;
const STATUS_COUNT_STYLE = { color: '#e2e8f0' } as const;
const MODAL_GRID_STYLE = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as const;
const FULL_WIDTH_STYLE = { width: '100%' } as const;

export default function SchedulingPage() {
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showShift, setShowShift] = useState(false);
  const [tabKey, setTabKey] = useState('list');

  const filtered = useMemo(() => {
    let r = SCHEDULES;
    if (shiftFilter !== 'all') r = r.filter(s => s.shift === shiftFilter);
    if (statusFilter !== 'all') r = r.filter(s => s.status === statusFilter);
    return r;
  }, [shiftFilter, statusFilter]);

  const onDuty = SCHEDULES.filter(s => s.status === 'working').length;
  const lateCount = SCHEDULES.filter(s => s.status === 'late').length;
  const absentCount = SCHEDULES.filter(s => s.status === 'late' || s.status === 'leave').length;
  const restCount = SCHEDULES.filter(s => s.status === 'off').length;
  const roleDist = useMemo(() => {
    const m: Record<string, number> = {};
    SCHEDULES.forEach(s => { m[s.role] = (m[s.role] || 0) + 1; });
    return Object.entries(m);
  }, []);

  const COLUMNS = [
    { title: '姓名', dataIndex: 'name', width: 80 },
    { title: '角色', dataIndex: 'role', width: 90, render: (v: string) => <Tag color={ROLE_COLORS[v] || 'default'} size="small">{v}</Tag> },
    { title: '班次', dataIndex: 'shift', width: 70, render: (v: string) => <Tag color={SHIFT_COLORS[v] || 'default'} size="small">{v}</Tag> },
    { title: '时间', dataIndex: 'time', width: 110 },
    { title: '日期', dataIndex: 'date', width: 110 },
    { title: '签到', dataIndex: 'checkIn', width: 70, render: (v?: string) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 70, render: (v: string) => <Tag color={STATUS_CFG[v]?.[0] || 'default'} size="small">{STATUS_CFG[v]?.[1] || v}</Tag> },
    { title: '操作', key: 'a', width: 140, render: (_: unknown, r: Staff) => <Space size="small">
      {r.status !== 'off' && <Button size="small" type="primary" ghost>调班</Button>}
      {r.status === 'late' && <Button size="small" type="link" style={{color:'#f59e0b'}}>审批</Button>}
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={PAGE_STACK_STYLE}>
        <div style={HEADER_STYLE}>
          <div><h2 style={TITLE_STYLE}>👥 排班管理</h2></div>
          <Space><Button>考勤统计</Button><Button>导出排班表</Button><Button type="primary" onClick={() => setShowShift(true)}>+ 新建排班</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={3}><Card size="small"><Statistic title="员工总数" value={SCHEDULES.length} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="今日在岗" value={onDuty} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="缺勤" value={absentCount} valueStyle={{ color: '#ef4444' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="休息" value={restCount} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="迟到" value={lateCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="到岗率" value={Math.round(onDuty / SCHEDULES.length * 100)} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="早班" value={SHIFTS_CONFIG.find(s => s.name === '早班')?.staff || 0} prefix="� " /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="中班" value={SHIFTS_CONFIG.find(s => s.name === '中班')?.staff || 0} prefix="� " /></Card></Col>
        </Row>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key:'list', label:'排班列表',
            children: <Card>
              <Space style={FILTER_BAR_STYLE} wrap>
                <span style={MUTED_TEXT_STYLE}>班次:</span>
                <Select value={shiftFilter} onChange={setShiftFilter} style={{ width: 100 }}
                  options={[{ value: 'all', label: '全部' }, { value: '早班', label: '早班' }, { value: '中班', label: '中班' }, { value: '晚班', label: '晚班' }]} />
                <span style={MUTED_TEXT_STYLE}>状态:</span>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 100 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'working', label: '在岗' }, { value: 'off', label: '休息' }, { value: 'late', label: '迟到' }, { value: 'leave', label: '请假' }]} />
                <span style={{ ...MUTED_TEXT_STYLE, marginLeft: 'auto' }}>共 {filtered.length} 人</span>
              </Space>
              {filtered.length === 0 ? <Empty description="无匹配员工" /> :
                <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 10 }} />
              }
            </Card>
          },
          { key:'schedule', label:'班次视图',
            children: <Row gutter={16}>
              {SHIFTS_CONFIG.map(sc => {
                const staffInShift = SCHEDULES.filter(s => s.shift === sc.name);
                return (
                  <Col key={sc.name} span={8}>
                    <Card title={<><span style={{color: sc.color}}>●</span> {sc.name} ({sc.time})</>} extra={<span style={{color:'#94a3b8'}}>{staffInShift.length}人</span>}>
                      {staffInShift.map(s => (
                        <div key={s.id} style={LIST_ROW_STYLE}>
                          <Space>
                            <span style={EMPLOYEE_NAME_STYLE}>{s.name}</span>
                            <Tag size="small" color={ROLE_COLORS[s.role]}>{s.role}</Tag>
                          </Space>
                          <Tag color={STATUS_CFG[s.status]?.[0]} size="small">{STATUS_CFG[s.status]?.[1]}</Tag>
                        </div>
                      ))}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          },
          { key:'stats', label:'统计分析',
            children: <Row gutter={16}>
              <Col span={12}>
                <Card title="角色分布">
                  {roleDist.map(([role, count]) => (
                    <div key={role} style={ANALYTICS_ROW_STYLE}>
                      <Tag color={ROLE_COLORS[role] || 'default'}>{role}</Tag>
                      <Space><Progress percent={Math.round(count / SCHEDULES.length * 100)} size="small" style={{width:120}} /><span style={ANALYTICS_VALUE_STYLE}>{count}人</span></Space>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="状态分布">
                  {Object.entries(STATUS_CFG).map(([k, [color, label]]) => {
                    const cnt = SCHEDULES.filter(s => s.status === k).length;
                    return <div key={k} style={ANALYTICS_ROW_STYLE}>
                      <Tag color={color}>{label}</Tag>
                      <span style={STATUS_COUNT_STYLE}>{cnt}人</span>
                    </div>;
                  })}
                </Card>
              </Col>
            </Row>
          },
        ]} />

        <Card size="small">
          <Space><Button>调班申请</Button><Button>请假审批</Button><Button>考勤异常</Button></Space>
        </Card>

        <Modal title="新建排班" open={showShift} onCancel={() => setShowShift(false)}
          onOk={() => { message.success('排班已保存'); setShowShift(false); }} width={480}>
          <Space direction="vertical" style={FULL_WIDTH_STYLE}>
            <div style={MODAL_GRID_STYLE}>
              <Input placeholder="日期" type="date" />
              <Select placeholder="选择班次" style={{width:'100%'}}>
                <Select.Option value="early">早班(08:00-14:00)</Select.Option>
                <Select.Option value="mid">中班(14:00-20:00)</Select.Option>
                <Select.Option value="late">晚班(15:00-22:00)</Select.Option>
              </Select>
              <Select placeholder="选择员工" style={{width:'100%', gridColumn:'1 / -1'}}>
                {SCHEDULES.filter(s => s.status !== 'leave').map(s => <Select.Option key={s.id} value={s.id}>{s.name} - {s.role}</Select.Option>)}
              </Select>
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
