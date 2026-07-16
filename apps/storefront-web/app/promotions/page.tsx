'use client';

import React, { useMemo, useState } from 'react';

import {
  Badge,
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  usePagination,
  useSearchFilter,
  type BadgeVariant,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type PromotionStatus = 'draft' | 'active' | 'paused' | 'ended';

interface Promotion {
  id: string;
  title: string;
  type: 'discount' | 'coupon' | 'gift' | 'flash-sale';
  status: PromotionStatus;
  storeName: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
  usageGrowth: number;
  roi: number;
}

// ---- 模拟数据 ----

const STORE_NAMES: string[] = ['旗舰店', '南山分店', '福田分店', '宝安店', '龙华店'];
const PROMOTION_TYPES: Promotion['type'][] = ['discount', 'coupon', 'gift', 'flash-sale'];
const PROMOTION_STATUSES: Promotion['status'][] = [
  'draft',
  'active',
  'paused',
  'ended',
];

const PROMOTION_TITLES: string[] = [
  '夏日清凉大促',
  '会员专属折扣',
  '满减优惠券',
  '买一送一活动',
  '双倍积分活动',
  '新品首发特价',
  '限时秒杀',
  '周末特惠',
  '节日礼包',
  '老客回馈',
];

function generateMockPromotions(count: number): Promotion[] {
  const now = Date.now();
  const result: Promotion[] = [];
  for (let i = 0; i < count; i++) {
    const status = PROMOTION_STATUSES[i % PROMOTION_STATUSES.length]!;
    const startOffset =
      status === 'draft'
        ? 86400000 * (1 + Math.floor(i / 4))
        : status === 'active'
          ? -86400000 * (1 + Math.floor(i / 3))
          : status === 'paused'
            ? -86400000 * 3
            : -86400000 * 10;
    const endOffset =
      status === 'draft'
        ? 86400000 * (15 + Math.floor(i / 2))
        : status === 'active'
          ? 86400000 * (5 + Math.floor(i / 2))
          : status === 'paused'
            ? 86400000 * 2
            : -86400000 * 3;
    const promo: Promotion = {
      id: `promo-${i + 1}`,
      title: PROMOTION_TITLES[i % PROMOTION_TITLES.length]!,
      type: PROMOTION_TYPES[i % PROMOTION_TYPES.length]!,
      status: PROMOTION_STATUSES[i % PROMOTION_STATUSES.length]!,
      storeName: STORE_NAMES[i % STORE_NAMES.length]!,
      startDate: new Date(now + startOffset).toISOString().slice(0, 10),
      endDate: new Date(now + endOffset).toISOString().slice(0, 10),
      budget: Math.round(Math.random() * 100000) / 100,
      usageCount: Math.floor(Math.random() * 5000),
      usageGrowth: Math.round((Math.random() * 50 - 10) * 10) / 10,
      roi: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
    };
    result.push(promo);
  }
  return result;
}

const MOCK_DATA: Promotion[] = generateMockPromotions(36);

// ---- 类型标签映射 ----

const TYPE_LABELS: Record<string, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const TYPE_COLORS: Record<string, BadgeVariant> = {
  discount: 'default',
  coupon: 'success',
  gift: 'warning',
  'flash-sale': 'purple',
};

const STATUS_FILTERS = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '进行中' },
  { value: 'draft', label: '草稿' },
  { value: 'paused', label: '已暂停' },
  { value: 'ended', label: '已结束' },
];

const TYPE_FILTERS = [
  { value: '', label: '全部类型' },
  { value: 'discount', label: '折扣' },
  { value: 'coupon', label: '优惠券' },
  { value: 'gift', label: '赠品' },
  { value: 'flash-sale', label: '秒杀' },
];

// ---- 页面组件 ----

