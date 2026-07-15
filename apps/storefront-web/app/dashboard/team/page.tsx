'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import {
  PageShell,
  Card,
  StatCard,
  StatusBadge,
  DataTable,
  Pagination,
  SearchFilterInput,
  Button,
  EmptyState,
  Select,
  Tabs,
  Avatar,
  AvatarGroup,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type TeamRole = 'store_manager' | 'shift_lead' | 'cashier' | 'sales_clerk' | 'technician' | 'cleaner';
type TeamStatus = 'active' | 'on_leave' | 'off_duty' | 'suspended' | 'resigned';

interface TeamMember {
  id: string;
  name: string;
  employeeNo: string;
  role: TeamRole;
  status: TeamStatus;
  phone: string;
  email: string;
  department: string;
  joinDate: string;
  shift: 'morning' | 'afternoon' | 'night' | 'rest';
  performanceScore: number;
  monthlySales: number;
  orderCount: number;
  avatar: string;
  skills: string[];
}

// ---- 常量映射 ----

const ROLE_LABELS: Record<TeamRole, string> = {
  store_manager: '店长',
  shift_lead: '值班组长',
  cashier: '收银员',
  sales_clerk: '导购员',
  technician: '技术员',
  cleaner: '保洁员',
};

const STATUS_LABELS: Record<TeamStatus, string> = {
  active: '在岗中',
  on_leave: '请假中',
  off_duty: '已下班',
  suspended: '停职中',
  resigned: '已离职',
};

const STATUS_VARIANTS: Record<TeamStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  active: 'success',
  on_leave: 'warning',
  off_duty: 'info',
  suspended: 'danger',
  resigned: 'neutral',
};

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班 (08:00-16:00)',
  afternoon: '中班 (12:00-20:00)',
  night: '晚班 (16:00-00:00)',
  rest: '休息',
};

const SHIFT_COLORS: Record<string, string> = {
  morning: '#34d399',
  afternoon: '#60a5fa',
  night: '#a78bfa',
  rest: '#94a3b8',
};

const DEPARTMENTS = ['门店运营部', '销售部', '技术维护部', '后勤保障部', '客户服务部'];

// ---- Mock 数据生成 ----

const NAMES = [
  '张明', '李华', '王芳', '赵强', '刘洋', '陈静', '杨磊', '黄丽',
  '周杰', '吴敏', '徐浩', '孙悦', '马超', '朱婷', '胡伟', '郭雪',
  '林峰', '何颖', '高翔', '梁燕', '郑凯', '谢琳', '宋涛', '唐蕾',
  '韩冰', '曹阳', '邓丽', '许波', '彭慧', '苏晨',
];

const SKILL_POOL = [
  '收银系统', '设备维修', '客户服务', '库存管理', '活动策划',
  '数据分析', '团队管理', '电竞赛事组织', '直播运营', '营销推广',
];

