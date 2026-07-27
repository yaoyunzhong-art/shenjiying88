'use client';
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  FilterChips,
  FormSubmitFeedback,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  SubmitButton,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip,
} from '@m5/ui';

import {
  STORE_RISK_LEVEL_MAP,
  STORE_RISK_LEVELS,
  STORE_STATUSES,
  STORE_STATUS_MAP,
  computeStoreMarketDistribution,
  computeStoreStats,
  type StoreItem,
  type StoreRiskLevel,
  type StoreStatus,
} from '../stores-data';
import { StoreCapabilityActionStrip } from '../components/store-capability-action-strip';
import { StoreCapabilityGatingBanner } from '../components/store-capability-gating-banner';
import { useDetailActions } from '../components/use-detail-actions';
import { useStoreCapabilityGating } from '../components/use-store-capability-gating';
import {
  deriveScopedCapabilityActionItem,
  type GatedCapabilityActionItem,
} from '../lyt-capability-access';
import type { StoresPageSnapshot } from './stores-page-data';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

function buildColumns(
  onRowClick: (item: StoreItem) => void,
  canEdit: boolean,
  onDelete: (item: StoreItem) => void,
): DataTableColumn<StoreItem>[] {
  return [
    {
      key: 'code',
      title: '门店编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '门店名称',
      dataKey: 'name',
      sortable: true,
      render: (item: StoreItem) => (
        <span
          onClick={(event) => {
            event.stopPropagation();
            if (canEdit) onRowClick(item);
          }}
          style={{
            color: canEdit ? '#93c5fd' : '#94a3b8',
            cursor: canEdit ? 'pointer' : 'not-allowed',
            textDecoration: canEdit ? 'underline' : 'none',
          }}
          title={canEdit ? '查看门店详情 / 编辑' : '当前门店能力受阻，详情入口暂不可用'}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'marketCode',
      title: '市场',
      dataKey: 'marketCode',
      sortable: true,
      render: (item: StoreItem) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.marketCode}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: StoreItem) => item.status,
      render: (item: StoreItem) => {
        const status = STORE_STATUS_MAP[item.status];
        return <StatusBadge label={status.label} variant={status.variant} size="sm" dot />;
      },
    },
    {
      key: 'tenantCount',
      title: '租户数',
      dataKey: 'tenantCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'brandCount',
      title: '品牌数',
      dataKey: 'brandCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      sortable: true,
      sortValue: (item: StoreItem) => {
        const order: Record<StoreRiskLevel, number> = { low: 0, medium: 1, high: 2 };
        return order[item.riskLevel];
      },
      render: (item: StoreItem) => {
        const risk = STORE_RISK_LEVEL_MAP[item.riskLevel];
        return <StatusBadge label={risk.label} variant={risk.variant} size="sm" />;
      },
    },
    {
      key: 'lastDeployed',
      title: '最后部署',
      dataKey: 'lastDeployed',
      sortable: true,
    },
    {
      key: 'actions',
      title: '操作',
      render: (item: StoreItem) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRowClick(item);
            }}
            style={actionBtnStyle}
            title="编辑门店"
          >
            ✏️
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item);
            }}
            style={{ ...actionBtnStyle, color: '#f87171' }}
            title="删除门店"
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];
}

