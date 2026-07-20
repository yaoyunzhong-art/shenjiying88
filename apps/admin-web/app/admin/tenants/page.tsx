// @ts-nocheck
'use client';

/**
 * 管理后台 - 租户配额管理
 * 角色: 👑超级管理员 / 🏢总部管理
 * 功能: 展示所有租户的配额使用情况：店铺上限、用户上限、存储空间、当前使用量
 */

import { useState, useMemo, useEffect } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  SearchFilterInput,
  DataTable,
  Pagination,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

type QuotaStatus = 'normal' | 'warning' | 'critical';

interface TenantQuota {
  id: string;
  name: string;
  code: string;
  tier: string;
  status: 'active' | 'trial' | 'suspended' | 'expired';
  region: string;
  // 店铺配额
  storeLimit: number;
  storeUsed: number;
  // 用户配额
  userLimit: number;
  userUsed: number;
  // 存储配额
  storageLimitGB: number;
  storageUsedGB: number;
  // 其他
  apiQuotaDaily: number;
  apiUsedToday: number;
}

function computeQuotaStatus(used: number, limit: number): QuotaStatus {
  if (limit <= 0) return 'normal';
  const ratio = used / limit;
  if (ratio >= 0.9) return 'critical';
  if (ratio >= 0.7) return 'warning';
  return 'normal';
}

const QUOTA_STATUS_LABELS: Record<QuotaStatus, { label: string; variant: 'success' | 'warning' | 'danger'; color: string }> = {
  normal:   { label: '正常',   variant: 'success', color: '#22c55e' },
  warning:  { label: '紧张',   variant: 'warning', color: '#eab308' },
  critical: { label: '超限',   variant: 'danger',  color: '#ef4444' },
};

const TIER_LABELS: Record<string, string> = { free: '免费版', starter: '入门版', business: '商业版', enterprise: '企业版', premium: '旗舰版' };
const TIER_COLORS: Record<string, string> = { free: '#6b7280', starter: '#94a3b8', business: '#3b82f6', enterprise: '#8b5cf6', premium: '#eab308' };
const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '港澳台', '海外'];
const TIERS = ['free', 'starter', 'business', 'enterprise', 'premium'];

const tenantQuotas: TenantQuota[] = Array.from({ length: 32 }, (_, i) => {
  const tier = TIERS[Math.floor(Math.random() * TIERS.length)]!;
  const statuses = ['active', 'active', 'active', 'active', 'trial', 'suspended', 'expired'] as const;

  // 根据 tier 设置不同的配额上限
  const tierQuotaMap: Record<string, { storeLimit: number; userLimit: number; storageLimitGB: number; apiDaily: number }> = {
    free:       { storeLimit: 1,  userLimit: 5,  storageLimitGB: 5,   apiDaily: 1000 },
    starter:    { storeLimit: 3,  userLimit: 20, storageLimitGB: 20,  apiDaily: 5000 },
    business:   { storeLimit: 10, userLimit: 50, storageLimitGB: 100, apiDaily: 20000 },
    enterprise: { storeLimit: 50, userLimit: 200, storageLimitGB: 500, apiDaily: 100000 },
    premium:    { storeLimit: 999, userLimit: 9999, storageLimitGB: 2048, apiDaily: 500000 },
  };
  const quota = tierQuotaMap[tier]!;

  // 使用率模拟：大部分租户使用率在 30-80%，部分接近超限
  const usageBias = Math.random();
  const usedRatio = usageBias < 0.15 ? 0.85 + Math.random() * 0.18 // 15% 高用率
    : usageBias < 0.25 ? 0.05 + Math.random() * 0.15               // 10% 低用率
    : 0.3 + Math.random() * 0.5;                                    // 75% 中等

  const storeUsed = Math.max(1, Math.min(quota.storeLimit, Math.round(quota.storeLimit * usedRatio)));
  const userUsed = Math.max(1, Math.min(quota.userLimit, Math.round(quota.userLimit * usedRatio)));
  const storageUsedGB = Math.max(0.1, Math.round((quota.storageLimitGB * usedRatio) * 10) / 10);
  const apiUsedToday = Math.round(quota.apiDaily * (0.1 + Math.random() * 0.5));

  return {
    id: `TNT-${String(i + 1).padStart(3, '0')}`,
    name: ['欢乐谷电玩城', '星际联盟', '潮玩部落', '乐动空间', '极速竞界', '梦幻乐园', '时空隧道', '数字浪潮', '星河漫游', '未来玩家', '嗨玩天地', '酷炫基地', '童趣乐园', '电玩新天地', '竞界风云', '超级玩家'][i % 16]! + (i >= 16 ? '(分店)' : '旗舰店'),
    code: `TENANT-${String(1000 + i + 1)}`,
    tier,
    status: statuses[Math.floor(Math.random() * statuses.length)]!,
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)]!,
    storeLimit: quota.storeLimit,
    storeUsed,
    userLimit: quota.userLimit,
    userUsed,
    storageLimitGB: quota.storageLimitGB,
    storageUsedGB,
    apiQuotaDaily: quota.apiDaily,
    apiUsedToday,
  };
});

