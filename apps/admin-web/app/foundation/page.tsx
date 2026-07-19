'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard, Row, Col, Statistic,
  DataTable, Tag, Button, Space, Select,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Empty, Tooltip, Input, type DataTableColumn,
  Progress,
} from '@m5/ui';

// ── 类型定义 ──────────────────────────────────────────
type ModuleStatus = 'healthy' | 'warning' | 'error' | 'unknown';

interface ModuleInfo {
  id: string;
  name: string;
  key: string;
  version: string;
  status: ModuleStatus;
  description: string;
  consumers: number;
  endpoints: number;
  lastDeploy: string;
  maintainer: string;
  healthScore: number;
  uptime: string;
}

interface QuickEntry {
  key: string;
  label: string;
  icon: string;
  href: string;
  color: string;
}

// ── 状态映射 ──────────────────────────────────────────
const MODULE_STATUS_CFG: Record<ModuleStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
  healthy: { label: '健康', variant: 'success' },
  warning: { label: '亚健康', variant: 'warning' },
  error: { label: '异常', variant: 'danger' },
  unknown: { label: '未知', variant: 'default' },
};

// ── Mock 数据 ─────────────────────────────────────────
const MOCK_MODULES: ModuleInfo[] = [
  { id: 'M-001', name: '用户中心', key: 'user-service', version: 'v2.3.1', status: 'healthy', description: '身份认证、用户资料、权限管理', consumers: 12, endpoints: 28, lastDeploy: '2026-07-18 03:00', maintainer: '张明', healthScore: 98, uptime: '99.97%' },
  { id: 'M-002', name: '门店管理', key: 'store-service', version: 'v1.8.4', status: 'healthy', description: '门店信息、设备管理、营业配置', consumers: 8, endpoints: 22, lastDeploy: '2026-07-17 02:30', maintainer: '李芳', healthScore: 95, uptime: '99.92%' },
  { id: 'M-003', name: '订单中心', key: 'order-service', version: 'v3.1.0', status: 'healthy', description: '订单创建、支付、履约、售后', consumers: 15, endpoints: 35, lastDeploy: '2026-07-16 01:00', maintainer: '王伟', healthScore: 93, uptime: '99.88%' },
  { id: 'M-004', name: '支付网关', key: 'payment-gateway', version: 'v2.0.5', status: 'warning', description: '支付渠道接入、对账、退款', consumers: 5, endpoints: 18, lastDeploy: '2026-07-15 04:00', maintainer: '陈雪', healthScore: 78, uptime: '99.75%' },
  { id: 'M-005', name: '库存管理', key: 'inventory-service', version: 'v1.5.2', status: 'healthy', description: '商品库存、出入库、盘点', consumers: 7, endpoints: 15, lastDeploy: '2026-07-14 03:00', maintainer: '赵敏', healthScore: 91, uptime: '99.85%' },
  { id: 'M-006', name: 'AI 服务', key: 'ai-service', version: 'v0.9.0', status: 'warning', description: '图像识别、竞品分析、预测', consumers: 4, endpoints: 12, lastDeploy: '2026-07-13 05:00', maintainer: '孙磊', healthScore: 72, uptime: '99.50%' },
  { id: 'M-007', name: '报表引擎', key: 'report-engine', version: 'v1.2.3', status: 'healthy', description: '数据报表、导出、可视化', consumers: 6, endpoints: 10, lastDeploy: '2026-07-12 02:00', maintainer: '刘洋', healthScore: 88, uptime: '99.80%' },
  { id: 'M-008', name: '消息推送', key: 'notification-service', version: 'v1.6.1', status: 'error', description: '短信、推送通知、站内信', consumers: 10, endpoints: 8, lastDeploy: '2026-07-11 03:00', maintainer: '吴强', healthScore: 45, uptime: '98.20%' },
  { id: 'M-009', name: '定时任务', key: 'scheduler-service', version: 'v1.1.0', status: 'healthy', description: '定时调度、任务编排、执行日志', consumers: 3, endpoints: 6, lastDeploy: '2026-07-10 04:00', maintainer: '周婷', healthScore: 96, uptime: '99.95%' },
  { id: 'M-010', name: 'API 网关', key: 'api-gateway', version: 'v2.5.0', status: 'healthy', description: '路由、限流、鉴权、日志', consumers: 20, endpoints: 4, lastDeploy: '2026-07-09 01:00', maintainer: '郑浩', healthScore: 99, uptime: '99.99%' },
];

