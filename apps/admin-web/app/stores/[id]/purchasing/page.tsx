// 🛒 采购管理 · 采购订单/供应商/入库 (48→80)
'use client'; import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message, Progress } from '@m5/ui';
interface Purchase { id: string; supplier: string; items: string; total: number; status: 'pending' | 'ordered' | 'partial' | 'received'; created: string; expected: string; receiver?: string; }
const DATA: Purchase[] = [
  { id:'PO-001',supplier:'农夫山泉',items:'纯净水×200箱',total:2400,status:'received',created:'2026-07-10',expected:'2026-07-12',receiver:'张三'},
  { id:'PO-002',supplier:'义乌礼品',items:'加油棒×500个',total:1250,status:'ordered',created:'2026-07-11',expected:'2026-07-14'},
  { id:'PO-003',supplier:'任天堂',items:'NS游戏卡带×10张',total:2800,status:'pending',created:'2026-07-12',expected:'2026-07-18'},
  { id:'PO-004',supplier:'清洁之家',items:'VR清洁套装×20套',total:700,status:'partial',created:'2026-07-09',expected:'2026-07-13',receiver:'李四'},
  { id:'PO-005',supplier:'宇治抹茶',items:'抹茶粉×5kg',total:600,status:'ordered',created:'2026-07-12',expected:'2026-07-15'},
  { id:'PO-006',supplier:'世嘉',items:'游戏币×10000枚',total:5000,status:'received',created:'2026-07-08',expected:'2026-07-10',receiver:'王五'},
  { id:'PO-007',supplier:'得力文具',items:'打印纸×50卷',total:400,status:'pending',created:'2026-07-13',expected:'2026-07-16'},
  { id:'PO-008',supplier:'本地供应商',items:'水果×15份',total:450,status:'ordered',created:'2026-07-12',expected:'2026-07-13'},
];
const SCFG: Record<string, { color: string; label: string }> = { pending: { color: 'default', label: '待下单' }, ordered: { color: 'blue', label: '已下单' }, partial: { color: 'orange', label: '部分到货' }, received: { color: 'green', label: '已到货' } };
export default function PurchasingPage() {
  const [filter, setFilter] = useState('all'); const [showAdd, setShowAdd] = useState(false);
  const filtered = filter === 'all' ? DATA : DATA.filter(d => d.status === filter);
  const cols = [
    { title: '单号', dataIndex: 'id' }, { title: '供应商', dataIndex: 'supplier' }, { title: '物品', dataIndex: 'items' },
    { title: '金额', dataIndex: 'total', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '下单', dataIndex: 'created' }, { title: '预期到货', dataIndex: 'expected' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '签收人', dataIndex: 'receiver', render: (v?: string) => v || '-' },
    { title: '操作', key: 'a', width: 140, render: (_: unknown, r: Purchase) => <Space size="small">{r.status !== 'received' && <Button size="small" type="primary">收货</Button>}<Button size="small">催单</Button></Space> },
  ];
  return (<PageShell><Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ color: '#f8fafc', margin: 0 }}>🛒 采购管理</h2><Button type="primary" onClick={() => setShowAdd(true)}>新建采购单</Button></div>
    <Row gutter={16}><Col span={4}><Card size="small"><Statistic title="总采购单" value={DATA.length} /></Card></Col><Col span={4}><Card size="small"><Statistic title="待收货" value={DATA.filter(d => d.status !== 'received').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col><Col span={4}><Card size="small"><Statistic title="已到货" value={DATA.filter(d => d.status === 'received').length} valueStyle={{ color: '#34d399' }} /></Card></Col><Col span={4}><Card size="small"><Statistic title="采购总额" value={DATA.reduce((s, d) => s + d.total, 0).toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col></Row>
    <Card><Space style={{ marginBottom: 12 }}><Select value={filter} onChange={setFilter} style={{ width: 120 }} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待下单' }, { value: 'ordered', label: '已下单' }, { value: 'partial', label: '部分到货' }, { value: 'received', label: '已到货' }]} /></Space><Table dataSource={filtered} columns={cols} rowKey="id" pagination={false} /></Card>
    <Modal title="新建采购单" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('采购单已创建'); setShowAdd(false); }}><Space direction="vertical" style={{ width: '100%' }}><Input placeholder="供应商" /><Input placeholder="物品描述" /><Input placeholder="金额" type="number" /><Input placeholder="预期到货日" type="date" /></Space></Modal>
  </Space></PageShell>);
}
