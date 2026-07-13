// 🧾 对账管理 · 支付对账/差异处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input } from '@m5/ui';

const DATA = [
  { id:'REC-01', date:'2026-07-12', income:12800, system:12850, diff:-50, method:'微信', status:'diff', operator:'张三', note:'微信通道手续费差异' },
  { id:'REC-02', date:'2026-07-12', income:3200, system:3200, diff:0, method:'支付宝', status:'match', operator:'张三', note:'' },
  { id:'REC-03', date:'2026-07-12', income:1500, system:1500, diff:0, method:'现金', status:'match', operator:'李四', note:'' },
  { id:'REC-04', date:'2026-07-11', income:14200, system:14200, diff:0, method:'微信', status:'match', operator:'王五', note:'' },
  { id:'REC-05', date:'2026-07-11', income:4500, system:4520, diff:-20, method:'现金', status:'diff', operator:'张三', note:'疑似短款' },
  { id:'REC-06', date:'2026-07-10', income:9800, system:9800, diff:0, method:'微信', status:'match', operator:'赵六', note:'' },
];

const COLUMNS = [
  { title:'日期', dataIndex:'date' },
  { title:'实收', dataIndex:'income', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'系统', dataIndex:'system', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'差额', dataIndex:'diff', render:(v:number)=><span style={{color:v!==0?'#f87171':'#34d399',fontWeight:600}}>{v===0?'✓':v>0?`+${v}`:v}</span> },
  { title:'支付方式', dataIndex:'method', render:(v:string)=><Tag>{v}</Tag> },
  { title:'操作人', dataIndex:'operator' },
  { title:'备注', dataIndex:'note', ellipsis:true },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='match'?'green':'orange'}>{v==='match'?'一致':'差异'}</Tag> },
];

export default function ReconciliationPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? DATA : DATA.filter(d => d.status === statusFilter);
  const totalDiff = DATA.reduce((s, d) => s + Math.abs(d.diff), 0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🧾 对账管理</h2>
    <Row gutter={16}>
      <Col span={4}><Card><Statistic title="对账单数" value={DATA.length}/></Card></Col>
      <Col span={4}><Card><Statistic title="一致" value={DATA.filter(d=>d.status==='match').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="差异" value={DATA.filter(d=>d.status==='diff').length} valueStyle={{color:'#f87171'}}/></Card></Col>
      <Col span={4}><Card><Statistic title="差异总额" value={totalDiff} prefix="¥" valueStyle={{color:'#f87171'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>状态:</span>
      <Select value={statusFilter} onChange={setStatusFilter} style={{width:110}}
        options={[{value:'all',label:'全部'},{value:'match',label:'一致'},{value:'diff',label:'差异'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>执行对账</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button>生成差异报告</Button><Button>历史对账</Button></Space></Card>
  </Space></PageShell>);
}
