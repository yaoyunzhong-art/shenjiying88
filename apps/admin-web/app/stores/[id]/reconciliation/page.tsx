// 🧾 对账管理 · 支付对账/差异处理/报表生成
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tooltip, DatePicker, Tabs, Progress } from '@m5/ui';

interface Record {
  id: string; date: string; income: number; system: number; diff: number;
  method: string; status: 'match' | 'diff'; operator: string; note: string;
}

const DATA: Record[] = [
  { id:'REC-01', date:'2026-07-12', income:12800, system:12850, diff:-50, method:'微信', status:'diff', operator:'张三', note:'微信通道手续费差异' },
  { id:'REC-02', date:'2026-07-12', income:3200, system:3200, diff:0, method:'支付宝', status:'match', operator:'张三', note:'' },
  { id:'REC-03', date:'2026-07-12', income:1500, system:1500, diff:0, method:'现金', status:'match', operator:'李四', note:'' },
  { id:'REC-04', date:'2026-07-11', income:14200, system:14200, diff:0, method:'微信', status:'match', operator:'王五', note:'' },
  { id:'REC-05', date:'2026-07-11', income:4500, system:4520, diff:-20, method:'现金', status:'diff', operator:'张三', note:'疑似短款' },
  { id:'REC-06', date:'2026-07-10', income:9800, system:9800, diff:0, method:'微信', status:'match', operator:'赵六', note:'' },
  { id:'REC-07', date:'2026-07-10', income:6200, system:6150, diff:50, method:'支付宝', status:'diff', operator:'李四', note:'系统差异待核实' },
  { id:'REC-08', date:'2026-07-09', income:10500, system:10500, diff:0, method:'微信', status:'match', operator:'张三', note:'' },
  { id:'REC-09', date:'2026-07-08', income:7800, system:7800, diff:0, method:'现金', status:'match', operator:'王五', note:'' },
  { id:'REC-10', date:'2026-07-07', income:9500, system:9300, diff:200, method:'微信', status:'diff', operator:'赵六', note:'大额差异待查' },
  { id:'REC-11', date:'2026-07-06', income:11000, system:11000, diff:0, method:'微信', status:'match', operator:'张三', note:'' },
  { id:'REC-12', date:'2026-07-05', income:6800, system:6850, diff:-50, method:'现金', status:'diff', operator:'李四', note:'现金差异待核实' },
];

const formatDiff = (v: number) => {
  if (v === 0) return <span style={{ color: '#34d399', fontWeight: 600 }}>✓</span>;
  return <span style={{ color: '#f87171', fontWeight: 600 }}>{v > 0 ? `+${v}` : `${v}`}</span>;
};

