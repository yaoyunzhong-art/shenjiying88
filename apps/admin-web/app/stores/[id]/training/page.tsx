// 📚 培训管理 · 培训计划/课程/考核
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const TRAININGS = [
  { id:'TR01', name:'新员工入职培训', type:'入职', date:'2026-07-15', duration:'4h', trainer:'张店长', status:'scheduled', attendees:3 },
  { id:'TR02', name:'设备操作规范', type:'技能', date:'2026-07-18', duration:'2h', trainer:'厂商', status:'scheduled', attendees:5 },
  { id:'TR03', name:'消防安全培训', type:'安全', date:'2026-07-10', duration:'1.5h', trainer:'消防员', status:'completed', attendees:8 },
  { id:'TR04', name:'收银系统操作', type:'技能', date:'2026-07-08', duration:'3h', trainer:'系统组', status:'completed', attendees:4 },
];
const COLUMNS = [
  { title:'培训', dataIndex:'name' }, { title:'类型', dataIndex:'type' },
  { title:'日期', dataIndex:'date' }, { title:'时长', dataIndex:'duration' }, { title:'讲师', dataIndex:'trainer' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='scheduled'?'blue':'default'}>{v==='scheduled'?'待进行':'已完成'}</Tag> },
  { title:'人数', dataIndex:'attendees' },
];
export default function TrainingPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📚 培训管理</h2>
    <Row gutter={16}>
      <Col span={8}><Card><Statistic title="本月培训" value={4}/></Card></Col>
      <Col span={8}><Card><Statistic title="待进行" value={2} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={8}><Card><Statistic title="已完成" value={2} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={TRAININGS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">安排培训</Button><Button>培训记录</Button></Space></Card>
  </Space></PageShell>);
}