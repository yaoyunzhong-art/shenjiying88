// 📈 经营分析 · 营收/客流/设备使用率
'use client'; import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space, Select, Progress } from '@m5/ui';

const METRICS = [
  { key:'revenue', label:'本月营收', value:386200, unit:'元', trend:'up', change:12.5, status:'good' },
  { key:'cogs', label:'本月成本', value:185400, unit:'元', trend:'up', change:8.3, status:'fair' },
  { key:'profit', label:'本月利润', value:200800, unit:'元', trend:'up', change:16.8, status:'good' },
  { key:'visitors', label:'本月客流', value:5420, unit:'人', trend:'up', change:6.2, status:'good' },
  { key:'avgSpend', label:'客单价', value:71.3, unit:'元', trend:'up', change:3.1, status:'good' },
  { key:'deviceUtil', label:'设备使用率', value:82, unit:'%', trend:'stable', change:0, status:'good' },
];

const TREND_CFG: Record<string,string> = { up:'📈', down:'📉', stable:'➡️' };
const PERIODS = ['今日', '本周', '本月', '本季度'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('本月');
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📈 经营分析</h2>
    <Space style={{justifyContent:'space-between',width:'100%'}}>
      <span style={{color:'#94a3b8',fontSize:13}}>当前周期: <Select value={period} onChange={setPeriod} style={{width:120}}
        options={PERIODS.map(p=>({value:p,label:p}))}/></span>
      <Space><Button>生成报表</Button><Button>导出</Button></Space>
    </Space>
    <Row gutter={16}>
      {METRICS.map(m => (
        <Col span={8} key={m.key}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{color:'#94a3b8',fontSize:13}}>{m.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:'#f8fafc',marginTop:4}}>
                  {m.unit === '元' ? `¥${(m.value/1000).toFixed(1)}K` : m.unit === '%' ? `${m.value}%` : m.value.toLocaleString()}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:20}}>{TREND_CFG[m.trend]||''}</div>
                <div style={{fontSize:13,color:m.change>0?'#34d399':'#f87171',fontWeight:600}}>
                  {m.change>0?'+':''}{m.change}%
                </div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
    <Card><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{color:'#f8fafc',fontWeight:600}}>指标快速查看</span>
      <Space>
        <span style={{color:'#34d399',fontSize:13}}>🟢 良好 {METRICS.filter(m=>m.status==='good').length}</span>
        <span style={{color:'#f59e0b',fontSize:13}}>🟡 一般 {METRICS.filter(m=>m.status==='fair').length}</span>
      </Space>
    </div></Card>
  </Space></PageShell>);
}
