'use client';

/**
 * 门店员工管理 - Store Staff Management Page
 * 角色: 👥HR管理 / 👔店长
 * 功能: 门店员工清单、排班管理、考勤统计、培训记录
 */

import { useState, useMemo, useCallback, use } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  InfoRow,
  StatCard,
  CopyToClipboard,
  DetailClosureBar,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

// ---- 类型定义 ----

type StaffRole = 'store_manager' | 'shift_manager' | 'cashier' | 'guide' | 'technician' | 'cleaner' | 'security' | 'trainer';
type StaffStatus = 'active' | 'leave' | 'resigned' | 'probation' | 'suspended';
type ShiftType = 'morning' | 'afternoon' | 'evening' | 'full_day' | 'rest';

interface StaffMember {
  id: string;
  name: string;
  employeeNo: string;
  role: StaffRole;
  status: StaffStatus;
  phone: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  lastWorkDate: string;
  shiftToday: ShiftType;
  attendance: { late: number; early: number; absent: number; overtime: number };
  performance: number; // 0-100
  certifications: string[];
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

interface ShiftSchedule {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
}

interface TrainingRecord {
  id: string;
  staffId: string;
  staffName: string;
  courseName: string;
  trainer: string;
  date: string;
  duration: number; // hours
  status: 'completed' | 'in_progress' | 'scheduled';
  score: number | null;
  certificateIssued: boolean;
}

// ---- 常量 ----

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  store_manager: '店长',
  shift_manager: '值班经理',
  cashier: '收银员',
  guide: '导玩员',
  technician: '技术员',
  cleaner: '保洁员',
  security: '安保员',
  trainer: '培训师',
};

const STAFF_ROLE_ICONS: Record<StaffRole, string> = {
  store_manager: '👔',
  shift_manager: '📋',
  cashier: '💳',
  guide: '🎮',
  technician: '🔧',
  cleaner: '🧹',
  security: '🛡️',
  trainer: '📚',
};

const STAFF_STATUS_MAP: Record<StaffStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' | 'info' }> = {
  active: { label: '在职', variant: 'success' },
  leave: { label: '请假', variant: 'warning' },
  resigned: { label: '离职', variant: 'danger' },
  probation: { label: '试用期', variant: 'info' },
  suspended: { label: '停职', variant: 'neutral' },
};

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
  full_day: '全天',
  rest: '休息',
};

const SHIFT_COLORS: Record<ShiftType, string> = {
  morning: '#3b82f6',
  afternoon: '#eab308',
  evening: '#8b5cf6',
  full_day: '#22c55e',
  rest: '#6b7280',
};

const TRAINING_STATUS_MAP: Record<TrainingRecord['status'], { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  completed: { label: '已完成', variant: 'success' },
  in_progress: { label: '进行中', variant: 'warning' },
  scheduled: { label: '已安排', variant: 'neutral' },
};

// ---- Mock 数据 ----

