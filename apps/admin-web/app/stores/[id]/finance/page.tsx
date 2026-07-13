// 💰 财务管理 · 营收/支出/对账/结算 · 完整看板+明细+报表
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Tabs, Input, Select, Modal, message, Progress, Empty } from '@m5/ui';

const TRANSACTIONS = [
  { id: 'T001', date: '2026-07-12', type: '营收', category: '游戏收入', amount: 12800, method: '微信', status: 'settled' },
  { id: 'T002', date: '2026-07-12', type: '营收', category: '饮品销售', amount: 3200, method: '支付宝', status: 'settled' },
  { id: 'T003', date: '2026-07-11', type: '支出', category: '电费', amount: -4500, method: '对公', status: 'settled' },
  { id: 'T004', date: '2026-07-11', type: '营收', category: '会员充值', amount: 8900, method: '微信', status: 'pending' },
  { id: 'T005', date: '2026-07-10', type: '支出', category: '设备维护', amount: -2800, method: '现金', status: 'settled' },
  { id: 'T006', date: '2026-07-10', type: '营收', category: '门票收入', amount: 5600, method: '微信', status: 'settled' },
  { id: 'T007', date: '2026-07-09', type: '营收', category: '游戏收入', amount: 10200, method: '支付宝', status: 'settled' },
  { id: 'T008', date: '2026-07-09', type: '支出', category: '采购', amount: -3200, method: '转账', status: 'settled' },
  { id: 'T009', date: '2026-07-08', type: '营收', category: '饮品销售', amount: 2800, method: '现金', status: 'settled' },
  { id: 'T010', date: '2026-07-07', type: '营收', category: '会员充值', amount: 15000, method: '微信', status: 'pending' },
  { id: 'T011', date: '2026-07-07', type: '支出', category: '人力成本', amount: -28000, method: '对公', status: 'settled' },
  { id: 'T012', date: '2026-07-06', type: '营收', category: '游戏收入', amount: 14500, method: '微信', status: 'settled' },
];

const COLUMNS = [
  { title: '日期', dataIndex: 'date' },
  { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color={v === '营收' ? 'green' : 'red'}>{v}</Tag> },
  { title: '分类', dataIndex: 'category' },
  { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: v > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>¥{Math.abs(v).toLocaleString()}</span> },
  { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag>{v}</Tag> },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'settled' ? 'default' : 'blue'}>{v === 'settled' ? '已结算' : '待结算'}</Tag> },
];

export default function FinancePage() {
  const [tab, setTab] = useState('overview');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSettle, setShowSettle] = useState(false);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return TRANSACTIONS;
    return TRANSACTIONS.filter(d => d.type === typeFilter);
  }, [typeFilter]);

  const income = TRANSACTIONS.filter(d => d.type === '营收').reduce((s, d) => s + d.amount, 0);
  const expense = TRANSACTIONS.filter(d => d.type === '支出').reduce((s, d) => s + Math.abs(d.amount), 0);
  const netProfit = income - expense;
  const pendingSettle = TRANSACTIONS.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>💰 财务管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>营收 · 支出 · 对账 · 结算</span></div>
          <Space><Button onClick={() => setShowSettle(true)}>日结</Button><Button type="primary">月报</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}><Card size="small"><Statistic title="今日营收" value={12800} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="本月累计" value={income.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="支出" value={expense.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="净利" value={netProfit.toLocaleString()} prefix="¥" valueStyle={{ color: netProfit >= 0 ? '#34d399' : '#f87171' }} /></Card></Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}><Card size="small"><Statistic title="待结算" value={pendingSettle.toLocaleString()} prefix="¥" valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="营收笔数" value={TRANSACTIONS.filter(d => d.type === '营收').length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="支出笔数" value={TRANSACTIONS.filter(d => d.type === '支出').length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="毛利率" value={income > 0 ? ((income - expense) / income * 100).toFixed(1) : '0'} suffix="%" valueStyle={{ color: netProfit > 0 ? '#34d399' : '#f87171' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="overview" label="总览" />
            <Tabs.Tab key="detail" label="明细" />
            <Tabs.Tab key="reports" label="报表" />
          </Tabs>

          {tab === 'overview' && (
            <Space direction="vertical" style={{ width: '100%', gap: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="收入结构">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div><span style={{ color: '#94a3b8' }}>游戏收入:</span> <span style={{ float: 'right' }}>¥{(income * 0.45).toLocaleString()} (45%)</span></div>
                      <Progress percent={45} size="small" strokeColor="#6366f1" />
                      <div><span style={{ color: '#94a3b8' }}>会员充值:</span> <span style={{ float: 'right' }}>¥{(income * 0.35).toLocaleString()} (35%)</span></div>
                      <Progress percent={35} size="small" strokeColor="#8b5cf6" />
                      <div><span style={{ color: '#94a3b8' }}>饮品销售:</span> <span style={{ float: 'right' }}>¥{(income * 0.12).toLocaleString()} (12%)</span></div>
                      <Progress percent={12} size="small" strokeColor="#14b8a6" />
                      <div><span style={{ color: '#94a3b8' }}>门票:</span> <span style={{ float: 'right' }}>¥{(income * 0.08).toLocaleString()} (8%)</span></div>
                      <Progress percent={8} size="small" strokeColor="#06b6d4" />
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="支出结构">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div><span style={{ color: '#94a3b8' }}>人力成本:</span> <span style={{ float: 'right' }}>¥{(expense * 0.7).toLocaleString()} (70%)</span></div>
                      <Progress percent={70} size="small" strokeColor="#f59e0b" />
                      <div><span style={{ color: '#94a3b8' }}>水电:</span> <span style={{ float: 'right' }}>¥{(expense * 0.15).toLocaleString()} (15%)</span></div>
                      <Progress percent={15} size="small" strokeColor="#ec4899" />
                      <div><span style={{ color: '#94a3b8' }}>设备维护:</span> <span style={{ float: 'right' }}>¥{(expense * 0.1).toLocaleString()} (10%)</span></div>
                      <Progress percent={10} size="small" strokeColor="#f97316" />
                      <div><span style={{ color: '#94a3b8' }}>采购:</span> <span style={{ float: 'right' }}>¥{(expense * 0.05).toLocaleString()} (5%)</span></div>
                      <Progress percent={5} size="small" strokeColor="#a855f7" />
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          )}

          {tab === 'detail' && (
            <>
              <Space style={{ marginBottom: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>类型:</span>
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: '营收', label: '营收' }, { value: '支出', label: '支出' }]} />
              </Space>
              <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8 }} />
            </>
          )}

          {tab === 'reports' && (
            <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
              <Button style={{ width: 200 }}>导出月度报表</Button>
              <Button style={{ width: 200 }}>导出对账单</Button>
              <Button style={{ width: 200 }}>查看季度分析</Button>
              <Empty description="更多报表开发中…" />
            </Space>
          )}
        </Card>

        <Modal title="日结确认" open={showSettle} onCancel={() => setShowSettle(false)}
          onOk={() => { message.success('日结完成'); setShowSettle(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>今日营收: ¥12,800</div>
            <div>今日支出: ¥0</div>
            <div>待结算: ¥{pendingSettle.toLocaleString()}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>日结将生成当日财务报表并锁定结算</div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
