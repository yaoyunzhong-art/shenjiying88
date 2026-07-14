// 🧾 财务对账 · 交易清单/对账状态/对账操作
// P-38 财务对账: admin-web增强 — 平台级对账管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Select, Modal, Input, Tooltip, DatePicker, Tabs, Progress, TextArea } from '@m5/ui';

interface TransactionRecord {
  id: string;
  date: string;
  orderId: string;
  storeId: string;
  storeName: string;
  income: number;
  system: number;
  diff: number;
  method: string;
  status: 'match' | 'diff';
  operator: string;
  note: string;
}

const DATA: TransactionRecord[] = [
  { id:'TRX-001', date:'2026-07-14', orderId:'ORD-240714-001', storeId:'S001', storeName:'总店', income:25600, system:25600, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-002', date:'2026-07-14', orderId:'ORD-240714-002', storeId:'S002', storeName:'天河分店', income:8200, system:8250, diff:-50, method:'支付宝', status:'diff', operator:'系统', note:'支付宝手续费差异' },
  { id:'TRX-003', date:'2026-07-14', orderId:'ORD-240714-003', storeId:'S003', storeName:'海珠分店', income:3500, system:3500, diff:0, method:'现金', status:'match', operator:'系统', note:'' },
  { id:'TRX-004', date:'2026-07-13', orderId:'ORD-240713-004', storeId:'S001', storeName:'总店', income:18400, system:18400, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-005', date:'2026-07-13', orderId:'ORD-240713-005', storeId:'S002', storeName:'天河分店', income:5200, system:5180, diff:20, method:'现金', status:'diff', operator:'系统', note:'现金短款+20' },
  { id:'TRX-006', date:'2026-07-13', orderId:'ORD-240713-006', storeId:'S003', storeName:'海珠分店', income:12800, system:12800, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-007', date:'2026-07-12', orderId:'ORD-240712-007', storeId:'S001', storeName:'总店', income:32000, system:31950, diff:50, method:'微信', status:'diff', operator:'系统', note:'微信通道结算延迟' },
  { id:'TRX-008', date:'2026-07-12', orderId:'ORD-240712-008', storeId:'S002', storeName:'天河分店', income:7600, system:7600, diff:0, method:'支付宝', status:'match', operator:'系统', note:'' },
  { id:'TRX-009', date:'2026-07-12', orderId:'ORD-240712-009', storeId:'S004', storeName:'番禺分店', income:4500, system:4500, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-010', date:'2026-07-11', orderId:'ORD-240711-010', storeId:'S001', storeName:'总店', income:22100, system:22100, diff:0, method:'支付宝', status:'match', operator:'系统', note:'' },
  { id:'TRX-011', date:'2026-07-11', orderId:'ORD-240711-011', storeId:'S003', storeName:'海珠分店', income:6800, system:6700, diff:100, method:'微信', status:'diff', operator:'系统', note:'大额差异待查' },
  { id:'TRX-012', date:'2026-07-11', orderId:'ORD-240711-012', storeId:'S004', storeName:'番禺分店', income:3900, system:3900, diff:0, method:'现金', status:'match', operator:'系统', note:'' },
  { id:'TRX-013', date:'2026-07-10', orderId:'ORD-240710-013', storeId:'S001', storeName:'总店', income:15700, system:15700, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-014', date:'2026-07-10', orderId:'ORD-240710-014', storeId:'S002', storeName:'天河分店', income:9400, system:9400, diff:0, method:'支付宝', status:'match', operator:'系统', note:'' },
  { id:'TRX-015', date:'2026-07-09', orderId:'ORD-240709-015', storeId:'S001', storeName:'总店', income:19800, system:19750, diff:50, method:'微信', status:'diff', operator:'系统', note:'微信通道手续费扣减' },
  { id:'TRX-016', date:'2026-07-09', orderId:'ORD-240709-016', storeId:'S003', storeName:'海珠分店', income:5500, system:5500, diff:0, method:'现金', status:'match', operator:'系统', note:'' },
  { id:'TRX-017', date:'2026-07-08', orderId:'ORD-240708-017', storeId:'S002', storeName:'天河分店', income:11200, system:11200, diff:0, method:'微信', status:'match', operator:'系统', note:'' },
  { id:'TRX-018', date:'2026-07-08', orderId:'ORD-240708-018', storeId:'S004', storeName:'番禺分店', income:6100, system:6080, diff:20, method:'支付宝', status:'diff', operator:'系统', note:'支付宝手续费差异' },
];

const formatDiff = (v: number) => {
  if (v === 0) return <span style={{ color: '#34d399', fontWeight: 600 }}>✓</span>;
  return <span style={{ color: '#ff6b6b', fontWeight: 600 }}>{v > 0 ? `+${v}` : `${v}`}</span>;
};

function StatCard({ label, value, color }: { label: string; value: string | number; color?: React.CSSProperties['color'] }) {
  return (
    <Card style={{ padding: '8px 12px' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || '#fafafa' }}>{value}</div>
    </Card>
  );
}

export default function FinanceReconciliationPage() {
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [showPerf, setShowPerf] = useState(false);
  const [showDetail, setShowDetail] = useState<TransactionRecord | null>(null);
  const [tab, setTab] = useState('list');

  // 按日期范围过滤
  const filteredByDate = useMemo(() => {
    if (dateRange === 'all') return DATA;
    const now = new Date('2026-07-15');
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - (dateRange === '7d' ? 7 : 30));
    return DATA.filter(d => new Date(d.date) >= cutoff);
  }, [dateRange]);

  const f = useMemo(() => {
    let r = filteredByDate;
    if (filter !== 'all') r = r.filter(d => d.status === filter);
    if (methodFilter !== 'all') r = r.filter(d => d.method === methodFilter);
    if (storeFilter !== 'all') r = r.filter(d => d.storeId === storeFilter);
    return r;
  }, [filter, methodFilter, storeFilter, filteredByDate]);

  const totalIncome = filteredByDate.reduce((s, d) => s + d.income, 0);
  const totalSystem = filteredByDate.reduce((s, d) => s + d.system, 0);
  const td = filteredByDate.reduce((s, d) => s + Math.abs(d.diff), 0);
  const dc = filteredByDate.filter(d => d.status === 'diff').length;
  const matchRate = filteredByDate.length > 0
    ? ((filteredByDate.length - dc) / filteredByDate.length * 100).toFixed(1)
    : '100';

  // 去重获取门店列表
  const storeOptions = useMemo(() => {
    const map = new Map<string, string>();
    DATA.forEach(d => map.set(d.storeId, d.storeName));
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, []);

  const cols = [
    { title: '日期', dataIndex: 'date', width: 90 },
    { title: '订单号', dataIndex: 'orderId', width: 140, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '门店', dataIndex: 'storeName', width: 90 },
    { title: '实收', dataIndex: 'income', render: (v: number) => <span style={{ fontWeight: 600 }}>¥{v.toLocaleString()}</span> },
    { title: '系统', dataIndex: 'system', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '差额', dataIndex: 'diff', width: 80, render: (v: number, r: TransactionRecord) => (
      <Tooltip content={r.note || (v === 0 ? '无差异' : '差异详情')}>
        {formatDiff(v)}
      </Tooltip>
    ) },
    { title: '支付方式', dataIndex: 'method', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '门店编号', dataIndex: 'storeId', width: 70, render: (v: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 70, render: (v: string) => (
      <Tag variant={v === 'match' ? 'success' : 'warning'}>{v === 'match' ? '一致' : '差异'}</Tag>
    ) },
    { title: '操作', key: 'a', width: 100, render: (_: unknown, r: TransactionRecord) => (
      <Space size="small">
        {r.status === 'diff' && <Button size="sm" variant="primary" onClick={() => setShowDetail(r)}>处理</Button>}
        <Button size="sm" onClick={() => setShowDetail(r)}>详情</Button>
      </Space>
    ) },
  ];

  // 汇总列 (按门店)
  const storeSummaryCols = [
    { title: '门店', dataIndex: 'storeName', render: (v: string) => <strong>{v}</strong> },
    { title: '笔数', dataIndex: 'count' },
    { title: '一致', dataIndex: 'matchCount', render: (v: number) => <span style={{ color: '#34d399' }}>{v}</span> },
    { title: '差异', dataIndex: 'diffCount', render: (v: number) => <span style={{ color: v > 0 ? '#f87171' : '#94a3b8' }}>{v}</span> },
    { title: '实收总计', dataIndex: 'totalIncome', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '系统总计', dataIndex: 'totalSystem', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '差异总额', dataIndex: 'diffTotal', render: (v: number) => (
      <span style={{ color: v !== 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>¥{v.toLocaleString()}</span>
    ) },
  ];

  const storeSummary = useMemo(() => {
    const map = new Map<string, {
      storeName: string; count: number; matchCount: number; diffCount: number;
      totalIncome: number; totalSystem: number; diffTotal: number;
    }>();
    filteredByDate.forEach(d => {
      if (!map.has(d.storeId)) {
        map.set(d.storeId, { storeName: d.storeName, count: 0, matchCount: 0, diffCount: 0, totalIncome: 0, totalSystem: 0, diffTotal: 0 });
      }
      const g = map.get(d.storeId)!;
      g.count++;
      if (d.status === 'match') g.matchCount++;
      else g.diffCount++;
      g.totalIncome += d.income;
      g.totalSystem += d.system;
      g.diffTotal += d.diff;
    });
    return Array.from(map.values());
  }, [filteredByDate]);

  // 汇总列 (按支付方式)
  const methodSummaryCols = [
    { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag>{v}</Tag> },
    { title: '笔数', dataIndex: 'count' },
    { title: '实收总计', dataIndex: 'totalIncome', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '系统总计', dataIndex: 'totalSystem', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '差异总额', dataIndex: 'diffTotal', render: (v: number) => (
      <span style={{ color: v !== 0 ? '#f87171' : '#34d399' }}>¥{v.toLocaleString()}</span>
    ) },
  ];

  const methodSummary = useMemo(() => {
    const map = new Map<string, { method: string; count: number; totalIncome: number; totalSystem: number; diffTotal: number }>();
    filteredByDate.forEach(d => {
      if (!map.has(d.method)) map.set(d.method, { method: d.method, count: 0, totalIncome: 0, totalSystem: 0, diffTotal: 0 });
      const g = map.get(d.method)!;
      g.count++; g.totalIncome += d.income; g.totalSystem += d.system; g.diffTotal += d.diff;
    });
    return Array.from(map.values());
  }, [filteredByDate]);

  return (
    <PageShell title="财务对账">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fafafa', margin: 0 }}>📊 财务对账</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>交易清单 · 对账状态 · 差异处理 · 报表生成</span>
          </div>
          <Space size="small">
            <Select value={dateRange} onChange={setDateRange} style={{ width: 110 }}
              options={[{ value: '7d', label: '近7天' }, { value: '30d', label: '近30天' }, { value: 'all', label: '全部' }]} />
            <Button variant="primary" onClick={() => setShowPerf(true)}>+ 执行对账</Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <Card><Statistic title="交易笔数" value={filteredByDate.length} /></Card>
          <Card><Statistic title="一致" value={filteredByDate.length - dc} valueStyle={{ color: '#34d399' }} suffix={`/ ${filteredByDate.length} (${matchRate}%)`} /></Card>
          <Card><Statistic title="差异" value={dc} valueStyle={{ color: '#f87171' }} /></Card>
          <Card><Statistic title="差异总额" value={td.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card>
          <Card><Statistic title="净差异率" value={td > 0 ? (td / totalIncome * 100).toFixed(2) : '0.00'} suffix="%" valueStyle={{ color: td > 0.01 * totalIncome ? '#f87171' : '#34d399' }} /></Card>
        </div>

        <Card>
          <Tabs activeKey={tab} onChange={setTab} style={{ marginBottom: 12 }}
            items={[
              { key: 'list', label: '交易明细' },
              { key: 'store-summary', label: '按门店汇总' },
              { key: 'method-summary', label: '按支付方式汇总' },
              { key: 'tools', label: '对账工具' },
            ]} />

          {tab === 'list' && (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={filter} onChange={setFilter} style={{ width: 110 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'match', label: '一致' }, { value: 'diff', label: '差异' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>支付方式:</span>
                <Select value={methodFilter} onChange={setMethodFilter} style={{ width: 110 }}
                  options={[{ value: 'all', label: '全部' }, { value: '微信', label: '微信' }, { value: '支付宝', label: '支付宝' }, { value: '现金', label: '现金' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>门店:</span>
                <Select value={storeFilter} onChange={setStoreFilter} style={{ width: 130 }}
                  options={[{ value: 'all', label: '全部门店' }, ...storeOptions]} />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                  实收: ¥{totalIncome.toLocaleString()} / 系统: ¥{totalSystem.toLocaleString()} / 差额: ¥{td.toLocaleString()}
                </span>
              </Space>
              <Table dataSource={f} columns={cols} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} />
            </>
          )}

          {tab === 'store-summary' && (
            <Table dataSource={storeSummary} columns={storeSummaryCols} rowKey="storeName" pagination={false} />
          )}

          {tab === 'method-summary' && (
            <Table dataSource={methodSummary} columns={methodSummaryCols} rowKey="method" pagination={false} />
          )}

          {tab === 'tools' && (
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <Card style={{ padding: '8px 12px' }}>
                <Space wrap>
                  <Button variant="primary" onClick={() => setShowPerf(true)}>执行自动对账</Button>
                  <Button>导出差异报告</Button>
                  <Button>导出全额明细</Button>
                  <Button>历史对账记录</Button>
                </Space>
              </Card>
              <Card style={{ padding: '8px 12px' }}>
                <div style={{ marginBottom: 8, fontWeight: 500, color: '#94a3b8', fontSize: 13 }}>对账规则配置</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Input placeholder="差异阈值(¥)" defaultValue="10" addonBefore="阈值" style={{ flex: 1 }} />
                  <Input placeholder="自动确认天数" defaultValue="7" addonBefore="自动确认" style={{ flex: 1 }} />
                  <Select defaultValue="all" style={{ flex: 1 }}
                    options={[{ value: 'all', label: '所有通道' }, { value: 'wechat', label: '仅微信' }, { value: 'alipay', label: '仅支付宝' }]} />
                  <Button>保存配置</Button>
                </div>
              </Card>
              <Card style={{ padding: '8px 12px' }}>
                <div style={{ marginBottom: 8, fontWeight: 500, color: '#94a3b8', fontSize: 13 }}>批量操作</div>
                <Space wrap>
                  <Button>批量标记已处理</Button>
                  <Button>批量导出</Button>
                  <Button>生成对账报表</Button>
                </Space>
              </Card>
            </Space>
          )}
        </Card>

        {/* 执行对账 Modal */}
        <Modal title="执行自动对账" open={showPerf} onClose={() => setShowPerf(false)}
          onOk={() => { setShowPerf(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8' }}>将拉取所选时段订单数据与银行流水逐一对账。</div>
            <Select placeholder="选择支付通道" style={{ width: '100%' }}>
              <Select.Option value="all">全部通道</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
              <Select.Option value="alipay">支付宝</Select.Option>
            </Select>
            <Select placeholder="选择门店" style={{ width: '100%' }}>
              <Select.Option value="all">全部门店</Select.Option>
              {storeOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Space>
        </Modal>

        {/* 差异详情 Modal */}
        <Modal title="交易差异详情" open={!!showDetail} onClose={() => setShowDetail(null)} footer={null}>
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                <div><span style={{ color: '#94a3b8' }}>交易单号:</span> {showDetail.id}</div>
                <div><span style={{ color: '#94a3b8' }}>订单号:</span> {showDetail.orderId}</div>
                <div><span style={{ color: '#94a3b8' }}>日期:</span> {showDetail.date}</div>
                <div><span style={{ color: '#94a3b8' }}>门店:</span> {showDetail.storeName} ({showDetail.storeId})</div>
                <div><span style={{ color: '#94a3b8' }}>实收:</span> <span style={{ fontWeight: 600 }}>¥{showDetail.income.toLocaleString()}</span></div>
                <div><span style={{ color: '#94a3b8' }}>系统记录:</span> ¥{showDetail.system.toLocaleString()}</div>
                <div><span style={{ color: '#94a3b8' }}>差额:</span> <span style={{ color: showDetail.diff !== 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>{showDetail.diff > 0 ? `+${showDetail.diff}` : showDetail.diff}</span></div>
                <div><span style={{ color: '#94a3b8' }}>支付方式:</span> <Tag>{showDetail.method}</Tag></div>
              </div>
              <div><span style={{ color: '#94a3b8' }}>备注:</span> {showDetail.note || '无'}</div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>处理说明</label>
                <TextArea placeholder="输入处理说明…" rows={3} />
              </div>
              <Space style={{ marginTop: 8 }}>
                <Button variant="primary">标记已处理</Button>
                <Button>提交审核</Button>
                <Button>标记无需处理</Button>
              </Space>
            </Space>
          )}
        </Modal>
      </Space>
    </PageShell>
  );
}
