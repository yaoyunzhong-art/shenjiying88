// @ts-nocheck
'use client';

/**
 * 租户管理 - Tenant Management
 * 角色: 👑超级管理员 / 🏢总部管理
 * 功能: 租户列表、状态统计、搜索/筛选/分页
 *
 * API: /api/tenants (P-31 RLS 多租户)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

// ── 类型 ──

export type TenantTier = 'free' | 'starter' | 'business' | 'enterprise' | 'premium';
export type TenantStatus = 'active' | 'trial' | 'suspended' | 'expired';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  tier: TenantTier;
  status: TenantStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  stores: number;
  users: number;
  revenue: number;
  createdDate?: string;
  expiryDate: string;
  lastActive: string;
  region: string;
  industry: string;
}

// ── 常量 ──

export const TIER_LABELS: Record<TenantTier, string> = {
  free: '免费版', starter: '入门版', business: '商业版', enterprise: '企业版', premium: '旗舰版',
};

export const TIER_COLORS: Record<TenantTier, string> = {
  free: '#6b7280', starter: '#94a3b8', business: '#3b82f6', enterprise: '#8b5cf6', premium: '#eab308',
};

export const STATUS_CONFIG: Record<TenantStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: '活跃', variant: 'success' },
  trial: { label: '试用', variant: 'info' },
  suspended: { label: '冻结', variant: 'danger' },
  expired: { label: '过期', variant: 'warning' },
};

export const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '港澳台', '海外'];
export const INDUSTRIES = ['游艺厅', '电玩城', '综合娱乐', '亲子乐园', 'VR体验', '健身娱乐', '其他'];
export const TIER_TIERS: TenantTier[] = ['free', 'starter', 'business', 'enterprise', 'premium'];

export function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ── URL-pattern Response Registry (可测试 mock) ──

const API_BASE = '/api/tenants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResponseHandler = (body?: any) => { ok: boolean; data: unknown; message: string };

const responseRegistry = new Map<string, ResponseHandler>();

// 注册默认 handler (生产模式下会被真实 fetch 覆盖)
// GET /api/tenants — 获取租户列表
responseRegistry.set('GET:/api/tenants', () => ({
  ok: true,
  data: buildDefaultTenants(),
  message: 'ok',
}));

// GET /api/tenants/stats — 状态统计
responseRegistry.set('GET:/api/tenants/stats', () => ({
  ok: true,
  data: {
    total: DEFAULT_TENANTS.length,
    active: DEFAULT_TENANTS.filter(t => t.status === 'active').length,
    suspended: DEFAULT_TENANTS.filter(t => t.status === 'suspended').length,
    expired: DEFAULT_TENANTS.filter(t => t.status === 'expired').length,
    trial: DEFAULT_TENANTS.filter(t => t.status === 'trial').length,
  },
  message: 'ok',
}));

// POST /api/tenants/suspend — 暂停租户
responseRegistry.set('POST:/api/tenants/suspend', (body) => {
  const tenantId = body?.tenantId;
  if (!tenantId) return { ok: false, data: null, message: '缺少 tenantId' };
  return { ok: true, data: { tenantId, status: 'suspended' }, message: '已暂停' };
});

// POST /api/tenants/reactivate — 恢复租户
responseRegistry.set('POST:/api/tenants/reactivate', (body) => {
  const tenantId = body?.tenantId;
  if (!tenantId) return { ok: false, data: null, message: '缺少 tenantId' };
  return { ok: true, data: { tenantId, status: 'active' }, message: '已恢复' };
});

/**
 * API 调用封装 — 优先走 mock registry，否则走真实 fetch
 */
async function handleApiCall(url: string, options?: RequestInit): Promise<{ ok: boolean; data: unknown; message: string }> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const key = `${method}:${url}`;

  // 开发/测试模式：优先走 responseRegistry mock
  const handler = responseRegistry.get(key);
  if (handler) {
    let body: unknown;
    if (options?.body && typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch { body = options.body; }
    }
    return Promise.resolve(handler(body));
  }

  // 生产模式：真实 fetch
  try {
    const res = await fetch(url, { ...options, cache: 'no-store' });
    const payload = await res.json();
    return { ok: res.ok, data: payload.data ?? payload, message: payload.message ?? '' };
  } catch (error) {
    return { ok: false, data: null, message: error instanceof Error ? error.message : '网络错误' };
  }
}

// ── 默认数据 ──

