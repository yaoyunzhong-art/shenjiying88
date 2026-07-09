/**
 * 店长工作台 — Store Manager Workbench (Next.js App Router Page)
 * 角色视角: 👔门店店长
 * 功能: 今日运营指标 / 待办任务 / 设备状态 / 快速操作 / 热门商品 / 人员排班
 */
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  StoreManagerDashboard,
  DataTable,
  DetailActionBar,
  Pagination,
  QuickStats,
  Tabs,
  StatusBadge,
  FilterChips,
  PageShell,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import type {
  StoreDailyMetrics,
  PendingTask,
  DeviceStatusSummary,
  QuickAction,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

interface TopProduct {
  id: string;
  rank: number;
  name: string;
  sku: string;
  salesVolume: number;
  revenue: number;
  stock: number;
  reorderLevel: 'safe' | 'low' | 'critical';
}

interface ShiftSchedule {
  id: string;
  staffName: string;
  role: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'off';
  status: 'onDuty' | 'onLeave' | 'late' | 'absent';
}

// ============================================================
// 常量映射
// ============================================================

const SHIFT_LABEL: Record<ShiftSchedule['shift'], string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
  off: '休息',
};

const SHIFT_VARIANT: Record<ShiftSchedule['shift'], 'info' | 'warning' | 'neutral' | 'success'> = {
  morning: 'info',
  afternoon: 'warning',
  evening: 'neutral',
  off: 'success',
};

const STATUS_LABEL: Record<ShiftSchedule['status'], string> = {
  onDuty: '在岗',
  onLeave: '请假',
  late: '迟到',
  absent: '缺勤',
};

const STATUS_URGENCY: Record<ShiftSchedule['status'], 'success' | 'neutral' | 'warning' | 'danger'> = {
  onDuty: 'success',
  onLeave: 'neutral',
  late: 'warning',
  absent: 'danger',
};

const REORDER_LABEL: Record<TopProduct['reorderLevel'], string> = {
  safe: '充足',
  low: '偏低',
  critical: '紧急',
};

const REORDER_VARIANT: Record<TopProduct['reorderLevel'], 'success' | 'warning' | 'danger'> = {
  safe: 'success',
  low: 'warning',
  critical: 'danger',
};

const TASK_TYPE_LABEL: Record<PendingTask['type'], string> = {
  inventory: '库存',
  member: '会员',
  order: '订单',
  device: '设备',
  alert: '告警',
};

// ============================================================
// Mock 数据
// ============================================================

const MOCK_METRICS: StoreDailyMetrics = {
  revenue: 128_560,
  orderCount: 342,
  avgOrderValue: 376,
  newMembers: 28,
  revenueTrend: 12.5,
  orderTrend: 8.3,
  avgValueTrend: -2.1,
  memberTrend: 15.0,
};

const MOCK_DEVICE_STATUS: DeviceStatusSummary = {
  total: 48,
  online: 42,
  offline: 3,
  warning: 3,
  lastCheckAt: '2026-07-10 03:30',
};

