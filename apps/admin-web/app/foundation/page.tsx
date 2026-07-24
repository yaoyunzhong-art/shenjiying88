'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard,
  DataTable, Button, Space, Tag,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Progress, type DataTableColumn,
} from '@m5/ui';
import { AdminPermissionGate } from '../components/admin-permission-gate';

// ── 类型 ──────────────────────────────────────────────
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

const MODULE_STATUS_CFG: Record<ModuleStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  healthy: { label: '健康', variant: 'success' },
  warning: { label: '亚健康', variant: 'warning' },
  error: { label: '异常', variant: 'error' },
  unknown: { label: '未知', variant: 'default' },
};

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
  { id: 'M-011', name: '数据同步', key: 'sync-service', version: 'v1.3.0', status: 'healthy', description: '跨店数据同步、缓存预热', consumers: 4, endpoints: 8, lastDeploy: '2026-07-08 02:00', maintainer: '杨华', healthScore: 90, uptime: '99.82%' },
  { id: 'M-012', name: '日志服务', key: 'log-service', version: 'v1.0.2', status: 'healthy', description: '操作日志、审计日志汇聚', consumers: 16, endpoints: 6, lastDeploy: '2026-07-07 03:00', maintainer: '马鹏', healthScore: 94, uptime: '99.91%' },
];

const columns: DataTableColumn<ModuleInfo>[] = [
  { key: 'name', title: '模块名称', dataKey: 'name', sortable: true, render: (row) => (
    <Space><span style={{ color: '#93c5fd', fontWeight: 600 }}>{row.name}</span><Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.version}</Tag></Space>
  )},
  { key: 'key', title: '标识符', dataKey: 'key', render: (row) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{row.key}</span> },
  { key: 'consumers', title: '消费者', dataKey: 'consumers', sortable: true },
  { key: 'endpoints', title: '接口数', dataKey: 'endpoints', sortable: true },
  { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (row) => (
    <Space size="small"><StatusBadge label={MODULE_STATUS_CFG[row.status].label} variant={MODULE_STATUS_CFG[row.status].variant} size="sm" dot /><span style={{ fontSize: 12, color: '#64748b' }}>{row.uptime}</span></Space>
  )},
  { key: 'healthScore', title: '健康分', dataKey: 'healthScore', sortable: true, render: (row) => (
    <Space size="small">
      <Progress value={row.healthScore} variant={row.healthScore >= 90 ? 'success' : row.healthScore >= 70 ? 'warning' : 'danger'} showLabel={false} height={6} style={{ width: 80 }} />
      <span style={{ color: row.healthScore >= 90 ? '#34d399' : row.healthScore >= 70 ? '#fbbf24' : '#f87171', fontWeight: 600, fontSize: 13 }}>{row.healthScore}</span>
    </Space>
  )},
  { key: 'lastDeploy', title: '最近部署', dataKey: 'lastDeploy', sortable: true },
  { key: 'maintainer', title: '维护人', dataKey: 'maintainer' },
];

