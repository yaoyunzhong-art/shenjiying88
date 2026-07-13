// 📅 活动管理 · 门店活动创建/审批/发布
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, Input, message } from '@m5/ui';
interface Event { id:string; name:string; type:string; date:string; time:string; location:string; budget:number; status:'draft'|'approved'|'published'|'completed'|'cancelled'; attendees?:number; }
const DATA: Event[] = [
  { id:'EVT-001',name:'暑期亲子活动',type:'主题活动',date:'2026-07-20',time:'14:00-17:00',location:'大厅',budget:5000,status:'approved',attendees:30 },
  { id:'EVT-002',name:'电竞赛季赛',type:'竞技',date:'2026-07-15',time:'18:00-21:00',location:'主机区',budget:8000,status:'published',attendees:45 },
  { id:'EVT-003',name:'生日派对特惠',type:'促销',date:'2026-07-25',time:'10:00-22:00',location:'全场',budget:2000,status:'draft' },
  { id:'EVT-004',name:'VR体验日',type:'体验',date:'2026-07-18',time:'10:00-18:00',location:'VR区',budget:3000,status:'published',attendees:80 },
  { id:'EVT-005',name:'会员回馈月',type:'会员',date:'2026-08-01',time:'全天',location:'全场',budget:10000,status:'draft' },
  { id:'EVT-006',name:'台球友谊赛',type:'竞技',date:'2026-07-22',time:'14:00-18:00',location:'台球区',budget:1500,status:'completed',attendees:24 },
  { id:'EVT-007',name:'安全消防培训',type:'培训',date:'2026-07-16',time:'09:00-11:00',location:'培训室',budget:500,status:'approved' },
];
const SCFG:Record<string,{color:string,label:string}> = { draft:{color:'default',label:'草稿'}, approved:{color:'blue',label:'已审核'}, published:{color:'green',label:'已发布'}, completed:{color:'default',label:'已完成'}, cancelled:{color:'red',label:'已取消'} };
export default function EventsPage() {
  const [filter,setFilter]=useState<string>('all'); const [showAdd,setShowAdd]=useState(false);
  const filtered = filter==='all'?DATA:DATA.filter(e=>e.status===filter);
  const totalBudget = DATA.reduce((s,e)=>s+e.budget,0);
  const cols = [
    {title:'活动名称',dataIndex:'name'},{title:'类型',dataIndex:'type',render:(v:string)=><Tag>{v}</Tag>},{title:'日期',dataIndex:'date'},{title:'时间',dataIndex:'time'},
    {title:'地点',dataIndex:'location'},{title:'预算',dataIndex:'budget',render:(v:number)=>`¥${v.toLocaleString()}`},{title:'预计参与',dataIndex:'attendees',render:(v?:number)=>v?`${v}人`:'-'},
    {title:'状态',dataIndex:'status',render:(v:string)=><Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag>},
    {title:'操作',key:'a',width:140,render:(_:any,r:Event)=><Space size="small">{r.status==='draft'&&<Button size="small">提交审核</Button>}{r.status==='approved'&&<Button size="small">发布</Button>}<Button size="small">查看</Button></Space>},
  ];
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#f8fafc',margin:0}}>📅 活动管理</h2><Button type="primary" onClick={()=>setShowAdd(true)}>创建活动</Button></div>
    <Row gutter={16}><Col span={4}><Card size="small"><Statistic title="本月光盘" value={DATA.length}/></Card></Col><Col span={4}><Card size="small"><Statistic title="进行中" value={DATA.filter(e=>e.status==='published'||e.status==='approved').length} valueStyle={{color:'#34d399'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="已完成" value={DATA.filter(e=>e.status==='completed').length} valueStyle={{color:'#94a3b8'}}/></Card></Col><Col span={4}><Card size="small"><Statistic title="总预算" value={totalBudget} prefix="¥" valueStyle={{color:'#fbbf24'}}/></Card></Col></Row>
    <Card><Space style={{marginBottom:12}}><Select value={filter} onChange={setFilter} style={{width:120}} options={[{value:'all',label:'全部'},{value:'draft',label:'草稿'},{value:'approved',label:'已审核'},{value:'published',label:'已发布'},{value:'completed',label:'已完成'},{value:'cancelled',label:'已取消'}]}/></Space><Table dataSource={filtered} columns={cols} rowKey="id" pagination={false}/></Card>
    <Modal title="创建活动" open={showAdd} onCancel={()=>setShowAdd(false)} onOk={()=>{message.success('活动已创建');setShowAdd(false)}}><Space direction="vertical" style={{width:'100%'}}><Input placeholder="活动名称"/><Input placeholder="活动类型"/><Input placeholder="日期" type="date"/><Input placeholder="预算" type="number"/></Space></Modal>
  </Space></PageShell>);
}