export default function StorePromotionsPage() {
  const { searchTerm, setSearchTerm, filteredItems: filteredBySearch } =
    useSearchFilter(MOCK_DATA, ['title', 'storeName']);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { page, pageSize, setPage, setPageSize } = usePagination({ initialPageSize: 10 });

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const stats = React.useMemo(() => {
    const active = MOCK_DATA.filter(d => d.status === 'active').length;
    const draft = MOCK_DATA.filter(d => d.status === 'draft').length;
    const ended = MOCK_DATA.filter(d => d.status === 'ended').length;
    const totalBudget = MOCK_DATA.reduce((s, d) => s + d.budget, 0);
    const totalUsage = MOCK_DATA.reduce((s, d) => s + d.usageCount, 0);
    const byStore: Record<string, number> = {};
    MOCK_DATA.forEach(d => { byStore[d.storeName] = (byStore[d.storeName] || 0) + 1; });
    return { active, draft, ended, totalBudget, totalUsage, total: MOCK_DATA.length, byStore };
  }, []);

  // 应用过滤器
  const filtered = useMemo(() => {
    let data = filteredBySearch;
    if (statusFilter) {
      data = data.filter((d) => d.status === statusFilter);
    }
    if (typeFilter) {
      data = data.filter((d) => d.type === typeFilter);
    }
    return data;
  }, [filteredBySearch, statusFilter, typeFilter]);

  const columns: DataTableColumn<Promotion>[] = useMemo(
    () => [
      {
        key: 'title',
        label: '活动名称',
        sortable: true,
        render: (row) => (
          <a
            href={`/promotions/${row.id}`}
            className="text-blue-600 hover:underline font-medium"
            onClick={(e) => {
              e.preventDefault();
              // Next.js 路由跳转
              window.location.href = `/promotions/${row.id}`;
            }}
          >
            {row.title}
          </a>
        ),
      },
      {
        key: 'type',
        label: '类型',
        render: (row) => (
          <Badge variant={TYPE_COLORS[row.type]}>
            {TYPE_LABELS[row.type]}
          </Badge>
        ),
      },
      {
        key: 'status',
        label: '状态',
        sortable: true,
        render: (row) => {
          const statusMap: Record<string, { label: string; variant: string }> = {
            draft: { label: '草稿', variant: 'default' },
            active: { label: '进行中', variant: 'success' },
            paused: { label: '已暂停', variant: 'warning' },
            ended: { label: '已结束', variant: 'neutral' },
          };
          const s = statusMap[row.status] ?? { label: row.status, variant: 'default' };
          return <StatusBadge label={s.label} variant={s.variant as 'default' | 'success' | 'warning' | 'neutral'} />;
        },
      },
      {
        key: 'storeName',
        label: '门店',
        sortable: true,
      },
      {
        key: 'startDate',
        label: '开始日期',
        sortable: true,
      },
      {
        key: 'endDate',
        label: '结束日期',
        sortable: true,
      },
      {
        key: 'budget',
        label: '预算 (¥)',
        sortable: true,
        render: (row) => row.budget.toFixed(2),
        align: 'right',
      },
      {
        key: 'usageCount',
        label: '使用次数',
        sortable: true,
        render: (row) => row.usageCount.toLocaleString(),
        align: 'right',
      },
    ],
    [],
  );

  // 排序 (使用 useMemo 替代 useSortedItems 以兼容类型)
  const sorted = React.useMemo(() => {
    if (!sortConfig) return filtered;
    const sorted = [...filtered].sort((a: Promotion, b: Promotion) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortConfig.key] ?? '';
      const bVal = (b as unknown as Record<string, unknown>)[sortConfig.key] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filtered, sortConfig]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <PageShell
      title="促销活动"
      description="查看和管理门店所有促销活动"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: showStats ? '#2563eb' : '#374151', cursor: 'pointer', fontSize: 12 }}
          >
            {showStats ? '隐藏统计' : '📊 统计'}
          </button>
          <button
            onClick={() => setShowError(!showError)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}
          >
            {showError ? '恢复' : '模拟错误'}
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => {
              window.location.href = '/promotions/new';
            }}
          >
            创建活动
          </button>
        </div>
      }
    >
      {/* 错误状态 */}
      {showError && (
        <div style={{ padding: 16, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>⚠️ 加载失败</div>
          <div style={{ color: '#fca5a5', fontSize: 13 }}>促销活动数据加载异常，请稍后刷新重试</div>
          <button onClick={() => setShowError(false)}
            style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
            重试
          </button>
        </div>
      )}

      {/* 统计面板 */}
      {!showError && showStats && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{stats.total}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>总活动</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{stats.active}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>进行中</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>{stats.draft}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>草稿</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>{stats.ended}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>已结束</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>¥{stats.totalBudget.toFixed(0)}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>总预算</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.totalUsage.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>总使用次数</div>
            </div>
          </div>
          {/* 门店分布 */}
          <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(stats.byStore).map(([store, count]) => (
              <span key={store} style={{ padding: '2px 8px', borderRadius: 6, background: '#f3f4f6' }}>{store}: {count}个</span>
            ))}
          </div>
        </div>
      )}

      {/* 搜索与过滤条 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索活动名称或门店..."
        />
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="状态筛选"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          aria-label="类型筛选"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          共 {filtered.length} 条
        </span>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        items={paginated}
        rowKey={(row) => row.id}
        sort={sortConfig}
        onSortChange={(cfg) => {
          setSortConfig(cfg);
        }}
        emptyText="暂无匹配的促销活动"
      />

      {/* 分页 */}
      <Pagination
        page={safePage}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      {/* 活动效果分析 */}
      {!showError && (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>📊 活动效果分析</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { label: '最佳活动类型', value: '折扣', count: MOCK_DATA.filter(d => d.type === 'discount').length, color: '#059669' },
              { label: '平均预算', value: `¥${Math.round(MOCK_DATA.reduce((s, d) => s + d.budget, 0) / MOCK_DATA.length)}`, count: 0, color: '#2563eb' },
              { label: '平均使用', value: Math.round(MOCK_DATA.reduce((s, d) => s + d.usageCount, 0) / MOCK_DATA.length).toLocaleString(), count: 0, color: '#d97706' },
              { label: '进行中活动', value: MOCK_DATA.filter(d => d.status === 'active').length.toString(), count: 0, color: '#6366f1' },
            ].map((item, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                {item.count > 0 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.count}个活动</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
            基于{MOCK_DATA.length}个活动数据分析
          </div>
        </div>
      )}

      {/* 月度活动排期日历 */}
      {!showError && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f3e8ff', border: '1px solid #e9d5ff' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>📅 活动排期概览</h3>
          <div style={{ display: 'flex', gap: 14, overflow: 'auto', paddingBottom: 4 }}>
            {['07-13', '07-14', '07-15', '07-16', '07-17', '07-18', '07-19', '07-20', '07-21'].map((date, i) => {
              const activePromos = MOCK_DATA.filter(d => d.startDate <= `2026-${date}` && d.endDate >= `2026-${date}`);
              const isToday = date === '07-16';
              return (
                <div key={i} style={{ minWidth: 100, padding: 10, borderRadius: 8, background: isToday ? '#fff' : '#faf5ff', border: isToday ? '2px solid #7c3aed' : '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? '#7c3aed' : '#374151' }}>{date}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{activePromos.length}个活动</div>
                  {activePromos.slice(0, 2).map(p => (
                    <div key={p.id} style={{ fontSize: 10, color: '#059669', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 门店活动排行 */}
      {!showError && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>🏪 门店活动排行</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Array.from(new Set(MOCK_DATA.map(d => d.storeName))).map(store => {
              const promos = MOCK_DATA.filter(d => d.storeName === store);
              const usage = promos.reduce((s, d) => s + d.usageCount, 0);
              return (
                <div key={store} style={{ flex: '1 1 120px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{store}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{promos.length}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{usage.toLocaleString()}次使用</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 最近活动效果 */}
      {!showError && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#166534' }}>📊 最近活动效果分析</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {MOCK_DATA.slice(0, 3).map(d => (
              <div key={d.id} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>{d.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#059669' }}>{d.usageCount.toLocaleString()}次</span>
                  <span style={{ color: '#d97706' }}>+{d.usageGrowth}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                  <span>预算: ¥{d.budget.toLocaleString()}</span>
                  <span>ROI: {d.roi.toFixed(1)}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        <div style={{ textAlign: "center", fontSize: 10, color: "#9ca3af", marginTop: 8 }}>💡 数据来源: 各门店活动执行系统 · 自动更新于每日 06:00</div>

    </PageShell>
  );
}
