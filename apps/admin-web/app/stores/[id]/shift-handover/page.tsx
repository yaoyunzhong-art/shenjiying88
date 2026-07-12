// 🔄 交接班 · 收银/设备/钥匙交接
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const HANDOVERS = [
  { id:'H01', from:'张三(早班)', to:'王五(晚班)', cash:8360, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-12 14:00', status:'normal' },
  { id:'H02', from:'李四(中班)', to:'刘七(夜班)', cash:12580, cash_diff:-50, devices:'VR-2停机', keys:'A柜', time:'2026-07-11 22:00', status:'diff' },
];
const COLUMNS = [
  { title:'交接', dataIndex:'from' }, { title:'接交人', dataIndex:'to' },
  { title:'现金', dataIndex:'cash', render:(v:number)=>`¥${v}` },
  { title:'差额', dataIndex:'cash_diff', render:(v:number)=><span style={{color:v<0?'#f87171':'#34d399'}}>{v>0?'+':''}{v}</span> },
  { title:'设备', dataIndex:'devices' }, { title:'钥匙', dataIndex:'keys' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='normal'?'green':'orange'}>{v==='normal'?'正常':'差异'}</Tag> },
];
export default function ShiftHandoverPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔄 交接班</h2>
    <Row gutter={16}>
      <Col span={8}><Card><Statistic title="今日班次" value={3}/></Card></Col>
      <Col span={8}><Card><Statistic title="现金总额" value={20940} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={8}><Card><Statistic title="差异记录" value={1} valueStyle={{color:'#f59e0b'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={HANDOVERS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">开始交接</Button><Button>历史记录</Button></Space></Card>
  </Space></PageShell>);
}