export default function ReconciliationPage() {
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showPerf, setShowPerf] = useState(false);
  const [showDetail, setShowDetail] = useState<Record | null>(null);
  const [tab, setTab] = useState('list');

  const f = useMemo(() => {
    let r = DATA;
    if (filter !== 'all') r = r.filter(d => d.status === filter);
    if (methodFilter !== 'all') r = r.filter(d => d.method === methodFilter);
    return r;
  }, [filter, methodFilter]);

  const totalIncome = DATA.reduce((s, d) => s + d.income, 0);
  const totalSystem = DATA.reduce((s, d) => s + d.system, 0);
  const td = DATA.reduce((s, d) => s + Math.abs(d.diff), 0);
  const dc = DATA.filter(d => d.status === 'diff').length;
  const matchRate = DATA.length > 0 ? ((DATA.length - dc) / DATA.length * 100).toFixed(1) : '100';

  const cols = [
    { title: '日期', dataIndex: 'date', width: 100 },
    { title: '实收', dataIndex: 'income', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '系统', dataIndex: 'system', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '差额', dataIndex: 'diff', render: (v: number, r: Record) => (
      <Tooltip title={r.note || (v === 0 ? '无差异' : '差异详情')}>
        {formatDiff(v)}
      </Tooltip>
    ) },
    { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作人', dataIndex: 'operator' },
    { title: '状态', dataIndex: 'status', render: (v: string) => (
      <Tag color={v === 'match' ? 'green' : 'orange'}>{v === 'match' ? '一致' : '差异'}</Tag>
    ) },
    { title: '操作', key: 'a', width: 100, render: (_: unknown, r: Record) => (
      <Space size="small">
        {r.status === 'diff' && <Button size="small" type="primary" onClick={() => setShowDetail(r)}>处理差异</Button>}
        <Button size="small" onClick={() => setShowDetail(r)}>查看</Button>
      </Space>
    ) },
  ];

  const summaryCols = [
    { title: '支付方式', dataIndex: 'method', render: (v: string) => <Tag>{v}</Tag> },
    { title: '笔数', dataIndex: 'count' },
    { title: '实收总计', dataIndex: 'totalIncome', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '系统总计', dataIndex: 'totalSystem', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '差异总额', dataIndex: 'diffTotal', render: (v: number) => <span style={{ color: v !== 0 ? '#f87171' : '#34d399' }}>¥{v.toLocaleString()}</span> },
  ];

  const methodSummary = useMemo(() => {
    const map = new Map<string, { method: string; count: number; totalIncome: number; totalSystem: number; diffTotal: number }>();
    DATA.forEach(d => {
      if (!map.has(d.method)) map.set(d.method, { method: d.method, count: 0, totalIncome: 0, totalSystem: 0, diffTotal: 0 });
      const g = map.get(d.method)!;
      g.count++; g.totalIncome += d.income; g.totalSystem += d.system; g.diffTotal += d.diff;
    });
    return Array.from(map.values());
  }, []);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#fafafa', margin: 0 }}>🧾 对账管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>支付对账 · 差异处理 · 日报生成</span></div>
          <Button type="primary" onClick={() => setShowPerf(true)}>+ 执行对账</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="对账单数" value={DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="一致" value={DATA.length - dc} valueStyle={{ color: '#34d399' }} suffix={`/ ${DATA.length} (${matchRate}%)`} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="差异" value={dc} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="差异总额" value={td.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="净差异率" value={td > 0 ? (td / totalIncome * 100).toFixed(2) : '0.00'} suffix="%" valueStyle={{ color: td > 0.01 * totalIncome ? '#f87171' : '#34d399' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="明细列表" />
            <Tabs.Tab key="summary" label="汇总统计" />
            <Tabs.Tab key="tools" label="工具" />
          </Tabs>

          {tab === 'list' && (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={filter} onChange={setFilter} style={{ width: 110 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'match', label: '一致' }, { value: 'diff', label: '差异' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>支付方式:</span>
                <Select value={methodFilter} onChange={setMethodFilter} style={{ width: 110 }}
                  options={[{ value: 'all', label: '全部' }, { value: '微信', label: '微信' }, { value: '支付宝', label: '支付宝' }, { value: '现金', label: '现金' }]} />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>实收总计: ¥{totalIncome.toLocaleString()} / 系统总计: ¥{totalSystem.toLocaleString()}</span>
              </Space>
              <Table dataSource={f} columns={cols} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} />
            </>
          )}

          {tab === 'summary' && (
            <Table dataSource={methodSummary} columns={summaryCols} rowKey="method" pagination={false} />
          )}

          {tab === 'tools' && (
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <Card size="small">
                <Space><Button type="primary" onClick={() => setShowPerf(true)}>执行自动对账</Button><Button>导出差异报告</Button><Button>历史对账</Button></Space>
              </Card>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                  <div style={{ fontWeight: 500 }}>对账规则配置</div>
                  <Row gutter={16}>
                    <Col span={6}><Input placeholder="差异阈值(¥)" defaultValue="10" size="small" /></Col>
                    <Col span={6}><Input placeholder="自动确认天数" defaultValue="7" size="small" /></Col>
                    <Col span={6}><Button size="small">保存配置</Button></Col>
                  </Row>
                </Space>
              </Card>
            </Space>
          )}
        </Card>

        <Modal title="执行对账" open={showPerf} onCancel={() => setShowPerf(false)}
          onOk={() => { message.success('对账完成，发现 ' + dc + ' 条差异记录'); setShowPerf(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8' }}>将拉取昨日订单数据与银行流水逐一对账，预计耗时 2-5 分钟</div>
            <Select placeholder="选择支付通道" style={{ width: '100%' }}>
              <Select.Option value="all">全部通道</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
              <Select.Option value="alipay">支付宝</Select.Option>
            </Select>
          </Space>
        </Modal>

        <Modal title="差异详情" open={!!showDetail} onCancel={() => setShowDetail(null)} footer={null}>
          {showDetail && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><span style={{ color: '#94a3b8' }}>单号:</span> {showDetail.id}</div>
              <div><span style={{ color: '#94a3b8' }}>日期:</span> {showDetail.date}</div>
              <div><span style={{ color: '#94a3b8' }}>实收:</span> ¥{showDetail.income.toLocaleString()}</div>
              <div><span style={{ color: '#94a3b8' }}>系统记录:</span> ¥{showDetail.system.toLocaleString()}</div>
              <div><span style={{ color: '#94a3b8' }}>差额:</span> <span style={{ color: showDetail.diff !== 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>{showDetail.diff}</span></div>
              <div><span style={{ color: '#94a3b8' }}>备注:</span> {showDetail.note || '无'}</div>
              <Input.TextArea placeholder="处理说明…" rows={3} />
              <Space><Button type="primary">标记已处理</Button><Button>提交审核</Button></Space>
            </Space>
          )}
        </Modal>
      </Space>
    </PageShell>
  );
}
