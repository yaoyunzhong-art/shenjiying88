// 🎉 促销管理 · 促销活动创建与监控
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space } from '@m5/ui';
const PROMOS = [
  { id:'P001', name:'充值满100送15', type:'充值', status:'active', used:128, limit:500, start:'2026-07-01', end:'2026-07-31' },
  { id:'P002', name:'团建8折优惠', type:'团建', status:'active', used:23, limit:100, start:'2026-07-01', end:'2026-08-31' },
  { id:'P003', name:'新人首单立减', type:'新人', status:'active', used:67, limit:200, start:'2026-07-01', end:'2026-07-31' },
  { id:'P004', name:'积分翻倍活动', type:'积分', status:'scheduled', used:0, limit:1000, start:'2026-08-01', end:'2026-08-07' },
];
const COLUMNS = [
  { title:'名称', dataIndex:'name' }, { title:'类型', dataIndex:'type' },
  { title:'状态', dataIndex:'status', render:(v:string)=> <Tag color={v==='active'?'green':v==='scheduled'?'blue':'default'}>{v==='active'?'进行中':v==='scheduled'?'待开始':'已结束'}</Tag> },
  { title:'使用', dataIndex:'used' }, { title:'总量', dataIndex:'limit' }, { title:'消耗率', render:(_:any,r:any)=>`${Math.round(r.used/r.limit*100)}%` },
  { title:'日期', dataIndex:'start' },
];
export default function PromotionsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🎉 促销管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="进行中" value={3} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="待开始" value={1} valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="总使用" value={218}/></Card></Col>
      <Col span={6}><Card><Statistic title="核销率" value="27%"/></Card></Col>
    </Row>
    <Card><Table dataSource={PROMOS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">新建促销</Button><Button>优惠券模板</Button><Button>效果分析</Button></Space></Card>
  </Space></PageShell>);
}