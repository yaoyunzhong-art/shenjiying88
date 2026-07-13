// 🔄 交接班 · 收银/设备/钥匙交接 · 完整交接班管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Modal, message, Input, Tabs, Empty, Select, Tooltip } from '@m5/ui';

interface Handover {
  id: string; from: string; to: string; cash: number; cash_diff: number;
  devices: string; keys: string; time: string; status: 'normal' | 'diff'; note: string;
}

const HANDOVERS: Handover[] = [
  { id:'H01', from:'张三(早班)', to:'王五(晚班)', cash:8360, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-12 14:00', status:'normal', note:'' },
  { id:'H02', from:'李四(中班)', to:'刘七(夜班)', cash:12580, cash_diff:-50, devices:'VR-2停机待修', keys:'A柜', time:'2026-07-11 22:00', status:'diff', note:'短款50元,已报主管' },
  { id:'H03', from:'王五(晚班)', to:'张三(早班)', cash:6320, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-10 06:00', status:'normal', note:'' },
  { id:'H04', from:'刘七(夜班)', to:'李四(中班)', cash:9810, cash_diff:30, devices:'台球桌灯需修', keys:'A柜', time:'2026-07-09 06:00', status:'diff', note:'长款30元' },
  { id:'H05', from:'张三(早班)', to:'王五(晚班)', cash:10500, cash_diff:0, devices:'全部正常', keys:'A柜+B柜', time:'2026-07-08 14:00', status:'normal', note:'' },
  { id:'H06', from:'赵六(早班)', to:'李四(中班)', cash:7200, cash_diff:0, devices:'全部正常', keys:'A柜', time:'2026-07-07 14:00', status:'normal', note:'' },
  { id:'H07', from:'王五(晚班)', to:'赵六(早班)', cash:8900, cash_diff:-20, devices:'兑币机缺零钱', keys:'A柜+B柜', time:'2026-07-07 06:00', status:'diff', note:'短款20元' },
  { id:'H08', from:'李四(中班)', to:'刘七(夜班)', cash:11000, cash_diff:0, devices:'全部正常', keys:'A柜', time:'2026-07-06 22:00', status:'normal', note:'' },
];

const getStatusForDiff = (diff: number): 'normal' | 'diff' => diff === 0 ? 'normal' : 'diff';

const COLUMNS = [
  { title:'交班人', dataIndex:'from', width:130 },
  { title:'接班人', dataIndex:'to', width:130 },
  { title:'现金', dataIndex:'cash', render:(v:number)=>`¥${v.toLocaleString()}` },
  {
    title:'差额', dataIndex:'cash_diff',
    render:(v:number) => (
      <Tooltip title={v === 0 ? '无差额' : v > 0 ? '长款' : '短款'}>
        <span style={{ color: v < 0 ? '#f87171' : v > 0 ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
          {v === 0 ? '-' : v > 0 ? `+${v}` : `-¥${Math.abs(v)}`}
        </span>
      </Tooltip>
    ),
  },
  { title:'设备状态', dataIndex:'devices', ellipsis:true },
  { title:'钥匙', dataIndex:'keys' },
  { title:'备注', dataIndex:'note', ellipsis:true },
  {
    title:'状态', dataIndex:'status',
    render:(v:string) => <Tag color={v === 'normal' ? 'green' : 'orange'}>{v === 'normal' ? '正常' : '差异'}</Tag>,
  },
  { title:'时间', dataIndex:'time', width:150 },
];

export default function ShiftHandoverPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStart, setShowStart] = useState(false);
  const [tab, setTab] = useState('list');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return HANDOVERS;
    return HANDOVERS.filter(h => h.status === statusFilter);
  }, [statusFilter]);

  const totalCash = HANDOVERS.reduce((s, h) => s + h.cash, 0);
  const diffCount = HANDOVERS.filter(h => h.status === 'diff').length;
  const totalCashDiff = HANDOVERS.reduce((s, h) => s + Math.abs(h.cash_diff), 0);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>🔄 交接班</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>收银 · 设备 · 钥匙 · 离职入职工位交接</span></div>
          <Button type="primary" onClick={() => setShowStart(true)}>+ 开始交接</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="交接记录" value={HANDOVERS.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="现金总额" value={totalCash.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="正常" value={HANDOVERS.length - diffCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="差异" value={diffCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="差异总额" value={totalCashDiff.toLocaleString()} prefix="¥" valueStyle={{ color: '#f87171' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="交接记录" />
            <Tabs.Tab key="my" label="我的交接" />
            <Tabs.Tab key="rules" label="交接规则" />
          </Tabs>

          {tab === 'list' && (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'normal', label: '正常' }, { value: 'diff', label: '差异' }]} />
              </Space>
              <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true }} />
            </>
          )}

          {tab === 'my' && (
            <Empty description="需登录查看个人交接记录" />
          )}

          {tab === 'rules' && (
            <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
              <Card size="small" title="交接规则">
                <div>1. 接班人员应在规定时间到岗</div>
                <div>2. 现金交接需双方当面清点</div>
                <div>3. 设备状态需逐项确认签字</div>
                <div>4. 钥匙交接需记录编号</div>
                <div>5. 差异需在备注栏记录并报主管</div>
              </Card>
            </Space>
          )}
        </Card>

        <Modal title="开始交接" open={showStart} onCancel={() => setShowStart(false)}
          onOk={() => { message.success('交接流程已启动'); setShowStart(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select placeholder="交班人" style={{ width: '100%' }}>
              <Select.Option value="zhangsan">张三(早班)</Select.Option>
              <Select.Option value="lisi">李四(中班)</Select.Option>
              <Select.Option value="wangwu">王五(晚班)</Select.Option>
            </Select>
            <Select placeholder="接班人" style={{ width: '100%' }}>
              <Select.Option value="zhangsan">张三(早班)</Select.Option>
              <Select.Option value="lisi">李四(中班)</Select.Option>
              <Select.Option value="wangwu">王五(晚班)</Select.Option>
            </Select>
            <Input placeholder="交接现金 ¥" type="number" />
            <Input placeholder="设备状态" />
            <Input placeholder="钥匙编号" />
            <Input placeholder="备注" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
