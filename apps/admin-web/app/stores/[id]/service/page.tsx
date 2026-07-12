// 🔧 服务管理 · 客户服务/投诉处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const DATA = [
  { id:'SV-01', customer:'张明', type:'投诉', desc:'排队时间太长', time:'2026-07-12 14:30', handler:'李四', status:'processing', priority:'high' },
  { id:'SV-02', customer:'李芳', type:'咨询', desc:'会员卡使用规则', time:'2026-07-12 13:00', handler:'张三', status:'resolved', priority:'low' },
  { id:'SV-03', customer:'王强', type:'报修', desc:'VR-2设备故障', time:'2026-07-12 10:15', handler:'', status:'pending', priority:'high' },
  { id:'SV-04', customer:'赵丽', type:'建议', desc:'增加扫码点单', time:'2026-07-11 16:00', handler:'张三', status:'resolved', priority:'low' },
];
const COLUMNS = [
  { title:'客户', dataIndex:'customer' }, { title:'类型', dataIndex:'type' },
  { title:'内容', dataIndex:'desc' }, { title:'时间', dataIndex:'time' },
  { title:'处理人', dataIndex:'handler' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='resolved'?'green':v==='processing'?'blue':'orange'}>{v==='resolved'?'已解决':v==='processing'?'处理中':'待处理'}</Tag> },
  { title:'优先级', dataIndex:'priority', render:(v:string)=><Tag color={v==='high'?'red':'default'}>{v==='high'?'高':'低'}</Tag> },
];
export default function ServicePage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔧 服务管理</h2>
    <Row gutter={16}><Col span={6}><Card><Statistic title="本月工单" value={48}/></Card></Col><Col span={6}><Card><Statistic title="待处理" value={2} valueStyle={{color:'#f87171'}}/></Card></Col><Col span={6}><Card><Statistic title="处理中" value={1} valueStyle={{color:'#f59e0b'}}/></Card></Col><Col span={6}><Card><Statistic title="已解决" value={45} valueStyle={{color:'#34d399'}}/></Card></Col></Row>
    <Card><Table dataSource={DATA} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">新建工单</Button><Button>报表</Button></Space></Card></Space></PageShell>);
}