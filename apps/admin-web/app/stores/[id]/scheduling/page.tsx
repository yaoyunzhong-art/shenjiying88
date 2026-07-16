// 👥 排班管理 · 员工排班/班次/考勤 · P-30 真联调版
'use client';
import { useState, useMemo, useEffect } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tabs, Progress, Empty, Spin } from '@m5/ui';

// P-30 真联调: 清洁排班数据接口 (对齐后端 clean-schedules API)
interface CleanSchedule {
  id: string;
  tenantId: string;
  storeId?: string;
  staffId: string;
  staffName: string;
  role: string;
  shift: string;
  timeRange: string;
  date: string;
  status: 'scheduled' | 'checked-in' | 'completed' | 'absent';
  area?: string;
  checkInAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API 状态映射到 UI 状态
const API_STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: '已排班', color: 'default' },
  'checked-in': { label: '已签到', color: 'success' },
  completed: { label: '已完成', color: 'primary' },
  absent: { label: '缺勤', color: 'error' },
};

// 旧版状态映射（兼容前端历史数据）
const STATUS_CFG: Record<string, [string, string]> = {
  working: ['green', '在岗'], off: ['default', '休息'], late: ['orange', '迟到'], leave: ['red', '请假'],
  absent: ['red', '缺勤'], scheduled: ['blue', '已排班'], 'checked-in': ['green', '已签到'],
  completed: ['purple', '已完成'],
};

const SHIFT_COLORS: Record<string, string> = { 早班: '#6366f1', 中班: '#f59e0b', 晚班: '#8b5cf6' };
const ROLE_COLORS: Record<string, string> = { 店长: '#6366f1', 收银员: '#10b981', 导玩员: '#f59e0b', 保洁: '#6b7280', 设备维护: '#8b5cf6', 清洁员: '#6b7280' };

