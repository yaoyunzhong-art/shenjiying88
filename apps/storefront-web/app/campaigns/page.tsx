'use client';

import React, { useMemo, useState, useEffect } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

// ---- 类型 ----

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'paused' | 'draft';
type CampaignChannel = '小程序' | 'H5' | 'App推送' | '短信' | '企微' | '全渠道';

interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  roi: number;
  conversions: number;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  active: '投放中',
  scheduled: '已排期',
  ended: '已结束',
  paused: '已暂停',
  draft: '草稿',
};

const STATUS_VARIANTS: Record<CampaignStatus, 'success' | 'info' | 'neutral' | 'warning' | 'default'> = {
  active: 'success',
  scheduled: 'info',
  ended: 'neutral',
  paused: 'warning',
  draft: 'default',
};

function formatCurrency(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ---- Mock 数据 ----

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active', budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618 年中大促全场折扣 + 满减活动' },
  { id: 'cmp-002', name: '新会员专享礼包', channel: '小程序', status: 'active', budget: 80000, spent: 45200, roi: 5.2, conversions: 3400, startAt: '2026-06-10', endAt: '2026-07-10', targetAudience: '新注册会员', description: '新人首单立减 20 元 + 赠品' },
  { id: 'cmp-003', name: '夏季饮品推广', channel: 'H5', status: 'scheduled', budget: 120000, spent: 0, roi: 0, conversions: 0, startAt: '2026-07-01', endAt: '2026-07-31', targetAudience: '18-35 岁消费者', description: '夏日冰饮系列买一送一' },
  { id: 'cmp-004', name: '会员积分双倍', channel: 'App推送', status: 'active', budget: 30000, spent: 18200, roi: 8.1, conversions: 5200, startAt: '2026-06-15', endAt: '2026-07-15', targetAudience: '银卡及以上会员', description: '积分双倍活动期间消费翻倍积分' },
  { id: 'cmp-005', name: '端午礼盒预售', channel: '企微', status: 'ended', budget: 200000, spent: 198000, roi: 2.45, conversions: 3800, startAt: '2026-05-20', endAt: '2026-06-10', targetAudience: '企业客户', description: '端午节高端礼盒团购预售' },
  { id: 'cmp-006', name: '周末限时秒杀', channel: '小程序', status: 'paused', budget: 50000, spent: 22300, roi: 3.2, conversions: 1800, startAt: '2026-06-05', endAt: '2026-06-30', targetAudience: '全体粉丝', description: '每周六晚 8 点限时秒杀' },
  { id: 'cmp-007', name: '拼团裂变活动', channel: '全渠道', status: 'active', budget: 100000, spent: 67100, roi: 4.6, conversions: 8900, startAt: '2026-06-08', endAt: '2026-06-28', targetAudience: '社交活跃用户', description: '三人成团享 7 折优惠' },
  { id: 'cmp-008', name: '会员日专属券', channel: '短信', status: 'draft', budget: 40000, spent: 0, roi: 0, conversions: 0, startAt: '2026-07-10', endAt: '2026-07-10', targetAudience: '钻石/黄金会员', description: '每月 10 日会员日专属优惠券' },
  { id: 'cmp-009', name: '短视频带货合作', channel: 'H5', status: 'draft', budget: 300000, spent: 0, roi: 0, conversions: 0, startAt: '2026-08-01', endAt: '2026-09-01', targetAudience: '新客', description: 'KOL 短视频带货种草活动' },
  { id: 'cmp-010', name: '换季清仓特卖', channel: '全渠道', status: 'scheduled', budget: 150000, spent: 0, roi: 0, conversions: 0, startAt: '2026-07-15', endAt: '2026-08-15', targetAudience: '全部用户', description: '夏装换季清仓 5 折起' },
  { id: 'cmp-011', name: '社群签到有礼', channel: '企微', status: 'active', budget: 15000, spent: 8900, roi: 6.8, conversions: 4200, startAt: '2026-06-01', endAt: '2026-07-01', targetAudience: '企微社群成员', description: '每日签到领积分，连续 7 天得优惠券' },
  { id: 'cmp-012', name: '七夕表白活动', channel: '全渠道', status: 'scheduled', budget: 180000, spent: 0, roi: 0, conversions: 0, startAt: '2026-08-07', endAt: '2026-08-14', targetAudience: '情侣', description: '七夕限定商品 + 表白墙互动' },
  { id: 'cmp-013', name: '夜间折扣专场', channel: 'App推送', status: 'paused', budget: 25000, spent: 14500, roi: 2.1, conversions: 950, startAt: '2026-06-10', endAt: '2026-06-25', targetAudience: '上班族', description: '每晚 8 点后夜宵零食 8 折' },
  { id: 'cmp-014', name: '推荐有礼', channel: '全渠道', status: 'active', budget: 60000, spent: 32100, roi: 7.2, conversions: 6100, startAt: '2026-06-01', endAt: '2026-12-31', targetAudience: '全部会员', description: '邀请好友注册得 30 元券' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Campaign>[] = [
  {
    key: 'name',
    header: '活动名称',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.description}
        </span>
      </div>
    ),
  },
  {
    key: 'channel',
    header: '渠道',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.channel}</span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
  {
    key: 'budget',
    header: '预算',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {formatCurrency(item.budget)}
      </span>
    ),
  },
  {
    key: 'spent',
    header: '已消耗',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, color: item.spent > 0 ? '#facc15' : '#64748b' }}>
        {formatCurrency(item.spent)}
      </span>
    ),
  },
  {
    key: 'roi',
    header: 'ROI',
    align: 'right',
    render: (item) => (
      <span style={{
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500,
        color: item.roi >= 3 ? '#4ade80' : item.roi > 0 ? '#facc15' : '#64748b',
      }}>
        {item.roi > 0 ? `${item.roi.toFixed(1)}x` : '-'}
      </span>
    ),
  },
  {
    key: 'conversions',
    header: '转化数',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {item.conversions > 0 ? item.conversions.toLocaleString() : '-'}
      </span>
    ),
  },
  {
    key: 'targetAudience',
    header: '目标人群',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.targetAudience}</span>
    ),
  },
  {
    key: 'startAt',
    header: '开始日期',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.startAt}</span>
    ),
  },
];

