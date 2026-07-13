// 📝 订单管理 · 订单查询/审核/退款处理 · 看板+筛选+退款功能
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Input, Select, Statistic, Row, Col, Modal, message, Tooltip, Tabs, Empty, Popconfirm, Badge } from '@m5/ui';

interface Order {
  id: string; customer: string; items: string; amount: number;
  method: string; status: 'completed' | 'pending' | 'refunded' | 'cancelled';
  time: string; note?: string; contact?: string;
}

const DATA: Order[] = [
  { id: 'ORD-001', customer: '张明', items: '游戏套餐x1', amount: 168, method: '微信', status: 'completed', time: '2026-07-12 14:30', contact: '138****1234' },
  { id: 'ORD-002', customer: '李芳', items: '游戏币x50', amount: 85, method: '支付宝', status: 'completed', time: '2026-07-12 13:15' },
  { id: 'ORD-003', customer: '王强', items: '充值200', amount: 200, method: '微信', status: 'completed', time: '2026-07-12 12:00' },
  { id: 'ORD-004', customer: '赵丽', items: '生日派对套餐', amount: 1280, method: '刷卡', status: 'pending', time: '2026-07-12 10:00', note: '待确认库存', contact: '139****5678' },
  { id: 'ORD-005', customer: '刘伟', items: 'VR体验30min', amount: 88, method: '支付宝', status: 'completed', time: '2026-07-11 20:30' },
  { id: 'ORD-006', customer: '陈静', items: '饮品x3', amount: 45, method: '现金', status: 'refunded', time: '2026-07-11 19:00', note: '已退款-重复收费' },
  { id: 'ORD-007', customer: '杨磊', items: '台球2h', amount: 60, method: '微信', status: 'completed', time: '2026-07-11 18:00' },
  { id: 'ORD-008', customer: '黄敏', items: '会员充值500', amount: 500, method: '支付宝', status: 'completed', time: '2026-07-11 16:30' },
  { id: 'ORD-009', customer: '周杰', items: '游戏币x100+饮品', amount: 185, method: '微信', status: 'cancelled', time: '2026-07-11 15:00', note: '用户取消' },
  { id: 'ORD-010', customer: '吴芳', items: '会员充值1000', amount: 1000, method: '微信', status: 'completed', time: '2026-07-11 14:00' },
  { id: 'ORD-011', customer: '郑鑫', items: '游戏币x200', amount: 340, method: '支付宝', status: 'pending', time: '2026-07-11 12:30', note: '待支付确认' },
  { id: 'ORD-012', customer: '孙丽', items: '生日派对套餐B', amount: 880, method: '微信', status: 'refunded', time: '2026-07-10 18:00', note: '退款-场地冲突' },
];

const SCFG: Record<string, { color: string; label: string }> = {
  completed: { color: 'green', label: '已完成' },
  pending: { color: 'blue', label: '待处理' },
  refunded: { color: 'orange', label: '已退款' },
  cancelled: { color: 'default', label: '已取消' },
};

