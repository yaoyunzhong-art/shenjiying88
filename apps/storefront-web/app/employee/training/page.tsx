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
import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';

// ---- 类型 ----

type TrainingStatus = 'in_progress' | 'completed' | 'not_started' | 'cancelled';

interface EmployeeTraining {
  id: string;
  name: string;
  role: string;
  department: string;
  courseName: string;
  startDate: string;
  endDate: string;
  progress: number;
  score: number | null;
  status: TrainingStatus;
}

const STATUS_LABELS: Record<TrainingStatus, string> = {
  in_progress: '培训中',
  completed: '已完成',
  not_started: '未开始',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<TrainingStatus, 'info' | 'success' | 'pending' | 'neutral'> = {
  in_progress: 'info',
  completed: 'success',
  not_started: 'pending',
  cancelled: 'neutral',
};

// ---- Mock 数据 ----

const MOCK_TRAINING: EmployeeTraining[] = [
  { id: 't1', name: '张三', role: '高级销售', department: '旗舰店', courseName: '新品话术培训', startDate: '2026-07-15', endDate: '2026-07-25', progress: 60, score: null, status: 'in_progress' },
  { id: 't2', name: '李四', role: '销售顾问', department: '旗舰店', courseName: '客户服务提升', startDate: '2026-07-10', endDate: '2026-07-20', progress: 85, score: null, status: 'in_progress' },
  { id: 't3', name: '王五', role: '销售顾问', department: '社区店', courseName: '消防安全培训', startDate: '2026-07-01', endDate: '2026-07-10', progress: 100, score: 92, status: 'completed' },
  { id: 't4', name: '赵六', role: '初级销售', department: '社区店', courseName: '基础销售技巧', startDate: '2026-07-20', endDate: '2026-07-30', progress: 0, score: null, status: 'not_started' },
  { id: 't5', name: '陈七', role: '高级销售', department: '旗舰店', courseName: '数据分析进阶', startDate: '2026-07-05', endDate: '2026-07-15', progress: 100, score: 88, status: 'completed' },
  { id: 't6', name: '刘八', role: '销售顾问', department: '社区店', courseName: '新品话术培训', startDate: '2026-07-15', endDate: '2026-07-25', progress: 40, score: null, status: 'in_progress' },
  { id: 't7', name: '孙九', role: '初级销售', department: '旗舰店', courseName: '产品知识考核', startDate: '2026-07-01', endDate: '2026-07-08', progress: 100, score: 95, status: 'completed' },
  { id: 't8', name: '周十', role: '高级销售', department: '社区店', courseName: '管理能力培训', startDate: '2026-07-25', endDate: '2026-08-05', progress: 0, score: null, status: 'not_started' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<EmployeeTraining>[] = [
  {
    key: 'name',
    header: '员工',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.role}
        </span>
      </div>
    ),
  },
  {
    key: 'department',
    header: '部门',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.department}</span>
    ),
  },
  {
    key: 'courseName',
    header: '培训课程',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{item.courseName}</span>
    ),
  },
  {
    key: 'progress',
    header: '进度',
    align: 'right',
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <div
          style={{
            width: 80,
            height: 6,
            borderRadius: 3,
            background: 'rgba(148,163,184,0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${item.progress}%`,
              height: '100%',
              borderRadius: 3,
              background: item.progress === 100 ? '#4ade80' : '#3b82f6',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
          {item.progress}%
        </span>
      </div>
    ),
  },
  {
    key: 'score',
    header: '考核成绩',
    align: 'right',
    render: (item) => (
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: item.score !== null ? (item.score >= 90 ? '#4ade80' : item.score >= 70 ? '#facc15' : '#f87171') : '#64748b',
      }}>
        {item.score !== null ? `${item.score}分` : '-'}
      </span>
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

export default function EmployeeTrainingPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<EmployeeTraining[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<EmployeeTraining[]>((resolve) => {
        setTimeout(() => resolve(MOCK_TRAINING), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  // 搜索
  const searchFields = useMemo<(keyof EmployeeTraining)[]>(
    () => ['name', 'role', 'department', 'courseName'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    pageData.length > 0 ? pageData : MOCK_TRAINING,
    searchFields,
  );

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | 'ALL'>('ALL');
  const finalFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
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
    const inProgress = pageData.filter((m) => m.status === 'in_progress').length;
    const completed = pageData.filter((m) => m.status === 'completed').length;
    const avgScore = pageData
      .filter((m) => m.score !== null)
      .reduce((sum, m) => sum + (m.score ?? 0), 0);
    const scoredCount = pageData.filter((m) => m.score !== null).length;
    return {
      total: pageData.length,
      inProgress,
      completed,
      avgScore: scoredCount > 0 ? Math.round(avgScore / scoredCount) : 0,
    };
  }, [pageData]);

  return (
    <PageShell
      title="员工培训"
      description="查看员工培训进度与考核成绩。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<EmployeeTraining[]>((resolve) => {
              setTimeout(() => resolve(MOCK_TRAINING), 300);
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatBadge label="总培训记录" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="培训中" value={String(stats.inProgress)} accent="#3b82f6" />
          <StatBadge label="已完成" value={String(stats.completed)} accent="#4ade80" />
          <StatBadge label="平均成绩" value={stats.avgScore > 0 ? `${stats.avgScore}分` : '-'} accent="#facc15" />
        </div>

        {/* 搜索与过滤 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索员工姓名、课程或部门..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
              ...(['in_progress', 'completed', 'not_started', 'cancelled'] as const).map(
                (status) => ({
                  key: status,
                  label: STATUS_LABELS[status],
                  count: (filteredItems ?? []).filter((item) => item.status === status).length,
                }),
              ),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as TrainingStatus | 'ALL')}
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
            未找到匹配的培训记录
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