// ---- 统计子组件 ----

function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
    </article>
  );
}

// ---- 页面 ----

export default function CampaignsListPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<Campaign[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<Campaign[]>((resolve) => {
        setTimeout(() => resolve(MOCK_CAMPAIGNS), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  // 搜索
  const searchFields = useMemo<(keyof Campaign)[]>(
    () => ['name', 'channel', 'description', 'targetAudience'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    pageData.length > 0 ? pageData : MOCK_CAMPAIGNS,
    searchFields,
  );

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  // 渠道过滤（叠加）
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'ALL'>('ALL');
  const finalFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.channel === channelFilter),
    [statusFiltered, channelFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  // 统计
  const stats = useMemo(() => {
    const active = pageData.filter((c) => c.status === 'active').length;
    const totalBudget = pageData.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = pageData.reduce((sum, c) => sum + c.spent, 0);
    const totalConversions = pageData.reduce((sum, c) => sum + c.conversions, 0);
    return {
      total: pageData.length,
      active,
      totalBudget,
      totalSpent,
      totalConversions,
      avgRoi: totalSpent > 0 ? ((totalConversions / totalSpent) * 100).toFixed(1) : '-',
    };
  }, [pageData]);

  // 去重渠道列表
  const channelOptions = useMemo<CampaignChannel[]>(
    () => [...new Set(pageData.map((c) => c.channel))],
    [pageData],
  );

  return (
    <PageShell
      title="营销活动"
      description="管理门店营销活动，追踪投放效果与 ROI。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<Campaign[]>((resolve) => {
              setTimeout(() => resolve(MOCK_CAMPAIGNS), 300);
            }),
          ).then((data) => {
            if (data) setPageData(data);
            setPageReady(true);
          })
        }
      >
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatBadge label="总活动数" value={String(stats.total)} accent="#60a5fa" />
        <StatBadge label="投放中" value={String(stats.active)} accent="#4ade80" />
        <StatBadge label="总预算" value={formatCurrency(stats.totalBudget)} accent="#facc15" />
        <StatBadge label="已消耗" value={formatCurrency(stats.totalSpent)} accent="#a78bfa" />
        <StatBadge label="总转化" value={stats.totalConversions.toLocaleString()} accent="#34d399" />
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索活动名称、渠道、描述..."
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 8 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
            { key: 'active', label: '投放中', count: (filteredItems ?? []).filter((c) => c.status === 'active').length },
            { key: 'scheduled', label: '已排期', count: (filteredItems ?? []).filter((c) => c.status === 'scheduled').length },
            { key: 'paused', label: '已暂停', count: (filteredItems ?? []).filter((c) => c.status === 'paused').length },
            { key: 'ended', label: '已结束', count: (filteredItems ?? []).filter((c) => c.status === 'ended').length },
            { key: 'draft', label: '草稿', count: (filteredItems ?? []).filter((c) => c.status === 'draft').length },
          ]}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as CampaignStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 渠道过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部渠道', count: statusFiltered.length },
            ...channelOptions.map((ch) => ({
              key: ch,
              label: ch,
              count: statusFiltered.filter((c) => c.channel === ch).length,
            })),
          ]}
          activeKey={channelFilter}
          onChange={(key) => setChannelFilter(key as CampaignChannel | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
      />

      {/* 空状态 */}
      {finalFiltered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: '#64748b',
            fontSize: 14,
            borderRadius: 12,
            border: '1px dashed rgba(148,163,184,0.18)',
            marginTop: 16,
          }}
        >
          未找到匹配的营销活动
        </div>
      )}

      {/* 分页 */}
      {finalFiltered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
      </TriStateRenderer>
    </PageShell>
  );
}
