// 📝 订单管理 · 订单查询/审核/退款处理
'use client';
import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Row, Col, Statistic, Input } from '@m5/ui';

const ORDERS = [
  { id: 'ORD-001', customer: '张明', items: '游戏套餐×1', amount: 168, method: '微信', status: 'completed', time: '2026-07-12 14:30' },
  { id: 'ORD-002', customer: '李芳', items: '游戏币×50', amount: 85, method: '支付宝', status: 'completed', time: '2026-07-12 13:15' },
  { id: 'ORD-003', customer: '王强', items: '充值¥200', amount: 200, method: '微信', status: 'completed', time: '2026-07-12 12:00' },
  { id: 'ORD-004', customer: '赵丽', items: '生日派对套餐', amount: 1280, method: '刷卡', status: 'pending', time: '2026-07-12 10:00' },
  { id: 'ORD-005', customer: '刘伟', items: '退款-游戏套餐', amount: -168, method: '原路', status: 'refunded', time: '2026-07-11 16:45' },
];

const STATUS_COLORS: Record<string, string> = { completed: 'green', pending: 'blue', refunded: 'red', cancelled: 'orange' };
const STATUS_NAMES: Record<string, string> = { completed: '已完成', pending: '待处理', refunded: '已退款', cancelled: '已取消' };

const COLUMNS = [
  { title: '订单号', dataIndex: 'id' }, { title: '顾客', dataIndex: 'customer' }, { title: '商品', dataIndex: 'items' },
  { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: v > 0 ? '#f8fafc' : '#f87171', fontWeight: 600 }}>¥{v}</span> },
  { title: '支付', dataIndex: 'method' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_NAMES[v]}</Tag> },
  { title: '时间', dataIndex: 'time' },
];

export default function OrdersPage() {
  const [data] = useState(ORDERS);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>📝 订单管理</h2>
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="今日订单" value={128} /></Card></Col>
          <Col span={6}><Card><Statistic title="待处理" value={3} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="已完成" value={122} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="退款" value={2} valueStyle={{ color: '#f87171' }} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ marginBottom: 16 }}><Input.Search placeholder="订单号/顾客" style={{ width: 300 }} /></Space>
          <Table dataSource={data} columns={COLUMNS} rowKey="id" pagination={false} />
        </Card>
        <Card><Space><Button type="primary">退款审核</Button><Button>导出Excel</Button></Space></Card>
      </Space>
    </PageShell>
  );
}