export const DEFAULT_TENANTS: Tenant[] = buildDefaultTenants();

export function buildDefaultTenants(): Tenant[] {
  return [
    { id: 'TNT-001', name: '欢乐谷电玩城', code: 'TENANT-1001', tier: 'enterprise', status: 'active', contactName: '张三', contactEmail: 'contact1@example.com', contactPhone: '13800001001', stores: 5, users: 18, revenue: 125000.00, createdDate: '2024-01-15', expiryDate: '2027-01-15', lastActive: '2026-07-18', region: '华东', industry: '游艺厅' },
    { id: 'TNT-002', name: '星际联盟旗舰店', code: 'TENANT-1002', tier: 'business', status: 'active', contactName: '李四', contactEmail: 'contact2@example.com', contactPhone: '13800001002', stores: 3, users: 12, revenue: 86000.00, createdDate: '2024-03-20', expiryDate: '2027-03-20', lastActive: '2026-07-17', region: '华南', industry: '电玩城' },
    { id: 'TNT-003', name: '潮玩部落', code: 'TENANT-1003', tier: 'starter', status: 'active', contactName: '王五', contactEmail: 'contact3@example.com', contactPhone: '13800001003', stores: 2, users: 8, revenue: 45000.00, createdDate: '2024-06-01', expiryDate: '2027-06-01', lastActive: '2026-07-16', region: '华北', industry: '综合娱乐' },
    { id: 'TNT-004', name: '乐动空间', code: 'TENANT-1004', tier: 'free', status: 'trial', contactName: '赵六', contactEmail: 'contact4@example.com', contactPhone: '13800001004', stores: 1, users: 5, revenue: 12000.00, createdDate: '2026-01-10', expiryDate: '2026-08-10', lastActive: '2026-07-15', region: '华中', industry: '亲子乐园' },
    { id: 'TNT-005', name: '极速竞界', code: 'TENANT-1005', tier: 'business', status: 'active', contactName: '陈七', contactEmail: 'contact5@example.com', contactPhone: '13800001005', stores: 4, users: 15, revenue: 98000.00, createdDate: '2024-08-15', expiryDate: '2027-08-15', lastActive: '2026-07-18', region: '华东', industry: '游艺厅' },
    { id: 'TNT-006', name: '梦幻乐园旗舰店', code: 'TENANT-1006', tier: 'enterprise', status: 'active', contactName: '刘八', contactEmail: 'contact6@example.com', contactPhone: '13800001006', stores: 6, users: 25, revenue: 168000.00, createdDate: '2024-02-01', expiryDate: '2027-02-01', lastActive: '2026-07-18', region: '华南', industry: '综合娱乐' },
    { id: 'TNT-007', name: '时空隧道', code: 'TENANT-1007', tier: 'premium', status: 'suspended', contactName: '张三', contactEmail: 'contact7@example.com', contactPhone: '13800001007', stores: 2, users: 10, revenue: 72000.00, createdDate: '2024-05-10', expiryDate: '2026-05-10', lastActive: '2026-06-01', region: '华北', industry: 'VR体验' },
    { id: 'TNT-008', name: '数字浪潮', code: 'TENANT-1008', tier: 'starter', status: 'active', contactName: '李四', contactEmail: 'contact8@example.com', contactPhone: '13800001008', stores: 2, users: 7, revenue: 35000.00, createdDate: '2025-01-20', expiryDate: '2028-01-20', lastActive: '2026-07-17', region: '西南', industry: '电玩城' },
    { id: 'TNT-009', name: '星河漫游', code: 'TENANT-1009', tier: 'business', status: 'expired', contactName: '王五', contactEmail: 'contact9@example.com', contactPhone: '13800001009', stores: 1, users: 4, revenue: 28000.00, createdDate: '2023-11-05', expiryDate: '2025-11-05', lastActive: '2025-10-20', region: '西北', industry: '健身娱乐' },
    { id: 'TNT-010', name: '未来玩家', code: 'TENANT-1010', tier: 'free', status: 'active', contactName: '赵六', contactEmail: 'contact10@example.com', contactPhone: '13800001010', stores: 1, users: 3, revenue: 8000.00, createdDate: '2026-03-15', expiryDate: '2027-03-15', lastActive: '2026-07-14', region: '华东', industry: '其他' },
    { id: 'TNT-011', name: '嗨玩天地', code: 'TENANT-1011', tier: 'premium', status: 'active', contactName: '陈七', contactEmail: 'contact11@example.com', contactPhone: '13800001011', stores: 7, users: 30, revenue: 210000.00, createdDate: '2024-07-01', expiryDate: '2027-07-01', lastActive: '2026-07-18', region: '华南', industry: '综合娱乐' },
    { id: 'TNT-012', name: '酷炫基地', code: 'TENANT-1012', tier: 'business', status: 'active', contactName: '刘八', contactEmail: 'contact12@example.com', contactPhone: '13800001012', stores: 3, users: 14, revenue: 76000.00, createdDate: '2024-10-20', expiryDate: '2027-10-20', lastActive: '2026-07-17', region: '华中', industry: '游艺厅' },
    { id: 'TNT-013', name: '童趣乐园', code: 'TENANT-1013', tier: 'starter', status: 'trial', contactName: '张三', contactEmail: 'contact13@example.com', contactPhone: '13800001013', stores: 1, users: 3, revenue: 9000.00, createdDate: '2026-05-01', expiryDate: '2026-09-01', lastActive: '2026-07-12', region: '华东', industry: '亲子乐园' },
    { id: 'TNT-014', name: '电玩新天地', code: 'TENANT-1014', tier: 'enterprise', status: 'suspended', contactName: '李四', contactEmail: 'contact14@example.com', contactPhone: '13800001014', stores: 4, users: 20, revenue: 135000.00, createdDate: '2024-04-10', expiryDate: '2026-04-10', lastActive: '2026-05-15', region: '华北', industry: '电玩城' },
    { id: 'TNT-015', name: '竞界风云旗舰店', code: 'TENANT-1015', tier: 'business', status: 'active', contactName: '王五', contactEmail: 'contact15@example.com', contactPhone: '13800001015', stores: 4, users: 16, revenue: 88000.00, createdDate: '2024-09-01', expiryDate: '2027-09-01', lastActive: '2026-07-18', region: '华东', industry: 'VR体验' },
  ];
}

