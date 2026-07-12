// 📅 活动管理 · 门店活动创建/审批/发布
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space } from '@m5/ui';
const EVENTS = [
  { id:'E001', name:'暑期电竞大赛', type:'赛事', date:'2026-07-20', status:'preparing', participants:48, budget:8000 },
  { id:'E002', name:'亲子DIY活动', type:'体验', date:'2026-07-15', status:'published', participants:32, budget:2000 },
  { id:'E003', name:'会员生日会', type:'会员', date:'2026-07-25', status:'draft', participants:0, budget:3000 },
  { id:'E004', name:'七夕情侣活动', type:'节日', date:'2026-08-10', status:'draft', participants:0, budget:5000 },
];
const STATUS_MAP: Record<string,[string,string]> = {'draft':['default','草稿'],'preparing':['blue','筹备中'],'published':['green','已发布'],'ended':['default','已结束']};
const COLUMNS = [
  { title:'活动', dataIndex:'name' }, { title:'类型', dataIndex:'type' },
  { title:'日期', dataIndex:'date' },
  { title:'状态', dataIndex:'status', render:(v:string) => <Tag color={(STATUS_MAP[v]||['default',v])[0]}>{STATUS_MAP[v]?.[1]||v}</Tag> },
  { title:'参与人数', dataIndex:'participants' }, { title:'预算', dataIndex:'budget', render:(v:number)=>`¥${v.toLocaleString()}` },
];
export default function EventsPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📅 活动管理</h2>
    <Row gutter={16}><Col span={8}><Card><Statistic title="本月活动" value={3}/></Card></Col><Col span={8}><Card><Statistic title="待发布" value={2} valueStyle={{color:'#f59e0b'}}/></Card></Col><Col span={8}><Card><Statistic title="总预算" value={18000} prefix="¥" valueStyle={{color:'#34d399'}}/></Card></Col></Row>
    <Card><Table dataSource={EVENTS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">创建活动</Button><Button>审批列表</Button></Space></Card>
  </Space></PageShell>);
}