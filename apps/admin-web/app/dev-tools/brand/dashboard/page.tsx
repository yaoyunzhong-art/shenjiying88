// 📊 运营看板 · P-47 / 品牌运营仪表盘
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Progress, Tabs, Select, Timeline, Empty, Divider } from '@m5/ui';

const REVENUE = [
  { month:'1月', revenue:128000, cost:72000, roi:'56%', leads:45, conversion:'33%' },
  { month:'2月', revenue:145000, cost:78000, roi:'60%', leads:52, conversion:'35%' },
  { month:'3月', revenue:162000, cost:85000, roi:'62%', leads:58, conversion:'34%' },
  { month:'4月', revenue:158000, cost:82000, roi:'61%', leads:48, conversion:'38%' },
  { month:'5月', revenue:175000, cost:88000, roi:'66%', leads:55, conversion:'36%' },
  { month:'6月', revenue:192000, cost:95000, roi:'67%', leads:62, conversion:'40%' },
];

const BRAND_METRICS = [
  { brand:'火星蹦床公园', posts:28, reach:45000, engagement:'3.2%', sentiment:'正82%' },
  { brand:'银河电竞馆', posts:18, reach:32000, engagement:'4.1%', sentiment:'正78%' },
  { brand:'极速卡丁车', posts:22, reach:28000, engagement:'2.8%', sentiment:'正85%' },
];

export default function BrandDashboardPage() {
  const [period, setPeriod] = useState('halfyear');
  const totalRev = REVENUE.reduce((s,r)=>s+r.revenue,0);
  const totalCost = REVENUE.reduce((s,r)=>s+r.cost,0);
  const totalLeads = REVENUE.reduce((s,r)=>s+r.leads,0);
  const avgRoi = Math.round(REVENUE.reduce((s,r)=>s+parseInt(r.roi),0)/REVENUE.length);

  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <h2 style={{color:'#f8fafc',margin:0}}>📊 品牌运营看板</h2>
      <Select value={period} onChange={setPeriod} style={{width:120}}
        options={[{value:'halfyear',label:'近半年'},{value:'year',label:'近一年'}]} />
    </div>
    <Row gutter={16}>
      <Col span={4}><Card size="small"><Statistic title="品牌数" value={BRAND_METRICS.length} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总营收" value={totalRev.toLocaleString()} prefix="¥" valueStyle={{color:'#34d399'}} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总成本" value={totalCost.toLocaleString()} prefix="¥" /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="平均ROI" value={`${avgRoi}%`} valueStyle={{color:'#fbbf24'}} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总线索" value={totalLeads} suffix="条" /></Card></Col>
    </Row>
    <Row gutter={16}>
      <Col span={16}>
        <Card title="营收趋势" size="small">
          <Table dataSource={REVENUE} rowKey="month" pagination={false} columns={[
            {title:'月份',dataIndex:'month'},
            {title:'营收',dataIndex:'revenue',render:(v:number)=>`¥${v.toLocaleString()}`},
            {title:'成本',dataIndex:'cost',render:(v:number)=>`¥${v.toLocaleString()}`},
            {title:'ROI',dataIndex:'roi',render:(v:string)=><Tag color={parseInt(v)>=60?'green':'blue'}>{v}</Tag>},
            {title:'线索',dataIndex:'leads'},
            {title:'转化率',dataIndex:'conversion'},
          ]} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="品牌社媒表现" size="small">
          {BRAND_METRICS.map(b=><div key={b.brand} style={{padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
            <div style={{color:'#e2e8f0',fontSize:13}}>{b.brand}</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#94a3b8',marginTop:2}}>
              <span>触达:{b.reach.toLocaleString()}</span>
              <span>互动:{b.engagement}</span>
              <span>{b.sentiment}</span>
            </div>
          </div>)}
        </Card>
      </Col>
    </Row>
  </Space></PageShell>);
}
