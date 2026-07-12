// 💰 财务管理 · 营收/支出/对账/结算
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space } from '@m5/ui';

const TRANSACTIONS = [
  { id: 'T001', date: '2026-07-12', type: '营收', category: '游戏收入', amount: 12800, method: '微信', status: 'settled' },
  { id: 'T002', date: '2026-07-12', type: '营收', category: '饮品销售', amount: 3200, method: '支付宝', status: 'settled' },
  { id: 'T003', date: '2026-07-11', type: '支出', category: '电费', amount: -4500, method: '对公', status: 'settled' },
  { id: 'T004', date: '2026-07-11', type: '营收', category: '会员充值', amount: 8900, method: '微信', status: 'pending' },
  { id: 'T005', date: '2026-07-10', type: '支出', category: '设备维护', amount: -2800, method: '现金', status: 'settled' },
];

const COLUMNS = [
  { title: '日期', dataIndex: 'date' },
  { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color={v === '营收' ? 'green' : 'red'}>{v}</Tag> },
  { title: '分类', dataIndex: 'category' },
  { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: v > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>¥{Math.abs(v).toLocaleString()}</span> },
  { title: '支付方式', dataIndex: 'method' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'settled' ? 'default' : 'blue'}>{v === 'settled' ? '已结算' : '待结算'}</Tag> },
];

export default function FinancePage() {
  const [data] = useState(TRANSACTIONS);
  const income = data.filter(d => d.type === '营收').reduce((s, d) => s + d.amount, 0);
  const expense = data.filter(d => d.type === '支出').reduce((s, d) => s + Math.abs(d.amount), 0);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>💰 财务管理</h2>
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="今日营收" value={12800} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="本月累计" value={186500} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="支出" value={7300} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="净利" value={income - expense} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>
        <Card><Table dataSource={data} columns={COLUMNS} rowKey="id" pagination={false} /></Card>
        <Card><Space><Button type="primary">日结</Button><Button>月报</Button><Button>导出对账单</Button></Space></Card>
      </Space>
    </PageShell>
  );
}