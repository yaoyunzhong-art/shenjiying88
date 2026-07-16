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

      {/* 活动类型分布 */}
      {!showError && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>🏷️ 活动类型分布</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { type: '折扣', count: MOCK_DATA.filter(d => d.type === 'discount').length, icon: '🏷️', color: '#7c3aed' },
              { type: '优惠券', count: MOCK_DATA.filter(d => d.type === 'coupon').length, icon: '🎫', color: '#2563eb' },
              { type: '赠品', count: MOCK_DATA.filter(d => d.type === 'gift').length, icon: '🎁', color: '#059669' },
              { type: '秒杀', count: MOCK_DATA.filter(d => d.type === 'flash-sale').length, icon: '⚡', color: '#dc2626' },
            ].map(t => (
              <div key={t.type} style={{ flex: '1 1 100px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{t.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.color }}>{t.count}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{t.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 活动渠道效果 */}
      {!showError && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0e7490' }}>📢 渠道效果对比</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {[
              { channel: '小程序', usage: 12800, rate: '38%', color: '#06b6d4' },
              { channel: '公众号', usage: 9200, rate: '27%', color: '#6366f1' },
              { channel: '短信', usage: 5800, rate: '17%', color: '#f59e0b' },
              { channel: '门店扫码', usage: 4200, rate: '12%', color: '#10b981' },
              { channel: '其他', usage: 2000, rate: '6%', color: '#94a3b8' },
            ].map(c => (
              <div key={c.channel} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{c.channel}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.usage.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.rate}使用占比</div>
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: c.rate, height: '100%', borderRadius: 2, background: c.color }} />
                </div>
              </div>
            ))}
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
                {/* 会员活动参与偏好 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0369a1' }}>🧑‍🤝‍🧑 会员活动参与偏好 (按年龄段)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { age: '18-22岁', icon: '🎓', fav: '竞技类游戏', fav2: '社交派对', pct1: 60, pct2: 30, color: '#3b82f6' },
              { age: '23-28岁', icon: '💼', fav: 'VR/电竞体验', fav2: '主题派对', pct1: 45, pct2: 38, color: '#06b6d4' },
              { age: '29-35岁', icon: '👨‍👩‍👧', fav: '亲子活动', fav2: '充值优惠', pct1: 50, pct2: 30, color: '#22c55e' },
              { age: '36-45岁', icon: '🏠', fav: '家庭套票', fav2: '会员福利', pct1: 42, pct2: 35, color: '#f59e0b' },
              { age: '46岁以上', icon: '🧓', fav: '休闲娱乐', fav2: '优惠活动', pct1: 35, pct2: 40, color: '#a855f7' },
              { age: '整体分布', icon: '📊', fav: '亲子/竞技类', fav2: '社交/优惠类', pct1: 48, pct2: 35, color: '#64748b' },
            ].map(function(g, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #bae6fd', fontSize: 12 }}>
                  <span style={{ fontSize: 14, minWidth: 22 }}>{g.icon}</span>
                  <span style={{ fontWeight: 600, color: '#0369a1', width: 68 }}>{g.age}</span>
                  <span style={{ fontSize: 11, color: '#374151', minWidth: 80 }}>🎯 {g.fav}</span>
                  <div style={{ flex: '0 0 60px', height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: g.pct1 + '%', height: '100%', borderRadius: 4, background: g.color, opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#6b7280', minWidth: 76 }}>{g.fav2}</span>
                  <div style={{ flex: '0 0 60px', height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: g.pct2 + '%', height: '100%', borderRadius: 4, background: '#9ca3af', opacity: 0.5 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#0369a1', textAlign: 'center' }}>
            📊 蓝色=最喜爱类型 · 灰色=次喜爱类型 · 建议按年龄段针对性推送活动
          </div>
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 10 }}>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#0369a1' }}>最高</div>
              <span style={{ color: '#3b82f6' }}>18-22岁 60%</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#0369a1' }}>最低</div>
              <span style={{ color: '#a855f7' }}>46岁以上 35%</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#0369a1' }}>平均</div>
              <span style={{ color: '#06b6d4' }}>46% / 33%</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#0369a1' }}>热门</div>
              <span style={{ color: '#22c55e' }}>亲子类850+人次</span>
            </div>
          </div>
        </div>
                {/* 活动拉新效果对比 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0e7490' }}>📈 活动拉新效果对比</h3>
          {function(promos: Promotion[]) {
            var byType: Record<string, Promotion[]> = {};
            promos.forEach(function(p) {
              var mapKey: Record<string, string> = { discount: '折扣', coupon: '优惠券', gift: '赠品', 'flash-sale': '秒杀' };
              var key = mapKey[p.type] || p.type;
              if (!byType[key]) byType[key] = [];
              (byType[key] as Promotion[]).push(p);
            });
            var typeOrder = ['折扣', '优惠券', '赠品', '秒杀'];
            var typeIcons: Record<string, string> = { '折扣': '🏷️', '优惠券': '🎫', '赠品': '🎁', '秒杀': '⚡' };
            var typeColors: Record<string, string> = { '折扣': '#7c3aed', '优惠券': '#2563eb', '赠品': '#059669', '秒杀': '#dc2626' };
            var newMemberData = [125, 85, 60, 40];
            return (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {typeOrder.map(function(t, i) {
                  var count = (byType[t] || []).length;
                  var newMembers = newMemberData[i] || 0;
                  return (
                    <div key={i} style={{ flex: '1 1 120px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #a5f3fc', textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>{typeIcons[t]}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0e7490', marginTop: 2 }}>{t}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: typeColors[t], marginTop: 2 }}>{count}个</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>活动</div>
                      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 11, color: '#059669' }}>👤 +{newMembers}新会员</div>
                        <div style={{ marginTop: 2, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ width: newMembers + '%', height: '100%', borderRadius: 2, background: typeColors[t] }} />
                        </div>
                        <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>拉新占比 {newMembers}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }(MOCK_DATA)}
        </div>
                {/* 活动历史回顾 */}
        {function(promos: Promotion[], i: number) {
          var RECENT_ACTIVITIES = [
            { name: '六一儿童节特惠', month: '6月', score: 92, participants: 480, feedback: '亲子活动评价很高' },
            { name: '端午节福利', month: '6月', score: 88, participants: 350, feedback: '会员专属感强' },
            { name: '暑期狂欢季', month: '7月', score: 95, participants: 620, feedback: '设备免费玩反馈最佳' },
            { name: '周四会员日', month: '7月', score: 78, participants: 280, feedback: '优惠力度可加大' },
            { name: '夏日清凉大促', month: '7月', score: 85, participants: 410, feedback: '折扣活动受欢迎' },
            { name: '周末特惠票', month: '7月', score: 73, participants: 320, feedback: '周末人流大但转化一般' },
          ];
          var avgScore = RECENT_ACTIVITIES.reduce(function(a, b) { return a + b.score; }, 0) / RECENT_ACTIVITIES.length;
          var totalPax = RECENT_ACTIVITIES.reduce(function(a, b) { return a + b.participants; }, 0);
          var topActivity = RECENT_ACTIVITIES.reduce(function(max, cur) { return cur.score > max.score ? cur : max; });
          return (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>📅 近3个月活动历史回顾</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
                {[
                  { label: '平均评分', value: avgScore.toFixed(0) + '分', color: '#ea580c', bg: '#fff7ed' },
                  { label: '参与人次', value: totalPax.toLocaleString(), color: '#2563eb', bg: '#eff6ff' },
                  { label: '最高评分', value: topActivity.name, color: '#059669', bg: '#f0fdf4' },
                  { label: '活动数量', value: RECENT_ACTIVITIES.length + '个', color: '#7c3aed', bg: '#f5f3ff' },
                ].map(function(s, i) {
                  return (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: s.bg, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {RECENT_ACTIVITIES.map(function(a, idx) {
                  var barH = a.score;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#fff', border: '1px solid #fed7aa', fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#9a3412', width: 80 }}>{a.month} {a.name}</span>
                      <span style={{ fontSize: 10, color: '#6b7280', minWidth: 30 }}>{a.participants}人</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#ffedd5', overflow: 'hidden' }}>
                        <div style={{ width: barH + '%', height: '100%', borderRadius: 4, background: '#ea580c' }} />
                      </div>
                      <span style={{ fontWeight: 700, color: '#ea580c', minWidth: 30, textAlign: 'right' }}>{a.score}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af', maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.feedback}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
                🏆 最佳活动: {topActivity.name} ({topActivity.score}分) · 建议参考其策划经验
              </div>
            </div>
          );
        }(MOCK_DATA, 0)}

                {/* 活动新客转化效果 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#065f46' }}>🆕 活动新客转化效果</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {function(s, i) {
              var icons = {优惠券: '🎫', 免费体验: '🎮', 团购活动: '👥', 联合推广: '🤝', 限时优惠: '⏰'} as const;
              return s.map(function(e, idx) {
                var barPct = Math.min(e.conversionRate * 2, 100);
                var icon = (icons as Record<string, string>)[e.type] || '🎁';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: '#065f46' }}>{e.type}</span>
                        <span style={{ fontWeight: 600, color: '#059669' }}>{e.newMembers}人 <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>新会员</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#d1fae5', overflow: 'hidden' }}>
                          <div style={{ width: barPct + '%', height: '100%', borderRadius: 3, background: '#059669' }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', minWidth: 60, textAlign: 'right' }}>{e.conversionRate}%转化</span>
                        <span style={{ fontSize: 9, color: '#9ca3af' }}>{e.campaigns}活动</span>
                      </div>
                    </div>
                  </div>
                );
              });
            }([
              { type: '优惠券', newMembers: 320, conversionRate: 28, campaigns: 12 },
              { type: '免费体验', newMembers: 240, conversionRate: 35, campaigns: 8 },
              { type: '团购活动', newMembers: 180, conversionRate: 22, campaigns: 6 },
              { type: '联合推广', newMembers: 260, conversionRate: 40, campaigns: 10 },
              { type: '限时优惠', newMembers: 150, conversionRate: 18, campaigns: 5 },
            ])}
          </div>
          <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'rgba(5,150,105,0.06)', fontSize: 11, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
            <span>🏆 联合推广转化率最高 (40%)</span>
            <span>📊 平均转化率: {Math.round([28,35,22,40,18].reduce(function(a,b){return a+b})/5)}%</span>
            <span>💡 限时优惠新客转化较低需优化</span>
          </div>
        </div>

                {/* 活动执行满意度 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>📊 活动执行满意度</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { name: '设备免费玩', satisfaction: 0.92, participants: 320 },
              { name: '充值送积分', satisfaction: 0.88, participants: 280 },
              { name: '新客专享', satisfaction: 0.95, participants: 180 },
              { name: '周末特惠', satisfaction: 0.85, participants: 450 },
              { name: '团队优惠', satisfaction: 0.90, participants: 120 },
            ].map(function(a, i) {
              return (
                <div key={i} style={{ padding: 8, borderRadius: 8, background: '#fff', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{Math.round(a.satisfaction * 100)}%<span style={{ fontSize: 10, color: '#9ca3af' }}>满意度</span></div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>参与 {a.participants}人</div>
                  <div style={{ marginTop: 2, height: 4, borderRadius: 2, background: '#f3e8ff', overflow: 'hidden' }}>
                    <div style={{ width: a.satisfaction * 100 + '%', height: '100%', borderRadius: 2, background: '#7c3aed' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 活动预算执行 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#166534' }}>💰 月度活动预算执行</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { month: '2月', budget: 80, used: 65, color: '#22c55e' },
              { month: '3月', budget: 100, used: 92, color: '#22c55e' },
              { month: '4月', budget: 80, used: 85, color: '#f59e0b' },
              { month: '5月', budget: 120, used: 88, color: '#3b82f6' },
              { month: '6月', budget: 100, used: 78, color: '#22c55e' },
            ].map(function(b, i) {
              var over = b.used > b.budget
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #dcfce7', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#166534', width: 40 }}>{b.month}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: Math.min(b.used / b.budget * 100, 100) + '%', height: '100%', borderRadius: 4, background: over ? '#ef4444' : b.color }} />
                  </div>
                  <span style={{ color: '#6b7280', width: 60, textAlign: 'right' }}>¥{b.used}k / ¥{b.budget}k</span>
                  <span style={{ color: over ? '#ef4444' : '#16a34a', width: 40, textAlign: 'right' }}>{over ? '超' + (b.used - b.budget) + 'k' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 活动渠道投入产出 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#713f12' }}>📢 活动渠道投入产出 ROI 对比</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { channel: '抖音', invest: 12000, roi: 4.8, users: 8500, color: '#2563eb' },
              { channel: '美团', invest: 8000, roi: 3.2, users: 6200, color: '#f59e0b' },
              { channel: '微信公众号', invest: 5000, roi: 2.6, users: 3800, color: '#059669' },
              { channel: '门店海报', invest: 3000, roi: 5.1, users: 2200, color: '#7c3aed' },
            ].map(function(c, i) {
              var maxInvest = 12000;
              var barPct = (c.invest / maxInvest * 100);
              return (
                <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fef3c7', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.channel}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.roi}x</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>投入 ¥{(c.invest / 1000).toFixed(0)}k</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>吸引 {c.users.toLocaleString()}人</div>
                  <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#fef3c7', overflow: 'hidden' }}>
                    <div style={{ width: barPct + '%', height: '100%', borderRadius: 3, background: c.color }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{'¥' + (c.invest / c.users).toFixed(1)}/人</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            门店海报 ROI {(5.1).toFixed(1)}x 最高，抖音吸引用户 {(8500).toLocaleString()}人 最多
          </div>
        </div>

        {/* 活动参与用户画像 — 年龄段/性别/消费水平分布 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9d174d' }}>👥 活动参与用户画像</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { dim: '18-25岁', rate: 28, pax: 420, color: '#ec4899' },
              { dim: '26-35岁', rate: 45, pax: 675, color: '#f43f5e' },
              { dim: '36-45岁', rate: 20, pax: 300, color: '#f97316' },
              { dim: '46岁+', rate: 7, pax: 105, color: '#94a3b8' },
            ].map(function(a, i) {
              return (
                <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fce7f3', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{a.dim}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: a.color, marginTop: 2 }}>{a.rate}%</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{a.pax}人参与</div>
                  <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#fce7f3', overflow: 'hidden' }}>
                    <div style={{ width: a.rate + '%', height: '100%', borderRadius: 3, background: a.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #fce7f3' }}>
            {[
              { dim: '男性', rate: 38, pct: 38, color: '#3b82f6', icon: '♂' },
              { dim: '女性', rate: 62, pct: 62, color: '#ec4899', icon: '♀' },
            ].map(function(g, i) {
              return (
                <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fce7f3', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{g.icon} 性别: {g.dim}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.rate}%</div>
                  <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#fce7f3', overflow: 'hidden' }}>
                    <div style={{ width: g.pct + '%', height: '100%', borderRadius: 3, background: g.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #fce7f3' }}>
            {[
              { dim: '高消费', rate: 52, pct: 52, pax: 340, color: '#7c3aed' },
              { dim: '中消费', rate: 32, pct: 32, pax: 210, color: '#f59e0b' },
              { dim: '低消费', rate: 16, pct: 16, pax: 105, color: '#94a3b8' },
            ].map(function(c, i) {
              return (
                <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fce7f3', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>消费: {c.dim}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.rate}%</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.pax}人</div>
                  <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#fce7f3', overflow: 'hidden' }}>
                    <div style={{ width: c.pct + '%', height: '100%', borderRadius: 3, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            主力参与人群: 26-35岁女性，高消费会员参与率{(52).toFixed(0)}%最高
          </div>
        </div>

        {/* 淡旺季活动效果 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#0e7490' }}>📊 各月活动效果评分（淡旺季对比）</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { month: '1月', score: 72, peak: '春节旺季', color: '#06b6d4' },
              { month: '2月', score: 88, peak: '春节持续', color: '#06b6d4' },
              { month: '3月', score: 65, peak: '淡季', color: '#94a3b8' },
              { month: '4月', score: 58, peak: '淡季', color: '#94a3b8' },
              { month: '5月', score: 75, peak: '劳动节', color: '#06b6d4' },
              { month: '6月', score: 82, peak: '儿童节', color: '#06b6d4' },
              { month: '7月', score: 90, peak: '暑期旺季', color: '#06b6d4' },
              { month: '8月', score: 85, peak: '暑期持续', color: '#06b6d4' },
              { month: '9月', score: 70, peak: '开学季', color: '#f59e0b' },
              { month: '10月', score: 78, peak: '国庆节', color: '#06b6d4' },
              { month: '11月', score: 68, peak: '双11', color: '#f59e0b' },
              { month: '12月', score: 92, peak: '圣诞+元旦', color: '#06b6d4' },
            ].map(function(m, i) {
              var isPeak = m.color === '#06b6d4';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6, background: isPeak ? '#f0fdfa' : '#fff', border: '1px solid ' + (isPeak ? '#99f6e4' : '#e5e7eb'), fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#0e7490', width: 40 }}>{m.month}</span>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: m.score + '%', height: '100%', borderRadius: 5, background: m.color }} />
                  </div>
                  <span style={{ fontWeight: 700, color: m.color, minWidth: 30, textAlign: 'right' }}>{m.score}</span>
                  <span style={{ fontSize: 10, color: isPeak ? '#059669' : '#9ca3af', minWidth: 60, textAlign: 'right' }}>{m.peak}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            旺季平均评分 {((88 + 75 + 82 + 90 + 85 + 78 + 92) / 7).toFixed(0)}分 vs 淡季平均评分 {((72 + 65 + 58 + 70 + 68) / 5).toFixed(0)}分
          </div>
        </div>

        {/* 活动投入产出比对比 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>💰 活动投入产出比对比</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { type: '满减活动', cost: 28000, revenue: 120000, roi: 4.3, ratio: 85, color: '#22c55e' },
              { type: '折扣促销', cost: 45000, revenue: 168000, roi: 3.7, ratio: 72, color: '#3b82f6' },
              { type: '赠品活动', cost: 15000, revenue: 72000, roi: 4.8, ratio: 92, color: '#a855f7' },
              { type: '会员专享', cost: 8000, revenue: 56000, roi: 7.0, ratio: 65, color: '#eab308' },
              { type: '限时秒杀', cost: 32000, revenue: 96000, roi: 3.0, ratio: 55, color: '#f97316' },
              { type: '裂变活动', cost: 6000, revenue: 38000, roi: 6.3, ratio: 78, color: '#06b6d4' },
            ].map(function(a, i) {
              var barW = Math.min(a.ratio, 100);
              return (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{a.type}</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      成本 ¥{String(a.cost).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} · 营收 ¥{String(a.revenue).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ width: barW + '%', height: '100%', borderRadius: 4, background: a.color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: a.color, minWidth: 40 }}>ROI {a.roi.toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                    投入产出比排名: #{i + 1} · 每投入1元回报 ¥{a.roi.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 10, color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
            <span>📌 最优: 会员专享活动 (ROI 7.0)</span>
            <span>⚡ 改进方向: 限时秒杀投入高回报低</span>
            <span>📊 平均ROI: {((4.3 + 3.7 + 4.8 + 7.0 + 3.0 + 6.3) / 6).toFixed(1)}</span>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "#9ca3af", marginTop: 8 }}>💡 数据来源: 各门店活动执行系统 · 自动更新于每日 06:00</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
          <span>📊 统计周期: 本月</span>
          <span>🏪 参与门店: 8家</span>
          <span>📈 平均使用率: {(MOCK_DATA.reduce((s,d) => s + d.usageCount, 0) / MOCK_DATA.length).toFixed(0)}次/活动</span>
        </div>

    </PageShell>
  );
}
