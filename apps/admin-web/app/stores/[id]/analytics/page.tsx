// 📈 经营分析 · 营收/客流/设备使用率
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space, Select, Progress, Table } from '@m5/ui';
interface Metric { id:string; label:string; value:number; unit:string; trend:'up'|'down'|'flat'; change:number; chart?:string; }
const METRICS: Metric[] = [
  { id:'M1',label:'今日营收',value:12800,unit:'¥',trend:'up',change:12 },
  { id:'M2',label:'本周营收',value:89200,unit:'¥',trend:'up',change:8.5 },
  { id:'M3',label:'本月营收',value:386500,unit:'¥',trend:'up',change:15.2 },
  { id:'M4',label:'今日客流',value:328,unit:'人',trend:'up',change:5.5 },
  { id:'M5',label:'本周客流',value:2180,unit:'人',trend:'flat',change:1.2 },
  { id:'M6',label:'本月客流',value:9250,unit:'人',trend:'up',change:10.8 },
  { id:'M7',label:'客单价',value:86,unit:'¥',trend:'up',change:3.5 },
  { id:'M8',label:'上座率',value:65,unit:'%',trend:'down',change:-2.1 },
  { id:'M9',label:'设备使用率',value:72,unit:'%',trend:'up',change:4.3 },
  { id:'M10',label:'会员消费占比',value:58,unit:'%',trend:'up',change:2.8 },
];
const TREND_CFG:Record<string,{color:string,icon:string}> = { up:{color:'#34d399',icon:'↑'}, down:{color:'#f87171',icon:'↓'}, flat:{color:'#94a3b8',icon:'→'} };

const TOP_PRODUCTS = [
  { product:'VR体验',revenue:28800,qty:120,rank:1 },
  { product:'游戏币售卖',revenue:18500,qty:37000,rank:2 },
  { product:'饮品',revenue:9600,qty:480,rank:3 },
  { product:'会员充值',revenue:8900,qty:45,rank:4 },
  { product:'台球',revenue:7200,qty:60,rank:5 },
  { product:'生日派对',revenue:6400,qty:5,rank:6 },
];

export default function AnalyticsPage() {
  const [period,setPeriod]=useState('today');
  const revenueMetrics = METRICS.filter(m=>m.label.includes('营收'));
  const trafficMetrics = METRICS.filter(m=>m.label.includes('客流')||m.label.includes('客单')||m.label.includes('上座')||m.label.includes('使用')||m.label.includes('消费'));
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#f8fafc',margin:0}}>📈 经营分析</h2><Select value={period} onChange={setPeriod} style={{width:140}} options={[{value:'today',label:'今日'},{value:'week',label:'本周'},{value:'month',label:'本月'},{value:'custom',label:'自定义'}]}/></div>
    <Card title="营收"><Row gutter={16}>{revenueMetrics.map(m=><Col span={8} key={m.id}><Card size="small" style={{background:'#0f172a'}}>
      <Statistic title={m.label} value={m.value} prefix={m.unit} valueStyle={{color:'#34d399'}}/>
      <div style={{fontSize:12,marginTop:4}}><span style={{color:TREND_CFG[m.trend].color}}>{TREND_CFG[m.trend].icon} {m.change}%</span><span style={{color:'#64748b',marginLeft:8}}>vs昨日</span></div>
    </Card></Col>)}</Row></Card>
    <Card title="客流与转化"><Row gutter={16}>{trafficMetrics.map(m=><Col span={6} key={m.id}><Card size="small" style={{background:'#0f172a'}}>
      <Statistic title={m.label} value={m.value} suffix={m.unit!=='¥'?m.unit:''} prefix={m.unit==='¥'?'¥':''} valueStyle={{color:m.trend==='down'?'#f87171':'#60a5fa'}}/>
      <div style={{fontSize:12,marginTop:4}}><span style={{color:TREND_CFG[m.trend].color}}>{TREND_CFG[m.trend].icon} {m.change}%</span></div>
    </Card></Col>)}</Row></Card>
    <Card title="销售排行 Top 6">
      <Table dataSource={TOP_PRODUCTS} columns={[
        {title:'#',dataIndex:'rank',width:40,render:(v:number)=><span style={{color:v<=3?'#fbbf24':'#64748b',fontWeight:v<=3?700:400}}>{v}</span>},
        {title:'产品/服务',dataIndex:'product'},{title:'营收',dataIndex:'revenue',render:(v:number)=>`¥${v.toLocaleString()}`},{title:'数量',dataIndex:'qty',render:(v:number)=>v.toLocaleString()},
      ]} rowKey="rank" pagination={false}/>
    </Card>
  </Space></PageShell>);
}
