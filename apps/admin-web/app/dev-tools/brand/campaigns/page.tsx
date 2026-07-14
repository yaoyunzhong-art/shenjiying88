// 📈 P-47 营销活动分析
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Progress, Modal, Input, message, Tabs, Divider } from '@m5/ui';

interface Campaign { id:string; name:string; channel:string; budget:number; spent:number; impressions:number; clicks:number; conversions:number; roi:string; status:'active'|'paused'|'ended'; }
const CAMPAIGNS: Campaign[] = [
  { id:'CM-01',name:'暑期档抖音推广',channel:'抖音',budget:15000,spent:9800,impressions:120000,clicks:3600,conversions:480,roi:'65%',status:'active' },
  { id:'CM-02',name:'会员日营销',channel:'短信',budget:5000,spent:3200,impressions:45000,clicks:1200,conversions:180,roi:'56%',status:'active' },
  { id:'CM-03',name:'开学季活动',channel:'公众号',budget:8000,spent:7600,impressions:68000,clicks:1800,conversions:240,roi:'48%',status:'ended' },
  { id:'CM-04',name:'周末特惠推送',channel:'小程序',budget:3000,spent:1800,impressions:28000,clicks:900,conversions:120,roi:'67%',status:'active' },
  { id:'CM-05',name:'短视频团购',channel:'抖音',budget:12000,spent:8500,impressions:95000,clicks:2800,conversions:350,roi:'62%',status:'active' },
];

const CHANNELS = [...new Set(CAMPAIGNS.map(c=>c.channel))];

export default function CampaignPage() {
  const [channelFilter, setChannelFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const filtered = channelFilter==='all' ? CAMPAIGNS : CAMPAIGNS.filter(c=>c.channel===channelFilter);
  const totalBudget = CAMPAIGNS.reduce((s,c)=>s+c.budget,0);
  const totalSpent = CAMPAIGNS.reduce((s,c)=>s+c.spent,0);
  const totalImpressions = CAMPAIGNS.reduce((s,c)=>s+c.impressions,0);

  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <h2 style={{color:'#f8fafc',margin:0}}>📈 营销活动</h2>
      <Button type="primary" onClick={()=>setShowCreate(true)}>+ 创建活动</Button>
    </div>
    <Row gutter={16}>
      <Col span={4}><Card size="small"><Statistic title="活动数" value={CAMPAIGNS.length} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="总预算" value={totalBudget.toLocaleString()} prefix="¥" /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="已消耗" value={totalSpent.toLocaleString()} prefix="¥" valueStyle={{color:'#f59e0b'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="总曝光" value={totalImpressions.toLocaleString()} suffix="次" /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="平均ROI" value={`${Math.round(CAMPAIGNS.reduce((s,c)=>s+parseInt(c.roi),0)/CAMPAIGNS.length)}%`} valueStyle={{color:'#34d399'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="进行中" value={CAMPAIGNS.filter(c=>c.status==='active').length} valueStyle={{color:'#34d399'}} /></Card></Col>
    </Row>
    <Card>
      <Select value={channelFilter} onChange={setChannelFilter} style={{width:120,marginBottom:12}}
        options={[{value:'all',label:'全部渠道'},...CHANNELS.map(c=>({value:c,label:c}))]} />
      <Table dataSource={filtered} rowKey="id" columns={[
        {title:'名称',dataIndex:'name'},{title:'渠道',dataIndex:'channel',render:(v:string)=><Tag>{v}</Tag>},
        {title:'预算',dataIndex:'budget',render:(v:number)=>`¥${v.toLocaleString()}`},
        {title:'已消耗',dataIndex:'spent',render:(v:number)=>`¥${v.toLocaleString()}`},
        {title:'曝光',dataIndex:'impressions',render:(v:number)=>v.toLocaleString()},
        {title:'点击',dataIndex:'clicks'},{title:'转化',dataIndex:'conversions'},
        {title:'ROI',dataIndex:'roi',render:(v:string)=><Tag color={parseInt(v)>=60?'green':'blue'}>{v}</Tag>},
        {title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='active'?'green':v==='paused'?'orange':'default'}>{v==='active'?'进行中':v==='paused'?'已暂停':'已结束'}</Tag>},
        {title:'操作',key:'a',render:(_:unknown,r:Campaign)=><Button size="small" disabled={r.status==='ended'}>分析</Button>},
      ]} pagination={false} />
    </Card>
    <Modal title="创建活动" open={showCreate} onCancel={()=>setShowCreate(false)} onOk={()=>{message.success('已创建');setShowCreate(false)}}>
      <Space direction="vertical" style={{width:'100%'}}>
        <Input placeholder="活动名称" /><Input placeholder="预算" type="number" />
        <Select placeholder="渠道" style={{width:'100%'}}>
          {CHANNELS.map(c=><Select.Option key={c} value={c}>{c}</Select.Option>)}
        </Select>
      </Space>
    </Modal>
  </Space></PageShell>);
}
