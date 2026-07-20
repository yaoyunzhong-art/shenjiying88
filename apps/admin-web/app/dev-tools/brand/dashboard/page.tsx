// 📊 运营看板 · P-47 / 品牌运营仪表盘
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Select } from '@m5/ui';

interface RevenueRow { month:string; revenue:number; cost:number; roi:string; leads:number; conversion:string; [key:string]:unknown; }
interface BrandMetric { brand:string; posts:number; reach:number; engagement:string; sentiment:string; [key:string]:unknown; }

const REVENUE: RevenueRow[] = [
  { month:'1月', revenue:128000, cost:72000, roi:'56%', leads:45, conversion:'33%' },
  { month:'2月', revenue:145000, cost:78000, roi:'60%', leads:52, conversion:'35%' },
  { month:'3月', revenue:162000, cost:85000, roi:'62%', leads:58, conversion:'34%' },
  { month:'4月', revenue:158000, cost:82000, roi:'61%', leads:48, conversion:'38%' },
  { month:'5月', revenue:175000, cost:88000, roi:'66%', leads:55, conversion:'36%' },
  { month:'6月', revenue:192000, cost:95000, roi:'67%', leads:62, conversion:'40%' },
];

const BRAND_METRICS: BrandMetric[] = [
  { brand:'火星蹦床公园', posts:28, reach:45000, engagement:'3.2%', sentiment:'正82%' },
  { brand:'银河电竞馆', posts:18, reach:32000, engagement:'4.1%', sentiment:'正78%' },
  { brand:'极速卡丁车', posts:22, reach:28000, engagement:'2.8%', sentiment:'正85%' },
];

export default function BrandDashboardPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('halfyear');
  const totalRev = REVENUE.reduce((s,r)=>s+r.revenue,0);
  const totalCost = REVENUE.reduce((s,r)=>s+r.cost,0);
  const totalLeads = REVENUE.reduce((s,r)=>s+r.leads,0);
  const avgRoi = Math.round(REVENUE.reduce((s,r)=>s+parseInt(r.roi),0)/REVENUE.length);

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!REVENUE || REVENUE.length === 0) return <div>暂无数据</div>

  return (
    <PageShell title="品牌运营看板">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>📊 品牌运营看板</h2>
          <Select value={period} onChange={setPeriod} style={{width:120}}
            options={[{value:'halfyear',label:'近半年'},{value:'year',label:'近一年'}]} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="品牌数" value={BRAND_METRICS.length} /></Card>
          <Card><Statistic label="总营收" value={totalRev.toLocaleString()} prefix="¥" variant="success" /></Card>
          <Card><Statistic label="总成本" value={totalCost.toLocaleString()} prefix="¥" /></Card>
          <Card><Statistic label="平均ROI" value={`${avgRoi}%`} variant="warning" /></Card>
          <Card><Statistic label="总线索" value={totalLeads} suffix="条" /></Card>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
          <Card>
            <div style={{color:'#e2e8f0',fontSize:15,marginBottom:12}}>营收趋势</div>
            <Table
              rows={REVENUE}
              rowKey={(r: RevenueRow) => r.month}
              columns={[
                {key:'month', header:'月份', render:(r: RevenueRow)=>r.month},
                {key:'revenue', header:'营收', render:(r: RevenueRow)=>`¥${r.revenue.toLocaleString()}`},
                {key:'cost', header:'成本', render:(r: RevenueRow)=>`¥${r.cost.toLocaleString()}`},
                {key:'roi', header:'ROI', render:(r: RevenueRow)=><Tag variant={parseInt(r.roi)>=60?'success':'primary'}>{r.roi}</Tag>},
                {key:'leads', header:'线索', render:(r: RevenueRow)=>String(r.leads)},
                {key:'conversion', header:'转化率', render:(r: RevenueRow)=>r.conversion},
              ]} />
          </Card>
          <Card>
            <div style={{color:'#e2e8f0',fontSize:15,marginBottom:12}}>品牌社媒表现</div>
            {BRAND_METRICS.map(b=><div key={b.brand} style={{padding:'8px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
              <div style={{color:'#e2e8f0',fontSize:13}}>{b.brand}</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#94a3b8',marginTop:2}}>
                <span>触达:{b.reach.toLocaleString()}</span>
                <span>互动:{b.engagement}</span>
                <span>{b.sentiment}</span>
              </div>
            </div>)}
          </Card>
        </div>
      </Space>
    </PageShell>
  );
}
