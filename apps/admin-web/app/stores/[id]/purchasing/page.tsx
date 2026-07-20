// 🛒 采购管理 · 采购订单/供应商/入库 · 完整采购流程
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Input, Modal, message, Progress, Tabs, Empty, Tooltip, Popconfirm } from '@m5/ui';

interface Purchase {
  id: string; supplier: string; items: string; total: number;
  status: 'pending' | 'ordered' | 'partial' | 'received';
  created: string; expected: string; receiver?: string; category?: string;
}

const DATA: Purchase[] = [
  { id:'PO-001', supplier:'农夫山泉', items:'纯净水×200箱', total:2400, status:'received', created:'2026-07-10', expected:'2026-07-12', receiver:'张三', category:'饮品' },
  { id:'PO-002', supplier:'义乌礼品', items:'加油棒×500个', total:1250, status:'ordered', created:'2026-07-11', expected:'2026-07-14', category:'礼品' },
  { id:'PO-003', supplier:'任天堂', items:'NS游戏卡带×10张', total:2800, status:'pending', created:'2026-07-12', expected:'2026-07-18', category:'游戏' },
  { id:'PO-004', supplier:'清洁之家', items:'VR清洁套装×20套', total:700, status:'partial', created:'2026-07-09', expected:'2026-07-13', receiver:'李四', category:'耗材' },
  { id:'PO-005', supplier:'宇治抹茶', items:'抹茶粉×5kg', total:600, status:'ordered', created:'2026-07-12', expected:'2026-07-15', category:'饮品' },
  { id:'PO-006', supplier:'世嘉', items:'游戏币×10000枚', total:5000, status:'received', created:'2026-07-08', expected:'2026-07-10', receiver:'王五', category:'游戏' },
  { id:'PO-007', supplier:'得力文具', items:'打印纸×50卷', total:400, status:'pending', created:'2026-07-13', expected:'2026-07-16', category:'耗材' },
  { id:'PO-008', supplier:'本地供应商', items:'水果×15份', total:450, status:'ordered', created:'2026-07-12', expected:'2026-07-13', category:'饮品' },
  { id:'PO-009', supplier:'联想', items:'显示器×2台', total:3600, status:'pending', created:'2026-07-12', expected:'2026-07-17', category:'设备' },
  { id:'PO-010', supplier:'叮咚买菜', items:'零食×50份', total:1500, status:'received', created:'2026-07-11', expected:'2026-07-11', receiver:'赵六', category:'饮品' },
];

const SCFG: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待下单' },
  ordered: { color: 'blue', label: '已下单' },
  partial: { color: 'orange', label: '部分到货' },
  received: { color: 'green', label: '已到货' },
};

const cols = [
  { title: '单号', dataIndex: 'id', width: 90 },
  { title: '供应商', dataIndex: 'supplier' },
  { title: '物品', dataIndex: 'items' },
  { title: '分类', dataIndex: 'category', render: (v: string) => <Tag>{v}</Tag> },
  { title: '金额', dataIndex: 'total', render: (v: number) => `¥${v.toLocaleString()}` },
  { title: '下单', dataIndex: 'created' },
  { title: '预期', dataIndex: 'expected' },
  {
    title: '状态', dataIndex: 'status',
    render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag>,
  },
  { title: '签收人', dataIndex: 'receiver', render: (v?: string) => v || '-' },
  {
    title: '操作', key: 'a', width: 160,
    render: (_: unknown, r: Purchase) => (
      <Space size="small">
        {r.status === 'pending' && <Button size="small" type="primary">下单</Button>}
        {(r.status === 'ordered' || r.status === 'partial') && <Button size="small" type="primary">收货</Button>}
        <Button size="small">催单</Button>
        {r.status === 'pending' && <Popconfirm title="确认取消？" onConfirm={() => message.success('已取消')}><Button size="small" danger>取消</Button></Popconfirm>}
      </Space>
    ),
  },
];

export default function PurchasingPage() {
  // 三态条件渲染
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)
  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!DATA || DATA.length === 0) return <div>暂无数据</div>;

  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState('list');

  const filtered = useMemo(() => {
    let r = DATA;
    if (filter !== 'all') r = r.filter(d => d.status === filter);
    if (categoryFilter !== 'all') r = r.filter(d => d.category === categoryFilter);
    return r;
  }, [filter, categoryFilter]);

  const totalPending = DATA.filter(d => d.status !== 'received').reduce((s, d) => s + d.total, 0);
  const pendingOrderCount = DATA.filter(d => d.status !== 'received').length;

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>🛒 采购管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>采购订单 · 供应商管理 · 入库确认</span></div>
          <Button type="primary" onClick={() => setShowAdd(true)}>+ 新建采购单</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总采购单" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="待收货" value={pendingOrderCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已到货" value={DATA.filter(d => d.status === 'received').length} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="采购总额" value={DATA.reduce((s, d) => s + d.total, 0).toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="待付款" value={totalPending.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="列表" />
            <Tabs.Tab key="suppliers" label="供应商" />
          </Tabs>

          {tab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={filter} onChange={setFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待下单' }, { value: 'ordered', label: '已下单' }, { value: 'partial', label: '部分到货' }, { value: 'received', label: '已到货' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>分类:</span>
                <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 110 }}
                  options={[{ value: 'all', label: '全部' }, { value: '饮品', label: '饮品' }, { value: '礼品', label: '礼品' }, { value: '游戏', label: '游戏' }, { value: '耗材', label: '耗材' }, { value: '设备', label: '设备' }]} />
              </Space>
              <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true }} />
            </>
          ) : (
            <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
              <Card size="small" title="常用供应商">
                <div>· 农夫山泉 (合作6次, 好评率100%)</div>
                <div>· 义乌礼品 (合作12次, 好评率92%)</div>
                <div>· 世嘉 (合作24次, 好评率100%)</div>
                <div>· 得力文具 (合作3次, 好评率100%)</div>
              </Card>
            </Space>
          )}
        </Card>

        <Modal title="新建采购单" open={showAdd} onCancel={() => setShowAdd(false)}
          onOk={() => { message.success('采购单已创建'); setShowAdd(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="供应商" />
            <Input placeholder="物品描述" />
            <Select placeholder="分类" style={{ width: '100%' }}>
              <Select.Option value="饮品">饮品</Select.Option>
              <Select.Option value="礼品">礼品</Select.Option>
              <Select.Option value="游戏">游戏</Select.Option>
              <Select.Option value="耗材">耗材</Select.Option>
              <Select.Option value="设备">设备</Select.Option>
            </Select>
            <Input placeholder="金额" type="number" />
            <Input placeholder="预期到货日" type="date" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
