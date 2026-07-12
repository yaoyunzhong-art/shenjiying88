// ⏰ 排班管理 · 员工排班/考勤管理
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space } from '@m5/ui';
const SCHEDULES = [
  { id: 'SCH-1', name: '张三', role: '店长', shift: '早班', time: '10:00-18:00', date: '2026-07-12', status: 'on-duty' },
  { id: 'SCH-2', name: '李四', role: '前台', shift: '早班', time: '10:00-18:00', date: '2026-07-12', status: 'on-duty' },
  { id: 'SCH-3', name: '王五', role: '导玩员', shift: '晚班', time: '14:00-22:00', date: '2026-07-12', status: 'on-duty' },
  { id: 'SCH-4', name: '刘七', role: '收银', shift: '早班', time: '10:00-18:00', date: '2026-07-12', status: 'absent' },
  { id: 'SCH-5', name: '赵六', role: '导玩员', shift: '休息', time: '-', date: '2026-07-12', status: 'off' },
];
const COLUMNS = [
  { title: '姓名', dataIndex: 'name' }, { title: '角色', dataIndex: 'role' }, { title: '班次', dataIndex: 'shift' },
  { title: '时间', dataIndex: 'time' }, { title: '日期', dataIndex: 'date' },
  { title: '状态', dataIndex: 'status', render: (v:string) => {
    const m: Record<string,[string,string]> = {'on-duty':['green','在岗'],'absent':['red','缺勤'],'off':['default','休息']};
    return <Tag color={m[v]?.[0]||'default'}>{m[v]?.[1]||v}</Tag>;
  }},
];
export default function SchedulingPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>⏰ 排班管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="今日在岗" value={3} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="缺勤" value={1} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="休息" value={1}/></Card></Col>
      <Col span={6}><Card><Statistic title="员工总数" value={5}/></Card></Col>
    </Row>
    <Card><Table dataSource={SCHEDULES} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">排班表</Button><Button>调班申请</Button><Button>考勤统计</Button></Space></Card>
  </Space></PageShell>);
}