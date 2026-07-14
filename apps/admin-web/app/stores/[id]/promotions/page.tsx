// 🎉 促销管理 · 全生命周期管理+效果分析
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message, Progress, Tabs, Empty, Popconfirm } from '@m5/ui';

interface Promo {
  id: string; name: string; type: string; discount: string; scope: string;
  start: string; end: string; budget: number; used: number;
  status: 'active' | 'scheduled' | 'ended' | 'draft'; targetGoal?: string;
}

const DATA: Promo[] = [
  { id:'PROMO-001', name:'暑期8折优惠', type:'折扣', discount:'8折', scope:'全场', start:'2026-07-15', end:'2026-08-31', budget:30000, used:8500, status:'active', targetGoal:'提升客流20%' },
  { id:'PROMO-002', name:'新客满100减20', type:'满减', discount:'减20', scope:'新用户', start:'2026-07-10', end:'2026-07-31', budget:10000, used:3200, status:'active' },
  { id:'PROMO-003', name:'会员生日特惠', type:'折扣', discount:'7折', scope:'会员', start:'2026-07-01', end:'2026-12-31', budget:5000, used:1250, status:'active' },
  { id:'PROMO-004', name:'充值满赠', type:'满赠', discount:'充200送50', scope:'全场', start:'2026-08-01', end:'2026-08-15', budget:15000, used:0, status:'scheduled' },
  { id:'PROMO-005', name:'国庆特惠', type:'折扣', discount:'7.5折', scope:'全场', start:'2026-10-01', end:'2026-10-07', budget:50000, used:0, status:'draft' },
  { id:'PROMO-006', name:'618狂欢', type:'满减', discount:'满200减50', scope:'全场', start:'2026-06-18', end:'2026-06-20', budget:20000, used:18600, status:'ended' },
  { id:'PROMO-007', name:'学生证优惠', type:'折扣', discount:'8.5折', scope:'学生', start:'2026-07-20', end:'2026-09-01', budget:8000, used:0, status:'draft' },
  { id:'PROMO-008', name:'夜场畅玩卡', type:'套餐', discount:'68元/3h', scope:'夜场', start:'2026-07-15', end:'2026-09-30', budget:12000, used:2800, status:'active' },
];

const SCFG: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '进行中' }, scheduled: { color: 'blue', label: '待开始' },
  ended: { color: 'default', label: '已结束' }, draft: { color: 'default', label: '草稿' },
};

const typeColors: Record<string, string> = { 折扣: '#10b981', 满减: '#f59e0b', 满赠: '#8b5cf6', 套餐: '#6366f1' };

export default function PromotionsPage() {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = filter === 'all' ? DATA : DATA.filter(p => p.status === filter);
  const totalBudget = DATA.reduce((s, p) => s + p.budget, 0);
  const totalUsed = DATA.reduce((s, p) => s + p.used, 0);

  const cols = [
    { title: '活动名称', dataIndex: 'name', render: (v: string, r: Promo) => (
      <><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{r.targetGoal || ''}</div></>
    )},
    { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color={typeColors[v]}>{v}</Tag> },
    { title: '优惠', dataIndex: 'discount' },
    { title: '范围', dataIndex: 'scope' },
    { title: '起止', key: 'period', render: (_: unknown, r: Promo) => <>{r.start}~{r.end}</> },
    { title: '预算', dataIndex: 'budget', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已消耗', dataIndex: 'used', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '消耗率', key: 'rate', render: (_: unknown, r: Promo) => (
      <Progress percent={r.budget > 0 ? Math.round(r.used / r.budget * 100) : 0} size="small" strokeColor={r.used / r.budget > 0.7 ? '#f59e0b' : '#34d399'} />
    )},
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '操作', key: 'a', width: 150, render: (_: unknown, r: Promo) => (
      <Space size="small">
        {r.status === 'draft' && <Button size="small" type="primary">发布</Button>}
        {r.status === 'active' && <Popconfirm title="确认结束?" onConfirm={() => message.success('已结束')}><Button size="small">结束</Button></Popconfirm>}
        <Button size="small">查看</Button>
      </Space>
    )},
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>🎉 促销管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>活动创建 · 监控 · 效果分析</span></div>
          <Button type="primary" onClick={() => setShowAdd(true)}>+ 新建促销</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="活动数" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="进行中" value={DATA.filter(p => p.status === 'active').length} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总预算" value={totalBudget.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已消耗" value={totalUsed.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="使用率" value={totalBudget > 0 ? Math.round(totalUsed / totalBudget * 100) : 0} suffix="%" valueStyle={{ color: totalUsed / totalBudget > 0.5 ? '#f59e0b' : '#34d399' }} /></Card></Col>
        </Row>

        <Card>
          <Space style={{ marginBottom: 12, gap: 8 }} wrap>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
            <Select value={filter} onChange={setFilter} style={{ width: 120 }}
              options={[{ value: 'all', label: '全部' }, { value: 'active', label: '进行中' }, { value: 'scheduled', label: '待开始' }, { value: 'ended', label: '已结束' }, { value: 'draft', label: '草稿' }]} />
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8 }} />
        </Card>

        <Modal title="新建促销" open={showAdd} onCancel={() => setShowAdd(false)}
          onOk={() => { message.success('促销活动已创建'); setShowAdd(false); }} width={500}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <Select placeholder="活动类型" style={{ width: '100%' }}
              options={[{ value: '折扣', label: '折扣' }, { value: '满减', label: '满减' }, { value: '满赠', label: '满赠' }, { value: '套餐', label: '套餐' }]} />
            <Input placeholder="优惠描述" />
            <Input placeholder="开始日期" type="date" />
            <Input placeholder="结束日期" type="date" />
            <Input placeholder="预算" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
