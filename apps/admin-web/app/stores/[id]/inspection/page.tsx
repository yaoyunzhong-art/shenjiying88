// 📋 巡检管理 · 设备/安全/卫生巡检记录 · 完整巡检体系
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tabs, Empty, Tooltip, Badge, Progress } from '@m5/ui';

interface Inspection {
  id: string; type: '设备' | '安全' | '卫生'; item: string;
  result: 'pass' | 'fail' | 'warn'; inspector: string; time: string; note: string;
  score?: number; area?: string;
}

const INSPECT_DATA: Inspection[] = [
  { id: 'IN-001', type: '设备', item: 'VR-01 头盔', result: 'pass', inspector: '王工', time: '2026-07-13 14:00', note: '镜片清洁, 线缆完好', score: 95, area: 'VR区' },
  { id: 'IN-002', type: '设备', item: '赛车-03 方向盘', result: 'pass', inspector: '王工', time: '2026-07-13 14:15', note: '螺丝紧固, 响应正常', score: 92, area: '主机区' },
  { id: 'IN-003', type: '设备', item: '台球桌-02', result: 'fail', inspector: '李工', time: '2026-07-13 14:30', note: '台面绒布破损, 需更换', score: 45, area: '台球区' },
  { id: 'IN-004', type: '安全', item: '消防栓-A区', result: 'pass', inspector: '陈安全', time: '2026-07-13 10:00', note: '压力正常, 无遮挡', score: 100, area: 'A区' },
  { id: 'IN-005', type: '安全', item: '灭火器(3F)', result: 'warn', inspector: '陈安全', time: '2026-07-13 10:20', note: '有效期至8月, 需更换', score: 60, area: '3F' },
  { id: 'IN-006', type: '安全', item: '应急灯', result: 'pass', inspector: '陈安全', time: '2026-07-13 10:40', note: '全部工作正常', score: 98, area: '全场' },
  { id: 'IN-007', type: '卫生', item: '洗手间男', result: 'pass', inspector: '张保洁', time: '2026-07-13 09:00', note: '清洁到位, 消毒记录完整', score: 90, area: '洗手间' },
  { id: 'IN-008', type: '卫生', item: '游戏区地面', result: 'fail', inspector: '张保洁', time: '2026-07-13 09:30', note: '零食碎屑较多, 需吸尘', score: 30, area: '游戏区' },
  { id: 'IN-009', type: '卫生', item: '休息区沙发', result: 'pass', inspector: '张保洁', time: '2026-07-13 10:00', note: '整洁无污渍', score: 95, area: '休息区' },
  { id: 'IN-010', type: '设备', item: '兑币机-01', result: 'pass', inspector: '王工', time: '2026-07-13 15:00', note: '出币流畅, 零钱充足', score: 88, area: '前台' },
  { id: 'IN-011', type: '设备', item: '投篮机-02', result: 'warn', inspector: '李工', time: '2026-07-13 15:30', note: '篮筐轻微松动, 需紧固', score: 65, area: '游戏区' },
  { id: 'IN-012', type: '安全', item: '监控系统', result: 'pass', inspector: '陈安全', time: '2026-07-13 11:00', note: '全部摄像头在线', score: 97, area: '监控室' },
];

const RESULT_CFG: Record<string, { color: string; label: string }> = {
  pass: { color: 'green', label: '通过' },
  fail: { color: 'red', label: '不通过' },
  warn: { color: 'orange', label: '需关注' },
};

const TYPE_CFG: Record<string, string> = { 设备: '🔧', 安全: '🛡️', 卫生: '🧹' };

const resultScore = (v: string) => v === 'pass' ? 90 : v === 'warn' ? 60 : 30;

