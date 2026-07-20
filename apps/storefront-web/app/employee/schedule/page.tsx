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

type ShiftType = '早班' | '中班' | '晚班' | '全天' | '休息';
type ScheduleStatus = 'confirmed' | 'pending' | 'conflict';

interface EmployeeSchedule {
  id: string;
  name: string;
  role: string;
  department: string;
  date: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
}

const STATUS_LABELS: Record<ScheduleStatus, string> = {
  confirmed: '已确认',
  pending: '待确认',
  conflict: '冲突',
};

const STATUS_VARIANTS: Record<ScheduleStatus, 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  conflict: 'danger',
};

const SHIFT_COLORS: Record<ShiftType, string> = {
  '早班': '#3b82f6',
  '中班': '#f59e0b',
  '晚班': '#8b5cf6',
  '全天': '#10b981',
  '休息': '#94a3b8',
};

// ---- Mock 数据 ----

const MOCK_SCHEDULES: EmployeeSchedule[] = [
  { id: 's1', name: '张三', role: '高级销售', department: '旗舰店', date: '2026-07-20', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'confirmed' },
  { id: 's2', name: '李四', role: '销售顾问', department: '旗舰店', date: '2026-07-20', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 's3', name: '王五', role: '销售顾问', department: '社区店', date: '2026-07-20', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'pending' },
  { id: 's4', name: '赵六', role: '初级销售', department: '社区店', date: '2026-07-20', shift: '休息', startTime: '-', endTime: '-', status: 'confirmed' },
  { id: 's5', name: '陈七', role: '高级销售', department: '旗舰店', date: '2026-07-20', shift: '全天', startTime: '08:00', endTime: '22:00', status: 'confirmed' },
  { id: 's6', name: '刘八', role: '销售顾问', department: '社区店', date: '2026-07-20', shift: '晚班', startTime: '16:00', endTime: '24:00', status: 'conflict' },
  { id: 's7', name: '孙九', role: '初级销售', department: '旗舰店', date: '2026-07-20', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 's8', name: '周十', role: '高级销售', department: '社区店', date: '2026-07-20', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'confirmed' },
  { id: 's9', name: '张三', role: '高级销售', department: '旗舰店', date: '2026-07-21', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 's10', name: '李四', role: '销售顾问', department: '旗舰店', date: '2026-07-21', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'pending' },
  { id: 's11', name: '王五', role: '销售顾问', department: '社区店', date: '2026-07-21', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 's12', name: '赵六', role: '初级销售', department: '社区店', date: '2026-07-21', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'confirmed' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<EmployeeSchedule>[] = [
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
    key: 'date',
    header: '日期',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
        {item.date}
      </span>
    ),
  },
  {
    key: 'shift',
    header: '班次',
    render: (item) => (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          color: SHIFT_COLORS[item.shift],
          background: `${SHIFT_COLORS[item.shift]}1a`,
        }}
      >
        {item.shift}
      </span>
    ),
  },
  {
    key: 'startTime',
    header: '开始',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.startTime}</span>
    ),
  },
  {
    key: 'endTime',
    header: '结束',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.endTime}</span>
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

export default function EmployeeSchedulePage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<EmployeeSchedule[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<EmployeeSchedule[]>((resolve) => {
        setTimeout(() => resolve(MOCK_SCHEDULES), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  // 搜索
  const searchFields = useMemo<(keyof EmployeeSchedule)[]>(
    () => ['name', 'role', 'department', 'shift'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    pageData.length > 0 ? pageData : MOCK_SCHEDULES,
    searchFields,
  );

  // 部门过滤
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const deptFiltered = useMemo(
    () =>
      deptFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.department === deptFilter),
    [filteredItems, deptFilter],
  );

  // 班次过滤
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const finalFiltered = useMemo(
    () =>
      shiftFilter === 'ALL'
        ? deptFiltered
        : deptFiltered.filter((item) => item.shift === shiftFilter),
    [deptFiltered, shiftFilter],
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
    const confirmed = pageData.filter((m) => m.status === 'confirmed').length;
    const pending = pageData.filter((m) => m.status === 'pending').length;
    const conflict = pageData.filter((m) => m.status === 'conflict').length;
    const shifts = new Set(pageData.map((m) => `${m.date}-${m.shift}`));
    return {
      total: pageData.length,
      confirmed,
      pending,
      conflict,
      uniqueShifts: shifts.size,
    };
  }, [pageData]);

  return (
    <PageShell
      title="员工排班"
      description="查看员工排班信息，管理班次安排与状态。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<EmployeeSchedule[]>((resolve) => {
              setTimeout(() => resolve(MOCK_SCHEDULES), 300);
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
          <StatBadge label="总排班数" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="已确认" value={String(stats.confirmed)} accent="#4ade80" />
          <StatBadge label="待确认" value={String(stats.pending)} accent="#facc15" />
          <StatBadge label="排班冲突" value={String(stats.conflict)} accent="#f87171" />
        </div>

        {/* 搜索与过滤 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索员工姓名、角色或班次..."
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部部门', count: (filteredItems ?? []).length },
              { key: '旗舰店', label: '旗舰店', count: (filteredItems ?? []).filter((i) => i.department === '旗舰店').length },
              { key: '社区店', label: '社区店', count: (filteredItems ?? []).filter((i) => i.department === '社区店').length },
            ]}
            activeKey={deptFilter}
            onChange={(key) => setDeptFilter(key)}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部班次', count: deptFiltered.length },
              { key: '早班', label: '早班', count: deptFiltered.filter((m) => m.shift === '早班').length },
              { key: '中班', label: '中班', count: deptFiltered.filter((m) => m.shift === '中班').length },
              { key: '晚班', label: '晚班', count: deptFiltered.filter((m) => m.shift === '晚班').length },
              { key: '全天', label: '全天', count: deptFiltered.filter((m) => m.shift === '全天').length },
              { key: '休息', label: '休息', count: deptFiltered.filter((m) => m.shift === '休息').length },
            ]}
            activeKey={shiftFilter}
            onChange={(key) => setShiftFilter(key)}
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
            未找到匹配的排班记录
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
