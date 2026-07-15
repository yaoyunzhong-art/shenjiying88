'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  PageShell,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  DataTable,
  Pagination,
  Tabs,
  usePagination,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';
import type { StaffPerformanceRecord, PerformanceSummary } from './page';

// ============================================================
// 绩效等级配置
// ============================================================

const GRADE_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' }> = {
  A: { label: '优秀', variant: 'success' },
  B: { label: '良好', variant: 'info' },
  C: { label: '一般', variant: 'warning' },
  D: { label: '待改进', variant: 'danger' },
};

// ============================================================
// 统计汇总
// ============================================================

interface StaffStats {
  total: number;
  totalSales: number;
  avgServiceScore: number;
  topPerformer: string;
  aGradeCount: number;
  belowTargetCount: number;
}

function computeStats(records: StaffPerformanceRecord[]): StaffStats {
  const total = records.length;
  const totalSales = records.reduce((s, r) => s + r.salesAmount, 0);
  const avgServiceScore = total > 0
    ? Math.round((records.reduce((s, r) => s + r.serviceScore, 0) / total) * 10) / 10
    : 0;
  const top = [...records].sort((a, b) => b.salesAmount - a.salesAmount)[0];
  return {
    total,
    totalSales,
    avgServiceScore,
    topPerformer: top?.name ?? '-',
    aGradeCount: records.filter(r => r.grade === 'A').length,
    belowTargetCount: records.filter(r => r.salesTargetRate < 100).length,
  };
}

// ============================================================
// 表格列定义
// ============================================================

const COLUMNS: DataTableColumn<StaffPerformanceRecord>[] = [
  { key: 'name', header: '姓名', dataKey: 'name', sortable: true },
  { key: 'role', header: '岗位', dataKey: 'role', sortable: true },
  {
    key: 'salesAmount',
    header: '销售额 (元)',
    sortable: true,
    render: (r: StaffPerformanceRecord) => r.salesAmount.toLocaleString(),
  },
  {
    key: 'salesTargetRate',
    header: '完成率',
    sortable: true,
    render: (r: StaffPerformanceRecord) => {
      const color = r.salesTargetRate >= 100 ? '#22c55e' : r.salesTargetRate >= 80 ? '#eab308' : '#ef4444';
      return <span style={{ color, fontWeight: 600 }}>{r.salesTargetRate}%</span>;
    },
  },
  {
    key: 'serviceScore',
    header: '服务评分',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.serviceScore.toFixed(1)} ⭐`,
  },
  {
    key: 'attendanceDays',
    header: '出勤 / 应出勤',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.attendanceDays}/${r.requiredDays}`,
  },
  {
    key: 'conversionRate',
    header: '转化率',
    sortable: true,
    render: (r: StaffPerformanceRecord) => `${r.conversionRate}%`,
  },
  {
    key: 'newMembers',
    header: '新增会员',
    sortable: true,
    dataKey: 'newMembers',
  },
  {
    key: 'grade',
    header: '绩效等级',
    sortable: true,
    render: (r: StaffPerformanceRecord) => {
      const cfg = GRADE_CONFIG[r.grade] ?? { variant: 'neutral' as const, label: r.grade };
      return <StatusBadge variant={cfg.variant} label={cfg.label} />;
    },
  },
];

// ============================================================
// 筛选 Tabs
// ============================================================

type FilterTab = 'all' | 'A' | 'B' | 'C' | 'D' | 'below_target';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'A', label: '优秀' },
  { key: 'B', label: '良好' },
  { key: 'C', label: '一般' },
  { key: 'D', label: '待改进' },
  { key: 'below_target', label: '未达标' },
];

