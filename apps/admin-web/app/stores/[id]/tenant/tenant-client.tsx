'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { StoreTenantRecord, TenantSnapshotDelivery, TenantStatus } from './tenant-data';

const PAGE_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  color: '#e2e8f0',
};

const CARD_STYLE: CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: '#0f172a',
  padding: 16,
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
};

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
};

const FILTER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(160px, 180px) minmax(160px, 180px) auto',
  alignItems: 'center',
};

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: '活跃',
  trial: '试用',
  pending: '待激活',
  migration: '迁移中',
};

const STATUS_COLOR: Record<TenantStatus, string> = {
  active: '#22c55e',
  trial: '#38bdf8',
  pending: '#f59e0b',
  migration: '#a855f7',
};

function formatMoney(value: number) {
  return `¥${value.toLocaleString('zh-CN')}`;
}

function readValue(value: string | string[] | null) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function TenantClient({
  snapshot,
}: {
  snapshot: TenantSnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [keyword, setKeyword] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [focusTenantId, setFocusTenantId] = useState(
    snapshot.tenants.some((tenant) => tenant.id === snapshot.tenantId)
      ? snapshot.tenantId
      : snapshot.tenants[0]?.id ?? '',
  );

  const refreshSnapshot = useCallback(
    (nextTenantId = focusTenantId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tenantId', nextTenantId || snapshot.tenantId);
      startRefresh(() => {
        router.replace(`${pathname}?${params.toString()}`);
        router.refresh();
      });
    },
    [focusTenantId, pathname, router, searchParams, snapshot.tenantId, startRefresh],
  );

  const filteredTenants = useMemo(() => {
    return snapshot.tenants.filter((tenant) => {
      const matchesKeyword =
        !keyword ||
        tenant.name.includes(keyword) ||
        tenant.brand.includes(keyword) ||
        tenant.id.includes(keyword);
      const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      return matchesKeyword && matchesPlan && matchesStatus;
    });
  }, [keyword, planFilter, snapshot.tenants, statusFilter]);

  const focusTenant: StoreTenantRecord | null =
    filteredTenants.find((tenant) => tenant.id === focusTenantId) ??
    snapshot.tenants.find((tenant) => tenant.id === focusTenantId) ??
    filteredTenants[0] ??
    snapshot.tenants[0] ??
    null;

  return (
    <div style={PAGE_STYLE}>
      <div style={{ ...CARD_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#f8fafc' }}>门店租户台账</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            门店 {snapshot.storeId} 的套餐、隔离得分、迁移状态统一在当前快照内展示。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: '#94a3b8', fontSize: 13 }}>当前 tenant</label>
          <select
            value={focusTenantId}
            onChange={(event) => setFocusTenantId(event.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#020617',
              color: '#e2e8f0',
            }}
          >
            {snapshot.tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refreshSnapshot()}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>
      </div>

      <div style={GRID_STYLE}>
        {[
          { label: '租户总数', value: String(snapshot.metrics.total) },
          { label: '活跃租户', value: String(snapshot.metrics.active) },
          { label: '试用 / 待激活', value: String(snapshot.metrics.trial + snapshot.metrics.pending) },
          { label: '月营收汇总', value: formatMoney(snapshot.metrics.monthlyRevenue) },
        ].map((item) => (
          <div key={item.label} style={CARD_STYLE}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={CARD_STYLE}>
        <div style={FILTER_STYLE}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索租户名称 / 品牌 / ID"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#020617',
              color: '#e2e8f0',
            }}
          />
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#020617',
              color: '#e2e8f0',
            }}
          >
            <option value="all">全部套餐</option>
            {snapshot.planOptions.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TenantStatus | 'all')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#020617',
              color: '#e2e8f0',
            }}
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="trial">试用</option>
            <option value="pending">待激活</option>
            <option value="migration">迁移中</option>
          </select>
          <button
            type="button"
            onClick={() => refreshSnapshot(focusTenantId)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#020617',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            以当前 tenant 刷新
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: 13, textAlign: 'left' }}>
              <th style={{ padding: '10px 8px' }}>租户</th>
              <th style={{ padding: '10px 8px' }}>套餐</th>
              <th style={{ padding: '10px 8px' }}>门店 / 用户</th>
              <th style={{ padding: '10px 8px' }}>隔离得分</th>
              <th style={{ padding: '10px 8px' }}>月营收</th>
              <th style={{ padding: '10px 8px' }}>状态</th>
              <th style={{ padding: '10px 8px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ fontWeight: 700 }}>{tenant.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>
                    {tenant.id} / {tenant.brand}
                  </div>
                </td>
                <td style={{ padding: '12px 8px' }}>{tenant.plan}</td>
                <td style={{ padding: '12px 8px' }}>
                  {tenant.stores} 店 / {tenant.users} 人
                </td>
                <td style={{ padding: '12px 8px' }}>{tenant.isolationScore} 分</td>
                <td style={{ padding: '12px 8px' }}>{formatMoney(tenant.monthlyRevenue)}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 999,
                      padding: '4px 10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: STATUS_COLOR[tenant.status],
                      border: `1px solid ${STATUS_COLOR[tenant.status]}`,
                    }}
                  >
                    {STATUS_LABEL[tenant.status]}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <button
                    type="button"
                    onClick={() => setFocusTenantId(tenant.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      background: '#020617',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 0.8fr' }}>
        <div style={CARD_STYLE}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f8fafc' }}>租户详情</h2>
          {focusTenant ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{focusTenant.name}</div>
              <div style={{ color: '#94a3b8' }}>
                {focusTenant.region} / 创建于 {focusTenant.createdAt}
              </div>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>迁移阶段</div>
                  <div style={{ marginTop: 6 }}>{focusTenant.migrationStage}</div>
                </div>
                <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>控制面隔离得分</div>
                  <div style={{ marginTop: 6 }}>{focusTenant.isolationScore} / 100</div>
                </div>
                <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>当前套餐</div>
                  <div style={{ marginTop: 6 }}>{focusTenant.plan}</div>
                </div>
                <div style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>关联门店数</div>
                  <div style={{ marginTop: 6 }}>{focusTenant.stores}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, color: '#94a3b8' }}>暂无可展示的租户。</div>
          )}
        </div>

        <div style={CARD_STYLE}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f8fafc' }}>迁移排队</h2>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {snapshot.migrationQueue.map((task) => (
              <div key={task.id} style={{ borderRadius: 12, background: '#020617', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{task.title}</strong>
                  <span style={{ color: '#38bdf8' }}>{task.stage}</span>
                </div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{task.tenantId}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>
                  {task.owner} / ETA {task.eta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ color: '#94a3b8', fontSize: 12 }}>
        query.tenantId = {readValue(searchParams.get('tenantId')) || snapshot.tenantId} / generatedAt ={' '}
        {snapshot.generatedAt}
      </div>
    </div>
  );
}
