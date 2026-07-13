// 📝 订单管理 · 订单查询/审核/退款处理 (44→80)
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Input, Select, Statistic, Row, Col, Modal, message } from '@m5/ui';
interface Order { id: string; customer: string; items: string; amount: number; method: string; status: string; time: string; note?: string; }
const DATA: Order[] = [
  { id:'ORD-001',customer:'张明',items:'游戏套餐x1',amount:168,method:'微信',status:'completed',time:'2026-07-12 14:30' },
  { id:'ORD-002',customer:'李芳',items:'游戏币x50',amount:85,method:'支付宝',status:'completed',time:'2026-07-12 13:15' },
  { id:'ORD-003',customer:'王强',items:'充值200',amount:200,method:'微信',status:'completed',time:'2026-07-12 12:00' },
  { id:'ORD-004',customer:'赵丽',items:'生日派对套餐',amount:1280,method:'刷卡',status:'pending',time:'2026-07-12 10:00',note:'待确认' },
  { id:'ORD-005',customer:'刘伟',items:'VR体验30min',amount:88,method:'支付宝',status:'completed',time:'2026-07-11 20:30' },
  { id:'ORD-006',customer:'陈静',items:'饮品x3',amount:45,method:'现金',status:'refunded',time:'2026-07-11 19:00',note:'已退款-重复收费' },
  { id:'ORD-007',customer:'杨磊',items:'台球2h',amount:60,method:'微信',status:'completed',time:'2026-07-11 18:00' },
  { id:'ORD-008',customer:'黄敏',items:'会员充值500',amount:500,method:'支付宝',status:'completed',time:'2026-07-11 16:30' },
  { id:'ORD-009',customer:'周杰',items:'游戏币x100+饮品',amount:185,method:'微信',status:'cancelled',time:'2026-07-11 15:00',note:'用户取消' },
];
const SCFG: Record<string, { color: string; label: string }> = { completed: { color: 'green', label: '已完成' }, pending: { color: 'blue', label: '待处理' }, refunded: { color: 'orange', label: '已退款' }, cancelled: { color: 'default', label: '已取消' } };
export default function OrdersPage() {
  const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('all'); const [showRefund, setShowRefund] = useState<Order | null>(null);
  const filtered = DATA.filter(o => (statusFilter === 'all' || o.status === statusFilter) && (!search || o.customer.includes(search) || o.id.includes(search)));
  const totalRevenue = DATA.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0);
  const cols = [
    { title: '单号', dataIndex: 'id' }, { title: '客户', dataIndex: 'customer' }, { title: '商品', dataIndex: 'items' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` }, { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '时间', dataIndex: 'time', width: 150 },
    { title: '操作', key: 'a', render: (_: unknown, r: Order) => <Space size="small">{r.status === 'pending' && <Button size="small">确认</Button>}{r.status === 'completed' && <Button size="small" onClick={() => setShowRefund(r)}>退款</Button>}<Button size="small">详情</Button></Space> },
  ];
  return (<PageShell><Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
    <h2 style={{ color: '#fafafa', margin: 0 }}>📝 订单管理</h2>
    <Row gutter={16}><Col span={4}><Card size="small"><Statistic title="今日订单" value={8} /></Card></Col><Col span={4}><Card size="small"><Statistic title="已完成" value={DATA.filter(o => o.status === 'completed').length} valueStyle={{ color: '#34d399' }} /></Card></Col><Col span={4}><Card size="small"><Statistic title="退款" value={DATA.filter(o => o.status === 'refunded').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col><Col span={4}><Card size="small"><Statistic title="营收" value={totalRevenue} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col></Row>
    <Card><Space style={{ width: '100%', marginBottom: 12, flexWrap: 'wrap' }}><Input.Search placeholder="搜索单号/客户" style={{ width: 240 }} onChange={e => setSearch(e.target.value)} />
      <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={[{ value: 'all', label: '全部' }, { value: 'completed', label: '已完成' }, { value: 'pending', label: '待处理' }, { value: 'refunded', label: '已退款' }, { value: 'cancelled', label: '已取消' }]} />
    </Space><Table dataSource={filtered} columns={cols} rowKey="id" pagination={false} /></Card>
    <Modal title="确认退款" open={!!showRefund} onCancel={() => setShowRefund(null)} onOk={() => { message.success('退款处理完成'); setShowRefund(null); }}>
      {showRefund && <Space direction="vertical" style={{ width: '100%' }}><div>订单: {showRefund.id}</div><div>金额: ¥{showRefund.amount.toLocaleString()}</div><Input placeholder="退款原因" /></Space>}
    </Modal>
  </Space></PageShell>);
}