const MOCK_TASKS: PendingTask[] = [
  { id: 't1', title: 'B区娃娃机缺货补货', type: 'inventory', priority: 'high', createdAt: '2026-07-10 02:15', description: 'B-12/B-14 机器内商品余量 < 10%' },
  { id: 't2', title: '会员投诉跟进：设备刷卡异常', type: 'member', priority: 'high', createdAt: '2026-07-10 01:30' },
  { id: 't3', title: '下午 2 点调拨单到货验收', type: 'inventory', priority: 'medium', createdAt: '2026-07-09 22:00' },
  { id: 't4', title: 'C区兑奖机故障报修', type: 'device', priority: 'high', createdAt: '2026-07-09 20:45', description: 'C-05 兑奖机卡纸，已联系维修' },
  { id: 't5', title: '今日 16:30 员工交接班会议', type: 'order', priority: 'medium', createdAt: '2026-07-09 18:00' },
  { id: 't6', title: '周日促销活动物料确认', type: 'order', priority: 'low', createdAt: '2026-07-09 15:30' },
  { id: 't7', title: '库存盘点异常 A 区差异 -3', type: 'inventory', priority: 'medium', createdAt: '2026-07-09 14:00' },
  { id: 't8', title: '新入职导购员系统权限开通', type: 'alert', priority: 'low', createdAt: '2026-07-08 10:00' },
  { id: 't9', title: '网络设备告警：交换机端口掉线', type: 'alert', priority: 'high', createdAt: '2026-07-10 03:00', description: 'C 区汇聚交换机端口 12 掉线' },
];

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { id: 'p1', rank: 1, name: '星之卡比毛绒玩偶', sku: 'KIRBY-ML-001', salesVolume: 86, revenue: 17_200, stock: 230, reorderLevel: 'safe' },
  { id: 'p2', rank: 2, name: '太鼓达人限定手办', sku: 'TAIKO-FIG-002', salesVolume: 64, revenue: 15_360, stock: 85, reorderLevel: 'low' },
  { id: 'p3', rank: 3, name: '宝可梦集换卡牌包', sku: 'POKE-PACK-003', salesVolume: 120, revenue: 14_400, stock: 45, reorderLevel: 'critical' },
  { id: 'p4', rank: 4, name: '迪士尼盲盒系列 4', sku: 'DIS-BLIND-004', salesVolume: 58, revenue: 8_120, stock: 180, reorderLevel: 'safe' },
  { id: 'p5', rank: 5, name: '初音未来限定徽章', sku: 'MIKU-BADGE-005', salesVolume: 42, revenue: 4_200, stock: 320, reorderLevel: 'safe' },
  { id: 'p6', rank: 6, name: '蜡笔小新联名钥匙扣', sku: 'SHIN-KEY-006', salesVolume: 38, revenue: 2_660, stock: 95, reorderLevel: 'low' },
  { id: 'p7', rank: 7, name: '街霸角色集换卡', sku: 'SF-CARD-007', salesVolume: 35, revenue: 3_150, stock: 62, reorderLevel: 'low' },
  { id: 'p8', rank: 8, name: '马里奥赛车合金模型', sku: 'MARIO-CAR-008', salesVolume: 29, revenue: 5_800, stock: 130, reorderLevel: 'safe' },
];

const MOCK_SHIFTS: ShiftSchedule[] = [
  { id: 's1', staffName: '王志明', role: '收银员', shift: 'morning', status: 'onDuty' },
  { id: 's2', staffName: '李婷', role: '导购员', shift: 'morning', status: 'onDuty' },
  { id: 's3', staffName: '张伟', role: '设备维护', shift: 'morning', status: 'onDuty' },
  { id: 's4', staffName: '陈雪', role: '导购员', shift: 'afternoon', status: 'onDuty' },
  { id: 's5', staffName: '刘洋', role: '收银员', shift: 'afternoon', status: 'late' },
  { id: 's6', staffName: '赵鹏', role: '库管', shift: 'afternoon', status: 'onDuty' },
  { id: 's7', staffName: '林峰', role: '设备维护', shift: 'evening', status: 'onDuty' },
  { id: 's8', staffName: '王芳', role: '收银员', shift: 'evening', status: 'onLeave' },
  { id: 's9', staffName: '周杰', role: '导购员', shift: 'evening', status: 'absent' },
  { id: 's10', staffName: '杨柳', role: '导购员', shift: 'off', status: 'onLeave' },
];

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { key: 'inventory-check', label: '库存盘点', primary: true },
  { key: 'shift-handover', label: '交接班', primary: false },
  { key: 'device-report', label: '设备报修', primary: false },
  { key: 'member-feedback', label: '会员反馈', primary: false },
  { key: 'daily-report', label: '日报导出', primary: false },
];

// ============================================================
// 列定义
// ============================================================

function buildProductColumns(): DataTableColumn<TopProduct>[] {
  return [
    {
      key: 'rank',
      title: '#',
      dataKey: 'rank',
      sortable: true,
      width: '48px',
    },
    {
      key: 'name',
      title: '商品名称',
      dataKey: 'name',
      sortable: true,
    },
    {
      key: 'sku',
      title: 'SKU',
      dataKey: 'sku',
      sortable: true,
    },
    {
      key: 'salesVolume',
      title: '销量',
      dataKey: 'salesVolume',
      sortable: true,
      align: 'right',
    },
    {
      key: 'revenue',
      title: '营收 (¥)',
      sortable: true,
      align: 'right',
      render: (item: TopProduct) => `¥${item.revenue.toLocaleString()}`,
    },
    {
      key: 'stock',
      title: '库存',
      dataKey: 'stock',
      sortable: true,
      align: 'right',
    },
    {
      key: 'reorderLevel',
      title: '补货',
      sortable: true,
      render: (item: TopProduct) => (
        <StatusBadge label={REORDER_LABEL[item.reorderLevel]} variant={REORDER_VARIANT[item.reorderLevel]} size="sm" />
      ),
    },
  ];
}

