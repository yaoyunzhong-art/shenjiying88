// 📈 报表中心 · 经营报表/自定义报表
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Tag, Button, Space, Select } from '@m5/ui';
const REPORTS = [
  { id:'R01', name:'每日营收报表', freq:'每日', type:'自动', desc:'前一日营收/支出/净利汇总', last:'2026-07-12' },
  { id:'R02', name:'客流趋势报表', freq:'每周', type:'自动', desc:'周客流/时段分布/峰值', last:'2026-07-07' },
  { id:'R03', name:'设备使用率报表', freq:'每月', type:'自动', desc:'各设备使用率/故障率/收益', last:'2026-07-01' },
  { id:'R04', name:'会员消费分析', freq:'每月', type:'自动', desc:'会员消费频次/客单价/偏好', last:'2026-07-01' },
  { id:'R05', name:'库存盘点报告', freq:'自定义', type:'手动', desc:'库存盘点差异/损耗分析', last:'2026-06-30' },
];
export default function ReportsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📈 报表中心</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="可选报表" value={12}/></Card></Col>
      <Col span={6}><Card><Statistic title="今日生成" value={1} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="待审报表" value={0} valueStyle={{color:'#64748b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="报表覆盖率" value="85%" valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    {REPORTS.map(r => (
      <Card key={r.id}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{color:'#f8fafc',fontWeight:600}}>{r.name}</div><div style={{color:'#64748b',fontSize:13}}>{r.desc}</div></div>
        <Space><Tag>{r.freq}</Tag><Button size="small">生成</Button><Button size="small">下载</Button></Space>
      </div></Card>
    ))}
  </Space></PageShell>);
}