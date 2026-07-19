'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard, Row, Col, Statistic,
  DataTable, Tag, Button, Space, Select,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Empty, Tooltip, Input, type DataTableColumn,
} from '@m5/ui';

// ── 类型定义 ──────────────────────────────────────────
type RuleStatus = 'active' | 'inactive' | 'blocked';
type RuleAlgorithm = 'token_bucket' | 'leaky_bucket' | 'sliding_window' | 'fixed_window';
type RuleScope = 'global' | 'tenant' | 'store' | 'user';

interface RateLimitRule {
  id: string;
  code: string;
  name: string;
  endpoint: string;
  algorithm: RuleAlgorithm;
  scope: RuleScope;
  limit: number;
  burstLimit: number;
  period: string;
  concurrency: number;
  status: RuleStatus;
  updatedAt: string;
  description: string;
}

// ── 标签映射 ──────────────────────────────────────────
const ALGO_LABELS: Record<RuleAlgorithm, string> = {
  token_bucket: '令牌桶',
  leaky_bucket: '漏桶',
  sliding_window: '滑动窗口',
  fixed_window: '固定窗口',
};

const SCOPE_LABELS: Record<RuleScope, string> = {
  global: '全局',
  tenant: '租户',
  store: '门店',
  user: '用户',
};

const STATUS_CFG: Record<RuleStatus, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'danger' },
  blocked: { label: '阻断', variant: 'warning' },
};

// ── Mock 数据 ─────────────────────────────────────────
const MOCK_RULES: RateLimitRule[] = [
  { id: 'RL-001', code: 'api:login', name: '登录接口限流', endpoint: 'POST /api/v1/auth/login', algorithm: 'token_bucket', scope: 'global', limit: 100, burstLimit: 150, period: '1min', concurrency: 50, status: 'active', updatedAt: '2026-07-15 10:30', description: '限制登录接口每分钟请求数' },
  { id: 'RL-002', code: 'api:register', name: '注册接口限流', endpoint: 'POST /api/v1/auth/register', algorithm: 'sliding_window', scope: 'global', limit: 20, burstLimit: 30, period: '1min', concurrency: 10, status: 'active', updatedAt: '2026-07-14 14:00', description: '防刷注册接口' },
  { id: 'RL-003', code: 'api:order:create', name: '下单限流', endpoint: 'POST /api/v1/orders', algorithm: 'token_bucket', scope: 'user', limit: 10, burstLimit: 20, period: '1min', concurrency: 5, status: 'active', updatedAt: '2026-07-13 09:00', description: '每用户每分钟最多 10 单' },
  { id: 'RL-004', code: 'api:payment', name: '支付接口限流', endpoint: 'POST /api/v1/payments', algorithm: 'leaky_bucket', scope: 'store', limit: 30, burstLimit: 50, period: '1min', concurrency: 15, status: 'active', updatedAt: '2026-07-12 16:45', description: '支付渠道保护' },
  { id: 'RL-005', code: 'api:search', name: '搜索限流', endpoint: 'GET /api/v1/products/search', algorithm: 'fixed_window', scope: 'user', limit: 60, burstLimit: 120, period: '1min', concurrency: 30, status: 'inactive', updatedAt: '2026-07-10 11:20', description: '搜索频率限制，已暂停' },
  { id: 'RL-006', code: 'api:export', name: '导出限流', endpoint: 'POST /api/v1/reports/export', algorithm: 'token_bucket', scope: 'global', limit: 5, burstLimit: 10, period: '1min', concurrency: 2, status: 'active', updatedAt: '2026-07-11 08:00', description: '报表导出防止服务过载' },
  { id: 'RL-007', code: 'api:sms', name: '短信发送限流', endpoint: 'POST /api/v1/notifications/sms', algorithm: 'sliding_window', scope: 'user', limit: 3, burstLimit: 5, period: '5min', concurrency: 1, status: 'active', updatedAt: '2026-07-09 17:30', description: '每用户 5 分钟内最多 3 条短信' },
  { id: 'RL-008', code: 'api:webhook', name: 'Webhook 限流', endpoint: 'POST /api/v1/webhooks/*', algorithm: 'leaky_bucket', scope: 'tenant', limit: 200, burstLimit: 300, period: '1min', concurrency: 50, status: 'blocked', updatedAt: '2026-07-08 22:00', description: 'Webhook 回调，因超量触发阻断' },
  { id: 'RL-009', code: 'api:refresh', name: 'Token 刷新限流', endpoint: 'POST /api/v1/auth/refresh', algorithm: 'token_bucket', scope: 'user', limit: 10, burstLimit: 15, period: '1min', concurrency: 5, status: 'active', updatedAt: '2026-07-07 13:15', description: 'Refresh Token 刷新频率限制' },
  { id: 'RL-010', code: 'api:ai:generate', name: 'AI 生成限流', endpoint: 'POST /api/v1/ai/generate', algorithm: 'token_bucket', scope: 'tenant', limit: 50, burstLimit: 80, period: '1min', concurrency: 10, status: 'active', updatedAt: '2026-07-06 09:45', description: 'AI 内容生成接口，成本控制' },
];

