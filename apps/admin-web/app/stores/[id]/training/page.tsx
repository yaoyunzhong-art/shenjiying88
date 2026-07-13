// 📚 培训管理 · 培训计划/课程/考核
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Progress } from '@m5/ui';

const TRAININGS = [
  { id:'TR01', name:'新员工入职培训', type:'入职', date:'2026-07-15', duration:'4h', trainer:'张店长', status:'scheduled', attendees:3, progress:0 },
  { id:'TR02', name:'设备操作规范', type:'技能', date:'2026-07-18', duration:'2h', trainer:'厂商代表', status:'scheduled', attendees:5, progress:0 },
  { id:'TR03', name:'消防安全培训', type:'安全', date:'2026-07-10', duration:'1.5h', trainer:'消防中队', status:'completed', attendees:8, progress:100 },
  { id:'TR04', name:'收银系统操作', type:'技能', date:'2026-07-08', duration:'3h', trainer:'系统组', status:'completed', attendees:4, progress:100 },
  { id:'TR05', name:'客服话术培训', type:'技能', date:'2026-07-20', duration:'2h', trainer:'运营部', status:'scheduled', attendees:6, progress:0 },
  { id:'TR06', name:'食品安全培训', type:'安全', date:'2026-07-22', duration:'1h', trainer:'食药监', status:'scheduled', attendees:10, progress:0 },
];

const STATUS_CFG: Record<string,[string,string]> = { scheduled:['blue','待进行'], completed:['green','已完成'] };
const COLUMNS = [
  { title:'培训项目', dataIndex:'name' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={v==='安全'?'red':v==='入职'?'purple':'blue'}>{v}</Tag> },
  { title:'日期', dataIndex:'date' }, { title:'时长', dataIndex:'duration' },
  { title:'讲师', dataIndex:'trainer' },
  { title:'人数', dataIndex:'attendees' },
  { title:'进度', dataIndex:'progress', render:(v:number)=><Progress percent={v} size="small" style={{width:80}}/> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
];

export default function TrainingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? TRAININGS : TRAININGS.filter(t => t.status === statusFilter);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📚 培训管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="培训项目" value={TRAININGS.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="待进行" value={TRAININGS.filter(t=>t.status==='scheduled').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="已完成" value={TRAININGS.filter(t=>t.status==='completed').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="总参训" value={TRAININGS.reduce((s,t)=>s+t.attendees,0)} valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:120}}
        options={[{value:'all',label:'全部'},{value:'scheduled',label:'待进行'},{value:'completed',label:'已完成'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>安排培训</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>培训记录</Button><Button>考核统计</Button></Space></Card>
  </Space></PageShell>);
}
