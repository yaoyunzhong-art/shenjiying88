// 🔍 审计日志 · 操作记录与可追溯 · 全量审计+筛选+报告
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Tooltip, Empty, Tabs, Input } from '@m5/ui';

const AUDIT_DATA = [
  { id: 'AL-001', operator: '系统', action: '登录', target: 'admin-web', detail: 'IP: 192.168.1.100', time: '2026-07-13 22:00', level: 'info' },
  { id: 'AL-002', operator: '张三(店长)', action: '修改价格', target: '收银 P-35', detail: '商品SKU-001 ￥25→￥22', time: '2026-07-13 21:30', level: 'warn' },
  { id: 'AL-003', operator: '李四(财务)', action: '审核退款', target: '财务 P-38', detail: '订单OR-2026-0713 退款￥88', time: '2026-07-13 20:15', level: 'info' },
  { id: 'AL-004', operator: '系统', action: '自动备份', target: '数据库', detail: '完整备份 2.3GB', time: '2026-07-13 20:00', level: 'info' },
  { id: 'AL-005', operator: '王五(管理员)', action: '配置变更', target: '权限', detail: '新增角色: 临时工', time: '2026-07-13 19:45', level: 'warn' },
  { id: 'AL-006', operator: '系统', action: '告警触发', target: '库存', detail: '抹茶粉低于安全库存', time: '2026-07-13 19:00', level: 'error' },
  { id: 'AL-007', operator: '赵六(HR)', action: '离职处理', target: '员工', detail: '员工EMP-089 已离职', time: '2026-07-13 18:00', level: 'info' },
  { id: 'AL-008', operator: '张三(店长)', action: '设备关机', target: '设备-03', detail: 'VR设备异常关机', time: '2026-07-13 17:00', level: 'error' },
  { id: 'AL-009', operator: '系统', action: '调度任务', target: '侦察兵', detail: '夜间竞品采集完成', time: '2026-07-13 04:00', level: 'info' },
  { id: 'AL-010', operator: '系统', action: '自动升级', target: 'API服务', detail: 'v17.0.3→v17.0.4', time: '2026-07-13 03:00', level: 'info' },
  { id: 'AL-011', operator: '李四(财务)', action: '导出报表', target: '月报', detail: '2026-06月度营收报表', time: '2026-07-13 10:00', level: 'info' },
  { id: 'AL-012', operator: '系统', action: '备份完成', target: '数据', detail: '增量备份 450MB', time: '2026-07-12 20:00', level: 'info' },
];

const LEVEL_CFG: Record<string, { color: string; label: string }> = {
  info: { color: 'blue', label: '普通' },
  warn: { color: 'orange', label: '警告' },
  error: { color: 'red', label: '错误' },
};

const COLUMNS = [
  { title: '操作编号', dataIndex: 'id', width: 100 },
  { title: '操作人', dataIndex: 'operator', width: 120 },
  { title: '操作类型', dataIndex: 'action' },
  { title: '操作对象', dataIndex: 'target' },
  { title: '详情', dataIndex: 'detail', ellipsis: true },
  { title: '时间', dataIndex: 'time', width: 150 },
  {
    title: '级别', dataIndex: 'level', width: 80,
    render: (v: string) => <Tag color={LEVEL_CFG[v]?.color || 'default'}>{LEVEL_CFG[v]?.label || v}</Tag>,
  },
];

export default function AuditPage() {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('list');
  const [showReport, setShowReport] = useState(false);

  const filtered = useMemo(() => {
    let r = AUDIT_DATA;
    if (levelFilter !== 'all') r = r.filter(d => d.level === levelFilter);
    if (search) r = r.filter(d => d.operator.includes(search) || d.action.includes(search) || d.target.includes(search));
    return r;
  }, [levelFilter, search]);

  const errorCount = AUDIT_DATA.filter(d => d.level === 'error').length;
  const warnCount = AUDIT_DATA.filter(d => d.level === 'warn').length;
  const infoCount = AUDIT_DATA.filter(d => d.level === 'info').length;

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🔍 审计日志</h2>
          <Button type="primary" onClick={() => setShowReport(true)}>导出审计报告</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={6}><Card size="small"><Statistic title="今日操作" value={AUDIT_DATA.length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="错误告警" value={errorCount} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="警告" value={warnCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="普通" value={infoCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="list" label="日志列表" />
            <Tabs.Tab key="analysis" label="统计分析" />
          </Tabs>

          {tab === 'list' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>级别:</span>
                <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'info', label: '普通' }, { value: 'warn', label: '警告' }, { value: 'error', label: '错误' }]} />
                <Input.Search placeholder="搜索操作人/类型/对象" style={{ width: 260 }} onChange={e => setSearch(e.target.value)} allowClear />
              </Space>
              <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: true }} />
            </>
          ) : (
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <Row gutter={16}>
                <Col span={8}><Card size="small" title="按类型分布">
                  <div>登录: {AUDIT_DATA.filter(d => d.action === '登录').length}次</div>
                  <div>配置变更: {AUDIT_DATA.filter(d => d.action.includes('修改') || d.action.includes('配置')).length}次</div>
                  <div>告警: {AUDIT_DATA.filter(d => d.action.includes('告警')).length}次</div>
                  <div>备份: {AUDIT_DATA.filter(d => d.action.includes('备份')).length}次</div>
                </Card></Col>
                <Col span={8}><Card size="small" title="错误趋势">
                  <div style={{ color: '#f87171' }}>今日: {errorCount}个</div>
                  <div style={{ color: '#f59e0b' }}>昨日: 3个</div>
                  <div style={{ color: '#34d399' }}>本周: 12个</div>
                </Card></Col>
                <Col span={8}><Card size="small" title="活跃操作人">
                  <div>张三: 2次</div>
                  <div>系统: 6次</div>
                  <div>李四: 2次</div>
                </Card></Col>
              </Row>
            </Space>
          )}
        </Card>

        <Modal title="导出审计报告" open={showReport} onCancel={() => setShowReport(false)}
          onOk={() => { message.success('审计报告生成中…'); setShowReport(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>将导出以下数据:</div>
            <div>· 操作日志: {AUDIT_DATA.length}条</div>
            <div>· 错误告警: {errorCount}条</div>
            <div>· 警告: {warnCount}条</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>报告将以PDF格式发送至管理员邮箱</div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