export default function FoundationPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const permissionGate = {
    requiredPermission: 'foundation.governance.read',
    title: 'Foundation 总览访问受限',
    description:
      'Foundation 总览页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看模块目录、治理基线、健康分与消费者依赖。',
  } as const;

  const filtered = useMemo(() => MOCK_MODULES.filter((m) => {
    if (search) {
      const haystack = `${m.name} ${m.key} ${m.description} ${m.maintainer}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [search]);

  const stats = useMemo(() => ({
    total: MOCK_MODULES.length,
    healthy: MOCK_MODULES.filter((m) => m.status === 'healthy').length,
    warningCount: MOCK_MODULES.filter((m) => m.status === 'warning').length,
    error: MOCK_MODULES.filter((m) => m.status === 'error').length,
  }), []);

  const healthAvg = Math.round(MOCK_MODULES.reduce((s, m) => s + m.healthScore, 0) / MOCK_MODULES.length);
  const uptimeAvg = (MOCK_MODULES.reduce((s, m) => s + parseFloat(m.uptime.replace('%', '')), 0) / MOCK_MODULES.length).toFixed(2);

  const unhealthy = useMemo(() => MOCK_MODULES.filter((m) => m.status === 'warning' || m.status === 'error'), []);

  return (
    <AdminPermissionGate {...permissionGate}>
      <PageShell title="🏗️ Foundation 总览">
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: 20 }}>模块目录 · 治理基线 · 消费者依赖</h2>
          <Space>
            <Button variant="primary" onClick={() => message.success('跳转至部署审批…')}>部署审批</Button>
            <Button onClick={() => message.success('正在检查运行状态…')}>运行状态</Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="总模块数" value={stats.total} />
          <StatCard label="健康" value={stats.healthy} variant="info" />
          <StatCard label="亚健康" value={stats.warningCount} variant="warning" />
          <StatCard label="异常" value={stats.error} variant="error" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Card title="平台版本">
            <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd' }}>v22.0.0</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>基础平台版本 · 2026-07 发布</div>
            <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>
              总接口: {MOCK_MODULES.reduce((s, m) => s + m.endpoints, 0)} · 总消费者: {MOCK_MODULES.reduce((s, m) => s + m.consumers, 0)}
            </div>
          </Card>
          <Card title="系统健康概览">
            <div>平均健康分: <span style={{ color: '#34d399', fontWeight: 600, fontSize: 18 }}>{healthAvg}</span></div>
            <div style={{ marginTop: 4 }}>平均可用率: <span style={{ color: '#93c5fd', fontWeight: 600 }}>{uptimeAvg}%</span></div>
            <div style={{ marginTop: 8 }}><Progress value={healthAvg} variant={healthAvg >= 90 ? 'success' : 'warning'} showLabel={false} height={8} /></div>
            <div style={{ color: stats.error > 0 ? '#f87171' : '#34d399', marginTop: 8, fontSize: 13 }}>
              {stats.error > 0 ? '⚠️ 存在异常模块需关注' : '✅ 所有模块正常运行'}
            </div>
          </Card>
          <Card title="维护团队">
            {[...new Set(MOCK_MODULES.map((m) => m.maintainer))].map((person) => (
              <Tag key={person} style={{ marginBottom: 4 }}>{person}</Tag>
            ))}
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
              共 {new Set(MOCK_MODULES.map((m) => m.maintainer)).size} 位维护人
            </div>
          </Card>
        </div>

        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'modules', label: '模块列表', count: stats.total },
            { key: 'unhealthy', label: '异常模块', count: unhealthy.length },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Card title="健康模块">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#34d399' }}>{stats.healthy}</div>
              <Progress value={Math.round((stats.healthy / stats.total) * 100)} variant="success" showLabel={true} height={8} style={{ marginTop: 8 }} />
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>占比 {Math.round((stats.healthy / stats.total) * 100)}%</div>
            </Card>
            <Card title="亚健康预警">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24' }}>{stats.warningCount}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>支付网关 (78分) · AI 服务 (72分)</div>
              <div style={{ marginTop: 8 }}><Button size="sm" variant="outline" onClick={() => setActiveTab('unhealthy')}>查看详情</Button></div>
            </Card>
            <Card title="异常告警">
              <div style={{ fontSize: 32, fontWeight: 700, color: '#f87171' }}>{stats.error}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                {stats.error > 0 ? MOCK_MODULES.filter((m) => m.status === 'error').map((m) => m.name).join('、') : '暂无异常'}
              </div>
            </Card>
            <Card title="最近部署">
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{MOCK_MODULES[0].name}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{MOCK_MODULES[0].version} · {MOCK_MODULES[0].lastDeploy}</div>
            </Card>
          </div>
        )}

        {(activeTab === 'modules' || activeTab === 'unhealthy') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SearchFilterInput value={search} onChange={setSearch} placeholder="搜索模块名称 / 标识符 / 维护人…" />
            <DataTable columns={columns} items={filtered} rowKey={(item) => item.id} striped compact />
          </div>
        )}

        <Card title="整体质量指标">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>平均健康评分</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#93c5fd' }}>{healthAvg}%</div>
              <Progress value={healthAvg} variant={healthAvg >= 90 ? 'success' : 'warning'} showLabel={false} height={8} style={{ marginTop: 4, width: '80%' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>整体可用率</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>{uptimeAvg}%</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>模块健康覆盖率</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>{Math.round((stats.healthy / stats.total) * 100)}%</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{stats.healthy}/{stats.total} 模块健康</div>
            </div>
          </div>
        </Card>
        </Space>
      </PageShell>
    </AdminPermissionGate>
  );
}
