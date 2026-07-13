// 🎉 促销管理 · 促销活动创建与监控
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Progress } from '@m5/ui';

const PROMOS = [
  { id:'P001', name:'充值满100送15', type:'充值', status:'active', used:128, limit:500, start:'2026-07-01', end:'2026-07-31', target:'all' },
  { id:'P002', name:'团建8折优惠', type:'团建', status:'active', used:23, limit:100, start:'2026-07-01', end:'2026-08-31', target:'group' },
  { id:'P003', name:'新人首单立减', type:'新人', status:'active', used:67, limit:200, start:'2026-07-01', end:'2026-07-31', target:'new' },
  { id:'P004', name:'积分翻倍活动', type:'积分', status:'scheduled', used:0, limit:1000, start:'2026-08-01', end:'2026-08-07', target:'all' },
  { id:'P005', name:'生日月免费体验', type:'会员', status:'active', used:15, limit:300, start:'2026-07-01', end:'2026-12-31', target:'member' },
  { id:'P006', name:'周末畅玩卡', type:'充值', status:'ended', used:342, limit:500, start:'2026-06-01', end:'2026-06-30', target:'all' },
];

const TYPE_CFG: Record<string,string> = { 充值:'#6366f1', 团建:'#10b981', 新人:'#f59e0b', 积分:'#8b5cf6', 会员:'#ef4444' };
const STATUS_CFG: Record<string,[string,string]> = { active:['green','进行中'], scheduled:['blue','待开始'], ended:['default','已结束'] };

const COLUMNS = [
  { title:'名称', dataIndex:'name' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={TYPE_CFG[v]||'default'}>{v}</Tag> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
  { title:'已用/总量', render:(_:any,r:any)=><span>{r.used}/{r.limit}</span> },
  { title:'消耗率', render:(_:any,r:any)=><Progress percent={Math.round(r.used/r.limit*100)} size="small" style={{width:80}}/> },
  { title:'日期', dataIndex:'start' },
];

export default function PromotionsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? PROMOS : PROMOS.filter(p => p.status === statusFilter);
  const totalUsed = PROMOS.reduce((s, p) => s + p.used, 0);
  const totalLimit = PROMOS.reduce((s, p) => s + p.limit, 0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🎉 促销管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="促销总数" value={PROMOS.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="进行中" value={PROMOS.filter(p=>p.status==='active').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="总使用" value={totalUsed}/></Card></Col>
      <Col span={6}><Card><Statistic title="总核销率" value={`${Math.round(totalUsed/totalLimit*100)}%`}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'active',label:'进行中'},{value:'scheduled',label:'待开始'},{value:'ended',label:'已结束'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>新建促销</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>优惠券模板</Button><Button>效果分析</Button></Space></Card>
  </Space></PageShell>);
}
