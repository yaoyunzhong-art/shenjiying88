'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard,
  DataTable, Button, Space, Tag,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Input, type DataTableColumn,
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

const ALGO_LABELS: Record<RuleAlgorithm, string> = {
  token_bucket: '令牌桶', leaky_bucket: '漏桶', sliding_window: '滑动窗口', fixed_window: '固定窗口',
};
const SCOPE_LABELS: Record<RuleScope, string> = {
  global: '全局', tenant: '租户', store: '门店', user: '用户',
};
const STATUS_CFG: Record<RuleStatus, { label: string; variant: 'success' | 'error' | 'warning' }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'error' },
  blocked: { label: '阻断', variant: 'warning' },
};

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
  { id: 'RL-011', code: 'api:upload', name: '文件上传限流', endpoint: 'POST /api/v1/files/upload', algorithm: 'token_bucket', scope: 'user', limit: 20, burstLimit: 30, period: '1hour', concurrency: 3, status: 'active', updatedAt: '2026-07-05 14:00', description: '每用户每小时最多 20 次上传' },
  { id: 'RL-012', code: 'api:report:daily', name: '日报生成限流', endpoint: 'POST /api/v1/reports/daily', algorithm: 'sliding_window', scope: 'store', limit: 2, burstLimit: 4, period: '1hour', concurrency: 1, status: 'inactive', updatedAt: '2026-07-04 10:30', description: '日报生成频率控制（已停用）' },
];

const columns: DataTableColumn<RateLimitRule>[] = [
  { key: 'code', title: '策略代码', dataKey: 'code', sortable: true, render: (row) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{row.code}</span> },
  { key: 'name', title: '策略名称', dataKey: 'name', sortable: true },
  { key: 'endpoint', title: '接口路径', dataKey: 'endpoint', render: (row) => <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{row.endpoint}</span> },
  { key: 'algorithm', title: '算法', dataKey: 'algorithm', render: (row) => <Tag>{ALGO_LABELS[row.algorithm]}</Tag> },
  { key: 'scope', title: '作用域', dataKey: 'scope', render: (row) => <Tag>{SCOPE_LABELS[row.scope]}</Tag> },
  { key: 'limit', title: '限额', render: (row) => `${row.limit}${row.burstLimit ? ` / 突增 ${row.burstLimit}` : ''}` },
  { key: 'concurrency', title: '并发数', dataKey: 'concurrency' },
  { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (row) => <StatusBadge label={STATUS_CFG[row.status].label} variant={STATUS_CFG[row.status].variant} size="sm" dot /> },
  { key: 'actions', title: '操作', render: (row) => (
    <Space size="small">
      <Button size="sm" variant={row.status === 'active' ? 'secondary' : 'primary'}
        disabled={row.status === 'blocked'}
        onClick={() => message.success(row.status === 'active' ? `已停用 ${row.code}` : `已启用 ${row.code}`)}
      >
        {row.status === 'active' ? '停用' : '启用'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => message.info(`编辑 ${row.code}`)}>编辑</Button>
    </Space>
  )},
];

export default function RateLimitsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => MOCK_RULES.filter((r) => {
    if (search) {
      const haystack = `${r.code} ${r.name} ${r.endpoint} ${r.description}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [search]);

  const blocked = useMemo(() => MOCK_RULES.filter((r) => r.status === 'blocked'), []);

  const stats = useMemo(() => ({
    total: MOCK_RULES.length,
    active: MOCK_RULES.filter((r) => r.status === 'active').length,
    inactiveCount: MOCK_RULES.filter((r) => r.status === 'inactive').length,
    blockedCount: MOCK_RULES.filter((r) => r.status === 'blocked').length,
  }), []);

  const algorithmDist = useMemo(() => {
    const d: Record<string, number> = {};
    MOCK_RULES.forEach((r) => { d[ALGO_LABELS[r.algorithm]] = (d[ALGO_LABELS[r.algorithm]] || 0) + 1; });
    return d;
  }, []);

  const allScopes: RuleScope[] = ['global', 'tenant', 'store', 'user'];

  return (
    <PageShell title="⏱️ 限流管理">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: 20 }}>限流策略 · 配额监控 · 规则管理</h2>
          <Space>
            <Button variant="primary" onClick={() => setShowNewModal(true)}>新建策略</Button>
            <Button onClick={() => message.success('正在刷新…')}>刷新状态</Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="总策略数" value={stats.total} />
          <StatCard label="启用中" value={stats.active} variant="info" />
          <StatCard label="已停用" value={stats.inactiveCount} variant="warning" />
          <StatCard label="阻断中" value={stats.blockedCount} variant="error" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Card title="算法分布">
            {Object.entries(algorithmDist).map(([algo, count]) => <div key={algo}>{algo}: {count} 条</div>)}
          </Card>
          <Card title="作用域分布">
            {allScopes.map((scope) => <div key={scope}>{SCOPE_LABELS[scope]}: {MOCK_RULES.filter((r) => r.scope === scope).length} 条</div>)}
          </Card>
          <Card title="当前限流概况">
            <div>均值限额: {Math.round(MOCK_RULES.reduce((s, r) => s + r.limit, 0) / MOCK_RULES.length)} 次/周期</div>
            <div>均值并发: {Math.round(MOCK_RULES.reduce((s, r) => s + r.concurrency, 0) / MOCK_RULES.length)}</div>
            <div style={{ color: '#f87171', marginTop: 4 }}>阻断策略: {stats.blockedCount} 条需关注</div>
          </Card>
        </div>

        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'rules', label: '全部策略', count: stats.total },
            { key: 'blocked', label: '阻断策略', count: stats.blockedCount },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Card title="活跃策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#34d399' }}>{stats.active}
                <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>/ {stats.total}</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>正常运行中的限流规则</div>
            </Card>
            <Card title="已停用策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{stats.inactiveCount}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>手动暂停或过期的规则</div>
            </Card>
            <Card title="阻断策略">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f87171' }}>{stats.blockedCount}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>超限触发的自动阻断规则</div>
            </Card>
            <Card title="最近更新">
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{MOCK_RULES[0].name}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{MOCK_RULES[0].updatedAt}</div>
            </Card>
          </div>
        )}

        {(activeTab === 'rules' || activeTab === 'blocked') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SearchFilterInput value={search} onChange={setSearch} placeholder="搜索策略代码 / 名称 / 接口路径…" />
            <DataTable columns={columns} items={filtered} rowKey={(item) => item.id} striped compact />
          </div>
        )}

        <Modal title="新建限流策略" open={showNewModal} onClose={() => setShowNewModal(false)}
          footer={
            <Space>
              <Button onClick={() => setShowNewModal(false)}>取消</Button>
              <Button variant="primary" onClick={() => { message.success('限流策略创建成功'); setShowNewModal(false); }}>确定</Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
            <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>策略名称</div><Input placeholder="例: 登录接口限流" style={{ width: '100%' }} /></div>
            <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>算法</div>
              <Space style={{ gap: 8 }}>
                {(Object.entries(ALGO_LABELS) as [RuleAlgorithm, string][]).map(([k, v]) => (
                  <Button key={k} variant="outline" size="sm" onClick={() => {}}>{v}</Button>
                ))}
              </Space>
            </div>
            <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>限额（次/周期）</div><Input placeholder="例: 100" style={{ width: '100%' }} /></div>
            <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>并发数</div><Input placeholder="例: 50" style={{ width: '100%' }} /></div>
            <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>接口路径</div><Input placeholder="例: POST /api/v1/auth/login" style={{ width: '100%' }} /></div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
