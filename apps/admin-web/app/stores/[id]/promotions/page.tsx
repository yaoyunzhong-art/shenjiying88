// 🎉 促销管理 · 促销活动创建与监控 (48→80)
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message, Progress } from '@m5/ui';
interface Promo { id:string; name:string; type:string; discount:string; scope:string; start:string; end:string; budget:number; used:number; status:'active'|'scheduled'|'ended'|'draft'; }
const DATA: Promo[] = [
  { id:'PROMO-001',name:'暑期8折优惠',type:'折扣',discount:'8折',scope:'全场',start:'2026-07-15',end:'2026-08-31',budget:30000,used:8500,status:'active' },
  { id:'PROMO-002',name:'新客满100减20',type:'满减',discount:'减20',scope:'新用户',start:'2026-07-10',end:'2026-07-31',budget:10000,used:3200,status:'active' },
  { id:'PROMO-003',name:'会员生日特惠',type:'折扣',discount:'7折',scope:'会员',start:'2026-07-01',end:'2026-12-31',budget:5000,used:1250,status:'active' },
  { id:'PROMO-004',name:'充值满赠',type:'满赠',discount:'充200送50',scope:'全场',start:'2026-08-01',end:'2026-08-15',budget:15000,used:0,status:'scheduled' },
  { id:'PROMO-005',name:'国庆特惠',type:'折扣',discount:'7.5折',scope:'全场',start:'2026-10-01',end:'2026-10-07',budget:50000,used:0,status:'draft' },
  { id:'PROMO-006',name:'618狂欢',type:'满减',discount:'满200减50',scope:'全场',start:'2026-06-18',end:'2026-06-20',budget:20000,used:18600,status:'ended' },
  { id:'PROMO-007',name:'学生证优惠',type:'折扣',discount:'8.5折',scope:'学生',start:'2026-07-20',end:'2026-09-01',budget:8000,used:0,status:'draft' },
];
const SCFG:Record<string,{color:string,label:string}> = { active:{color:'green',label:'进行中'}, scheduled:{color:'blue',label:'待开始'}, ended:{color:'default',label:'已结束'}, draft:{color:'default',label:'草稿'} };
export default function PromotionsPage() {
  const [filter,setFilter]=useState('all'); const [showAdd,setShowAdd]=useState(false);
  const filtered = filter==='all'?DATA:DATA.filter(p=>p.status===filter);
  const totalBudget = DATA.reduce((s,p)=>s+p.budget,0); const totalUsed = DATA.reduce((s,p)=>s+p.used,0);
  const cols = [
    {title:'活动名称',dataIndex:'name'},{title:'类型',dataIndex:'type',render:(v:string)=><Tag>{v}</Tag>},{title:'优惠',dataIndex:'discount'},{title:'范围',dataIndex:'scope'},
    {title:'开始',dataIndex:'start'},{title:'结束',dataIndex:'end'},{title:'预算',dataIndex:'budget',render:(v:number)=>`¥${v.toLocaleString()}`},
    {title:'使用',dataIndex:'used',render:(v:number)=>`¥${v.toLocaleString()}`},{title:'消耗率',key:'rate',render:(_:any,r:Promo)=><Progress percent={r.budget>0?Math.round(r.used/r.budget*100):0} size="small" strokeColor={r.used/r.budget>0.7?'#f59e0b':'#34d399'}/>},
    {title:'状态',dataIndex:'status',render:(v:string)=><Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag>},
    {title:'操作',key:'a',width:120,render:(_:any,r:Promo)=><Space size="small">{r.status==='draft'&&<Button size="small">发布</Button>}<Button size="small">查看</Button></Space>},
  ];
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#f8fafc',margin:0}}>🎉 促销管理</h2><Button type="primary" onClick={()=>setShowAdd(true)}>新建促销</Button></div>
    <Row gutter={16}><Col span={4}><Card size="small"><Statistic title="活动数" value={DATA.length}/></Card></Col><Col span={4}><Card size="small"><Statistic title="进行中" value={DATA.filter(p=>p.status==='active').length} valueStyle={{color:'#34d399'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="总预算" value={totalBudget} prefix="¥" valueStyle={{color:'#fbbf24'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="已消耗" value={totalUsed} prefix="¥" valueStyle={{color:'#f59e0b'}}/></Card></Col></Row>
    <Card><Space style={{marginBottom:12}}><Select value={filter} onChange={setFilter} style={{width:120}} options={[{value:'all',label:'全部'},{value:'active',label:'进行中'},{value:'scheduled',label:'待开始'},{value:'ended',label:'已结束'},{value:'draft',label:'草稿'}]}/></Space><Table dataSource={filtered} columns={cols} rowKey="id" pagination={false}/></Card>
    <Modal title="新建促销" open={showAdd} onCancel={()=>setShowAdd(false)} onOk={()=>{message.success('促销活动已创建');setShowAdd(false)}}><Space direction="vertical" style={{width:'100%'}}><Input placeholder="活动名称"/><Input placeholder="优惠描述"/><Input placeholder="开始日期" type="date"/><Input placeholder="结束日期" type="date"/><Input placeholder="预算" type="number"/></Space></Modal>
  </Space></PageShell>);
}
