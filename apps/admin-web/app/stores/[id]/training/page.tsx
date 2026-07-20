// 📚 培训管理 · 培训计划/课程/考核 · 完整培训管理
'use client';
import { useState, useMemo, useEffect } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Modal, Input, message, Progress } from '@m5/ui';

interface Course {
  id: string; name: string; type: string; trainer: string; date: string;
  duration: number; status: 'planned' | 'ongoing' | 'completed';
  attendees: number; passRate: number; room?: string;
}

const COURSES: Course[] = [
  { id: 'CRS-001', name: '新员工入职培训', type: '入职', trainer: 'HR', date: '2026-07-15', duration: 4, status: 'planned', attendees: 5, passRate: 0, room: 'A培训室' },
  { id: 'CRS-002', name: '收银系统操作', type: '技能', trainer: '李四', date: '2026-07-10', duration: 3, status: 'completed', attendees: 8, passRate: 100, room: '电脑室' },
  { id: 'CRS-003', name: '安全消防演练', type: '安全', trainer: '消防队', date: '2026-07-20', duration: 2, status: 'planned', attendees: 15, passRate: 0, room: '室外' },
  { id: 'CRS-004', name: '客户服务技巧', type: '服务', trainer: '外部讲师', date: '2026-07-08', duration: 4, status: 'ongoing', attendees: 10, passRate: 60, room: 'B培训室' },
  { id: 'CRS-005', name: '设备操作指南', type: '技能', trainer: '王五', date: '2026-07-05', duration: 2, status: 'completed', attendees: 6, passRate: 83, room: '设备区' },
  { id: 'CRS-006', name: '产品知识更新', type: '产品', trainer: '总部', date: '2026-07-22', duration: 3, status: 'planned', attendees: 12, passRate: 0, room: 'A培训室' },
  { id: 'CRS-007', name: '应急处理流程', type: '安全', trainer: '张店长', date: '2026-07-12', duration: 2, status: 'completed', attendees: 8, passRate: 100, room: 'B培训室' },
  { id: 'CRS-008', name: '社交媒体营销', type: '营销', trainer: '市场部', date: '2026-07-18', duration: 4, status: 'planned', attendees: 6, passRate: 0, room: '会议室' },
  { id: 'CRS-009', name: '数据报表解读', type: '技能', trainer: '财务部', date: '2026-07-25', duration: 2, status: 'planned', attendees: 4, passRate: 0, room: '会议室' },
];

const SCFG: Record<string, { color: string; label: string }> = {
  planned: { color: 'default', label: '计划' },
  ongoing: { color: 'blue', label: '进行中' },
  completed: { color: 'green', label: '已完成' },
};

export default function TrainingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Course[] | null>(null);

  useEffect(() => {
    try {
      setData(COURSES);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <PageShell><div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>加载中...</div></PageShell>;
  if (error) return <PageShell><div style={{ textAlign: 'center', padding: 64, color: '#ef4444' }}>数据获取失败: {error}</div></PageShell>;
  if (!data || data.length === 0) return <PageShell><div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>暂无数据</div></PageShell>;

  const
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? COURSES : COURSES.filter(c => c.status === filter);
  const completedCourses = COURSES.filter(c => c.status === 'completed');
  const avgPassRate = completedCourses.length > 0
    ? Math.round(completedCourses.reduce((s, c) => s + c.passRate, 0) / completedCourses.length)
    : 0;

  const cols = [
    { title: '课程名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: '讲师', dataIndex: 'trainer' },
    { title: '教室', dataIndex: 'room' },
    { title: '日期', dataIndex: 'date' },
    { title: '时长', dataIndex: 'duration', render: (v: number) => `${v}h` },
    { title: '参训', dataIndex: 'attendees', render: (v: number) => `${v}人` },
    { title: '通过率', dataIndex: 'passRate', render: (v: number) => v ? <span style={{ color: '#34d399', fontWeight: 600 }}>{v}%</span> : <span style={{ color: '#64748b' }}>-</span> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={SCFG[v]?.color}>{SCFG[v]?.label}</Tag> },
    { title: '操作', key: 'a', width: 160, render: (_: unknown, r: Course) => (
      <Space size="small"><Button size="small">详情</Button>{r.status !== 'completed' && <Button size="small">签到</Button>}</Space>
    )},
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📚 培训管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>培训计划 · 课程 · 考核</span></div>
          <Button type="primary" onClick={() => setShowAdd(true)}>+ 创建培训</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总课程" value={COURSES.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已完成" value={completedCourses.length} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="进行中" value={COURSES.filter(c => c.status === 'ongoing').length} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="计划中" value={COURSES.filter(c => c.status === 'planned').length} valueStyle={{ color: '#94a3b8' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="平均通过率" value={avgPassRate} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Select value={filter} onChange={setFilter} style={{ width: 120 }}
              options={[{ value: 'all', label: '全部' }, { value: 'planned', label: '计划' }, { value: 'ongoing', label: '进行中' }, { value: 'completed', label: '已完成' }]} />
          </Space>
          <Table dataSource={filtered} columns={cols} rowKey="id" pagination={{ pageSize: 8 }} />
        </Card>

        <Card size="small">
          <Space><Button>培训计划</Button><Button>考核记录</Button><Button>导出</Button></Space>
        </Card>

        <Modal title="创建培训" open={showAdd} onCancel={() => setShowAdd(false)}
          onOk={() => { message.success('培训已创建'); setShowAdd(false); }} width={500}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="课程名称" />
            <Input placeholder="讲师" />
            <Select placeholder="类型" style={{ width: '100%' }}>
              <Select.Option value="入职">入职培训</Select.Option>
              <Select.Option value="技能">技能培训</Select.Option>
              <Select.Option value="安全">安全培训</Select.Option>
              <Select.Option value="服务">服务培训</Select.Option>
            </Select>
            <Input placeholder="日期" type="date" />
            <Input placeholder="时长(小时)" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