const methodTag: Record<string, string> = { '微信': 'green', '支付宝': 'blue', '现金': 'orange', '刷卡': 'purple' };

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showRefund, setShowRefund] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [tab, setTab] = useState('list');

  const filtered = useMemo(() => {
    let r = DATA;
    if (statusFilter !== 'all') r = r.filter(o => o.status === statusFilter);
    if (methodFilter !== 'all') r = r.filter(o => o.method === methodFilter);
    if (search) r = r.filter(o => o.customer.includes(search) || o.id.includes(search) || (o.contact && o.contact.includes(search)));
    return r;
  }, [search, statusFilter, methodFilter]);

  const totalRevenue = DATA.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0);
  const pendingRevenue = DATA.filter(o => o.status === 'pending').reduce((s, o) => s + o.amount, 0);
  const refundedTotal = DATA.filter(o => o.status === 'refunded').reduce((s, o) => s + o.amount, 0);

  const cols = [
    { title: '单号', dataIndex: 'id', width: 90 },
    { title: '客户', dataIndex: 'customer', render: (v: string, r: Order) => (
      <Tooltip title={r.contact || ''}><span>{v}</span></Tooltip>
    ) },
    { title: '商品', dataIndex: 'items' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag color={methodTag[v]}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '时间', dataIndex: 'time', width: 150 },
    {
      title: '操作', key: 'a', width: 180,
      render: (_: unknown, r: Order) => (
        <Space size="small">
          {r.status === 'pending' && <Button size="small" type="primary" onClick={() => setShowDetail(r)}>确认</Button>}
          {r.status === 'completed' && <Button size="small" onClick={() => setShowRefund(r)}>退款</Button>}
          <Button size="small" onClick={() => setShowDetail(r)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#fafafa', margin: 0 }}>📝 订单管理</h2>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总订单" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已完成" value={DATA.filter(o => o.status === 'completed').length} valueStyle={{ color: '#34d399' }} suffix={`/ ${DATA.length}`} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="待处理" value={DATA.filter(o => o.status === 'pending').length} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="营收" value={totalRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="退款总计" value={refundedTotal.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        </Row>

        <Card>
          <Space style={{ width: '100%', marginBottom: 12, flexWrap: 'wrap', gap: 8 }} wrap>
            <Input.Search placeholder="搜索单号/客户/手机" style={{ width: 260 }} onChange={e => setSearch(e.target.value)} allowClear />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
              options={[{ value: 'all', label: '全部状态' }, { value: 'completed', label: '已完成' }, { value: 'pending', label: '待处理' }, { value: 'refunded', label: '已退款' }, { value: 'cancelled', label: '已取消' }]} />
            <Select value={methodFilter} onChange={setMethodFilter} style={{ width: 120 }}
              options={[{ value: 'all', label: '全部方式' }, { value: '微信', label: '微信' }, { value: '支付宝', label: '支付宝' }, { value: '现金', label: '现金' }, { value: '刷卡', label: '刷卡' }]} />
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['8', '16', '24'] }} />
        </Card>

        <Modal title="确认退款" open={!!showRefund} onCancel={() => setShowRefund(null)}
          onOk={() => { message.success('退款处理完成'); setShowRefund(null); }}>
          {showRefund && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><span style={{ color: '#94a3b8' }}>订单:</span> {showRefund.id}</div>
              <div><span style={{ color: '#94a3b8' }}>客户:</span> {showRefund.customer}</div>
              <div><span style={{ color: '#94a3b8' }}>金额:</span> ¥{showRefund.amount.toLocaleString()}</div>
              <div><span style={{ color: '#94a3b8' }}>商品:</span> {showRefund.items}</div>
              <Input placeholder="退款原因 *" />
              <Select placeholder="退款方式" style={{ width: '100%' }}>
                <Select.Option value="original">原路退回</Select.Option>
                <Select.Option value="cash">现金退款</Select.Option>
                <Select.Option value="transfer">转账退款</Select.Option>
              </Select>
            </Space>
          )}
        </Modal>

        <Modal title="订单详情" open={!!showDetail} onCancel={() => setShowDetail(null)} footer={null}>
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><span style={{ color: '#94a3b8' }}>单号:</span> {showDetail.id}</div>
              <div><span style={{ color: '#94a3b8' }}>客户:</span> {showDetail.customer} {showDetail.contact && `(${showDetail.contact})`}</div>
              <div><span style={{ color: '#94a3b8' }}>商品:</span> {showDetail.items}</div>
              <div><span style={{ color: '#94a3b8' }}>金额:</span> ¥{showDetail.amount.toLocaleString()}</div>
              <div><span style={{ color: '#94a3b8' }}>支付方式:</span> {showDetail.method}</div>
              <div><span style={{ color: '#94a3b8' }}>时间:</span> {showDetail.time}</div>
              <div><span style={{ color: '#94a3b8' }}>备注:</span> {showDetail.note || '无'}</div>
              {showDetail.status === 'pending' && (
                <Space><Button type="primary" onClick={() => { message.success('订单已确认'); setShowDetail(null); }}>确认订单</Button></Space>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </PageShell>
  );
}
