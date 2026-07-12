// 🧾 对账管理 · 支付对账/差异处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const DATA = [
  { id:'REC-01', date:'2026-07-12', income:12800, system:12850, diff:-50, method:'微信', status:'diff' },
  { id:'REC-02', date:'2026-07-12', income:3200, system:3200, diff:0, method:'支付宝', status:'match' },
  { id:'REC-03', date:'2026-07-12', income:1500, system:1500, diff:0, method:'现金', status:'match' },
  { id:'REC-04', date:'2026-07-11', income:14200, system:14200, diff:0, method:'微信', status:'match' },
];
const COLUMNS = [
  { title:'日期', dataIndex:'date' }, { title:'实收', dataIndex:'income', render:(v:number)=>`¥${v}` },
  { title:'系统', dataIndex:'system', render:(v:number)=>`¥${v}` },
  { title:'差额', dataIndex:'diff', render:(v:number)=><span style={{color:v!==0?'#f87171':'#34d399'}}>{v===0?'✓':v}</span> },
  { title:'支付', dataIndex:'method' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='match'?'green':'orange'}>{v==='match'?'一致':'差异'}</Tag> },
];
export default function ReconciliationPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🧾 对账管理</h2>
    <Row gutter={16}><Col span={8}><Card><Statistic title="今日对账" value={3} valueStyle={{color:'#34d399'}}/></Card></Col><Col span={8}><Card><Statistic title="一致" value={2} valueStyle={{color:'#34d399'}}/></Card></Col><Col span={8}><Card><Statistic title="差异" value={1} valueStyle={{color:'#f87171'}}/></Card></Col></Row>
    <Card><Table dataSource={DATA} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">对账</Button><Button>生成差异报告</Button></Space></Card></Space></PageShell>);
}