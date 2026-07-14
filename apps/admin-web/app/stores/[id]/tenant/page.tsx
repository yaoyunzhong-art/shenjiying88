// 🔌 租户管理 · 多租户配置/隔离/迁移
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tabs, Empty, Progress } from '@m5/ui';

const TENANTS = [
  { id:'T-001', name:'旗舰店', brand:'大玩家', plan:'专业版', users:12, stores:1, status:'active', created:'2026-01-01', region:'华南', revenue:285000 },
  { id:'T-002', name:'万达店', brand:'星际传奇', plan:'企业版', users:25, stores:3, status:'active', created:'2026-03-15', region:'华北', revenue:520000 },
  { id:'T-003', name:'测试租户', brand:'测试品牌', plan:'免费版', users:2, stores:1, status:'trial', created:'2026-07-01', region:'华东', revenue:0 },
  { id:'T-004', name:'龙湖店', brand:'欢乐英雄', plan:'专业版', users:8, stores:1, status:'active', created:'2026-04-01', region:'西南', revenue:180000 },
  { id:'T-005', name:'筹备店A', brand:'大玩家', plan:'企业版', users:5, stores:0, status:'pending', created:'2026-07-10', region:'华东', revenue:0 },
];

const STATUS_MAP: Record<string, {color:string,label:string}> = { active:{color:'green',label:'活跃'}, trial:{color:'blue',label:'试用'}, pending:{color:'orange',label:'待激活'}, suspended:{color:'red',label:'停用'} };
const COLUMNS = [
  { title:'租户名称', dataIndex:'name' },
  { title:'品牌', dataIndex:'brand' },
  { title:'套餐', dataIndex:'plan' },
  { title:'用户数', dataIndex:'users' },
  { title:'门店数', dataIndex:'stores' },
  { title:'区域', dataIndex:'region' },
  { title:'月营收', dataIndex:'revenue', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_MAP[v]?.color||'default'}>{STATUS_MAP[v]?.label||v}</Tag> },
  { title:'创建时间', dataIndex:'created' },
];

export default function TenantPage() {
  const [planFilter, setPlanFilter] = useState('all');
  const filtered = planFilter==='all'?TENANTS:TENANTS.filter(t=>t.plan===planFilter);
  const totalRevenue = TENANTS.reduce((s,t)=>s+t.revenue,0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2 style={{color:'#f8fafc',margin:0}}>🔌 租户管理</h2><span style={{color:'#94a3b8',fontSize:13}}>多租户隔离·配置·迁移</span></div><Button type="primary">创建租户</Button></div>
    <Row gutter={[16,16]}>
      <Col span={4}><Card size="small"><Statistic title="租户总数" value={TENANTS.length}/></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="活跃" value={TENANTS.filter(t=>t.status==='active').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="试用/待激活" value={TENANTS.filter(t=>t.status!=='active').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="月营收总计" value={totalRevenue.toLocaleString()} prefix="¥" valueStyle={{color:'#fbbf24'}}/></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总门店" value={TENANTS.reduce((s,t)=>s+t.stores,0)}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12,gap:8}} wrap><span style={{color:'#94a3b8',fontSize:13}}>套餐:</span><Select value={planFilter} onChange={setPlanFilter} style={{width:120}} options={[{value:'all',label:'全部'},{value:'免费版',label:'免费版'},{value:'专业版',label:'专业版'},{value:'企业版',label:'企业版'}]}/></Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{pageSize:8}}/></Card>
  </Space></PageShell>);
}
