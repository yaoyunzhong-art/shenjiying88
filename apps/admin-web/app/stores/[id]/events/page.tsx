// 📅 活动管理 · 门店活动创建/审批/发布
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select } from '@m5/ui';

const EVENTS = [
  { id:'E001', name:'暑期电竞大赛', type:'赛事', date:'2026-07-20', status:'preparing', participants:48, budget:8000 },
  { id:'E002', name:'亲子DIY活动', type:'体验', date:'2026-07-15', status:'published', participants:32, budget:2000 },
  { id:'E003', name:'会员生日会', type:'会员', date:'2026-07-25', status:'draft', participants:0, budget:3000 },
  { id:'E004', name:'七夕情侣活动', type:'节日', date:'2026-08-10', status:'draft', participants:0, budget:5000 },
  { id:'E005', name:'开学季特惠', type:'促销', date:'2026-09-01', status:'draft', participants:0, budget:10000 },
  { id:'E006', name:'万圣节派对', type:'节日', date:'2026-10-31', status:'draft', participants:0, budget:6000 },
];

const STATUS_MAP: Record<string,[string,string]> = { draft:['default','草稿'], preparing:['blue','筹备中'], published:['green','已发布'], ended:['default','已结束'] };
const TYPE_COLORS: Record<string,string> = { 赛事:'#6366f1', 体验:'#10b981', 会员:'#f59e0b', 节日:'#ef4444', 促销:'#8b5cf6' };

const COLUMNS = [
  { title:'活动名称', dataIndex:'name' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={TYPE_COLORS[v]||'default'}>{v}</Tag> },
  { title:'日期', dataIndex:'date' },
  { title:'状态', dataIndex:'status', render:(v:string) => <Tag color={(STATUS_MAP[v]||['default',v])[0]}>{STATUS_MAP[v]?.[1]||v}</Tag> },
  { title:'参与人数', dataIndex:'participants' },
  { title:'预算', dataIndex:'budget', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'操作', key:'action', render:()=><Space><Button size="small" type="primary">编辑</Button><Button size="small">发布</Button></Space> },
];

export default function EventsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = EVENTS.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });
  const totalBudget = EVENTS.reduce((s, e) => s + e.budget, 0);
  const publishedCount = EVENTS.filter(e => e.status === 'published').length;
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📅 活动管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="活动总数" value={EVENTS.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="已发布" value={publishedCount} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="待发布" value={EVENTS.filter(e=>e.status==='draft').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="总预算" value={totalBudget} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      类型: <Select value={typeFilter} onChange={setTypeFilter} style={{width:100}}
        options={[{value:'all',label:'全部'},{value:'赛事',label:'赛事'},{value:'体验',label:'体验'},{value:'会员',label:'会员'},{value:'节日',label:'节日'},{value:'促销',label:'促销'}]}/>
      状态: <Select value={statusFilter} onChange={setStatusFilter} style={{width:120}}
        options={[{value:'all',label:'全部'},{value:'draft',label:'草稿'},{value:'preparing',label:'筹备中'},{value:'published',label:'已发布'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>创建活动</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{pageSize:5}}/></Card>
    <Card><Space><Button>审批列表</Button><Button>活动日历</Button></Space></Card>
  </Space></PageShell>);
}
