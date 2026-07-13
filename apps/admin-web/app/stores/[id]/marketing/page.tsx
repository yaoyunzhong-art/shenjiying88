// 📢 营销管理 · 优惠券/推广/会员营销
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Progress } from '@m5/ui';

const CAMPAIGNS = [
  { id:'C001', name:'新会员首充有礼', type:'充值', status:'active', start:'2026-07-01', end:'2026-07-31', budget:5000, used:3200, channel:'小程序' },
  { id:'C002', name:'暑期畅玩卡', type:'会员卡', status:'active', start:'2026-07-01', end:'2026-08-31', budget:20000, used:8500, channel:'到店' },
  { id:'C003', name:'分享有礼活动', type:'推广', status:'active', start:'2026-07-05', end:'2026-07-20', budget:3000, used:1800, channel:'社交' },
  { id:'C004', name:'教师节特别活动', type:'节日', status:'scheduled', start:'2026-09-10', end:'2026-09-10', budget:2000, used:0, channel:'全部' },
  { id:'C005', name:'短视频团购券', type:'推广', status:'active', start:'2026-07-01', end:'2026-07-31', budget:15000, used:9800, channel:'抖音' },
  { id:'C006', name:'会员积分兑换', type:'会员', status:'ended', start:'2026-06-01', end:'2026-06-30', budget:8000, used:7600, channel:'小程序' },
];

const TYPE_COLORS: Record<string,string> = { 充值:'#6366f1', 推广:'#f59e0b', 会员:'#8b5cf6', 节日:'#ef4444', 会员卡:'#10b981' };
const STATUS_CFG: Record<string,[string,string]> = { active:['green','进行中'], scheduled:['blue','待开始'], ended:['default','已结束'] };
const COLUMNS = [
  { title:'活动名称', dataIndex:'name' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={TYPE_COLORS[v]||'default'}>{v}</Tag> },
  { title:'渠道', dataIndex:'channel', render:(v:string)=><Tag>{v}</Tag> },
  { title:'预算', dataIndex:'budget', render:(v:number)=>`¥${(v/1000).toFixed(0)}K` },
  { title:'已使用', dataIndex:'used', render:(v:number)=>`¥${(v/1000).toFixed(0)}K` },
  { title:'消耗率', render:(_:any,r:any)=><Progress percent={Math.round(r.used/r.budget*100)} size="small" style={{width:80}}/> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
  { title:'起止', dataIndex:'start' },
];

export default function MarketingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.status === statusFilter);
  const totalUsed = CAMPAIGNS.reduce((s, c) => s + c.used, 0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📢 营销管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="进行中" value={CAMPAIGNS.filter(c=>c.status==='active').length}/></Card></Col>
      <Col span={4}><Card><Statistic title="总营销投入" value={CAMPAIGNS.reduce((s,c)=>s+c.budget,0)} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="已消耗" value={totalUsed} prefix="¥" valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="预算使用率" value={`${Math.round(totalUsed/CAMPAIGNS.reduce((s,c)=>s+c.budget,0)*100)}%`}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'active',label:'进行中'},{value:'scheduled',label:'待开始'},{value:'ended',label:'已结束'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>创建活动</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>优惠券管理</Button><Button>投放渠道</Button><Button>效果分析</Button></Space></Card>
  </Space></PageShell>);
}
