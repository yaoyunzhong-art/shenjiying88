// 🔄 交接班 · 收银/设备/钥匙交接
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Modal } from '@m5/ui';

const HANDOVERS = [
  { id:'H01', from:'张三(早班)', to:'王五(晚班)', cash:8360, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-12 14:00', status:'normal', note:'' },
  { id:'H02', from:'李四(中班)', to:'刘七(夜班)', cash:12580, cash_diff:-50, devices:'VR-2停机待修', keys:'A柜', time:'2026-07-11 22:00', status:'diff', note:'短款50元,已报主管' },
  { id:'H03', from:'王五(晚班)', to:'张三(早班)', cash:6320, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-10 06:00', status:'normal', note:'' },
  { id:'H04', from:'刘七(夜班)', to:'李四(中班)', cash:9810, cash_diff:30, devices:'台球桌灯需修', keys:'A柜', time:'2026-07-09 06:00', status:'diff', note:'长款30元' },
  { id:'H05', from:'张三(早班)', to:'王五(晚班)', cash:10500, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-08 14:00', status:'normal', note:'' },
];

const COLUMNS = [
  { title:'交班人', dataIndex:'from', width:130 },
  { title:'接班人', dataIndex:'to', width:130 },
  { title:'现金', dataIndex:'cash', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'差额', dataIndex:'cash_diff', render:(v:number)=><span style={{color:v<0?'#f87171':v>0?'#34d399':'#94a3b8'}}>{v===0?'-':v>0?`+${v}`:v}</span> },
  { title:'设备状态', dataIndex:'devices', ellipsis:true },
  { title:'钥匙', dataIndex:'keys' },
  { title:'备注', dataIndex:'note', ellipsis:true },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='normal'?'green':'orange'}>{v==='normal'?'正常':'差异'}</Tag> },
  { title:'时间', dataIndex:'time' },
];

export default function ShiftHandoverPage() {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? HANDOVERS : HANDOVERS.slice(0, 3);
  const totalCash = HANDOVERS.reduce((s, h) => s + h.cash, 0);
  const diffCount = HANDOVERS.filter(h => h.status === 'diff').length;
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔄 交接班</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="交接记录" value={HANDOVERS.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="现金总额" value={totalCash} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="正常" value={HANDOVERS.length - diffCount} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="差异" value={diffCount} valueStyle={{color:'#f59e0b'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={displayed} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space>
      <Button type="primary">开始交接</Button>
      <Button onClick={()=>setShowAll(!showAll)}>{showAll?'收起':'查看全部'}</Button>
      <Button>历史记录</Button>
    </Space></Card>
  </Space></PageShell>);
}