function generateStaff(): StaffMember[] {
  const roles: StaffRole[] = ['store_manager', 'shift_manager', 'cashier', 'cashier', 'guide', 'guide', 'guide', 'technician', 'cleaner', 'security', 'trainer', 'cashier'];
  const names = ['张伟', '李娜', '王强', '赵敏', '刘洋', '陈静', '杨磊', '黄丽', '周杰', '吴芳', '徐明', '孙燕'];
  const statuses: StaffStatus[] = ['active', 'active', 'active', 'probation', 'active', 'leave', 'active', 'active', 'active', 'resigned', 'suspended', 'active'];
  const shifts: ShiftType[] = ['morning', 'morning', 'afternoon', 'afternoon', 'afternoon', 'evening', 'rest', 'evening', 'full_day', 'morning', 'rest', 'afternoon'];
  const departments = ['运营部', '运营部', '收银组', '导玩组', '导玩组', '导玩组', '技术部', '后勤部', '后勤部', '安保部', '培训部', '收银组'];
  const certs: Record<number, string[]> = {
    0: ['门店管理认证', '急救证书'],
    1: ['门店管理认证'],
    2: ['收银资格证'],
    3: [],
    4: ['游戏机操作证'],
    5: ['客户服务认证'],
    6: [],
    7: ['设备维修证书', '电工证', '消防证'],
    8: [],
    9: ['保安证'],
    10: ['培训师资格证'],
    11: ['收银资格证'],
  };

  return names.map((name, idx) => {
    const d = new Date(2023, 0, 1);
    d.setDate(d.getDate() + idx * 45 + Math.floor(Math.random() * 30));
    return {
      id: `EMP-${String(idx + 1).padStart(3, '0')}`,
      name,
      employeeNo: `M5-${String(1000 + idx)}`,
      role: roles[idx],
      status: statuses[idx],
      phone: `1${3 + Math.floor(Math.random() * 7)}8${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      email: `${name.toLowerCase()}@m5store.com`,
      department: departments[idx],
      position: STAFF_ROLE_LABELS[roles[idx]],
      hireDate: d.toISOString().split('T')[0],
      lastWorkDate: new Date().toISOString().split('T')[0],
      shiftToday: shifts[idx],
      attendance: {
        late: Math.floor(Math.random() * 5),
        early: Math.floor(Math.random() * 3),
        absent: statuses[idx] === 'active' ? 0 : Math.floor(Math.random() * 10),
        overtime: Math.floor(Math.random() * 15),
      },
      performance: 50 + Math.floor(Math.random() * 50),
      certifications: certs[idx] ?? [],
      emergencyContact: `紧急联系人${idx + 1}`,
      emergencyPhone: `1${3 + Math.floor(Math.random() * 7)}8${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      notes: '',
    };
  });
}

function generateSchedule(staffList: StaffMember[]): ShiftSchedule[] {
  const schedule: ShiftSchedule[] = [];
  const today = new Date();
  for (let day = -1; day <= 6; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    staffList.forEach((staff, idx) => {
      if (staff.status === 'resigned') return;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const shifts: ShiftType[] = isWeekend ? ['morning', 'evening', 'rest', 'rest', 'afternoon', 'full_day', 'rest', 'afternoon', 'morning', 'rest', 'evening', 'afternoon'] : ['morning', 'afternoon', 'rest', 'morning', 'afternoon', 'evening', 'rest', 'full_day', 'morning', 'afternoon', 'rest', 'morning'];
      const shift = shifts[idx % shifts.length];
      const timeMap: Record<ShiftType, { start: string; end: string }> = {
        morning: { start: '08:00', end: '14:00' },
        afternoon: { start: '14:00', end: '20:00' },
        evening: { start: '20:00', end: '02:00' },
        full_day: { start: '08:00', end: '20:00' },
        rest: { start: '--', end: '--' },
      };

      schedule.push({
        id: `SCH-${dateStr}-${staff.id}`,
        date: dateStr,
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        shift,
        startTime: timeMap[shift].start,
        endTime: timeMap[shift].end,
        location: day === 0 ? '主店' : day < 0 ? '今日' : `未来${day}天`,
        notes: day === 0 ? '今日班次' : '',
      });
    });
  }
  return schedule;
}

function generateTrainingRecords(staffList: StaffMember[]): TrainingRecord[] {
  const courses = [
    '新人入职培训', '收银系统操作', '客户服务技巧', '游戏机维护', '消防安全',
    '会员服务流程', '应急处理', '产品知识', '销售技巧', '沟通艺术',
    '团队管理', '设备安全管理', '卫生标准培训', '反欺诈培训', 'VIP接待礼仪',
  ];
  const trainers = ['赵老师', '钱教练', '孙主管', '李经理', '周讲师'];
  const records: TrainingRecord[] = [];

  staffList.forEach((staff, si) => {
    const count = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 180));
      const statuses: TrainingRecord['status'][] = ['completed', 'completed', 'completed', 'in_progress', 'scheduled'];
      records.push({
        id: `TRN-${String(si + 1).padStart(2, '0')}-${i}`,
        staffId: staff.id,
        staffName: staff.name,
        courseName: courses[Math.floor(Math.random() * courses.length)],
        trainer: trainers[Math.floor(Math.random() * trainers.length)],
        date: d.toISOString().split('T')[0],
        duration: 1 + Math.floor(Math.random() * 8),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        score: Math.random() > 0.3 ? 60 + Math.floor(Math.random() * 40) : null,
        certificateIssued: Math.random() > 0.6,
      });
    }
  });

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

// ---- 数据缓存 ----

let staffCache: StaffMember[] | null = null;
let scheduleCache: ShiftSchedule[] | null = null;
let trainingCache: TrainingRecord[] | null = null;

function getStaff(): StaffMember[] {
  if (!staffCache) staffCache = generateStaff();
  return staffCache;
}

function getSchedule(): ShiftSchedule[] {
  if (!scheduleCache) scheduleCache = generateSchedule(getStaff());
  return scheduleCache;
}

function getTrainingRecords(): TrainingRecord[] {
  if (!trainingCache) trainingCache = generateTrainingRecords(getStaff());
  return trainingCache;
}

// ---- 列定义 ----

