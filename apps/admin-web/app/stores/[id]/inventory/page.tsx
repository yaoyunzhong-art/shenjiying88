// 📦 库存管理 · 物资/消耗品/安全库存管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Progress, Empty, Divider, Tabs, Timeline } from '@m5/ui';

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
  { id: 'STK-011', name: '饮品杯(大)', category: '饮品', unit: '个', stock: 500, minStock: 100, maxStock: 2000, cost: 0.8, totalValue: 400, supplier: '餐具批发', lastRestock: '2026-07-08' },
  { id: 'STK-012', name: '免洗洗手液', category: '耗材', unit: '瓶', stock: 8, minStock: 10, maxStock: 50, cost: 18, totalValue: 144, supplier: '清洁之家', lastRestock: '2026-06-25' },
];

const CATEGORIES = [...new Set(ITEMS.map(i => i.category))];
const RESTOCK_LOG = [
  { id:'R-01', item:'游戏币', qty:5000, date:'2026-07-12', supplier:'世嘉', cost:2500 },
  { id:'R-02', item:'打印纸(热敏)', qty:50, date:'2026-07-12', supplier:'得力文具', cost:400 },
  { id:'R-03', item:'加油棒', qty:200, date:'2026-07-11', supplier:'义乌礼品', cost:500 },
  { id:'R-04', item:'纯净水', qty:500, date:'2026-07-10', supplier:'农夫山泉', cost:600 },
  { id:'R-05', item:'礼品包装袋', qty:100, date:'2026-07-09', supplier:'义乌礼品', cost:150 },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Item | null>(null);
  const [showRestock, setShowRestock] = useState(false);
  const [tabKey, setTabKey] = useState('list');

  const lowStock = ITEMS.filter(i => i.stock < i.minStock);
  const totalVal = ITEMS.reduce((s, i) => s + i.totalValue, 0);
  const safeCount = ITEMS.filter(i => i.stock >= i.minStock).length;

  const filtered = useMemo(() => {
    let list = ITEMS;
    if (search) list = list.filter(i => i.name.includes(search) || i.category.includes(search) || i.supplier.includes(search));
    if (catFilter !== 'all') list = list.filter(i => i.category === catFilter);
    return list;
  }, [search, catFilter]);

  const getLevel = (stock: number, min: number, max: number) => {
    if (stock < min) return { pct: Math.round((stock / min) * 100), color: '#f87171', label: '不足' };
    const pct = Math.round((stock / max) * 100);
    return { pct: Math.min(pct, 100), color: pct > 85 ? '#60a5fa' : '#34d399', label: pct > 85 ? '充足' : '正常' };
  };

  const catSummary = useMemo(() => CATEGORIES.map(cat => ({
    name: cat,
    count: ITEMS.filter(i => i.category === cat).length,
    value: ITEMS.filter(i => i.category === cat).reduce((s, i) => s + i.totalValue, 0),
    low: ITEMS.filter(i => i.category === cat && i.stock < i.minStock).length,
  })), []);

  const columns = [
    { title: '名称', dataIndex: 'name', width: 140 },
    { title: '分类', dataIndex: 'category', width: 80, render: (v: string) => <Tag size="small">{v}</Tag> },
    { title: '库存', dataIndex: 'stock', width: 80, render: (v: number, r: Item) => (
      <span style={{ color: v < r.minStock ? '#f87171' : '#e2e8f0', fontWeight: v < r.minStock ? 700 : 400 }}>{v}{r.unit}</span>
    )},
    { title: '安全库存', dataIndex: 'minStock', width: 70, render: (v: number, r: Item) => `${v}${r.unit}` },
    { title: '库存水位', key: 'level', width: 130, render: (_: unknown, r: Item) => {
      const { pct, color, label } = getLevel(r.stock, r.minStock, r.maxStock);
      return <Space size={4}><Progress percent={pct} size="small" style={{width:80}} strokeColor={color} /><Tag color={label === '不足' ? 'red' : 'green'} size="small">{label}</Tag></Space>;
    }},
    { title: '单价', dataIndex: 'cost', width: 60, render: (v: number) => `¥${v}` },
    { title: '总价值', dataIndex: 'totalValue', width: 80, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '供应商', dataIndex: 'supplier', width: 90 },
    { title: '上次补货', dataIndex: 'lastRestock', width: 90 },
    { title: '操作', key: 'actions', width: 140, render: (_: unknown, r: Item) => <Space size="small">
      <Button size="small" onClick={() => setShowDetail(r)}>详情</Button>
      <Button size="small" type={r.stock < r.minStock ? 'primary' : 'default'} danger={r.stock < r.minStock}>
        {r.stock < r.minStock ? '紧急采购' : '补货'}
      </Button>
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>📦 库存管理</h2>
          <Space>
            <Button onClick={() => setShowRestock(true)}>入库记录</Button>
            <Button>盘点</Button>
            <Button type="primary" onClick={() => setShowAdd(true)}>+ 添加物资</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={3}><Card size="small"><Statistic title="物资种类" value={ITEMS.length} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="低于安全库存" value={lowStock.length} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="库存充足" value={safeCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="库存总价值" value={totalVal.toLocaleString()} prefix="¥" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="平均库存水位" value={lowStock.length > 0 ? '⚠️' : '✓'} valueStyle={{ color: lowStock.length > 0 ? '#f87171' : '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="供应商数" value={[...new Set(ITEMS.map(i => i.supplier))].length} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="本月补货" value={RESTOCK_LOG.length} suffix="次" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="库存品类" value={CATEGORIES.length} /></Card></Col>
        </Row>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key:'list', label:'物资列表',
            children: <Card>
              <Space style={{ width: '100%', marginBottom: 12, display:'flex', flexWrap:'wrap' }}>
                <Input.Search placeholder="搜索名称/分类/供应商" style={{ width: 260 }} value={search} onChange={e => setSearch(e.target.value)} />
                <Select value={catFilter} onChange={setCatFilter} style={{ width: 120 }}
                  options={[{value:'all', label:'全部分类'}, ...CATEGORIES.map(c => ({value:c, label:c}))]} />
                <Button size="small" style={{marginLeft:'auto'}}>导出清单</Button>
              </Space>
              {filtered.length === 0 ? <Empty description="无匹配物资" /> :
                <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{pageSize: 8}} />
              }
            </Card>
          },
          { key:'category', label:'分类概览',
            children: <Row gutter={[16, 16]}>
              {catSummary.map(cat => (
                <Col key={cat.name} span={8}>
                  <Card title={cat.name} size="small" extra={<Tag color={cat.low > 0 ? 'red' : 'green'}>{cat.low > 0 ? `${cat.low}项不足` : '正常'}</Tag>}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                      <span style={{color:'#94a3b8'}}>种类</span>
                      <span style={{color:'#e2e8f0'}}>{cat.count}项</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{color:'#94a3b8'}}>总价值</span>
                      <span style={{color:'#e2e8f0'}}>¥{cat.value.toLocaleString()}</span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          },
        ]} />

        <Modal title={`物资详情 - ${showDetail?.name || ''}`} open={!!showDetail} onCancel={() => setShowDetail(null)} footer={<Button onClick={() => setShowDetail(null)}>关闭</Button>}>
          {showDetail && <Space direction="vertical" style={{width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><div style={{color:'#94a3b8',fontSize:12}}>名称</div><div style={{color:'#e2e8f0'}}>{showDetail.name}</div></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>分类</div><Tag>{showDetail.category}</Tag></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>库存</div><span style={{color: showDetail.stock < showDetail.minStock ? '#f87171' : '#e2e8f0',fontWeight: showDetail.stock < showDetail.minStock ? 700 : 400}}>{showDetail.stock}{showDetail.unit}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>安全库存</div><span style={{color:'#e2e8f0'}}>{showDetail.minStock}{showDetail.unit}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>单价</div><span style={{color:'#e2e8f0'}}>¥{showDetail.cost}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>总价值</div><span style={{color:'#e2e8f0'}}>¥{showDetail.totalValue.toLocaleString()}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>供应商</div><span style={{color:'#e2e8f0'}}>{showDetail.supplier}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>上次补货</div><span style={{color:'#e2e8f0'}}>{showDetail.lastRestock}</span></div>
            </div>
          </Space>}
        </Modal>

        <Modal title="添加入库记录" open={showRestock} onCancel={() => setShowRestock(false)} onOk={() => {message.success('入库记录已添加'); setShowRestock(false);}} width={500}>
          <Space direction="vertical" style={{width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input placeholder="物资名称" /><Input placeholder="入库数量" type="number" />
              <Input placeholder="入库单价" type="number" /><Input placeholder="供应商" />
              <Input placeholder="批次号" style={{gridColumn:'1 / -1'}} />
              <Input.TextArea rows={3} placeholder="备注" style={{gridColumn:'1 / -1'}} />
            </div>
          </Space>
        </Modal>

        <Modal title="添加物资" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => { message.success('物资已添加'); setShowAdd(false); }} okText="添加" width={480}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Input placeholder="物资名称" /><Input placeholder="分类" />
              <Input placeholder="单位" /><Input placeholder="初始库存" type="number" />
              <Input placeholder="安全库存" type="number" /><Input placeholder="最大库存" type="number" />
              <Input placeholder="成本价" type="number" /><Input placeholder="供应商" />
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
