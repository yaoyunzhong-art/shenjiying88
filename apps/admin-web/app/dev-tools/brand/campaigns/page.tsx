// 📈 P-47 营销活动分析
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Select, Modal, Input } from '@m5/ui';

interface Campaign { id:string; name:string; channel:string; budget:number; spent:number; impressions:number; clicks:number; conversions:number; roi:string; status:string; [key:string]:unknown; }

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

  return (
    <PageShell title="营销活动">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>📈 营销活动</h2>
          <Button variant="primary" onClick={()=>setShowCreate(true)}>+ 创建活动</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16}}>
          <Card><Statistic label="活动数" value={CAMPAIGNS.length} /></Card>
          <Card><Statistic label="总预算" value={totalBudget.toLocaleString()} prefix="¥" /></Card>
          <Card><Statistic label="已消耗" value={totalSpent.toLocaleString()} prefix="¥" variant="warning" /></Card>
          <Card><Statistic label="总曝光" value={totalImpressions.toLocaleString()} suffix="次" /></Card>
          <Card><Statistic label="平均ROI" value={`${Math.round(CAMPAIGNS.reduce((s,c)=>s+parseInt(c.roi),0)/CAMPAIGNS.length)}%`} variant="success" /></Card>
          <Card><Statistic label="进行中" value={CAMPAIGNS.filter(c=>c.status==='active').length} variant="success" /></Card>
        </div>
        <Card>
          <Select value={channelFilter} onChange={setChannelFilter} style={{width:120,marginBottom:12}}
            options={[{value:'all',label:'全部渠道'},...CHANNELS.map(c=>({value:c,label:c}))]} />
          <Table
            rows={filtered}
            rowKey={(r: Campaign) => r.id}
            columns={[
              {key:'name', header:'名称', render:(r: Campaign)=>r.name},
              {key:'channel', header:'渠道', render:(r: Campaign)=><Tag>{r.channel}</Tag>},
              {key:'budget', header:'预算', render:(r: Campaign)=>`¥${r.budget.toLocaleString()}`},
              {key:'spent', header:'已消耗', render:(r: Campaign)=>`¥${r.spent.toLocaleString()}`},
              {key:'impressions', header:'曝光', render:(r: Campaign)=>r.impressions.toLocaleString()},
              {key:'clicks', header:'点击', render:(r: Campaign)=>String(r.clicks)},
              {key:'conversions', header:'转化', render:(r: Campaign)=>String(r.conversions)},
              {key:'roi', header:'ROI', render:(r: Campaign)=><Tag variant={parseInt(r.roi)>=60?'success':'primary'}>{r.roi}</Tag>},
              {key:'status', header:'状态', render:(r: Campaign)=>{
                const v = r.status;
                const label = v==='active'?'进行中':v==='paused'?'已暂停':'已结束';
                const variant = v==='active'?'success':v==='paused'?'warning':'default';
                return <Tag variant={variant as any}>{label}</Tag>;
              }},
              {key:'a', header:'操作', render:(r: Campaign)=><Button size="sm" disabled={r.status==='ended'}>分析</Button>},
            ]}
          />
        </Card>
        <Modal title="创建活动" open={showCreate} onClose={()=>setShowCreate(false)}>
          <Space style={{width:'100%',flexDirection:'column'}}>
            <Input placeholder="活动名称" /><Input placeholder="预算" type="number" />
            <Select placeholder="渠道" options={CHANNELS.map(c=>({value:c,label:c}))} style={{width:'100%'}} />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