export default function SchedulingPage() {
  // ============ 数据状态 ============
  const [schedules, setSchedules] = useState<CleanSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ============ 筛选状态 ============
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabKey, setTabKey] = useState('list');
  
  // ============ 弹窗状态 ============
  const [showShift, setShowShift] = useState(false);
  const [creating, setCreating] = useState(false);

  // ============ 常量 ============
  const tenantId = 'tenant-p30';

  // ============ 数据获取 ============
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (shiftFilter !== 'all') qs.set('shift', shiftFilter);
      
      const res = await fetch(`/api/logistics/clean-schedules?${qs.toString()}`, {
        headers: { 'x-tenant-id': tenantId },
      });
      
      if (!res.ok) throw new Error(`获取排班失败: ${res.status}`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || '加载排班列表失败');
      message.error('加载排班列表失败');
    } finally {
      setLoading(false);
    }
  };

  // ============ 创建排班 ============
  const handleCreateSchedule = async (values: any) => {
    setCreating(true);
    try {
      const res = await fetch('/api/logistics/clean-schedules', {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          tenantId,
          status: 'scheduled',
        }),
      });
      if (!res.ok) throw new Error('创建失败');
      message.success('排班创建成功');
      setShowShift(false);
      fetchSchedules();
    } catch (e) {
      message.error('创建排班失败');
    } finally {
      setCreating(false);
    }
  };

  // ============ 签到操作 ============
  const handleCheckIn = async (id: string) => {
    try {
      const res = await fetch(`/api/logistics/clean-schedules/${id}/check-in`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('签到失败');
      message.success('签到成功');
      fetchSchedules();
    } catch (e) {
      message.error('签到失败');
    }
  };

  // ============ 初始加载 ============
  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftFilter, statusFilter]);

  // ============ 计算属性 ============
  const filtered = useMemo(() => {
    let r = schedules;
    if (shiftFilter !== 'all') r = r.filter(s => s.shift === shiftFilter);
    if (statusFilter !== 'all') r = r.filter(s => s.status === statusFilter);
    return r;
  }, [schedules, shiftFilter, statusFilter]);

  const onDuty = schedules.filter(s => s.status === 'checked-in').length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const completedCount = schedules.filter(s => s.status === 'completed').length;
  const absentCount = schedules.filter(s => s.status === 'absent').length;

  // 班次统计
  const shiftStats = useMemo(() => {
    const stats: Record<string, number> = { 早班: 0, 中班: 0, 晚班: 0 };
    schedules.forEach(s => {
      if (stats[s.shift] !== undefined) stats[s.shift]++;
    });
    return stats;
  }, [schedules]);

  // 角色分布
  const roleDist = useMemo(() => {
    const m: Record<string, number> = {};
    schedules.forEach(s => { m[s.role] = (m[s.role] || 0) + 1; });
    return Object.entries(m);
  }, [schedules]);

  // ============ 表格列定义 ============
  const COLUMNS = [
    { title: '员工', dataIndex: 'staffName', width: 100, render: (v: string, r: CleanSchedule) => (
      <Space direction="vertical" size={0}>
        <span style={{ color: '#e2e8f0' }}>{v}</span>
        <Tag size="small" color={ROLE_COLORS[r.role] || 'default'} style={{ fontSize: 11 }}>{r.role}</Tag>
      </Space>
    )},
    { title: '班次', dataIndex: 'shift', width: 90, render: (v: string) => (
      <Tag color={SHIFT_COLORS[v] || 'default'} size="small">{v}</Tag>
    )},
    { title: '时间段', dataIndex: 'timeRange', width: 120 },
    { title: '日期', dataIndex: 'date', width: 110 },
    { title: '签到时间', dataIndex: 'checkInAt', width: 100, render: (v?: string) => v ? new Date(v).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-' },
    { title: '清洁区域', dataIndex: 'area', width: 100, render: (v?: string) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => {
      const cfg = API_STATUS_MAP[v] || { label: v, color: 'default' };
      return <Tag color={cfg.color} size="small">{cfg.label}</Tag>;
    }},
    { title: '操作', key: 'a', width: 160, render: (_: unknown, r: CleanSchedule) => (
      <Space size="small">
        {r.status === 'scheduled' && (
          <Button size="small" type="primary" onClick={() => handleCheckIn(r.id)}>签到</Button>
        )}
        <Button size="small" ghost>调班</Button>
      </Space>
    )},
  ];

  // ============ 提取 Tab 配置（提升解析稳定性） ============
  const TAB_ITEMS = [
    {
      key: 'list',
      label: '排班列表',
      children: (
        <Card>
          {/* 筛选栏 */}
          <Space style={{ marginBottom: 12, gap: 8, width: '100%' }} wrap>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>班次:</span>
            <Select
              value={shiftFilter}
              onChange={setShiftFilter}
              style={{ width: 100 }}
              options={[
                { value: 'all', label: '全部' },
                { value: '早班', label: '早班' },
                { value: '中班', label: '中班' },
                { value: '晚班', label: '晚班' },
              ]}
            />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'scheduled', label: '待签到' },
                { value: 'checked-in', label: '已签到' },
                { value: 'completed', label: '已完成' },
                { value: 'absent', label: '缺勤' },
              ]}
            />
            <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 'auto' }}>
              共 {filtered.length} 条
            </span>
          </Space>

          {/* 表格 */}
          {filtered.length === 0 ? (
            <Empty description="暂无排班数据" />
          ) : (
            <Table
              dataSource={filtered}
              columns={COLUMNS as any}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'schedule',
      label: '班次视图',
      children: (
        <Row gutter={16}>
          {['早班', '中班', '晚班'].map((shiftName) => {
            const staffInShift = filtered.filter((s) => s.shift === shiftName);
            return (
              <Col key={shiftName} span={8}>
                <Card
                  title={
                    <>
                      <span style={{ color: SHIFT_COLORS[shiftName] }}>●</span>{' '}
                      {shiftName}
                    </>
                  }
                  extra={
                    <span style={{ color: '#94a3b8' }}>{staffInShift.length}人</span>
                  }
                >
                  {staffInShift.length === 0 ? (
                    <Empty description="暂无排班" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    staffInShift.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(148,163,184,0.08)',
                        }}
                      >
                        <Space>
                          <span style={{ color: '#e2e8f0' }}>{s.staffName}</span>
                          <Tag size="small" color={ROLE_COLORS[s.role] || 'default'}>
                            {s.role}
                          </Tag>
                        </Space>
                        <Tag
                          color={API_STATUS_MAP[s.status]?.color || 'default'}
                          size="small"
                        >
                          {API_STATUS_MAP[s.status]?.label || s.status}
                        </Tag>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      ),
    },
    {
      key: 'stats',
      label: '统计分析',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="角色分布">
              {roleDist.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                roleDist.map(([role, count]) => (
                  <div
                    key={role}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                    }}
                  >
                    <Tag color={ROLE_COLORS[role] || 'default'}>{role}</Tag>
                    <Space>
                      <Progress
                        percent={Math.round((count / schedules.length) * 100)}
                        size="small"
                        style={{ width: 120 }}
                      />
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{count}人</span>
                    </Space>
                  </div>
                ))
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="状态分布">
              {schedules.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                Object.entries(API_STATUS_MAP).map(([k, cfg]) => {
                  const cnt = schedules.filter((s) => s.status === k).length;
                  return (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(148,163,184,0.08)',
                      }}
                    >
                      <Tag color={cfg.color}>{cfg.label}</Tag>
                      <span style={{ color: '#e2e8f0' }}>{cnt}人</span>
                    </div>
                  );
                })
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  // ============ 主内容渲染 ============
  function renderMainContent() {
    if (error) {
      return (
        <Card>
          <Empty description={error}>
            <Button onClick={fetchSchedules}>重试</Button>
          </Empty>
        </Card>
      );
    }
    return <Tabs activeKey={tabKey} onChange={setTabKey} items={TAB_ITEMS} />;
  }

  // ============ 渲染 ============
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 排班管理</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>清洁排班 · 考勤签到 · 区域分配</span>
          </div>
          <Space>
            <Button onClick={() => fetchSchedules()} loading={loading}>刷新</Button>
            <Button>导出排班表</Button>
            <Button type="primary" onClick={() => setShowShift(true)}>+ 新建排班</Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col span={3}>
            <Card size="small">
              <Statistic title="总排班" value={schedules.length} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="已签到" value={onDuty} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="待签到" value={scheduledCount} valueStyle={{ color: '#6366f1' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="已完成" value={completedCount} valueStyle={{ color: '#10b981' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="缺勤" value={absentCount} valueStyle={{ color: '#ef4444' }} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic 
                title="签到率" 
                value={schedules.length > 0 ? Math.round((onDuty + completedCount) / schedules.length * 100) : 0} 
                suffix="%" 
                valueStyle={{ color: '#34d399' }} 
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="早班" value={shiftStats['早班'] || 0} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="中班" value={shiftStats['中班'] || 0} />
            </Card>
          </Col>
        </Row>

        {/* 主内容区 */}
        <Spin spinning={loading} tip="加载排班数据...">
          {renderMainContent()}
        </Spin>

        {/* 底部操作栏 */}
        <Card size="small">
          <Space>
            <Button>调班申请</Button>
            <Button>请假审批</Button>
            <Button>考勤异常</Button>
          </Space>
        </Card>

        {/* 新建排班弹窗 */}
        <Modal
          title="新建排班"
          open={showShift}
          onCancel={() => setShowShift(false)}
          onOk={() => {
            // 简单模拟创建
            handleCreateSchedule({
              staffId: 'new-staff-id',
              staffName: '新员工',
              role: '清洁员',
              shift: '早班',
              timeRange: '08:00-14:00',
              date: new Date().toISOString().split('T')[0],
            });
          }}
          confirmLoading={creating}
          width={480}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input placeholder="日期" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              <Select placeholder="选择班次" style={{ width: '100%' }}>
                <Select.Option value="早班">早班(08:00-14:00)</Select.Option>
                <Select.Option value="中班">中班(14:00-20:00)</Select.Option>
                <Select.Option value="晚班">晚班(15:00-22:00)</Select.Option>
              </Select>
              <Select placeholder="选择员工" style={{ width: '100%', gridColumn: '1 / -1' }}>
                <Select.Option value="staff-1">张三 - 清洁员</Select.Option>
                <Select.Option value="staff-2">李四 - 保洁</Select.Option>
                <Select.Option value="staff-3">王五 - 清洁员</Select.Option>
              </Select>
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
