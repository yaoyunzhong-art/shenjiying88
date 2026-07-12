// 📅 预约管理 · 场地/设备预约处理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const DATA = [
  { id:'R001', customer:'张明', type:'生日派对', date:'2026-07-15', time:'14:00-17:00', people:15, status:'confirmed', phone:'138****8888' },
  { id:'R002', customer:'公司团建', type:'团建活动', date:'2026-07-16', time:'10:00-16:00', people:28, status:'confirmed', phone:'139****0000' },
  { id:'R003', customer:'李芳', type:'VR体验', date:'2026-07-13', time:'10:00-12:00', people:3, status:'pending', phone:'136****6666' },
];
const COLUMNS = [
  { title:'客户', dataIndex:'customer' }, { title:'类型', dataIndex:'type' },
  { title:'日期', dataIndex:'date' }, { title:'时间', dataIndex:'time' }, { title:'人数', dataIndex:'people' },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='confirmed'?'green':v==='pending'?'blue':'default'}>{v==='confirmed'?'已确认':v==='pending'?'待确认':'已取消'}</Tag> },
];
export default function ReservationsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📅 预约管理</h2>
    <Row gutter={16}><Col span={8}><Card><Statistic title="今日预约" value={3}/></Card></Col><Col span={8}><Card><Statistic title="待确认" value={1} valueStyle={{color:'#f59e0b'}}/></Card></Col><Col span={8}><Card><Statistic title="累计预约" value={128}/></Card></Col></Row>
    <Card><Table dataSource={DATA} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">确认预约</Button><Button>排程表</Button><Button>模板</Button></Space></Card></Space></PageShell>);
}