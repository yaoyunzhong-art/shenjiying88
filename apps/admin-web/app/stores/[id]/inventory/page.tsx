// \u{1F4E6} 库存管理 · 物资/消耗品/安全库存管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Progress } from '@m5/ui';

interface Item {
  id: string; name: string; category: string; unit: string;
  stock: number; minStock: number; maxStock: number; cost: number;
  totalValue: number; supplier: string; lastRestock: string;
}

const ITEMS: Item[] = [
  { id: 'STK-001', name: '游戏币', category: '消耗品', unit: '枚', stock: 5000, minStock: 1000, maxStock: 20000, cost: 0.5, totalValue: 2500, supplier: '世嘉', lastRestock: '2026-07-12' },
  { id: 'STK-002', name: '加油棒', category: '礼品', unit: '个', stock: 320, minStock: 100, maxStock: 1000, cost: 2.5, totalValue: 800, supplier: '义乌礼品', lastRestock: '2026-07-11' },
  { id: 'STK-003', name: '纯净水', category: '饮品', unit: '瓶', stock: 85, minStock: 200, maxStock: 2000, cost: 1.2, totalValue: 102, supplier: '农夫山泉', lastRestock: '2026-07-10' },
  { id: 'STK-004', name: '抹茶粉', category: '饮品原料', unit: 'kg', stock: 2.5, minStock: 5, maxStock: 50, cost: 120, totalValue: 300, supplier: '宇治抹茶', lastRestock: '2026-07-08' },
  { id: 'STK-005', name: 'VR清洁套装', category: '耗材', unit: '套', stock: 15, minStock: 5, maxStock: 50, cost: 35, totalValue: 525, supplier: '清洁之家', lastRestock: '2026-07-05' },
  { id: 'STK-006', name: '打印纸(热敏)', category: '办公', unit: '卷', stock: 48, minStock: 20, maxStock: 200, cost: 8, totalValue: 384, supplier: '得力文具', lastRestock: '2026-07-12' },
  { id: 'STK-007', name: '游戏卡带(NS)', category: '游戏', unit: '张', stock: 23, minStock: 10, maxStock: 100, cost: 280, totalValue: 6440, supplier: '任天堂', lastRestock: '2026-06-20' },
  { id: 'STK-008', name: '抹布', category: '耗材', unit: '条', stock: 60, minStock: 20, maxStock: 200, cost: 3, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-10' },
  { id: 'STK-009', name: '一次性手套', category: '耗材', unit: '盒', stock: 12, minStock: 10, maxStock: 100, cost: 15, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-01' },
  { id: 'STK-010', name: '礼品包装袋', category: '礼品', unit: '个', stock: 200, minStock: 50, maxStock: 500, cost: 1.5, totalValue: 300, supplier: '义乌礼品', lastRestock: '2026-07-09' },
];

const lowStock = ITEMS.filter(i => i.stock < i.minStock).length;
const totalVal = ITEMS.reduce((s, i) => s + i.totalValue, 0);

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const filtered = search ? ITEMS.filter(i => i.name.includes(search) || i.category.includes(search)) : ITEMS;

  const columns = [
    { title: '名称', dataIndex: 'name', width: 140 },
    { title: '分类', dataIndex: 'category', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '库存', dataIndex: 'stock', width: 80, render: (v: number, r: Item) => <span style={{ color: v < r.minStock ? '#f87171' : '#e2e8f0', fontWeight: v < r.minStock ? 700 : 400 }}>{v}{r.unit}</span> },
    { title: '安全库存', dataIndex: 'minStock', width: 80, render: (v: number, r: Item) => `${v}${r.unit}` },
    { title: '库存水位', key: 'level', width: 120, render: (_: unknown, r: Item) => <Progress percent={Math.min(100, r.stock / r.maxStock * 100)} size="small" strokeColor={r.stock < r.minStock ? '#f87171' : '#34d399'} /> },
    { title: '单价', dataIndex: 'cost', width: 60, render: (v: number) => `¥${v}` },
    { title: '总价值', dataIndex: 'totalValue', width: 80, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '供应商', dataIndex: 'supplier', width: 100 },
    { title: '上次补货', dataIndex: 'lastRestock', width: 100 },
    { title: '操作', key: 'actions', width: 140, render: (_: unknown, r: Item) => <Space size="small"><Button size="small">补货</Button><Button size="small" disabled={r.stock >= r.minStock} danger={r.stock < r.minStock}>紧急采购</Button></Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>📦 库存管理</h2>
          <Button type="primary" onClick={() => setShowAdd(true)}>添加物资</Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="物资种类" value={ITEMS.length} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="低于安全库存" value={lowStock} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="库存充足" value={ITEMS.length - lowStock} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="库存总价值" value={totalVal} prefix="¥" /></Card></Col>
        </Row>
        <Card>
          <Space style={{ width: '100%', marginBottom: 12 }}>
            <Input.Search placeholder="搜索物资名称/分类" style={{ width: 280 }} value={search} onChange={e => setSearch(e.target.value)} />
            <Button style={{ marginLeft: 'auto' }}>入库</Button><Button>出库</Button><Button>盘点</Button>
          </Space>
          <Table dataSource={filtered} columns={columns} rowKey="id" pagination={false} />
        </Card>
        <Modal title="添加物资" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('物资已添加'); setShowAdd(false); }} okText="添加">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="物资名称" /><Input placeholder="分类" /><Input placeholder="单位" /><Input placeholder="库存数量" type="number" /><Input placeholder="安全库存" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