export default function InspectionPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState('list');

  const filtered = useMemo(() => {
    let r = INSPECT_DATA;
    if (typeFilter !== 'all') r = r.filter(d => d.type === typeFilter);
    if (resultFilter !== 'all') r = r.filter(d => d.result === resultFilter);
    return r;
  }, [typeFilter, resultFilter]);

  const passCount = INSPECT_DATA.filter(d => d.result === 'pass').length;
  const warnCount = INSPECT_DATA.filter(d => d.result === 'warn').length;
  const failCount = INSPECT_DATA.filter(d => d.result === 'fail').length;
  const avgScore = Math.round(INSPECT_DATA.reduce((s, d) => s + (d.score || resultScore(d.result)), 0) / INSPECT_DATA.length);

  const cols = [
    { title: '类别', dataIndex: 'type', render: (v: string) => <Tag>{TYPE_CFG[v] || ''} {v}</Tag> },
    { title: '检查项', dataIndex: 'item' },
    { title: '区域', dataIndex: 'area' },
    {
      title: '评分', dataIndex: 'score', render: (v: number | undefined, r: Inspection) => {
        const s = v || resultScore(r.result);
        return <Progress percent={s} size="small" style={{ width: 100 }} strokeColor={s >= 80 ? '#34d399' : s >= 60 ? '#f59e0b' : '#f87171'} />;
      }
    },
    { title: '结果', dataIndex: 'result', render: (v: string) => <Tag color={RESULT_CFG[v]?.color || 'default'}>{RESULT_CFG[v]?.label || v}</Tag> },
    { title: '检查人', dataIndex: 'inspector' },
    { title: '备注', dataIndex: 'note', ellipsis: true },
    { title: '时间', dataIndex: 'time' },
    {
      title: '操作', key: 'a', width: 100,
      render: (_: unknown, r: Inspection) => (
        <Space size="small">
          {r.result === 'fail' && <Button size="small" type="primary">派单维修</Button>}
          <Button size="small">详情</Button>
        </Space>
      ),
    },
  ];

  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    INSPECT_DATA.forEach(d => map.set(d.type, (map.get(d.type) || 0) + 1));
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, []);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📋 巡检管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>设备 · 安全 · 卫生 · 全维度巡检</span></div>
          <Button type="primary" onClick={() => setShowAdd(true)}>+ 新建巡检</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="今日巡检" value={INSPECT_DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="通过" value={passCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="需关注" value={warnCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="不通过" value={failCount} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="综合评分" value={avgScore} suffix="分" valueStyle={{ color: avgScore >= 80 ? '#34d399' : '#f59e0b' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="巡检列表" />
            <Tabs.Tab key="stats" label="统计" />
          </Tabs>

          {tab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>类别:</span>
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }}
                  options={[{ value: 'all', label: '全部' }, { value: '设备', label: '🔧 设备' }, { value: '安全', label: '🛡️ 安全' }, { value: '卫生', label: '🧹 卫生' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>结果:</span>
                <Select value={resultFilter} onChange={setResultFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'pass', label: '通过' }, { value: 'warn', label: '需关注' }, { value: 'fail', label: '不通过' }]} />
              </Space>
              <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true }} />
            </>
          ) : (
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <Row gutter={16}>
                {typeStats.map(s => (
                  <Col key={s.type} span={8}>
                    <Card size="small" title={`${TYPE_CFG[s.type] || ''} ${s.type}`}>
                      <div>今日巡检: {s.count}项</div>
                      <div>通过率: {Math.round(INSPECT_DATA.filter(d => d.type === s.type && d.result === 'pass').length / s.count * 100)}%</div>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Button>生成巡检报告</Button>
            </Space>
          )}
        </Card>

        <Modal title="新建巡检" open={showAdd} onCancel={() => setShowAdd(false)}
          onOk={() => { message.success('巡检记录已创建'); setShowAdd(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select placeholder="巡检类别" style={{ width: '100%' }}>
              <Select.Option value="设备">🔧 设备</Select.Option>
              <Select.Option value="安全">🛡️ 安全</Select.Option>
              <Select.Option value="卫生">🧹 卫生</Select.Option>
            </Select>
            <Input placeholder="检查项名称" />
            <Input placeholder="检查区域" />
            <Input placeholder="检查人" />
            <Input placeholder="备注" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