function buildStaffColumns(onRowClick: (item: StaffMember) => void): DataTableColumn<StaffMember>[] {
  return [
    {
      key: 'name',
      title: '姓名',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {STAFF_ROLE_ICONS[item.role]} {item.name}
        </span>
      ),
    },
    {
      key: 'employeeNo',
      title: '工号',
      dataKey: 'employeeNo',
      sortable: true,
    },
    {
      key: 'role',
      title: '岗位',
      sortable: true,
      sortValue: (item) => item.role,
      render: (item) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {STAFF_ROLE_ICONS[item.role]} {STAFF_ROLE_LABELS[item.role]}
        </span>
      ),
    },
    {
      key: 'department',
      title: '部门',
      dataKey: 'department',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item) => item.status,
      render: (item) => {
        const s = STAFF_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'shiftToday',
      title: '今日班次',
      sortable: true,
      sortValue: (item) => item.shiftToday,
      render: (item) => (
        <span
          style={{
            color: SHIFT_COLORS[item.shiftToday],
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {SHIFT_LABELS[item.shiftToday]}
        </span>
      ),
    },
    {
      key: 'performance',
      title: '绩效',
      dataKey: 'performance',
      sortable: true,
      align: 'right',
      render: (item) => {
        const color = item.performance >= 80 ? '#22c55e' : item.performance >= 60 ? '#eab308' : '#ef4444';
        return <span style={{ color, fontWeight: 600 }}>{item.performance}</span>;
      },
    },
    {
      key: 'phone',
      title: '电话',
      dataKey: 'phone',
      render: (item) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {item.phone}
          <CopyToClipboard text={item.phone} size="sm" iconOnly />
        </span>
      ),
    },
    {
      key: 'certifications',
      title: '证书',
      sortable: false,
      render: (item) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.certifications.length > 0
            ? item.certifications.map(c => (
                <span key={c} style={certBadgeStyle}>{c}</span>
              ))
            : <span style={{ color: '#6b7280' }}>—</span>}
        </div>
      ),
    },
  ];
}

// ---- 员工详情面板 ----