function buildColumns(): DataTableColumn<TenantQuota>[] {
  return [
    {
      key: 'name',
      title: '租户',
      dataKey: 'name',
      sortable: true,
      render: t => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{t.name}</span>,
      width: 160,
    },
    {
      key: 'tier',
      title: '版本',
      sortable: true,
      sortValue: t => t.tier,
      render: t => <span style={{ color: TIER_COLORS[t.tier]!, fontWeight: 600 }}>{TIER_LABELS[t.tier]}</span>,
      width: 90,
    },
    // ---- 店铺配额 ----
    {
      key: 'storeUsed',
      title: '店铺',
      sortable: true,
      align: 'right',
      render: t => renderQuotaCell(t.storeUsed, t.storeLimit),
      width: 130,
    },
    // ---- 用户配额 ----
    {
      key: 'userUsed',
      title: '用户',
      sortable: true,
      align: 'right',
      render: t => renderQuotaCell(t.userUsed, t.userLimit),
      width: 130,
    },
    // ---- 存储配额 ----
    {
      key: 'storageUsedGB',
      title: '存储',
      sortable: true,
      align: 'right',
      render: t => renderQuotaCell(t.storageUsedGB, t.storageLimitGB, 'GB'),
      width: 150,
    },
    // ---- API 配额 ----
    {
      key: 'apiUsedToday',
      title: 'API(今日)',
      sortable: true,
      align: 'right',
      render: t => renderQuotaCell(t.apiUsedToday, t.apiQuotaDaily),
      width: 140,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: t => t.status,
      render: t => {
        const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
          active: { label: '正常', variant: 'success' },
          trial: { label: '试用', variant: 'info' },
          suspended: { label: '暂停', variant: 'danger' },
          expired: { label: '过期', variant: 'warning' },
        };
        const s = statusConfig[t.status]!;
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
      width: 90,
    },
    {
      key: 'region',
      title: '区域',
      dataKey: 'region',
      sortable: true,
      width: 80,
    },
  ];
}

