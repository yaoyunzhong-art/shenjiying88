// 📦 库存管理 · 商品/物料出入库管理
'use client';
import { useState } from 'react';
import { PageShell, Button, Card, Tag, Table, Space, Statistic, Row, Col } from '@m5/ui';

const ITEMS = [
  { id: 'I001', name: '游戏币(枚)', category: '消耗品', stock: 50000, threshold: 10000, unit: '枚', status: 'normal' },
  { id: 'I002', name: '饮品-可乐', category: '食品', stock: 240, threshold: 50, unit: '瓶', status: 'normal' },
  { id: 'I003', name: '饮品-雪碧', category: '食品', stock: 180, threshold: 50, unit: '瓶', status: 'normal' },
  { id: 'I004', name: '零食-薯片', category: '食品', stock: 30, threshold: 40, unit: '包', status: 'low' },
  { id: 'I005', name: '礼品-玩偶', category: '礼品', stock: 15, threshold: 20, unit: '个', status: 'low' },
  { id: 'I006', name: '打印纸(卷)', category: '耗材', stock: 8, threshold: 10, unit: '卷', status: 'low' },
];

const COLUMNS = [
  { title: '编号', dataIndex: 'id' },
  { title: '名称', dataIndex: 'name' },
  { title: '分类', dataIndex: 'category' },
  { title: '库存', dataIndex: 'stock', render: (v: number, r: any) => <span style={{ color: r.stock < r.threshold ? '#f87171' : '#34d399', fontWeight: 600 }}>{v}{r.unit}</span> },
  { title: '预警线', dataIndex: 'threshold' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'normal' ? 'green' : 'orange'}>{v === 'normal' ? '正常' : '需补货'}</Tag> },
];

export default function InventoryPage() {
  const [items] = useState(ITEMS);
  const lowStock = items.filter(i => i.stock <= i.threshold).length;
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>📦 库存管理</h2>
        <Row gutter={16}>
          <Col span={8}><Card><Statistic title="库存种类" value={items.length} /></Card></Col>
          <Col span={8}><Card><Statistic title="需补货" value={lowStock} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={8}><Card><Statistic title="总库存量" value={items.reduce((s, i) => s + i.stock, 0)} /></Card></Col>
        </Row>
        <Card><Table dataSource={items} columns={COLUMNS} rowKey="id" pagination={false} /></Card>
        <Card>
          <Space><Button type="primary">入库</Button><Button>出库</Button><Button>盘点</Button><Button>采购申请</Button></Space>
        </Card>
      </Space>
    </PageShell>
  );
}