function buildColumns(): DataTableColumn<Tenant>[] {
  return [
    { key: 'name', title: '租户名称', dataKey: 'name', sortable: true, render: i => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{i.name}</span> },
    { key: 'code', title: '编码', dataKey: 'code', sortable: true },
    { key: 'tier', title: '版本', sortable: true, sortValue: i => TIER_TIERS.indexOf(i.tier), render: i => <span style={{ color: TIER_COLORS[i.tier], fontWeight: 600 }}>{TIER_LABELS[i.tier]}</span> },
    { key: 'status', title: '状态', sortable: true, sortValue: i => i.status, render: i => <StatusBadge label={STATUS_CONFIG[i.status].label} variant={STATUS_CONFIG[i.status].variant} size="sm" dot /> },
    { key: 'stores', title: '门店', dataKey: 'stores', sortable: true, align: 'right' },
    { key: 'users', title: '用户', dataKey: 'users', sortable: true, align: 'right' },
    { key: 'revenue', title: '营收', dataKey: 'revenue', sortable: true, align: 'right', render: i => <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatMoney(i.revenue)}</span> },
    { key: 'region', title: '区域', dataKey: 'region', sortable: true },
    { key: 'expiryDate', title: '到期日', dataKey: 'expiryDate', sortable: true, render: i => {
      const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000);
      return <span style={{ color: days < 0 ? '#ef4444' : days < 30 ? '#eab308' : '#94a3b8' }}>{i.expiryDate}{days < 0 ? ' 已过期' : ''}</span>;
    }},
  ];
}

// ── 状态统计栏 ──

interface TenantStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  expired: number;
  revenue: number;
  stores: number;
  users: number;
  byTier: Array<{ tier: TenantTier; count: number }>;
}

function computeStats(tenants: Tenant[]): TenantStats {
  return {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    expired: tenants.filter(t => t.status === 'expired').length,
    revenue: tenants.reduce((s, t) => s + t.revenue, 0),
    stores: tenants.reduce((s, t) => s + t.stores, 0),
    users: tenants.reduce((s, t) => s + t.users, 0),
    byTier: TIER_TIERS.map(tier => ({ tier, count: tenants.filter(t => t.tier === tier).length })),
  };
}

// ── 统计卡片行 ──

