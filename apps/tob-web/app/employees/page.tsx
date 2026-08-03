'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MOCK_EMPLOYEES,
  EMPLOYEE_ROLE_MAP,
  EMPLOYEE_STATUS_MAP,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_DEPARTMENTS,
  ALL_STORES,
  ALL_MARKETS,
  type EmployeeItem,
  type EmployeeRole,
  type EmployeeStatus,
  type EmployeeDepartment,
} from '../employees-data';

// ---- 工具函数 ----

function performanceLevel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 75) return '良好';
  if (score >= 60) return '合格';
  return '待改进';
}

function performanceColor(score: number): string {
  if (score >= 90) return '#4ade80';
  if (score >= 75) return '#93c5fd';
  if (score >= 60) return '#fbbf24';
  return '#f87171';
}

function formatSalary(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

function roleOrder(role: EmployeeRole): number {
  const o: Record<EmployeeRole, number> = {
    manager: 4,
    supervisor: 3,
    staff: 2,
    trainee: 1,
  };
  return o[role];
}

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: EmployeeItem) => void
): DataTableColumn<EmployeeItem>[] {
  return [
    {
      key: 'code',
      title: '员工编号',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '姓名',
      dataKey: 'name',
      sortable: true,
      render: (item: EmployeeItem) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(item);
          }}
          style={{
            color: '#93c5fd',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'phone',
      title: '手机号',
      dataKey: 'phone',
      sortable: true,
      render: (item: EmployeeItem) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#94a3b8' }}>
          {item.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')}
        </span>
      ),
    },
    {
      key: 'department',
      title: '部门',
      dataKey: 'department',
      sortable: true,
      render: (item: EmployeeItem) => {
        const deptLabels: Record<EmployeeDepartment, string> = {
          sales: '销售部',
          operations: '运营部',
          marketing: '市场部',
          finance: '财务部',
          hr: '人事部',
        };
        return (
          <span style={{ color: '#94a3b8' }}>
            {deptLabels[item.department]}
          </span>
        );
      },
    },
    {
      key: 'role',
      title: '职位',
      sortable: true,
      sortValue: (item: EmployeeItem) => roleOrder(item.role),
      render: (item: EmployeeItem) => {
        const r = EMPLOYEE_ROLE_MAP[item.role];
        return <StatusBadge label={r.label} variant={r.variant} size="sm" />;
      },
    },
    {
      key: 'storeName',
      title: '所属门店',
      dataKey: 'storeName',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: EmployeeItem) => item.status,
      render: (item: EmployeeItem) => {
        const s = EMPLOYEE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'salary',
      title: '薪资',
      dataKey: 'salary',
      sortable: true,
      align: 'right',
      render: (item: EmployeeItem) => (
        <span
          style={{
            fontWeight: 600,
            color: '#4ade80',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSalary(item.salary)}
        </span>
      ),
    },
    {
      key: 'performance',
      title: '绩效',
      sortable: true,
      sortValue: (item: EmployeeItem) => item.performance,
      align: 'center',
      render: (item: EmployeeItem) => (
        <span
          style={{
            fontWeight: 600,
            color: performanceColor(item.performance),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.performance}
          <span style={{ fontSize: 11, marginLeft: 4, color: '#94a3b8' }}>
            ({performanceLevel(item.performance)})
          </span>
        </span>
      ),
    },
    {
      key: 'joinDate',
      title: '入职时间',
      dataKey: 'joinDate',
      sortable: true,
    },
    {
      key: 'marketCode',
      title: '市场',
      dataKey: 'marketCode',
      sortable: true,
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

function EmployeesPageContent() {
  // 搜索过滤
  const searchFields = useMemo<(keyof EmployeeItem)[]>(
    () => ['code', 'name', 'phone', 'storeName', 'department', 'email'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_EMPLOYEES,
    searchFields
  );

  // 部门筛选
  const [deptFilter, setDeptFilter] = useState<EmployeeDepartment | 'ALL'>('ALL');
  const deptFiltered = useMemo(
    () =>
      deptFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.department === deptFilter),
    [filteredItems, deptFilter]
  );

  // 角色筛选
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'ALL'>('ALL');
  const roleFiltered = useMemo(
    () =>
      roleFilter === 'ALL'
        ? deptFiltered
        : deptFiltered.filter((item) => item.role === roleFilter),
    [deptFiltered, roleFilter]
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? roleFiltered
        : roleFiltered.filter((item) => item.status === statusFilter),
    [roleFiltered, statusFilter]
  );

  // 门店筛选
  const [storeFilter, setStoreFilter] = useState<string>('ALL');
  const storeFiltered = useMemo(
    () =>
      storeFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.storeName === storeFilter),
    [statusFiltered, storeFilter]
  );

  // 市场筛选
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? storeFiltered
        : storeFiltered.filter((item) => item.marketCode === marketFilter),
    [storeFiltered, marketFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: EmployeeItem) => {
    window.location.href = `/employees/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(marketFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, deptFilter, roleFilter, statusFilter, storeFilter, marketFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计数据
  const stats = useMemo(() => {
    const active = MOCK_EMPLOYEES.filter((m) => m.status === 'active').length;
    const totalSalary = MOCK_EMPLOYEES.reduce((s, m) => s + m.salary, 0);
    const avgPerformance =
      MOCK_EMPLOYEES.reduce((s, m) => s + m.performance, 0) / MOCK_EMPLOYEES.length;
    const managers = MOCK_EMPLOYEES.filter((m) => m.role === 'manager').length;
    return { total: MOCK_EMPLOYEES.length, active, totalSalary, avgPerformance: Math.round(avgPerformance), managers };
  }, []);

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="员工管理"
        subtitle="ToB 管理端 — 查看员工信息、角色分布与绩效数据，支持多维度筛选与排序。"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>员工总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {ALL_STORES.length} 个门店
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>在职员工</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.active}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {((stats.active / stats.total) * 100).toFixed(0)}% 在职率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>月薪总额</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: '#4ade80',
              }}
            >
              ¥{(stats.totalSalary / 10000).toFixed(1)}万
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              人均 ¥{Math.round(stats.totalSalary / stats.total).toLocaleString()}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均绩效</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: performanceColor(stats.avgPerformance),
              }}
            >
              {stats.avgPerformance}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              ({performanceLevel(stats.avgPerformance)})
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索员工编号 / 姓名 / 手机号 / 门店 / 部门 / 邮箱..."
          />
        </div>

        {/* 部门过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部部门', count: MOCK_EMPLOYEES.length },
              ...EMPLOYEE_DEPARTMENTS.map((d) => ({
                key: d,
                label: d === 'sales' ? '销售部' : d === 'operations' ? '运营部' : d === 'marketing' ? '市场部' : d === 'finance' ? '财务部' : '人事部',
                count: MOCK_EMPLOYEES.filter((item) => item.department === d).length,
              })),
            ]}
            activeKey={deptFilter}
            onChange={(key) => setDeptFilter(key as EmployeeDepartment | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 角色 + 状态 + 门店 + 市场 筛选栏 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              职位
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部职位', count: deptFiltered.length },
                ...EMPLOYEE_ROLES.map((r) => ({
                  key: r,
                  label: EMPLOYEE_ROLE_MAP[r].label,
                  count: deptFiltered.filter((item) => item.role === r).length,
                })),
              ]}
              activeKey={roleFilter}
              onChange={(key) => setRoleFilter(key as EmployeeRole | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              状态
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部状态', count: roleFiltered.length },
                ...EMPLOYEE_STATUSES.map((s) => ({
                  key: s,
                  label: EMPLOYEE_STATUS_MAP[s].label,
                  count: roleFiltered.filter((item) => item.status === s).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as EmployeeStatus | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              门店
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部门店', count: statusFiltered.length },
                ...ALL_STORES.map((store) => ({
                  key: store,
                  label: store,
                  count: statusFiltered.filter((item) => item.storeName === store).length,
                })),
              ]}
              activeKey={storeFilter}
              onChange={(key) => setStoreFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              市场
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部市场', count: storeFiltered.length },
                ...ALL_MARKETS.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: storeFiltered.filter((item) => item.marketCode === mkt).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(deptFilter !== 'ALL'
              ? [
                  {
                    key: 'department' as const,
                    label: deptFilter === 'sales' ? '销售部' : deptFilter === 'operations' ? '运营部' : deptFilter === 'marketing' ? '市场部' : deptFilter === 'finance' ? '财务部' : '人事部',
                    tone: 'info' as FilterChip['tone'],
                    count: deptFiltered.filter(
                      (item) => item.department === deptFilter
                    ).length,
                  },
                ]
              : []),
            ...(roleFilter !== 'ALL'
              ? [
                  {
                    key: 'role' as const,
                    label: EMPLOYEE_ROLE_MAP[roleFilter].label,
                    tone: (EMPLOYEE_ROLE_MAP[roleFilter].variant === 'success'
                      ? 'success'
                      : EMPLOYEE_ROLE_MAP[roleFilter].variant === 'warning'
                        ? 'warning'
                        : EMPLOYEE_ROLE_MAP[roleFilter].variant === 'info'
                          ? 'info'
                          : 'neutral') as FilterChip['tone'],
                    count: roleFiltered.filter(
                      (item) => item.role === roleFilter
                    ).length,
                  },
                ]
              : []),
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status' as const,
                    label: EMPLOYEE_STATUS_MAP[statusFilter].label,
                    tone: (EMPLOYEE_STATUS_MAP[statusFilter].variant === 'success'
                      ? 'success'
                      : EMPLOYEE_STATUS_MAP[statusFilter].variant === 'warning'
                        ? 'warning'
                        : EMPLOYEE_STATUS_MAP[statusFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(storeFilter !== 'ALL'
              ? [
                  {
                    key: 'store' as const,
                    label: storeFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: storeFiltered.filter(
                      (item) => item.storeName === storeFilter
                    ).length,
                  },
                ]
              : []),
            ...(marketFilter !== 'ALL'
              ? [
                  {
                    key: 'market' as const,
                    label: marketFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: marketFiltered.filter(
                      (item) => item.marketCode === marketFilter
                    ).length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'department':
                setDeptFilter('ALL');
                break;
              case 'role':
                setRoleFilter('ALL');
                break;
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'store':
                setStoreFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setDeptFilter('ALL');
            setRoleFilter('ALL');
            setStatusFilter('ALL');
            setStoreFilter('ALL');
            setMarketFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`员工列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </PageShell>
    </main>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeesPageFallback />}>
      <EmployeesPageContent />
    </Suspense>
  );
}

function EmployeesPageFallback() {
  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载员工列表...
    </main>
  );
}