function StaffDetailPanel({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const statusInfo = STAFF_STATUS_MAP[staff.status];
  const staffSchedules = getSchedule().filter(s => s.staffId === staff.id).slice(0, 7);
  const staffTraining = getTrainingRecords().filter(t => t.staffId === staff.id).slice(0, 5);

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{STAFF_ROLE_ICONS[staff.role]}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{staff.name}</h2>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 14 }}>
              {staff.employeeNo} · {STAFF_ROLE_LABELS[staff.role]} · {staff.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="md" dot />
          <button onClick={onClose} style={closeBtnStyle}>关闭</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <InfoRow label="手机" value={staff.phone} />
        <InfoRow label="邮箱" value={staff.email} />
        <InfoRow label="入职日期" value={staff.hireDate} />
        <InfoRow label="今日班次" value={
          <span style={{ color: SHIFT_COLORS[staff.shiftToday], fontWeight: 600 }}>
            {SHIFT_LABELS[staff.shiftToday]}
          </span>
        } />
        <InfoRow label="绩效评分" value={
          <span style={{ color: staff.performance >= 80 ? '#22c55e' : staff.performance >= 60 ? '#eab308' : '#ef4444', fontWeight: 600 }}>
            {staff.performance}/100
          </span>
        } />
        <InfoRow label="加班时长" value={`${staff.attendance.overtime}h`} />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <StatCard label="迟到" value={`${staff.attendance.late}次`} helper="本月累计" />
        <StatCard label="早退" value={`${staff.attendance.early}次`} helper="本月累计" />
        <StatCard label="缺勤" value={`${staff.attendance.absent}次`} helper="本月累计" />
      </div>

      {staff.certifications.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>资质证书</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {staff.certifications.map(c => (
              <span key={c} style={certBadgeStyle}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* 排班预览 */}
      {staffSchedules.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '12px 0 8px', fontSize: 15, fontWeight: 600 }}>最近排班</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {staffSchedules.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.3)', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{s.date}</span>
                <span style={{ color: SHIFT_COLORS[s.shift], fontWeight: 600 }}>{SHIFT_LABELS[s.shift]}</span>
                <span style={{ color: '#cbd5e1' }}>{s.startTime} - {s.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 培训记录 */}
      {staffTraining.length > 0 && (
        <div>
          <h3 style={{ margin: '12px 0 8px', fontSize: 15, fontWeight: 600 }}>培训记录</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {staffTraining.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.3)', fontSize: 13 }}>
                <div>
                  <span style={{ color: '#e2e8f0' }}>{t.courseName}</span>
                  <span style={{ color: '#94a3b8', marginLeft: 8 }}>{t.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge label={TRAINING_STATUS_MAP[t.status].label} variant={TRAINING_STATUS_MAP[t.status].variant} size="sm" />
                  {t.score !== null && <span style={{ color: t.score >= 80 ? '#22c55e' : '#eab308', fontWeight: 600 }}>{t.score}分</span>}
                  {t.certificateIssued && <span style={{ color: '#22c55e' }}>📜</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button style={actionBtnStyle('#3b82f6', '#93c5fd')}>📝 编辑员工信息</button>
        <button style={actionBtnStyle('#8b5cf6', '#c4b5fd')}>📅 查看完整排班</button>
        <button style={actionBtnStyle('#22c55e', '#86efac')}>📊 绩效评估</button>
        {staff.status === 'active' && (
          <button style={actionBtnStyle('#ef4444', '#fca5a5')}>⏸️ 暂停排班</button>
        )}
      </div>
    </section>
  );
}

// ---- 今日排班表 ----

function TodayScheduleView() {
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = getSchedule().filter(s => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section style={panelStyle}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>今日排班</h2>
      <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>{today} · 共 {todaySchedule.length} 人</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {todaySchedule.map(s => (
          <div
            key={s.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{STAFF_ROLE_ICONS[s.role]}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.staffName}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{STAFF_ROLE_LABELS[s.role]}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: SHIFT_COLORS[s.shift], fontWeight: 700, fontSize: 14 }}>{SHIFT_LABELS[s.shift]}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{s.startTime} - {s.endTime}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- 统计 ----

function computeStats(staff: StaffMember[]) {
  return {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    probation: staff.filter(s => s.status === 'probation').length,
    leave: staff.filter(s => s.status === 'leave').length,
    resigned: staff.filter(s => s.status === 'resigned').length,
    byRole: staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgPerformance: Math.round(staff.reduce((sum, s) => sum + s.performance, 0) / staff.length),
    totalOvertime: staff.reduce((sum, s) => sum + s.attendance.overtime, 0),
    todayStaff: staff.filter(s => s.status === 'active' || s.status === 'probation').length,
  };
}

// ---- 主页面 ----

export default function StoreStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staff = useMemo(() => getStaff(), []);
  const stats = useMemo(() => computeStats(staff), [staff]);

  const searchFields = useMemo<(keyof StaffMember)[]>(() => ['name', 'employeeNo', 'phone', 'email', 'department', 'position'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(staff, searchFields);

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'staff' | 'schedule' | 'training'>('staff');

  const roleFiltered = useMemo(
    () => (roleFilter === 'ALL' ? filteredItems : filteredItems.filter(s => s.role === roleFilter)),
    [filteredItems, roleFilter]
  );
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? roleFiltered : roleFiltered.filter(s => s.status === statusFilter)),
    [roleFiltered, statusFilter]
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const handleRowClick = useCallback((item: StaffMember) => setSelectedStaff(item), []);
  const columns = useMemo(() => buildStaffColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);

  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, roleFilter, statusFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  const trainingRecords = useMemo(() => getTrainingRecords(), []);
  const recentTraining = trainingRecords.filter(t => t.status !== 'completed').slice(0, 6);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '员工管理' })} />
      <PageShell title="门店员工管理" subtitle="人员档案 · 排班考勤 · 培训记录 · 绩效管理">
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>员工总数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>
              在职: {stats.active} · 试用: {stats.probation}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>今日在岗</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{stats.todayStaff}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              请假: {stats.leave} · 离职: {stats.resigned}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均绩效</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: stats.avgPerformance >= 75 ? '#22c55e' : '#eab308' }}>
              {stats.avgPerformance}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>总分 100</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>加班总时长</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{stats.totalOvertime}h</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>本月累计</div>
          </div>
        </div>

        {selectedStaff && <StaffDetailPanel staff={selectedStaff} onClose={() => setSelectedStaff(null)} />}

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'staff', label: '👥 员工列表' },
              { key: 'schedule', label: '📅 今日排班' },
              { key: 'training', label: '📚 培训管理' },
            ]}
            activeKey={activeTab}
            onChange={(t) => setActiveTab(t as typeof activeTab)}
            variant="pills"
          />
        </div>

        {activeTab === 'staff' && (
          <>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索姓名/工号/电话/部门..." />
            <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>岗位</div>
                <Tabs
                  items={[
                    { key: 'ALL', label: '全部', count: filteredItems.length },
                    ...(Object.entries(STAFF_ROLE_LABELS) as [StaffRole, string][]).map(([role, label]) => ({
                      key: role,
                      label: `${STAFF_ROLE_ICONS[role]} ${label}`,
                      count: filteredItems.filter(s => s.role === role).length,
                    })),
                  ]}
                  activeKey={roleFilter}
                  onChange={setRoleFilter}
                  variant="pills" size="sm"
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>状态</div>
                <Tabs
                  items={[
                    { key: 'ALL', label: '全部', count: roleFiltered.length },
                    ...(['active', 'probation', 'leave', 'suspended', 'resigned'] as StaffStatus[]).map(s => ({
                      key: s,
                      label: STAFF_STATUS_MAP[s].label,
                      count: roleFiltered.filter(item => item.status === s).length,
                    })),
                  ]}
                  activeKey={statusFilter} onChange={setStatusFilter}
                  variant="pills" size="sm"
                />
              </div>
            </div>

            <FilterChips
              hint="已筛选："
              chips={[
                ...(roleFilter !== 'ALL' ? [{ key: 'role' as const, label: STAFF_ROLE_LABELS[roleFilter as StaffRole], tone: 'neutral' as FilterChip['tone'] }] : []),
                ...(statusFilter !== 'ALL' ? [{ key: 'status' as const, label: STAFF_STATUS_MAP[statusFilter as StaffStatus].label, tone: 'neutral' as FilterChip['tone'] }] : []),
              ]}
              onRemove={(key) => { if (key === 'role') setRoleFilter('ALL'); if (key === 'status') setStatusFilter('ALL'); }}
              onClearAll={() => { setRoleFilter('ALL'); setStatusFilter('ALL'); }}
              size="sm" style={{ marginBottom: 8, marginTop: 8 }}
            />

            <DataTable
              title={`员工列表（匹配 ${sortedItems.length} 条）`}
              columns={columns} items={pageItems}
              rowKey={(item) => item.id}
              sort={sortConfig} onSortChange={setSortConfig}
              striped compact
            />
            <Pagination
              page={pagination.page} pageSize={pagination.pageSize}
              total={sortedItems.length}
              onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}

        {activeTab === 'schedule' && <TodayScheduleView />}

        {activeTab === 'training' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总培训记录</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{trainingRecords.length}</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>已完成</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {trainingRecords.filter(t => t.status === 'completed').length}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>进行中/待安排</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#eab308' }}>
                  {trainingRecords.filter(t => t.status !== 'completed').length}
                </div>
              </div>
            </div>

            {recentTraining.length > 0 && (
              <section style={panelStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>待完成培训</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {recentTraining.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.courseName}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{t.staffName} · {t.trainer} · {t.date}</div>
                      </div>
                      <StatusBadge label={TRAINING_STATUS_MAP[t.status].label} variant={TRAINING_STATUS_MAP[t.status].variant} size="sm" dot />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
              <thead>
                <tr>
                  <th style={thStyle}>员工</th>
                  <th style={thStyle}>课程</th>
                  <th style={thStyle}>讲师</th>
                  <th style={thStyle}>日期</th>
                  <th style={thStyle}>时长</th>
                  <th style={thStyle}>成绩</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>证书</th>
                </tr>
              </thead>
              <tbody>
                {trainingRecords.slice(0, 20).map(t => (
                  <tr key={t.id}>
                    <td style={tdStyle}>{t.staffName}</td>
                    <td style={tdStyle}>{t.courseName}</td>
                    <td style={tdStyle}>{t.trainer}</td>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}>{t.duration}h</td>
                    <td style={tdStyle}>
                      {t.score !== null ? (
                        <span style={{ color: t.score >= 80 ? '#22c55e' : t.score >= 60 ? '#eab308' : '#ef4444', fontWeight: 600 }}>
                          {t.score}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge label={TRAINING_STATUS_MAP[t.status].label} variant={TRAINING_STATUS_MAP[t.status].variant} size="sm" />
                    </td>
                    <td style={tdStyle}>{t.certificateIssued ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </PageShell>
    </main>
  );
}

// ---- 样式 ----

const panelStyle: React.CSSProperties = {
  borderRadius: 16, padding: 24,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  marginBottom: 24,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16, padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const certBadgeStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 6,
  background: 'rgba(59,130,246,0.12)',
  color: '#93c5fd',
  fontSize: 11,
  fontWeight: 600,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
  padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};

const actionBtnStyle = (bg: string, color: string): React.CSSProperties => ({
  borderRadius: 10, padding: '10px 18px',
  background: `${bg}22`, color,
  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
});

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  color: '#94a3b8', fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#e2e8f0', fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
};