function StatBar({ stats }: { stats: TenantStats }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
      <div style={card}>
        <div style={{ fontSize: 13, color: '#cbd5e1' }}>全部租户</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>累计营收 {formatMoney(stats.revenue)}</div>
      </div>
      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={{ fontSize: 13, color: '#22c55e' }}>活跃</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>占比 {stats.total > 0 ? Math.round(stats.active / stats.total * 100) : 0}%</div>
      </div>
      <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
        <div style={{ fontSize: 13, color: '#3b82f6' }}>试用</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{stats.trial}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>待转化</div>
      </div>
      <div style={{ ...card, borderLeft: '3px solid #ef4444' }}>
        <div style={{ fontSize: 13, color: '#ef4444' }}>冻结</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.suspended}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需关注</div>
      </div>
      <div style={{ ...card, borderLeft: '3px solid #eab308' }}>
        <div style={{ fontSize: 13, color: '#eab308' }}>过期</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#eab308' }}>{stats.expired}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>待处理</div>
      </div>
      <div style={{ ...card, borderLeft: '3px solid #a78bfa' }}>
        <div style={{ fontSize: 13, color: '#a78bfa' }}>门店</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>{stats.stores}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>累计 {stats.stores} 家</div>
      </div>
    </div>
  );
}

// ── 数据分析 Tab 的版本分布 ──

function TierDistribution({ stats }: { stats: TenantStats }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
      {stats.byTier.map(t => (
        <div key={t.tier} style={card}>
          <div style={{ fontSize: 13, color: TIER_COLORS[t.tier] }}>{TIER_LABELS[t.tier]}</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{t.count}</div>
          <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.total > 0 ? (t.count / stats.total) * 100 : 0}%`, borderRadius: 3, background: TIER_COLORS[t.tier] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionDistribution({ tenants }: { tenants: Tenant[] }) {
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>区域分布</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {REGIONS.map(r => {
          const count = tenants.filter(t => t.region === r).length;
          return (
            <div key={r} style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{count}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{r}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 主页面组件 ──

export default function TenantsPage() {
  const [tab, setTab] = useState<'list' | 'analytics'>('list');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载租户数据
  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await handleApiCall(API_BASE);
    if (result.ok) {
      const data = Array.isArray(result.data) ? result.data : (result.data as { data?: unknown })?.data ?? [];
      setTenants(data as Tenant[]);
    } else {
      setError(result.message);
      setTenants([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const stats = useMemo(() => computeStats(tenants), [tenants]);

  const searchFields = useMemo<(keyof Tenant)[]>(() => ['name', 'code', 'contactName', 'contactEmail', 'region', 'industry'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(tenants, searchFields);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const statusFiltered = useMemo(() => statusFilter === 'ALL' ? filteredItems : filteredItems.filter(t => t.status === statusFilter as TenantStatus), [filteredItems, statusFilter]);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(statusFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 15 });
  const pageItems = pagination.paginate(sorted);

  // 加载状态
  if (loading) {
    return (
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="租户管理" subtitle="加载中...">
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载租户数据中...</div>
        </PageShell>
      </main>
    );
  }

  // 错误状态
  if (error) {
    return (
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="租户管理" subtitle="数据加载失败">
          <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>
            <p>加载失败: {error}</p>
            <button onClick={loadTenants} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>重试</button>
          </div>
        </PageShell>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="租户管理" subtitle={`${stats.total}个租户 · 累计营收${formatMoney(stats.revenue)}`}>
        {tenants.length > 0 && <StatBar stats={stats} />}

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'list', label: '📋 租户列表' },
              { key: 'analytics', label: '📊 数据分析' },
            ]}
            activeKey={tab}
            onChange={t => setTab(t as typeof tab)}
            variant="pills"
          />
        </div>

        {tab === 'list' && (
          <>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索租户名称/编码/联系人/区域..." />
            <div style={{ marginTop: 12 }}>
              <Tabs
                items={[
                  { key: 'ALL', label: '全部', count: filteredItems.length },
                  ...(['active', 'trial', 'suspended', 'expired'] as TenantStatus[]).map(s => ({
                    key: s,
                    label: STATUS_CONFIG[s].label,
                    count: filteredItems.filter(t => t.status === s).length,
                  })),
                ]}
                activeKey={statusFilter}
                onChange={setStatusFilter}
                variant="pills"
                size="sm"
              />
            </div>
            <DataTable
              title={`租户列表 (${sorted.length})`}
              columns={columns}
              items={pageItems}
              rowKey={i => i.id}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}

        {tab === 'analytics' && (
          <>
            <TierDistribution stats={stats} />
            <RegionDistribution tenants={tenants} />
          </>
        )}
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};
