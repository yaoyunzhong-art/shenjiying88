// 🛠️ 售后服务 · 客诉/维修/工单管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Input, Modal, message, Progress } from '@m5/ui';

type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Ticket {
  id: string; title: string; type: string; customer: string;
  priority: TicketPriority; status: TicketStatus; assignee: string;
  createdAt: string; resolvedAt?: string; slaHours: number;
}

const PRIORITY_CFG: Record<TicketPriority, { color: string; label: string }> = {
  low: { color: 'default', label: '低' },
  medium: { color: 'blue', label: '中' },
  high: { color: 'orange', label: '高' },
  urgent: { color: 'red', label: '紧急' },
};
const STATUS_CFG: Record<TicketStatus, { color: string; label: string }> = {
  open: { color: 'red', label: '待处理' },
  processing: { color: 'blue', label: '处理中' },
  resolved: { color: 'green', label: '已解决' },
  closed: { color: 'default', label: '已关闭' },
};

const TICKETS: Ticket[] = [
  { id: 'TK-001', title: 'VR设备画面闪烁', type: '设备故障', customer: '张先生', priority: 'high', status: 'processing', assignee: '王师傅', createdAt: '2026-07-13 14:00', slaHours: 4 },
  { id: 'TK-002', title: '会员卡无法充值', type: '系统问题', customer: '李女士', priority: 'urgent', status: 'open', assignee: '李开发', createdAt: '2026-07-13 16:30', slaHours: 2 },
  { id: 'TK-003', title: '空调制冷不足', type: '环境', customer: '赵先生', priority: 'medium', status: 'processing', assignee: '物业', createdAt: '2026-07-13 10:00', slaHours: 8 },
  { id: 'TK-004', title: '游戏币兑换故障', type: '设备故障', customer: '王女士', priority: 'medium', status: 'resolved', assignee: '王师傅', createdAt: '2026-07-12 20:00', resolvedAt: '2026-07-13 09:00', slaHours: 8 },
  { id: 'TK-005', title: '预约系统显示异常', type: '系统问题', customer: '刘先生', priority: 'low', status: 'closed', assignee: '李开发', createdAt: '2026-07-11 15:00', resolvedAt: '2026-07-12 10:00', slaHours: 24 },
  { id: 'TK-006', title: '空调噪音过大', type: '环境', customer: '周先生', priority: 'high', status: 'open', assignee: '物业', createdAt: '2026-07-13 18:00', slaHours: 4 },
  { id: 'TK-007', title: '充值未到账投诉', type: '客诉', customer: '吴女士', priority: 'urgent', status: 'processing', assignee: '张店长', createdAt: '2026-07-13 17:00', slaHours: 2 },
  { id: 'TK-008', title: '台球桌台面磨损', type: '设备维护', customer: '内部', priority: 'low', status: 'open', assignee: '王师傅', createdAt: '2026-07-13 09:00', slaHours: 48 },
];

export default function ServicePage() {
  // 三态条件渲染
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)
  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!TICKETS || TICKETS.length === 0) return <div>暂无数据</div>;

  const [filter, setFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    let list = TICKETS;
    if (filter) list = list.filter(t => t.status === filter);
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    return list;
  }, [filter, priorityFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const stats = useMemo(() => ({
    total: TICKETS.length,
    open: TICKETS.filter(t => t.status === 'open').length,
    processing: TICKETS.filter(t => t.status === 'processing').length,
    resolved: TICKETS.filter(t => t.status === 'resolved').length,
    urgent: TICKETS.filter(t => t.priority === 'urgent').length,
  }), []);

  const columns = [
    { title: '工单号', dataIndex: 'id', width: 90 },
    { title: '标题', dataIndex: 'title', width: 160 },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '客户', dataIndex: 'customer', width: 80 },
    { title: '优先级', dataIndex: 'priority', width: 70, render: (v: TicketPriority) => <Tag color={PRIORITY_CFG[v].color}>{PRIORITY_CFG[v].label}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: TicketStatus) => <Tag color={STATUS_CFG[v].color}>{STATUS_CFG[v].label}</Tag> },
    { title: '负责人', dataIndex: 'assignee', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', width: 150 },
    { title: 'SLA', dataIndex: 'slaHours', width: 70, render: (v: number) => `${v}h` },
    { title: '操作', key: 'actions', width: 140, render: (_: unknown) => <Space size="small"><Button size="small">处理</Button><Button size="small">转派</Button></Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🛠️ 售后服务</h2>
          <Button type="primary" onClick={() => setShowCreate(true)}>创建工单</Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总工单" value={stats.total} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="待处理" value={stats.open} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="已解决" value={stats.resolved} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="紧急" value={stats.urgent} valueStyle={{ color: '#ef4444' }} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ width: '100%', marginBottom: 12, flexWrap: 'wrap' }}>
            <Select style={{ width: 120 }} placeholder="全部状态" allowClear value={filter || undefined} onChange={v => setFilter((v || '') as TicketStatus | '')}>
              {Object.entries(STATUS_CFG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
            </Select>
            <Select style={{ width: 120 }} placeholder="全部优先级" allowClear value={priorityFilter || undefined} onChange={v => setPriorityFilter((v || '') as TicketPriority | '')}>
              {Object.entries(PRIORITY_CFG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
            </Select>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>共 {filtered.length} 条</span>
          </Space>
          <Table dataSource={paged} columns={columns} rowKey="id" pagination={false} />
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
              <span style={{ color: '#94a3b8', lineHeight: '32px' }}>{page}/{totalPages}</span>
              <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</Button>
            </div>
          )}
        </Card>
      </Space>
      <Modal title="创建工单" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => { message.success('工单已创建'); setShowCreate(false); }} okText="创建" width={480}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="工单标题" /><Select placeholder="类型"><Select.Option value="设备故障">设备故障</Select.Option><Select.Option value="系统问题">系统问题</Select.Option><Select.Option value="客诉">客诉</Select.Option><Select.Option value="环境">环境</Select.Option></Select>
          <Select placeholder="优先级"><Select.Option value="low">低</Select.Option><Select.Option value="medium">中</Select.Option><Select.Option value="high">高</Select.Option><Select.Option value="urgent">紧急</Select.Option></Select>
          <Input placeholder="客户信息" /><Input.TextArea rows={3} placeholder="问题描述" />
        </Space>
      </Modal>
    </PageShell>
  );
}