/** 渲染配额概要单元格 */
function renderQuotaCell(used: number, limit: number, unit?: string): JSX.Element {
  if (limit <= 0) return <span style={{ color: '#94a3b8' }}>—</span>;
  const ratio = used / limit;
  const status = computeQuotaStatus(used, limit);
  const color = QUOTA_STATUS_LABELS[status].color;
  const usedStr = typeof used === 'number' && !Number.isInteger(used) ? used.toFixed(1) : used.toLocaleString();
  const limitStr = limit.toLocaleString();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#e2e8f0' }}>
        {usedStr}
        {unit ?? ''}
        <span style={{ color: '#64748b', margin: '0 2px' }}>/</span>
        {limitStr}
        {unit ?? ''}
      </span>
      <span
        style={{
          display: 'inline-block',
          width: 48,
          height: 5,
          borderRadius: 3,
          background: 'rgba(148,163,184,0.15)',
          overflow: 'hidden',
          verticalAlign: 'middle',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${Math.min(ratio * 100, 100)}%`,
            borderRadius: 3,
            background: color,
            transition: 'width 0.3s',
          }}
        />
      </span>
    </span>
  );
}

/** 计算配额维度统计数据 */
function computeQuotaStats(items: TenantQuota[]) {
  let storeOver = 0, userOver = 0, storageOver = 0, apiOver = 0;
  let storeWarn = 0, userWarn = 0, storageWarn = 0, apiWarn = 0;
  for (const t of items) {
    if (t.storeLimit > 0 && t.storeUsed / t.storeLimit >= 0.9) storeOver++;
    else if (t.storeLimit > 0 && t.storeUsed / t.storeLimit >= 0.7) storeWarn++;
    if (t.userLimit > 0 && t.userUsed / t.userLimit >= 0.9) userOver++;
    else if (t.userLimit > 0 && t.userUsed / t.userLimit >= 0.7) userWarn++;
    if (t.storageLimitGB > 0 && t.storageUsedGB / t.storageLimitGB >= 0.9) storageOver++;
    else if (t.storageLimitGB > 0 && t.storageUsedGB / t.storageLimitGB >= 0.7) storageWarn++;
    if (t.apiQuotaDaily > 0 && t.apiUsedToday / t.apiQuotaDaily >= 0.9) apiOver++;
    else if (t.apiQuotaDaily > 0 && t.apiUsedToday / t.apiQuotaDaily >= 0.7) apiWarn++;
  }
  return { storeOver, storeWarn, userOver, userWarn, storageOver, storageWarn, apiOver, apiWarn };
}

export default function AdminTenantsQuotaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TenantQuota[] | null>(null);

  useEffect(() => {
    try {
      setData(tenantQuotas);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></main>;
  if (error) return <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></main>;
  if (!data || data.length === 0) return <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></main>;

  const
  const [tab, setTab] = useState<'quota' | 'overview'>('quota');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const searchFields = useMemo<(keyof TenantQuota)[]>(() => ['name', 'code', 'region', 'tier'], []);
  const [searchTerm, setSearchTerm] = useState('');
  const { filteredItems } = useSearchFilter(tenantQuotas, searchFields);

  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const tierFiltered = useMemo(
    () => (tierFilter === 'ALL' ? filteredItems : filteredItems.filter(t => t.tier === tierFilter)),
    [filteredItems, tierFilter],
  );

  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(tierFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 15 });
  const pageItems = pagination.paginate(sorted);

  // ---- 汇总统计 ----
  const stats = useMemo(() => {
    const items = tenantQuotas;
    const total = items.length;
    const totalStoreUsed = items.reduce((s, t) => s + t.storeUsed, 0);
    const totalStoreLimit = items.reduce((s, t) => s + t.storeLimit, 0);
    const totalUserUsed = items.reduce((s, t) => s + t.userUsed, 0);
    const totalUserLimit = items.reduce((s, t) => s + t.userLimit, 0);
    const totalStorageUsed = items.reduce((s, t) => s + t.storageUsedGB, 0);
    const totalStorageLimit = items.reduce((s, t) => s + t.storageLimitGB, 0);

    const dimensionStats = computeQuotaStats(items);

    return {
      total,
      totalStoreUsed,
      totalStoreLimit,
      totalUserUsed,
      totalUserLimit,
      totalStorageUsed,
      totalStorageLimit,
      ...dimensionStats,
    };
  }, []);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell title="租户配额管理" subtitle={`${stats.total}个租户 · 配额使用情况概览`}>
        {/* ---- 配额一览统计卡 ---- */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>店铺容量</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
              {stats.totalStoreUsed.toLocaleString()}
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}> / {stats.totalStoreLimit.toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 10, fontSize: 12 }}>
              <span style={{ color: '#ef4444' }}>超限 {stats.storeOver}</span>
              <span style={{ color: '#eab308' }}>紧张 {stats.storeWarn}</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>用户容量</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
              {stats.totalUserUsed.toLocaleString()}
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}> / {stats.totalUserLimit.toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 10, fontSize: 12 }}>
              <span style={{ color: '#ef4444' }}>超限 {stats.userOver}</span>
              <span style={{ color: '#eab308' }}>紧张 {stats.userWarn}</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>存储容量</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>
              {stats.totalStorageUsed.toFixed(1)}GB
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}> / {stats.totalStorageLimit}GB</span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 10, fontSize: 12 }}>
              <span style={{ color: '#ef4444' }}>超限 {stats.storageOver}</span>
              <span style={{ color: '#eab308' }}>紧张 {stats.storageWarn}</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>需关注租户</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#f97316' }}>
              {stats.storeOver + stats.userOver + stats.storageOver + stats.apiOver}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#eab308' }}>
              紧张 {stats.storeWarn + stats.userWarn + stats.storageWarn + stats.apiWarn}
            </div>
          </div>
        </div>

        {/* ---- Tabs ---- */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'quota', label: '📋 配额列表' },
              { key: 'overview', label: '📊 概况' },
            ]}
            activeKey={tab}
            onChange={t => setTab(t as typeof tab)}
            variant="pills"
          />
        </div>

        {/* ===== Tab: 配额列表 ===== */}
        {tab === 'quota' && (
          <>
            <SearchFilterInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="搜索租户名称/编码/区域..."
            />
            <div style={{ marginTop: 12 }}>
              <Tabs
                items={[
                  { key: 'ALL', label: '全部', count: filteredItems.length },
                  ...TIERS.map(t => ({ key: t, label: TIER_LABELS[t]!, count: filteredItems.filter(x => x.tier === t).length })),
                ]}
                activeKey={tierFilter}
                onChange={setTierFilter}
                variant="pills"
                size="sm"
              />
            </div>
            <DataTable
              title={`配额列表 (${sorted.length})`}
              columns={columns}
              items={pageItems}
              rowKey={t => t.id}
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

        {/* ===== Tab: 概况分析 ===== */}
        {tab === 'overview' && (
          <>
            {/* 版本分布 */}
            <div style={cardSection}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>版本配额分布</h3>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {TIERS.map(tier => {
                  const items = tenantQuotas.filter(t => t.tier === tier);
                  const avgStore = items.reduce((s, t) => s + (t.storeLimit > 0 ? t.storeUsed / t.storeLimit : 0), 0) / (items.length || 1);
                  const avgUser = items.reduce((s, t) => s + (t.userLimit > 0 ? t.userUsed / t.userLimit : 0), 0) / (items.length || 1);
                  const avgStorage = items.reduce((s, t) => s + (t.storageLimitGB > 0 ? t.storageUsedGB / t.storageLimitGB : 0), 0) / (items.length || 1);
                  const overLimit = items.filter(t => computeQuotaStatus(t.storeUsed, t.storeLimit) === 'critical' || computeQuotaStatus(t.userUsed, t.userLimit) === 'critical').length;
                  return (
                    <div key={tier} style={card}>
                      <div style={{ fontSize: 13, color: TIER_COLORS[tier]!, fontWeight: 600 }}>{TIER_LABELS[tier]}</div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{items.length}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
                        <div>店铺均用率: <span style={{ color: getRatioColor(avgStore) }}>{(avgStore * 100).toFixed(0)}%</span></div>
                        <div>用户均用率: <span style={{ color: getRatioColor(avgUser) }}>{(avgUser * 100).toFixed(0)}%</span></div>
                        <div>存储均用率: <span style={{ color: getRatioColor(avgStorage) }}>{(avgStorage * 100).toFixed(0)}%</span></div>
                        {overLimit > 0 && <div style={{ color: '#ef4444', marginTop: 2 }}>⚠ {overLimit}个超限</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 按区域统计 */}
            <div style={{ ...cardSection, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>区域配额概况</h3>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {REGIONS.map(r => {
                  const items = tenantQuotas.filter(t => t.region === r);
                  const avgStore = items.reduce((s, t) => s + (t.storeLimit > 0 ? t.storeUsed / t.storeLimit : 0), 0) / (items.length || 1);
                  const avgUser = items.reduce((s, t) => s + (t.userLimit > 0 ? t.userUsed / t.userLimit : 0), 0) / (items.length || 1);
                  const overCount = items.filter(t => computeQuotaStatus(t.storeUsed, t.storeLimit) === 'critical' || computeQuotaStatus(t.userUsed, t.userLimit) === 'critical').length;
                  return (
                    <div key={r} style={{ padding: 14, borderRadius: 12, background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148,163,184,0.18)' }}>
                      <div style={{ fontWeight: 600, color: '#cbd5e1' }}>{r}</div>
                      <div style={{ marginTop: 4, fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{items.length}</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
                        <div>店铺均用率 <span style={{ color: getRatioColor(avgStore) }}>{(avgStore * 100).toFixed(0)}%</span></div>
                        <div>用户均用率 <span style={{ color: getRatioColor(avgUser) }}>{(avgUser * 100).toFixed(0)}%</span></div>
                        {overCount > 0 && <div style={{ color: '#ef4444' }}>{overCount}个超限</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 风险预警 */}
            <div style={{ ...cardSection, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#f97316' }}>⚠ 风险预警</h3>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>超限租户 (使用率 ≥ 90%)</div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#e2e8f0', lineHeight: 2 }}>
                    <div>店铺超限: <span style={{ color: '#ef4444', fontWeight: 700 }}>{stats.storeOver}</span> 个</div>
                    <div>用户超限: <span style={{ color: '#ef4444', fontWeight: 700 }}>{stats.userOver}</span> 个</div>
                    <div>存储超限: <span style={{ color: '#ef4444', fontWeight: 700 }}>{stats.storageOver}</span> 个</div>
                    <div>API超限:  <span style={{ color: '#ef4444', fontWeight: 700 }}>{stats.apiOver}</span> 个</div>
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>需关注 (使用率 ≥ 70%)</div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#e2e8f0', lineHeight: 2 }}>
                    <div>店铺: <span style={{ color: '#eab308', fontWeight: 700 }}>{stats.storeWarn}</span> 个</div>
                    <div>用户: <span style={{ color: '#eab308', fontWeight: 700 }}>{stats.userWarn}</span> 个</div>
                    <div>存储: <span style={{ color: '#eab308', fontWeight: 700 }}>{stats.storageWarn}</span> 个</div>
                    <div>API:  <span style={{ color: '#eab308', fontWeight: 700 }}>{stats.apiWarn}</span> 个</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </PageShell>
    </main>
  );
}

function getRatioColor(ratio: number): string {
  if (ratio >= 0.9) return '#ef4444';
  if (ratio >= 0.7) return '#eab308';
  if (ratio >= 0.4) return '#22c55e';
  return '#94a3b8';
}

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const cardSection: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};