function randomItems(arr: string[], min: number, max: number): string[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generateTeam(count: number): TeamMember[] {
  const roles: TeamRole[] = ['store_manager', 'shift_lead', 'cashier', 'sales_clerk', 'technician', 'cleaner'];
  const shifts: ('morning' | 'afternoon' | 'night' | 'rest')[] = ['morning', 'afternoon', 'night', 'rest'];

  return Array.from({ length: count }, (_, i) => {
    const role = i < 2 ? roles[0] : roles[(i % (roles.length - 1)) + 1];
    const status: TeamStatus = i < 20 ? 'active' : (i < 24 ? 'on_leave' : (i < 27 ? 'off_duty' : 'resigned'));
    const monthSales = 20000 + Math.floor(Math.random() * 80000);
    const orders = 50 + Math.floor(Math.random() * 200);

    return {
      id: `TM-${String(i + 1).padStart(3, '0')}`,
      name: NAMES[i % NAMES.length],
      employeeNo: `EMP-${String(2026001 + i)}`,
      role,
      status,
      phone: `138${String(10000000 + Math.floor(Math.random() * 90000000)).slice(0, 8)}`,
      email: `staff${i + 1}@shenjiying.com`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      joinDate: `202${i % 6}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      shift: shifts[i % shifts.length],
      performanceScore: 60 + Math.floor(Math.random() * 40),
      monthlySales: monthSales,
      orderCount: orders,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=staff${i}`,
      skills: randomItems(SKILL_POOL, 2, 5),
    };
  });
}

const MOCK_TEAM = generateTeam(30);

// ---- 子组件 ----

/** 格式化金额 */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

/** 团队概览统计 */
function TeamSummaryCards({ members }: { members: TeamMember[] }) {
  const active = members.filter((m) => m.status === 'active').length;
  const onLeave = members.filter((m) => m.status === 'on_leave').length;
  const avgScore = Math.round(
    members.filter((m) => m.status !== 'resigned').reduce((sum, m) => sum + m.performanceScore, 0) /
      members.filter((m) => m.status !== 'resigned').length
  );
  const totalSales = members.filter((m) => m.status !== 'resigned').reduce((sum, m) => sum + m.monthlySales, 0);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard label="团队总人数" value={members.length.toString()} variant="info" />
      <StatCard label="当前在岗" value={active.toString()} variant="success" />
      <StatCard label="请假中" value={onLeave.toString()} variant="warning" />
      <StatCard label="平均绩效分" value={`${avgScore}`} variant="info" />
      <StatCard label="月度总业绩" value={formatCurrency(totalSales)} variant="success" />
    </div>
  );
}

/** 班次分布条 */
function ShiftDistributionBar({ members }: { members: TeamMember[] }) {
  const counts = { morning: 0, afternoon: 0, night: 0, rest: 0 };
  members.forEach((m) => {
    if (m.shift in counts) counts[m.shift]++;
  });
  const total = members.length;

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>班次分布</div>
      <div style={{ display: 'flex', gap: 4, height: 24, borderRadius: 6, overflow: 'hidden' }}>
        {(Object.entries(counts) as [string, number][]).map(([shift, count]) => (
          <div
            key={shift}
            style={{
              flex: count,
              background: SHIFT_COLORS[shift],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#0f172a',
              fontWeight: 600,
              minWidth: count > 0 ? `${(count / total) * 100}%` : '0%',
              transition: 'all 0.3s',
            }}
          >
            {count > 0 ? `${SHIFT_LABELS[shift].split(' ')[0]} ${count}人` : ''}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** 角色筛选 */
function RoleFilter({
  value,
  onChange,
}: {
  value: TeamRole | 'all';
  onChange: (v: TeamRole | 'all') => void;
}) {
  const options: { value: TeamRole | 'all'; label: string }[] = [
    { value: 'all', label: '全部岗位' },
    { value: 'store_manager', label: '店长' },
    { value: 'shift_lead', label: '值班组长' },
    { value: 'cashier', label: '收银员' },
    { value: 'sales_clerk', label: '导购员' },
    { value: 'technician', label: '技术员' },
    { value: 'cleaner', label: '保洁员' },
  ];

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {options.map((opt) => (
        <span
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 12,
            background: value === opt.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${value === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.08)'}`,
            color: value === opt.value ? '#818cf8' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </span>
      ))}
    </div>
  );
}

/** 快速操作面板 */
function QuickActions() {
  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>快速操作</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary" size="sm" onClick={() => alert('跳转至排班管理')}>
          📅 排班管理
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert('跳转至招聘页面')}>
          👤 招聘新员工
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert('跳转至培训页面')}>
          📚 培训管理
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert('跳转至考勤页面')}>
          ⏰ 考勤管理
        </Button>
      </div>
    </Card>
  );
}

/** 加载中骨架屏 */
function TeamLoadingSkeleton() {
  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(30,41,59,0.6) 50%, rgba(30,41,59,0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div style={{ height: 60, borderRadius: 10, background: 'rgba(30,41,59,0.3)', marginBottom: 16 }} />
      <div style={{ height: 300, borderRadius: 10, background: 'rgba(30,41,59,0.3)' }} />
    </div>
  );
}