const QUICK_ENTRIES: QuickEntry[] = [
  { key: 'users', label: '用户管理', icon: '👥', href: '/users', color: '#93c5fd' },
  { key: 'stores', label: '门店管理', icon: '🏪', href: '/stores', color: '#34d399' },
  { key: 'orders', label: '订单中心', icon: '📦', href: '/stores', color: '#fbbf24' },
  { key: 'rate-limits', label: '限流策略', icon: '⏱️', href: '/rate-limits', color: '#f87171' },
  { key: 'audit', label: '审计日志', icon: '🔍', href: '/audit-logs', color: '#a78bfa' },
  { key: 'settings', label: '系统配置', icon: '⚙️', href: '/settings', color: '#94a3b8' },
  { key: 'security', label: '安防管理', icon: '🛡️', href: '/settings/security', color: '#fb923c' },
  { key: 'ai', label: 'AI 场景', icon: '🤖', href: '/ai-scenario-simulator', color: '#e879f9' },
];

// ── 列定义 ────────────────────────────────────────────
const columns: DataTableColumn<ModuleInfo>[] = [
  {
    key: 'name',
    title: '模块名称',
    dataKey: 'name',
    sortable: true,
    render: (item) => (
      <Space>
        <span style={{ color: '#93c5fd', fontWeight: 600 }}>{item.name}</span>
        <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.version}</Tag>
      </Space>
    ),
  },
  {
    key: 'key',
    title: '标识符',
    dataKey: 'key',
    render: (item) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.key}</span>
    ),
  },
  { key: 'consumers', title: '消费者', dataKey: 'consumers', sortable: true },
  { key: 'endpoints', title: '接口数', dataKey: 'endpoints', sortable: true },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    sortable: true,
    render: (item) => (
      <Space size="small" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <StatusBadge
          label={MODULE_STATUS_CFG[item.status].label}
          variant={MODULE_STATUS_CFG[item.status].variant}
          size="sm"
          dot
        />
        <span style={{ fontSize: 12, color: '#64748b' }}>{item.uptime}</span>
      </Space>
    ),
  },
  {
    key: 'healthScore',
    title: '健康分',
    dataKey: 'healthScore',
    sortable: true,
    render: (item) => (
      <Space size="small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Progress
          percent={item.healthScore}
          size="small"
          strokeColor={item.healthScore >= 90 ? '#34d399' : item.healthScore >= 70 ? '#fbbf24' : '#f87171'}
          style={{ width: 60 }}
        />
        <span style={{
          color: item.healthScore >= 90 ? '#34d399' : item.healthScore >= 70 ? '#fbbf24' : '#f87171',
          fontWeight: 600,
          fontSize: 13,
        }}>
          {item.healthScore}
        </span>
      </Space>
    ),
  },
  {
    key: 'lastDeploy',
    title: '最近部署',
    dataKey: 'lastDeploy',
    sortable: true,
  },
  {
    key: 'maintainer',
    title: '维护人',
    dataKey: 'maintainer',
  },
];