export default function StoresClient({
  snapshot,
}: {
  snapshot: StoresPageSnapshot;
}) {
  const router = useRouter();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [storesState, setStoresState] = useState<{
    deliveryMode: 'api' | 'fallback';
    stores: StoreItem[];
  }>({ deliveryMode: snapshot.deliveryMode, stores: snapshot.stores });
  const [deleteConfirm, setDeleteConfirm] = useState<StoreItem | null>(null);
  const [deleteResult, setDeleteResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'ALL'>('ALL');
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<StoreRiskLevel | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  useEffect(() => {
    setStoresState({ deliveryMode: snapshot.deliveryMode, stores: snapshot.stores });
  }, [snapshot.deliveryMode, snapshot.stores]);

  const stores = storesState.stores;
  const stats = useMemo(() => computeStoreStats(stores), [stores]);
  const marketDistribution = useMemo(() => computeStoreMarketDistribution(stores), [stores]);

  const searchFields = useMemo<(keyof StoreItem)[]>(
    () => ['code', 'name', 'marketCode'] as (keyof StoreItem)[],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(stores, searchFields);

  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter],
  );

  const allMarkets = useMemo(() => [...new Set(stores.map((item) => item.marketCode))].sort(), [stores]);
  const marketFiltered = useMemo(
    () => (marketFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.marketCode === marketFilter)),
    [statusFiltered, marketFilter],
  );

  const riskFiltered = useMemo(
    () => (riskFilter === 'ALL' ? marketFiltered : marketFiltered.filter((item) => item.riskLevel === riskFilter)),
    [marketFiltered, riskFilter],
  );

  const storeGating = useStoreCapabilityGating({ targetCapabilities: ['store-mgmt'] });
  const canEditStore = Boolean(storeGating.primaryNavigableAction);
  const handleRowClick = useCallback(
    (item: StoreItem) => {
      if (!canEditStore) return;
      router.push(`/stores/${item.id}`);
    },
    [canEditStore, router],
  );

  const handleDelete = useCallback((item: StoreItem) => {
    setDeleteConfirm(item);
    setDeleteResult('idle');
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setDeleteResult('success');
      setStoresState((previous) => ({
        ...previous,
        stores: previous.stores.filter((item) => item.id !== deleteConfirm.id),
      }));
    } catch {
      setDeleteResult('error');
    }
  }, [deleteConfirm]);

  const dismissDelete = useCallback(() => {
    setDeleteConfirm(null);
    setDeleteResult('idle');
  }, []);

  const columns = useMemo(
    () => buildColumns(handleRowClick, canEditStore, handleDelete),
    [handleDelete, handleRowClick, canEditStore],
  );
  const sortedItems = useSortedItems(riskFiltered, columns, sortConfig);

  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [...PAGE_SIZE_OPTIONS] });
  useEffect(
    () => {
      pagination.resetPage();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchTerm, statusFilter, marketFilter, riskFilter],
  );
  const pageItems = pagination.paginate(sortedItems);

  const storeBulkActions = useMemo<GatedCapabilityActionItem[]>(() => {
    const baseAction = storeGating.visibleActions[0];
    if (!baseAction) return [];

    return [
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'store-bulk-export',
        label: baseAction.isDisabled
          ? '等待门店批量导出'
          : baseAction.access === 'degraded'
            ? '降级批量导出'
            : '门店批量导出',
        href: '/stores?focus=bulk-export',
        hint: `${baseAction.hint} 用于批量导出门店数据`,
      }),
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'store-bulk-update',
        label: baseAction.isDisabled
          ? '等待门店批量更新'
          : baseAction.access === 'degraded'
            ? '降级批量更新'
            : '门店批量更新',
        href: '/stores?focus=bulk-update',
        hint: `${baseAction.hint} 用于批量更新门店状态/风险等级`,
      }),
    ];
  }, [storeGating.visibleActions]);

  const { actions } = useDetailActions({
    workspace: 'stores',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, marketFilter, riskFilter, stats, marketDistribution },
    shareTitle: '门店管理中心',
    shareText: '查看门店 / 市场 / 风险等级筛选结果',
  });

  

  if (stores.length === 0) {
    return (
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
        <PageShell title="门店管理中心" subtitle="暂无门店数据，请先创建门店。">
          <div
            style={{
              textAlign: 'center',
              padding: 64,
              borderRadius: 16,
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: 'rgba(15, 23, 42, 0.38)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>暂无门店</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 16 }}>
              当前系统中没有已注册的门店，点击下方按钮创建第一个门店。
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <SubmitButton variant="primary" onClick={() => router.push('/stores/new')}>
                ➕ 新建门店
              </SubmitButton>
              <SubmitButton variant="secondary" onClick={handleRefresh}>
                {isRefreshing ? '刷新中...' : '刷新快照'}
              </SubmitButton>
            </div>
          </div>
        </PageShell>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="门店管理中心"
        subtitle={`统一管理所有市场下的门店运营状态、租户品牌关联及风险等级。当前数据源：${
          storesState.deliveryMode === 'api' ? '真实 API' : '演示数据'
        }。`}
      >
        {snapshot.error ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              background: 'rgba(120, 53, 15, 0.22)',
              color: '#fcd34d',
              fontSize: 13,
            }}
          >
            {snapshot.error}
          </div>
        ) : null}

        {isRefreshing ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: 'rgba(15, 23, 42, 0.35)',
              color: '#cbd5e1',
              fontSize: 13,
            }}
          >
            正在通过服务端快照刷新门店中心...
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <SubmitButton variant="secondary" onClick={handleRefresh}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </SubmitButton>
        </div>

        <StoreCapabilityGatingBanner
          title="门店入口治理"
          description="门店中心已接入 LYT capability access。页面入口、批量操作与编辑功能应按 store-mgmt capability 的 enabled / degraded / blocked / hidden 自动降级。"
          targetCapabilities={['store-mgmt']}
          surfaceHref="/"
          surfaceLabel="返回首页"
        />

        <StoreCapabilityActionStrip
          title="门店批量动作"
          description="门店批量动作会直接复用 store-mgmt capability gating。blocked 时禁用，degraded 时允许进入但保留风险提示。"
          actions={storeBulkActions}
          emptyHint="当前没有可执行的门店批量动作，请先检查 store-mgmt capability access。"
        />

        {!canEditStore && !storeGating.isLoading ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              background: 'rgba(127, 29, 29, 0.22)',
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            当前门店的 store-mgmt capability 处于阻塞或隐藏状态，门店名称行点击已禁用，请先处理能力矩阵中的治理问题。
          </div>
        ) : null}

        {deleteConfirm ? (
          <FormSubmitFeedback
            success={deleteResult === 'success' ? `门店「${deleteConfirm.name}」已删除` : undefined}
            error={deleteResult === 'error' ? '删除失败，请重试' : undefined}
            onDismissSuccess={dismissDelete}
            onDismissError={() => setDeleteResult('idle')}
            onRetry={confirmDelete}
          >
            <div
              style={{
                marginBottom: 16,
                borderRadius: 12,
                padding: '16px 18px',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                background: 'rgba(127, 29, 29, 0.18)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fecaca', marginBottom: 8 }}>
                确认删除门店「{deleteConfirm.name}」？
              </div>
              <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 12 }}>
                编码：{deleteConfirm.code} | 市场：{deleteConfirm.marketCode}。此操作不可逆。
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SubmitButton variant="danger" onClick={confirmDelete}>
                  确认删除
                </SubmitButton>
                <SubmitButton variant="secondary" onClick={dismissDelete}>
                  取消
                </SubmitButton>
              </div>
            </div>
          </FormSubmitFeedback>
        ) : null}

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>门店总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {Object.keys(marketDistribution).length} 个市场
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>运营中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}% 健康率` : '-'}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总租户数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.totalTenants}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>所有门店累计租户</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>高风险门店</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.highRisk}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需重点关注</div>
          </article>
        </div>

        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索门店编码 / 名称 / 市场..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: stores.length },
              ...STORE_STATUSES.map((status) => ({
                key: status,
                label: STORE_STATUS_MAP[status].label,
                count: stores.filter((item) => item.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as StoreStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...allMarkets.map((marketCode) => ({
                  key: marketCode,
                  label: marketCode,
                  count: statusFiltered.filter((item) => item.marketCode === marketCode).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>风险等级</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                ...STORE_RISK_LEVELS.map((riskLevel) => ({
                  key: riskLevel,
                  label: STORE_RISK_LEVEL_MAP[riskLevel].label,
                  count: marketFiltered.filter((item) => item.riskLevel === riskLevel).length,
                })),
              ]}
              activeKey={riskFilter}
              onChange={(key) => setRiskFilter(key as StoreRiskLevel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [{
                  key: 'status' as const,
                  label: STORE_STATUS_MAP[statusFilter].label,
                  tone: (STORE_STATUS_MAP[statusFilter].variant === 'success'
                    ? 'success'
                    : STORE_STATUS_MAP[statusFilter].variant === 'warning'
                      ? 'warning'
                      : STORE_STATUS_MAP[statusFilter].variant === 'danger'
                        ? 'danger'
                        : 'neutral') as FilterChip['tone'],
                  count: statusFiltered.filter((item) => item.status === statusFilter).length,
                }]
              : []),
            ...(marketFilter !== 'ALL'
              ? [{
                  key: 'market' as const,
                  label: marketFilter,
                  tone: 'neutral' as FilterChip['tone'],
                  count: statusFiltered.filter((item) => item.marketCode === marketFilter).length,
                }]
              : []),
            ...(riskFilter !== 'ALL'
              ? [{
                  key: 'risk' as const,
                  label: STORE_RISK_LEVEL_MAP[riskFilter].label,
                  tone: (STORE_RISK_LEVEL_MAP[riskFilter].variant === 'danger'
                    ? 'danger'
                    : STORE_RISK_LEVEL_MAP[riskFilter].variant === 'warning'
                      ? 'warning'
                      : 'neutral') as FilterChip['tone'],
                  count: marketFiltered.filter((item) => item.riskLevel === riskFilter).length,
                }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
              case 'risk':
                setRiskFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setMarketFilter('ALL');
            setRiskFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        <DataTable
          title={`门店列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />

        <section
          style={{
            marginTop: 24,
            marginBottom: 24,
            borderRadius: 16,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>
            快捷操作
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <QuickActionLink href="/stores/new" icon="➕" label="新建门店" description="创建新的门店档案" />
            <QuickActionLink href="/stores/form" icon="📝" label="编辑门店" description="修改现有门店信息" />
            <QuickActionLink
              href={`/stores/${stores[0]?.id ?? ''}`}
              icon="📋"
              label="门店详情"
              description="查看门店详细配置"
            />
            <QuickActionLink href="/workbench/store-manager" icon="⚙️" label="运营工作台" description="门店运营管理" />
            <QuickActionLink href="/reports/store-summary" icon="📊" label="门店报表" description="数据分析与报表" />
          </div>
        </section>

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前门店管理中心筛选快照"
        />
      </PageShell>
    </main>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 12,
        background: 'rgba(30, 41, 59, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        minWidth: 180,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{description}</div>
      </div>
    </a>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.5)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 8,
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  transition: 'all 0.15s ease',
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};