function buildShiftColumns(): DataTableColumn<ShiftSchedule>[] {
  return [
    {
      key: 'staffName',
      title: '姓名',
      dataKey: 'staffName',
      sortable: true,
    },
    {
      key: 'role',
      title: '岗位',
      dataKey: 'role',
      sortable: true,
    },
    {
      key: 'shift',
      title: '班次',
      sortable: true,
      render: (item: ShiftSchedule) => (
        <StatusBadge label={SHIFT_LABEL[item.shift]} variant={SHIFT_VARIANT[item.shift]} size="sm" />
      ),
    },
    {
      key: 'status',
      title: '出勤状态',
      sortable: true,
      render: (item: ShiftSchedule) => (
        <StatusBadge label={STATUS_LABEL[item.status]} variant={STATUS_URGENCY[item.status]} size="sm" dot />
      ),
    },
  ];
}

// ============================================================
// 页面组件
// ============================================================

const TASK_PRIORITIES: Array<'ALL' | 'high' | 'medium' | 'low'> = ['ALL', 'high', 'medium', 'low'];

export default function StoreManagerWorkbenchPage(): React.ReactElement {
  const router = useRouter();

  // --- 待办任务 ---
  const taskSearchFields = useMemo<(keyof PendingTask)[]>(() => ['title', 'description'], []);
  const { searchTerm: taskSearch, setSearchTerm: setTaskSearch, filteredItems: taskSearched } = useSearchFilter(MOCK_TASKS, taskSearchFields);

  const [taskPriority, setTaskPriority] = useState<'ALL' | 'high' | 'medium' | 'low'>('ALL');
  const taskFiltered = useMemo(
    () => (taskPriority === 'ALL' ? taskSearched : taskSearched.filter((t) => t.priority === taskPriority)),
    [taskSearched, taskPriority],
  );

  const taskSortConfigState = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' });
  const [taskSort, setTaskSort] = taskSortConfigState;

  const taskColumns = useMemo(() => {
    const cols: DataTableColumn<PendingTask>[] = [
      {
        key: 'title',
        title: '任务',
        dataKey: 'title',
        sortable: true,
      },
      {
        key: 'type',
        title: '类型',
        sortable: true,
        render: (item: PendingTask) => <StatusBadge label={TASK_TYPE_LABEL[item.type]} variant="neutral" size="sm" />,
      },
      {
        key: 'priority',
        title: '优先级',
        sortable: true,
        render: (item: PendingTask) => {
          const p = item.priority;
          const variant = p === 'high' ? 'danger' : p === 'medium' ? 'warning' : 'neutral' as const;
          const label = p === 'high' ? '高' : p === 'medium' ? '中' : '低';
          return <StatusBadge label={label} variant={variant} size="sm" dot />;
        },
      },
      {
        key: 'createdAt',
        title: '创建时间',
        dataKey: 'createdAt',
        sortable: true,
      },
    ];
    return cols;
  }, []);

  const taskSorted = useSortedItems(taskFiltered, taskColumns, taskSort);
  const taskPagination = usePagination({ initialPageSize: 5 });
  useEffect(() => { taskPagination.resetPage(); }, [taskSearch, taskPriority]);
  const taskPageItems = taskPagination.paginate(taskSorted);

  // --- 热门商品 ---
  const [productSort, setProductSort] = useState<DataTableSortConfig | null>({ key: 'rank', direction: 'asc' });
  const prodColumns = useMemo(() => buildProductColumns(), []);
  const sortedProducts = useSortedItems(MOCK_TOP_PRODUCTS, prodColumns, productSort);
  const prodPagination = usePagination({ initialPageSize: 5 });
  const prodPageItems = prodPagination.paginate(sortedProducts);

  // --- 排班 ---
  const [shiftFilter, setShiftFilter] = useState<ShiftSchedule['shift'] | 'ALL'>('ALL');
  const shiftFiltered = useMemo(
    () => (shiftFilter === 'ALL' ? MOCK_SHIFTS : MOCK_SHIFTS.filter((s) => s.shift === shiftFilter)),
    [shiftFilter],
  );
  const shiftColumns = useMemo(() => buildShiftColumns(), []);
  const [shiftSort, setShiftSort] = useState<DataTableSortConfig | null>(null);
  const sortedShifts = useSortedItems(shiftFiltered, shiftColumns, shiftSort);

  // --- 统计 ---
  const stats = useMemo(() => ({
    revenue: MOCK_METRICS.revenue,
    orders: MOCK_METRICS.orderCount,
    newMembers: MOCK_METRICS.newMembers,
    deviceOnline: MOCK_DEVICE_STATUS.online,
    deviceTotal: MOCK_DEVICE_STATUS.total,
    pendingTasks: MOCK_TASKS.filter((t) => t.priority === 'high').length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'store-manager',
    detailId: 'overview',
    record: { metrics: MOCK_METRICS, deviceStatus: MOCK_DEVICE_STATUS, taskCount: MOCK_TASKS.length },
    shareTitle: '店长工作台',
    shareText: '门店今日运营指标 / 待办任务 / 设备状态概览',
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="店长工作台"
        subtitle="朝阳大悦城旗舰店 — 今日运营指标、待办任务、设备状态一站式管理。"
      >
        {/* ===== 核心运营指标 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>今日运营指标</h2>
          <StoreManagerDashboard
            dailyMetrics={MOCK_METRICS}
            deviceStatus={MOCK_DEVICE_STATUS}
            pendingTasks={[]} /* 下方单独展示 */
            quickActions={MOCK_QUICK_ACTIONS}
            storeName="朝阳大悦城旗舰店"
            lastSyncAt="2026-07-10 03:30"
          />
        </section>

        {/* ===== 快速统计 ===== */}
        <section style={{ marginBottom: 24 }}>
          <QuickStats
            items={[
              { label: '今日营收', value: `¥${stats.revenue.toLocaleString()}`, helper: '同比 +12.5%' },
              { label: '订单数', value: stats.orders, helper: '同比 +8.3%' },
              { label: '新增会员', value: stats.newMembers, helper: '同比 +15%' },
              { label: '设备在线率', value: `${((stats.deviceOnline / stats.deviceTotal) * 100).toFixed(0)}%`, helper: `${stats.deviceOnline}/${stats.deviceTotal} 台在线` },
              { label: '待处理高优先级', value: stats.pendingTasks, valueColor: '#f87171', helper: '紧急任务' },
            ]}
          />
        </section>

        {/* ===== 待办任务 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>待办任务</h2>
          <div style={{ marginBottom: 8 }}>
            <Tabs
              items={TASK_PRIORITIES.map((p) => ({
                key: p,
                label: p === 'ALL' ? '全部' : p === 'high' ? '高优先级' : p === 'medium' ? '中优先级' : '低优先级',
                count: p === 'ALL'
                  ? MOCK_TASKS.length
                  : MOCK_TASKS.filter((t) => t.priority === p).length,
              }))}
              activeKey={taskPriority}
              onChange={(key) => setTaskPriority(key as typeof taskPriority)}
              variant="pills"
              size="sm"
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.25)',
                background: 'rgba(15,23,42,0.5)',
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none',
              }}
              placeholder="搜索任务..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
          <DataTable
            title={`待办任务（共 ${taskSorted.length} 项）`}
            columns={taskColumns}
            items={taskPageItems}
            rowKey={(item) => item.id}
            sort={taskSort}
            onSortChange={setTaskSort}
            compact
            striped
          />
          <Pagination
            page={taskPagination.page}
            pageSize={taskPagination.pageSize}
            total={taskSorted.length}
            onPageChange={taskPagination.setPage}
            onPageSizeChange={taskPagination.setPageSize}
          />
        </section>

        {/* ===== 热门商品 TOP 8 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>今日热门商品</h2>
          <DataTable
            title="销量排行前 8"
            columns={prodColumns}
            items={prodPageItems}
            rowKey={(item) => item.id}
            sort={productSort}
            onSortChange={setProductSort}
            compact
          />
          <Pagination
            page={prodPagination.page}
            pageSize={prodPagination.pageSize}
            total={sortedProducts.length}
            onPageChange={prodPagination.setPage}
            onPageSizeChange={prodPagination.setPageSize}
          />
        </section>

        {/* ===== 人员排班 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>今日排班</h2>
          <div style={{ marginBottom: 8 }}>
            <Tabs
              items={(
                ['ALL', 'morning', 'afternoon', 'evening', 'off'] as const
              ).map((s) => ({
                key: s,
                label: s === 'ALL' ? '全部' : SHIFT_LABEL[s],
                count: s === 'ALL'
                  ? MOCK_SHIFTS.length
                  : MOCK_SHIFTS.filter((sh) => sh.shift === s).length,
              }))}
              activeKey={shiftFilter}
              onChange={(key) => setShiftFilter(key as typeof shiftFilter)}
              variant="pills"
              size="sm"
            />
          </div>
          <DataTable
            title="员工排班与出勤"
            columns={shiftColumns}
            items={sortedShifts}
            rowKey={(item) => item.id}
            sort={shiftSort}
            onSortChange={setShiftSort}
            compact
          />
        </section>

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="导出运营日报 / 分享工作台快照"
        />
      </PageShell>
    </main>
  );
}