// ── 列定义 ────────────────────────────────────────────
const columns: DataTableColumn<RateLimitRule>[] = [
  {
    key: 'code',
    title: '策略代码',
    dataKey: 'code',
    sortable: true,
    render: (item) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.code}</span>
    ),
  },
  {
    key: 'name',
    title: '策略名称',
    dataKey: 'name',
    sortable: true,
  },
  {
    key: 'endpoint',
    title: '接口路径',
    dataKey: 'endpoint',
    render: (item) => (
      <Tooltip title={item.description}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{item.endpoint}</span>
      </Tooltip>
    ),
  },
  {
    key: 'algorithm',
    title: '算法',
    dataKey: 'algorithm',
    render: (item) => <Tag>{ALGO_LABELS[item.algorithm]}</Tag>,
  },
  {
    key: 'scope',
    title: '作用域',
    dataKey: 'scope',
    render: (item) => <Tag>{SCOPE_LABELS[item.scope]}</Tag>,
  },
  {
    key: 'limit',
    title: '限额',
    render: (item) => `${item.limit}${item.burstLimit ? ` / 突增 ${item.burstLimit}` : ''}`,
  },
  {
    key: 'concurrency',
    title: '并发数',
    dataKey: 'concurrency',
  },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    sortable: true,
    render: (item) => (
      <StatusBadge
        label={STATUS_CFG[item.status].label}
        variant={STATUS_CFG[item.status].variant}
        size="sm"
        dot
      />
    ),
  },
  {
    key: 'actions',
    title: '操作',
    width: 160,
    render: (_value, record) => (
      <Space size="small">
        <Button size="small" type="primary"
          disabled={record.status === 'blocked'}
          onClick={() => {
            message.success(
              record.status === 'active' ? `已停用 ${record.code}` : `已启用 ${record.code}`,
            );
          }}
        >
          {record.status === 'active' ? '停用' : '启用'}
        </Button>
        <Button size="small" onClick={() => message.info(`编辑 ${record.code}`)}>编辑</Button>
      </Space>
    ),
  },
];