// ============================================================
// 子组件: Loading Skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片骨架 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 10, background: 'rgba(148,163,184,0.06)' }} />
        ))}
      </div>
      {/* 搜索框骨架 */}
      <div style={{ height: 36, width: 360, borderRadius: 8, background: 'rgba(148,163,184,0.06)', marginBottom: 16 }} />
      {/* 标签骨架 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ height: 32, width: 70, borderRadius: 6, background: 'rgba(148,163,184,0.06)' }} />
        ))}
      </div>
      {/* 表格行骨架 */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 48, borderRadius: 6, background: 'rgba(148,163,184,0.04)', marginBottom: 6 }} />
      ))}
    </div>
  );
}

// ============================================================
// 子组件: Error State
// ============================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>📊</div>
      <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>绩效看板加载失败</div>
      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{error}</div>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 28px',
          borderRadius: 10,
          border: 'none',
          background: '#3b82f6',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        重新加载
      </button>
    </div>
  );
}

// ============================================================
// 子组件: 绩效排行榜
// ============================================================

function StaffRanking({ records }: { records: StaffPerformanceRecord[] }) {
  const sorted = [...records].sort((a, b) => b.salesAmount - a.salesAmount).slice(0, 5);
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 16,
      marginBottom: 20,
      background: '#fff',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 12px' }}>
        🏆 本月销售排行榜 TOP 5
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: i === 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : i < 3 ? '#f9fafb' : 'transparent',
          }}>
            <span style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: ['#f59e0b', '#94a3b8', '#d97706', '#e5e7eb', '#e5e7eb'][i],
              color: i < 3 ? '#fff' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {['🥇', '🥈', '🥉', '4', '5'][i]}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.name}</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{r.role}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>¥{r.salesAmount.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{r.salesTargetRate}% 完成率</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 回访待办排名
// ============================================================

function LowPerformanceAlert({ records }: { records: StaffPerformanceRecord[] }) {
  const lowPerformers = records.filter(r => r.salesTargetRate < 80).sort((a, b) => a.salesTargetRate - b.salesTargetRate);
  if (lowPerformers.length === 0) return null;
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #fecaca',
      padding: '12px 16px',
      marginBottom: 20,
      background: '#fef2f2',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', margin: '0 0 8px' }}>
        ⚠️ 绩效预警 — 未达标员工
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {lowPerformers.map(r => (
          <div key={r.id} style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: '#fff',
            border: '1px solid #fecaca',
            fontSize: 12,
          }}>
            <span style={{ fontWeight: 600, color: '#991b1b' }}>{r.name}</span>
            <span style={{ color: '#ef4444', marginLeft: 4 }}>{r.salesTargetRate}%</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: '#b91c1c' }}>
        共 {lowPerformers.length} 名员工需加强辅导
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 团队分布图表
// ============================================================

function GradeDistributionChart({ records }: { records: StaffPerformanceRecord[] }) {
  const grades = ['A', 'B', 'C', 'D'] as const;
  const counts = grades.map(g => ({ grade: g, count: records.filter(r => r.grade === g).length }));
  const maxCount = Math.max(...counts.map(c => c.count), 1);

  const GRADE_COLORS: Record<string, string> = {
    A: '#22c55e',
    B: '#3b82f6',
    C: '#eab308',
    D: '#ef4444',
  };
  const GRADE_LABELS: Record<string, string> = { A: '优秀', B: '良好', C: '一般', D: '待改进' };

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 16,
      marginBottom: 20,
      background: '#fff',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>
        📊 团队绩效等级分布
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 70, padding: '4px 0' }}>
        {counts.map(({ grade, count }) => (
          <div key={grade} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{count}</div>
            <div style={{
              width: '70%',
              background: GRADE_COLORS[grade],
              borderRadius: '4px 4px 0 0',
              height: Math.max((count / maxCount) * 50, 4),
              minHeight: 4,
              transition: 'height 0.3s',
            }} />
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{GRADE_LABELS[grade]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 客户端组件
// ============================================================

interface StaffPerformanceClientProps {
  records: StaffPerformanceRecord[];
  summary?: PerformanceSummary;
}

export function StaffPerformanceClient({ records, summary }: StaffPerformanceClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模拟加载延迟
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200 + Math.random() * 200);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => setLoading(false), 500);
  }, []);

  const { searchTerm: search, setSearchTerm: setSearch, filteredItems: searchedItems } = useSearchFilter(
    records,
    ['name', 'role', 'remark'],
  );

  const statusFiltered = useMemo(() => {
    if (activeTab === 'all') return searchedItems;
    if (activeTab === 'below_target') return searchedItems.filter(r => r.salesTargetRate < 100);
    return searchedItems.filter(r => r.grade === activeTab);
  }, [searchedItems, activeTab]);

  const pagination = usePagination({ initialPageSize: 6 });
  const { page, pageSize, setPage, setPageSize, totalPages } = pagination;
  const pageItems = pagination.paginate(statusFiltered);

  const stats = useMemo(() => computeStats(records), [records]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <PageShell title="员工绩效看板" subtitle="正在加载数据…">
        <LoadingSkeleton />
      </PageShell>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <PageShell title="员工绩效看板" subtitle="加载异常">
        <ErrorState error={error} onRetry={handleRetry} />
      </PageShell>
    );
  }

  /* ── Empty state ── */
  if (records.length === 0) {
    return (
      <PageShell title="员工绩效看板" subtitle="暂无数据">
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>📊</div>
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>暂无绩效数据</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>本月尚未录入员工绩效记录，请先进行数据录入</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="员工绩效看板" subtitle="查看门店员工月度绩效数据，支持搜索、排序与等级筛选">
      {/* 团队等级分布 */}
      <GradeDistributionChart records={records} />

      {/* 销售排行榜 */}
      <StaffRanking records={records} />

      {/* 未达标预警 */}
      <LowPerformanceAlert records={records} />

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="员工总人数" value={stats.total} />
        <StatCard label="总销售额 (元)" value={stats.totalSales.toLocaleString()} variant="info" />
        <StatCard label="平均服务评分" value={`${stats.avgServiceScore.toFixed(1)} ⭐`} variant="success" />
        <StatCard label="优秀 (A级)" value={stats.aGradeCount} variant="warning" />
        <StatCard label="未达标" value={stats.belowTargetCount} variant="error" />
      </div>

      {/* 摘要信息 */}
      {summary && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: '10px 14px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          fontSize: 13,
          color: '#64748b',
        }}>
          <span>📈 人均销售额: ¥{summary.avgSales.toLocaleString()}</span>
          <span>·</span>
          <span>🏅 总销售额: ¥{summary.totalSales.toLocaleString()}</span>
          <span>·</span>
          <span>⭐ 平均服务分: {summary.avgServiceScore}</span>
          <span>·</span>
          <span>A级 {summary.aCount}名 / B级 {summary.bCount}名 / C级 {summary.cCount}名 / D级 {summary.dCount}名</span>
        </div>
      )}

      {/* 搜索 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder="搜索员工姓名/岗位..."
          width={360}
        />
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          本月最佳员工: <strong style={{ color: '#22c55e' }}>{stats.topPerformer}</strong>
        </div>
      </div>

      {/* 筛选 Tabs */}
      <Tabs
        items={FILTER_TABS.map(t => ({
          key: t.key,
          label: `${t.label} (${
            t.key === 'all' ? records.length
              : t.key === 'below_target' ? records.filter(r => r.salesTargetRate < 100).length
              : records.filter(r => r.grade === t.key).length
          })`,
        }))}
        activeKey={activeTab}
        onChange={k => { setActiveTab(k as FilterTab); setPage(1); }}
      />

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(r: StaffPerformanceRecord) => r.id}
      />

      {/* Empty table state */}
      {pageItems.length === 0 && statusFiltered.length > 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          当前筛选条件下无匹配记录，请尝试调整筛选条件
        </div>
      )}

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ color: '#94a3b8', fontSize: 14 }}>
          共 {statusFiltered.length} 条记录，当前第 {page}/{totalPages} 页
        </span>
        <Pagination
          page={page}
          total={statusFiltered.length}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 12, 24]}
        />
      </div>
    </PageShell>
  );
}
