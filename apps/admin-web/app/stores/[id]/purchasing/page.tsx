// 🛒 采购管理 · 采购订单/供应商管理
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col } from '@m5/ui';
const DATA = [
  { id:'PO-001', item:'可乐(箱)', supplier:'统一商贸', qty:20, price:1200, date:'2026-07-10', status:'received' },
  { id:'PO-002', item:'打印纸(箱)', supplier:'办公用品', qty:5, price:400, date:'2026-07-12', status:'pending' },
  { id:'PO-003', item:'游戏币(袋)', supplier:'游戏币厂', qty:100, price:5000, date:'2026-07-08', status:'received' },
  { id:'PO-004', item:'礼品玩偶', supplier:'礼品商', qty:50, price:3000, date:'2026-07-14', status:'ordered' },
];
const COLUMNS = [
  { title:'品名', dataIndex:'item' }, { title:'供应商', dataIndex:'supplier' },
  { title:'数量', dataIndex:'qty' }, { title:'金额', dataIndex:'price', render:(v:number)=>`¥${v}` },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='received'?'green':v==='ordered'?'blue':'orange'}>{v==='received'?'已入库':v==='ordered'?'已下单':'待处理'}</Tag> },
];
export default function PurchasingPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🛒 采购管理</h2>
    <Row gutter={16}><Col span={8}><Card><Statistic title="本月采购" value={12}/></Card></Col><Col span={8}><Card><Statistic title="金额" value={24800} prefix="¥"/></Card></Col><Col span={8}><Card><Statistic title="待收货" value={2} valueStyle={{color:'#f59e0b'}}/></Card></Col></Row>
    <Card><Table dataSource={DATA} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">新建采购单</Button><Button>供应商管理</Button></Space></Card></Space></PageShell>);
}