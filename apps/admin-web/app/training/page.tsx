'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Training - 神机营' }


import {
  MOCK_TRAININGS,
  TRAINING_STATUS_MAP,
  TRAINING_TYPE_MAP,
  TRAINING_STATUSES,
  TRAINING_TABS,
  computeTrainingStats,
  filterByTab,
  type TrainingItem,
  type TrainingStatus,
  type TrainingTabKey,
} from '../training-data';

// ---- 空态 SVG ----

function EmptyStateSVG() {
  return (
    <svg
      width="240"
      height="180"
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.5 }}
    >
      <rect x="30" y="20" width="180" height="100" rx="8" stroke="#475569" strokeWidth="2" fill="none" />
      <rect x="50" y="40" width="60" height="8" rx="4" fill="#475569" />
      <rect x="50" y="56" width="40" height="6" rx="3" fill="#334155" />
      <rect x="50" y="70" width="50" height="6" rx="3" fill="#334155" />
      <rect x="50" y="84" width="35" height="6" rx="3" fill="#334155" />
      <circle cx="162" cy="60" r="24" stroke="#475569" strokeWidth="2" fill="none" />
      <path d="M158 60 h8 M162 56 v8" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M60 130 L90 110 L120 130 L150 115 L180 130"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <circle cx="60" cy="130" r="3" fill="#475569" />
      <circle cx="90" cy="110" r="3" fill="#475569" />
      <circle cx="120" cy="130" r="3" fill="#475569" />
      <circle cx="150" cy="115" r="3" fill="#475569" />
      <circle cx="180" cy="130" r="3" fill="#475569" />
    </svg>
  );
}

// ---- 列定义 ----

function buildColumns(): DataTableColumn<TrainingItem>[] {
  return [
    {
      key: 'courseName',
      title: '课程名称',
      dataKey: 'courseName',
      sortable: true,
      render: (item: TrainingItem) => (
        <span style={{ color: '#93c5fd', fontWeight: 500 }}>
          {item.courseName}
        </span>
      ),
    },
    {
      key: 'instructor',
      title: '讲师',
      dataKey: 'instructor',
      sortable: true,
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item: TrainingItem) => item.type,
      render: (item: TrainingItem) => {
        const t = TRAINING_TYPE_MAP[item.type];
        return <StatusBadge label={t.label} variant="neutral" size="sm" />;
      },
    },
    {
      key: 'attendeeCount',
      title: '参训人数',
      dataKey: 'attendeeCount',
      sortable: true,
      align: 'right',
      render: (item: TrainingItem) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {item.attendeeCount}
        </span>
      ),
    },
    {
      key: 'date',
      title: '日期',
      dataKey: 'date',
      sortable: true,
    },
    {
      key: 'durationMinutes',
      title: '时长',
      sortable: true,
      align: 'right',
      sortValue: (item: TrainingItem) => item.durationMinutes,
      render: (item: TrainingItem) => {
        const h = Math.floor(item.durationMinutes / 60);
        const m = item.durationMinutes % 60;
        if (h > 0 && m > 0) return `${h}小时${m}分钟`;
        if (h > 0) return `${h}小时`;
        return `${m}分钟`;
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: TrainingItem) => item.status,
      render: (item: TrainingItem) => {
        const s = TRAINING_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
  ];
}

// ---- 统计卡片样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

// ---- 页面组件 ----

function TrainingPageContent() {
  // 搜索过滤
  const searchFields = useMemo<(keyof TrainingItem)[]>(
    () => ['courseName', 'instructor'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_TRAININGS,
    searchFields
  );

  // Tab 筛选
  const [activeTab, setActiveTab] = useState<TrainingTabKey>('ALL');
  const tabFiltered = useMemo(
    () => filterByTab(filteredItems, activeTab),
    [filteredItems, activeTab]
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? tabFiltered
        : tabFiltered.filter((item) => item.status === statusFilter),
    [tabFiltered, statusFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  const pageItems = pagination.paginate(sortedItems);

  // 刷新
  const handleRefresh = useCallback(() => {
    pagination.resetPage();
  }, [pagination]);

  // 概览统计
  const stats = useMemo(() => computeTrainingStats(MOCK_TRAININGS), []);

  // 空态
  const isEmpty = sortedItems.length === 0;

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="培训管理中心"
        subtitle="统一管理门店培训计划、参训记录与培训效果追踪，覆盖岗前培训、技能提升、安全培训和管理培训。"
      >
        {/* 概览统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总培训数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              全部培训记录
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>本季度培训</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}
            >
              {stats.thisQuarter}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              本季度已安排
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总参训人次</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#a78bfa' }}
            >
              {stats.totalAttendees}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              累计人次
            </div>
          </article>
        </div>

        {/* 搜索 + 刷新 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <SearchFilterInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="搜索课程名称 / 讲师..."
            />
          </div>
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            ⟳ 刷新
          </button>
        </div>

        {/* Tab 筛选 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={TRAINING_TABS.map((tab) => ({
              key: tab.key,
              label: tab.label,
              count:
                tab.key === 'ALL'
                  ? filteredItems.length
                  : filteredItems.filter((item) => item.status === tab.key).length,
            }))}
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as TrainingTabKey);
              setStatusFilter('ALL');
            }}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态筛选 */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态', count: tabFiltered.length },
              ...TRAINING_STATUSES.map((s) => ({
                key: s,
                label: TRAINING_STATUS_MAP[s].label,
                count: tabFiltered.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as TrainingStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 数据表格 / 空态 */}
        {isEmpty ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <EmptyStateSVG />
            <div
              style={{
                marginTop: 20,
                fontSize: 16,
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              暂无匹配的培训记录
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: '#64748b',
                maxWidth: 360,
              }}
            >
              当前筛选条件下没有找到培训记录，请尝试调整搜索条件或筛选标签。
            </div>
          </div>
        ) : (
          <>
            <DataTable
              title={`培训列表（匹配 ${sortedItems.length} 条）`}
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
          </>
        )}
      </PageShell>
    </main>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingPageFallback />}>
      <TrainingPageContent />
    </Suspense>
  );
}

function TrainingPageFallback() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载培训管理视图...
    </main>
  );
}