// ── 页面组件 ──────────────────────────────────────────
export default function RateLimitsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_RULES.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search) {
        const haystack = `${r.code} ${r.name} ${r.endpoint} ${r.description}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: MOCK_RULES.length,
      active: MOCK_RULES.filter((r) => r.status === 'active').length,
      inactive: MOCK_RULES.filter((r) => r.status === 'inactive').length,
      blocked: MOCK_RULES.filter((r) => r.status === 'blocked').length,
    }),
    [],
  );

  const algorithmDist = useMemo(() => {
    const dist: Record<string, number> = {};
    MOCK_RULES.forEach((r) => {
      dist[ALGO_LABELS[r.algorithm]] = (dist[ALGO_LABELS[r.algorithm]] || 0) + 1;
    });
    return dist;
  }, []);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {/* ── 标题栏 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>⏱️ 限流管理</h2>
          <Space>
            <Button type="primary" onClick={() => setShowNewModal(true)}>新建策略</Button>
            <Button>刷新状态</Button>
          </Space>
        </div>

        {/* ── 统计卡片 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="总策略数" value={stats.total} variant="default" />
          <StatCard label="启用中" value={stats.active} variant="info" />
          <StatCard label="已停用" value={stats.inactive} variant="warning" />
          <StatCard label="阻断中" value={stats.blocked} variant="danger" />
        </div>

        {/* ── 信息卡片 ── */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="算法分布">
              {Object.entries(algorithmDist).map(([algo, count]) => (
                <div key={algo}>
                  {algo}: {count} 条
                </div>
              ))}
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="作用域分布">
              {(['global', 'tenant', 'store', 'user'] as RuleScope[]).map((scope) => (
                <div key={scope}>
                  {SCOPE_LABELS[scope]}: {MOCK_RULES.filter((r) => r.scope === scope).length} 条
                </div>
              ))}
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="当前限流概况">
              <div>
                均值限额: {Math.round(MOCK_RULES.reduce((s, r) => s + r.limit, 0) / MOCK_RULES.length)} 次/周期
              </div>
              <div>
                均值并发: {Math.round(MOCK_RULES.reduce((s, r) => s + r.concurrency, 0) / MOCK_RULES.length)}
              </div>
              <div style={{ color: '#f87171', marginTop: 4 }}>
                阻断策略: {stats.blocked} 条需关注
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── Tab 切换 ── */}
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'rules', label: '策略列表', count: stats.total },
            { key: 'blocked', label: '阻断策略', count: stats.blocked },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {/* ── 筛选区 ── */}
        {activeTab !== 'overview' && (
          <Space style={{ gap: 8, width: '100%' }} wrap>
            <SearchFilterInput
              value={search}
              onChange={setSearch}
              placeholder="搜索策略代码 / 名称 / 接口路径..."
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: '全部状态' },
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用' },
                { value: 'blocked', label: '阻断' },
              ]}
              style={{ width: 140 }}
            />
          </Space>
        )}

        {/* ── 总览 Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Card title="活跃策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#34d399' }}>
                {stats.active}
                <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>
                  / {stats.total}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                正常运行中的限流规则
              </div>
            </Card>
            <Card title="已停用策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>
                {stats.inactive}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                手动暂停或过期的规则
              </div>
            </Card>
            <Card title="阻断策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f87171' }}>
                {stats.blocked}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                超限触发的自动阻断规则
              </div>
            </Card>
            <Card title="最近更新">
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>
                {MOCK_RULES[0].name}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                {MOCK_RULES[0].updatedAt}
              </div>
            </Card>
          </div>
        )}

        {/* ── 列表 Tab ── */}
        {(activeTab === 'rules' || activeTab === 'blocked') && (
          <DataTable
            columns={columns}
            items={filtered}
            rowKey={(item) => item.id}
            striped
            compact
            pagination={{ pageSize: 8 }}
          />
        )}

        {activeTab === 'blocked' && filtered.length === 0 && (
          <Empty description="暂无阻断策略" />
        )}

        {/* ── 新建策略弹窗 ── */}
        <Modal
          title="新建限流策略"
          open={showNewModal}
          onCancel={() => setShowNewModal(false)}
          onOk={() => {
            message.success('限流策略创建成功');
            setShowNewModal(false);
          }}
        >
          <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>策略名称</div>
              <Input placeholder="例如: 登录接口限流" style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>算法</div>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: 'token_bucket', label: '令牌桶' },
                  { value: 'leaky_bucket', label: '漏桶' },
                  { value: 'sliding_window', label: '滑动窗口' },
                  { value: 'fixed_window', label: '固定窗口' },
                ]}
              />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>限额（次/周期）</div>
              <Input placeholder="例如: 100" style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>并发数</div>
              <Input placeholder="例如: 50" style={{ width: '100%' }} />
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