/** 错误回退 */
function TeamErrorFallback() {
  return (
    <EmptyState
      title="团队成员数据加载失败"
      description="无法获取团队成员列表。请检查数据源服务状态。"
      actionLabel="重试"
      actionHref="/dashboard/team"
    />
  );
}

/** 空状态 */
function TeamEmptyState() {
  return (
    <EmptyState
      title="暂无团队成员"
      description="当前没有团队成员数据，请先添加团队成员。"
      actionLabel="添加成员"
      actionHref="/dashboard/team"
    />
  );
}

// ---- 主组件 ----

const ROLES: TeamRole[] = ['store_manager', 'shift_lead', 'cashier', 'sales_clerk', 'technician', 'cleaner'];

const COLUMNS: DataTableColumn<TeamMember>[] = [
  {
    key: 'name',
    header: '姓名',
    sortable: true,
    width: 120,
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={item.name} size="sm" />
        <span>{item.name}</span>
      </div>
    ),
  },
  { key: 'employeeNo', header: '工号', sortable: true, width: 130 },
  {
    key: 'role',
    header: '岗位',
    sortable: true,
    width: 90,
    render: (item) => ROLE_LABELS[item.role],
  },
  {
    key: 'status',
    header: '状态',
    sortable: true,
    width: 80,
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" />
    ),
  },
  { key: 'department', header: '部门', sortable: true, width: 110 },
  {
    key: 'shift',
    header: '班次',
    sortable: true,
    width: 100,
    render: (item) => SHIFT_LABELS[item.shift],
  },
  {
    key: 'performanceScore',
    header: '绩效分',
    sortable: true,
    width: 80,
    align: 'right',
  },
  {
    key: 'monthlySales',
    header: '月业绩',
    sortable: true,
    width: 110,
    align: 'right',
    render: (item) => formatCurrency(item.monthlySales),
  },
  { key: 'phone', header: '联系电话', width: 130 },
  {
    key: 'actions',
    header: '操作',
    width: 100,
    render: () => <Button variant="ghost" size="sm">详情</Button>,
  },
];

export default function DashboardTeamPage() {
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all');
  const searchFilter = useSearchFilter({ keys: ['name', 'employeeNo', 'phone', 'email', 'department'] });
  const pagination = usePagination({ defaultPageSize: 10 });

  // 多维过滤
  const filtered = useMemo(() => {
    let result = MOCK_TEAM;

    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }
    if (searchFilter.query) {
      const q = searchFilter.query.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.employeeNo.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q)
      );
    }

    return result;
  }, [roleFilter, searchFilter.query]);

  // 排序
  const { sortedItems, sortConfig, handleSort } = useSortedItems(filtered, {
    key: 'name',
    direction: 'asc',
  });

  // 分页
  const pagedItems = sortedItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sortedItems.length / pagination.pageSize);

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.setPage(newPage);
    },
    [pagination]
  );

  return (
    <PageShell title="团队管理" subtitle="查看门店团队成员信息、排班与绩效">
      {/* 概览统计 */}
      <TeamSummaryCards members={MOCK_TEAM} />

      {/* 左侧班次 + 右侧快速操作 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <ShiftDistributionBar members={MOCK_TEAM} />
        <QuickActions />
      </div>

      {/* 搜索与角色筛选 */}
      <Card>
        <div style={{ marginBottom: 10 }}>
          <SearchFilterInput
            placeholder="搜索姓名、工号、电话、邮箱..."
            value={searchFilter.query}
            onChange={searchFilter.setQuery}
          />
        </div>
        <RoleFilter value={roleFilter} onChange={(v) => { setRoleFilter(v); pagination.setPage(1); }} />
      </Card>

      {/* 数据表格 */}
      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={COLUMNS}
          data={pagedItems}
          sortConfig={sortConfig as DataTableSortConfig}
          onSort={handleSort}
          emptyState={<TeamEmptyState />}
          loading={false}
        />

        {sortedItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={pagination.setPageSize}
              total={sortedItems.length}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