// ── 页面组件 ──────────────────────────────────────────
export default function FoundationPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const filtered = useMemo(() => {
    return MOCK_MODULES.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (search) {
        const haystack = `${m.name} ${m.key} ${m.description} ${m.maintainer}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: MOCK_MODULES.length,
      healthy: MOCK_MODULES.filter((m) => m.status === 'healthy').length,
      warning: MOCK_MODULES.filter((m) => m.status === 'warning').length,
      error: MOCK_MODULES.filter((m) => m.status === 'error').length,
    }),
    [],
  );

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {/* ── 标题栏 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>🏗️ Foundation 总览</h2>
          <Space>
            <Button type="primary">部署审批</Button>
            <Button>运行状态</Button>
          </Space>
        </div>

        {/* ── 统计卡片 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="总模块数" value={stats.total} variant="default" />
          <StatCard label="健康" value={stats.healthy} variant="info" />
          <StatCard label="亚健康" value={stats.warning} variant="warning" />
          <StatCard label="异常" value={stats.error} variant="danger" />
        </div>

        {/* ── 概览面板 ── */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="平台版本">
              <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd' }}>v22.0.0</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                基础平台版本 · 2026-07 发布
              </div>
              <div style={{ marginTop: 12 }}>
                <Button size="small" onClick={() => message.info('版本更新日志')}>
                  查看更新日志
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="系统概览">
              <div>
                总接口数: {MOCK_MODULES.reduce((s, m) => s + m.endpoints, 0)}
              </div>
              <div>
                总消费者: {MOCK_MODULES.reduce((s, m) => s + m.consumers, 0)}
              </div>
              <div>
                维护团队: {new Set(MOCK_MODULES.map((m) => m.maintainer)).size} 人
              </div>
              <div style={{ color: stats.error > 0 ? '#f87171' : '#34d399', marginTop: 4 }}>
                整体健康: {stats.error > 0 ? '存在异常模块' : '所有模块正常运行'}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="快速入口">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {QUICK_ENTRIES.slice(0, 6).map((entry) => (
                  <Button
                    key={entry.key}
                    size="small"
                    style={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      border: '1px solid #334155',
                      padding: '6px 10px',
                    }}
                    onClick={() => message.info(`跳转至 ${entry.label}`)}
                  >
                    {entry.icon} {entry.label}
                  </Button>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── 快速入口卡片 ── */}
        <Card title="🔗 功能导航">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {QUICK_ENTRIES.map((entry) => (
              <div
                key={entry.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: 'rgba(30,41,59,0.4)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => message.info(`导航到 ${entry.label} 页`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(30,41,59,0.4)')}
              >
                <span style={{ fontSize: 24 }}>{entry.icon}</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{entry.label}</div>
                  <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{entry.href}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Tab 切换 ── */}
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'modules', label: '模块列表', count: stats.total },
            { key: 'unhealthy', label: '异常模块', count: stats.error + stats.warning },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {/* ── 筛选 ── */}
        {activeTab !== 'overview' && (
          <Space style={{ gap: 8, width: '100%' }} wrap>
            <SearchFilterInput
              value={search}
              onChange={setSearch}
              placeholder="搜索模块名称 / 标识符 / 维护人..."
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: '全部状态' },
                { value: 'healthy', label: '健康' },
                { value: 'warning', label: '亚健康' },
                { value: 'error', label: '异常' },
              ]}
              style={{ width: 140 }}
            />
          </Space>
        )}

        {/* ── 总览 Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Card title="健康模块">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#34d399' }}>{stats.healthy}</div>
              <Progress
                percent={Math.round((stats.healthy / stats.total) * 100)}
                size="small"
                strokeColor="#34d399"
                style={{ marginTop: 8 }}
              />
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                占比 {Math.round((stats.healthy / stats.total) * 100)}%
              </div>
            </Card>
            <Card title="亚健康预警">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24' }}>{stats.warning}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                需关注模块: 支付网关、AI 服务
              </div>
            </Card>
            <Card title="异常告警">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f87171' }}>{stats.error}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                {stats.error > 0
                  ? MOCK_MODULES.filter((m) => m.status === 'error')
                      .map((m) => m.name)
                      .join('、')
                  : '暂无异常模块'}
              </div>
            </Card>
            <Card title="最近部署">
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{MOCK_MODULES[0].name}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{MOCK_MODULES[0].version}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{MOCK_MODULES[0].lastDeploy}</div>
            </Card>
          </div>
        )}

        {/* ── 模块列表 Tab ── */}
        {(activeTab === 'modules' || activeTab === 'unhealthy') && (
          <DataTable
            columns={columns}
            items={filtered}
            rowKey={(item) => item.id}
            striped
            compact
            pagination={{ pageSize: 8 }}
          />
        )}

        {activeTab === 'unhealthy' && filtered.length === 0 && (
          <Empty description="无异常模块" />
        )}

        {/* ── 模块详情占位 ── */}
        <Card size="small" title="模块健康趋势">
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8 }}>
            健康评分平均值:{' '}
            {Math.round(MOCK_MODULES.reduce((s, m) => s + m.healthScore, 0) / MOCK_MODULES.length)}%
            <br />
            整体可用率:{' '}
            {(
              MOCK_MODULES.reduce((s, m) => s + parseFloat(m.uptime.replace('%', '')), 0) /
              MOCK_MODULES.length
            ).toFixed(2)}
            %
          </div>
        </Card>
      </Space>
    </PageShell>
  );
}
