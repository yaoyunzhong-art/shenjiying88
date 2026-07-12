// 📢 营销管理 · 优惠券/推广/会员营销
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space } from '@m5/ui';
const CAMPAIGNS = [
  { id: 'C001', name: '新会员首充有礼', type: '充值', status: 'active', start: '2026-07-01', end: '2026-07-31', budget: 5000, used: 3200 },
  { id: 'C002', name: '暑期畅玩卡', type: '会员卡', status: 'active', start: '2026-07-01', end: '2026-08-31', budget: 20000, used: 8500 },
  { id: 'C003', name: '周末特惠套餐', type: '套餐', status: 'active', start: '2026-07-06', end: '2026-07-31', budget: 8000, used: 2800 },
  { id: 'C004', name: '团建优惠券', type: '优惠券', status: 'draft', start: '2026-08-01', end: '2026-08-31', budget: 3000, used: 0 },
];
const COLUMNS = [
  { title: '活动名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' },
  { title: '状态', dataIndex: 'status', render: (v:string) => <Tag color={v==='active'?'green':'default'}>{v==='active'?'进行中':'草稿'}</Tag> },
  { title: '预算', dataIndex: 'budget', render: (v:number) => `¥${v.toLocaleString()}` },
  { title: '已用', dataIndex: 'used', render: (v:number) => `¥${v.toLocaleString()}` },
  { title: '进度', dataIndex: 'progress', render: (_:any,r:any) => `${Math.round(r.used/r.budget*100)}%` },
  { title: '日期', dataIndex: 'start' },
];
export default function MarketingPage() {
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <h2 style={{color:'#f8fafc',margin:0}}>📢 营销管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="进行中活动" value={3} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="本月预算" value={33000} prefix="¥"/></Card></Col>
      <Col span={6}><Card><Statistic title="已消耗" value={14500} prefix="¥" valueStyle={{color:'#f59e0b'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="转化率" value="23%" valueStyle={{color:'#34d399'}}/></Card></Col>
    </Row>
    <Card><Table dataSource={CAMPAIGNS} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
    <Card><Space><Button type="primary">创建活动</Button><Button>优惠券管理</Button><Button>数据报表</Button></Space></Card>
  </Space></PageShell>);
}