/**
 * 员工管理页 — Staff Management Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 运营主管
 * 功能: 员工信息管理、值班状态、排班概览、岗位设置
 * 类型: B-管理页 (含搜索/筛选/状态/分页)
 */
'use client';

import React, { useMemo, useState } from 'react';
import { PageShell, StatusBadge, SearchFilterInput, Pagination, DataTable, usePagination, useSearchFilter, type DataTableColumn } from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

export type StaffRole = 'manager' | 'sales' | 'cashier' | 'cleaner' | 'guard' | 'customer_service';
export type StaffStatus = 'active' | 'on_leave' | 'vacation' | 'off_duty' | 'resigned';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'rest';

export interface StaffRecord {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  shift: ShiftType;
  department: string;
  joinDate: string;
  lastWorkDate: string;
  performanceScore: number;
  storeName: string;
  remark?: string;
}

// ============================================================
// 常量配置
// ============================================================

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: '店长',
  sales: '导购员',
  cashier: '收银员',
  cleaner: '保洁',
  guard: '保安',
  customer_service: '客服',
};

const ROLE_VARIANTS: Record<StaffRole, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  manager: 'success',
  sales: 'info',
  cashier: 'warning',
  cleaner: 'neutral',
  guard: 'neutral',
  customer_service: 'info',
};

const STATUS_LABELS: Record<StaffStatus, string> = {
  active: '在岗',
  on_leave: '请假',
  vacation: '休假',
  off_duty: '已下班',
  resigned: '已离职',
};

const STATUS_VARIANTS: Record<StaffStatus, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  active: 'success',
  on_leave: 'warning',
  vacation: 'info',
  off_duty: 'neutral',
  resigned: 'danger',
};

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: '早班 08:00-16:00',
  afternoon: '中班 12:00-20:00',
  night: '晚班 16:00-00:00',
  rest: '休息',
};

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '在岗' },
  { key: 'on_leave', label: '请假' },
  { key: 'vacation', label: '休假' },
  { key: 'resigned', label: '已离职' },
] as const;

// ============================================================
// Mock 数据 — 15 名员工覆盖全部状态和角色
// ============================================================

const MOCK_STAFF: StaffRecord[] = [
  { id: 'st-001', name: '张伟强', phone: '138****0001', role: 'manager', status: 'active', shift: 'morning', department: '门店运营部', joinDate: '2021-03-15', lastWorkDate: '2026-07-19', performanceScore: 95, storeName: '深圳南山旗舰店' },
  { id: 'st-002', name: '李敏', phone: '138****0002', role: 'sales', status: 'active', shift: 'morning', department: '销售部', joinDate: '2022-06-01', lastWorkDate: '2026-07-19', performanceScore: 88, storeName: '深圳南山旗舰店' },
  { id: 'st-003', name: '王浩', phone: '138****0003', role: 'sales', status: 'on_leave', shift: 'rest', department: '销售部', joinDate: '2023-01-10', lastWorkDate: '2026-07-18', performanceScore: 72, storeName: '深圳南山旗舰店' },
  { id: 'st-004', name: '陈雪', phone: '138****0004', role: 'cashier', status: 'active', shift: 'afternoon', department: '门店运营部', joinDate: '2022-09-20', lastWorkDate: '2026-07-19', performanceScore: 90, storeName: '深圳南山旗舰店' },
  { id: 'st-005', name: '刘洋', phone: '139****0010', role: 'cleaner', status: 'active', shift: 'morning', department: '后勤保障部', joinDate: '2023-03-05', lastWorkDate: '2026-07-19', performanceScore: 82, storeName: '深圳南山旗舰店' },
  { id: 'st-006', name: '周丽', phone: '137****0020', role: 'customer_service', status: 'vacation', shift: 'rest', department: '客户服务部', joinDate: '2024-02-15', lastWorkDate: '2026-07-15', performanceScore: 78, storeName: '北京朝阳标准店' },
  { id: 'st-007', name: '吴刚', phone: '136****0030', role: 'guard', status: 'active', shift: 'night', department: '后勤保障部', joinDate: '2023-07-01', lastWorkDate: '2026-07-19', performanceScore: 85, storeName: '深圳南山旗舰店' },
  { id: 'st-008', name: '孙丽', phone: '135****0040', role: 'sales', status: 'active', shift: 'afternoon', department: '销售部', joinDate: '2022-06-15', lastWorkDate: '2026-07-19', performanceScore: 93, storeName: '北京朝阳标准店' },
  { id: 'st-009', name: '黄磊', phone: '134****0050', role: 'cashier', status: 'on_leave', shift: 'rest', department: '门店运营部', joinDate: '2024-04-01', lastWorkDate: '2026-07-17', performanceScore: 65, storeName: '北京朝阳标准店' },
  { id: 'st-010', name: '赵敏', phone: '133****0060', role: 'sales', status: 'resigned', shift: 'rest', department: '销售部', joinDate: '2023-09-10', lastWorkDate: '2026-06-30', performanceScore: 58, storeName: '上海浦东社区店' },
  { id: 'st-011', name: '陈浩', phone: '132****0070', role: 'manager', status: 'active', shift: 'morning', department: '门店运营部', joinDate: '2020-11-01', lastWorkDate: '2026-07-19', performanceScore: 97, storeName: '北京朝阳标准店' },
  { id: 'st-012', name: '周明', phone: '131****0080', role: 'manager', status: 'active', shift: 'morning', department: '门店运营部', joinDate: '2022-05-20', lastWorkDate: '2026-07-19', performanceScore: 91, storeName: '上海浦东社区店' },
  { id: 'st-013', name: '杨雪', phone: '130****0090', role: 'cashier', status: 'off_duty', shift: 'rest', department: '门店运营部', joinDate: '2024-07-01', lastWorkDate: '2026-07-19', performanceScore: 76, storeName: '上海浦东社区店' },
  { id: 'st-014', name: '郑涛', phone: '159****0100', role: 'sales', status: 'active', shift: 'night', department: '销售部', joinDate: '2023-04-10', lastWorkDate: '2026-07-19', performanceScore: 84, storeName: '北京朝阳标准店' },
  { id: 'st-015', name: '林雪', phone: '158****0110', role: 'cleaner', status: 'active', shift: 'morning', department: '后勤保障部', joinDate: '2024-01-10', lastWorkDate: '2026-07-19', performanceScore: 79, storeName: '北京朝阳标准店' },
];

// ============================================================
// 统计计算
// ============================================================

export interface StaffStats {
  total: number;
  active: number;
  onLeave: number;
  vacation: number;
  offDuty: number;
  resigned: number;
  morningShift: number;
  afternoonShift: number;
  nightShift: number;
  restShift: number;
  departmentCount: number;
  avgPerformance: number;
}

function computeStaffStats(records: StaffRecord[]): StaffStats {
  if (records.length === 0) {
    return { total: 0, active: 0, onLeave: 0, vacation: 0, offDuty: 0, resigned: 0, morningShift: 0, afternoonShift: 0, nightShift: 0, restShift: 0, departmentCount: 0, avgPerformance: 0 };
  }
  const depts = new Set(records.map(r => r.department));
  const totalScore = records.reduce((s, r) => s + r.performanceScore, 0);
  return {
    total: records.length,
    active: records.filter(r => r.status === 'active').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    vacation: records.filter(r => r.status === 'vacation').length,
    offDuty: records.filter(r => r.status === 'off_duty').length,
    resigned: records.filter(r => r.status === 'resigned').length,
    morningShift: records.filter(r => r.shift === 'morning').length,
    afternoonShift: records.filter(r => r.shift === 'afternoon').length,
    nightShift: records.filter(r => r.shift === 'night').length,
    restShift: records.filter(r => r.shift === 'rest').length,
    departmentCount: depts.size,
    avgPerformance: Math.round(totalScore / records.length),
  };
}

// ============================================================
// 列定义
// ============================================================

const COLUMNS: DataTableColumn<StaffRecord>[] = [
  { key: 'name', header: '姓名', dataKey: 'name', sortable: true },
  { key: 'phone', header: '电话', dataKey: 'phone', sortable: false },
  {
    key: 'role',
    header: '岗位',
    sortable: true,
    render: (r: StaffRecord) => <StatusBadge variant={ROLE_VARIANTS[r.role]} label={ROLE_LABELS[r.role]} />,
  },
  {
    key: 'status',
    header: '状态',
    sortable: true,
    render: (r: StaffRecord) => <StatusBadge variant={STATUS_VARIANTS[r.status]} label={STATUS_LABELS[r.status]} />,
  },
  {
    key: 'shift',
    header: '班次',
    sortable: true,
    render: (r: StaffRecord) => SHIFT_LABELS[r.shift],
  },
  { key: 'department', header: '部门', dataKey: 'department', sortable: true },
];

// ============================================================
// 员工管理页面
// ============================================================

export default function StaffManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  const { searchTerm: search, setSearchTerm: setSearch, filteredItems } = useSearchFilter(
    MOCK_STAFF,
    ['name', 'phone', 'department', 'storeName', 'remark', 'role'],
  );

  const multiFiltered = useMemo(() => {
    let result = filteredItems;
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (roleFilter !== 'all') {
      result = result.filter(r => r.role === roleFilter);
    }
    return result;
  }, [filteredItems, statusFilter, roleFilter]);

  const stats = useMemo(() => computeStaffStats(MOCK_STAFF), []);

  const { page, pageSize, setPage, setPageSize, totalPages, paginate } = usePagination({ initialPageSize: 8 });
  const pageItems = paginate(multiFiltered);

  return (
    <PageShell title="员工管理" description="门店员工信息管理与值班状态查看">
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
            👥 员工管理
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {stats.total} 名员工 · {stats.active} 人在岗 · {stats.departmentCount} 个部门
          </p>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>总员工</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{stats.total}</div>
          </div>
          <div style={{ ...statCardStyle, borderColor: 'rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>在岗</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
          </div>
          <div style={{ ...statCardStyle, borderColor: 'rgba(234,179,8,0.3)' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>请假/休假</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#eab308' }}>{stats.onLeave + stats.vacation}</div>
          </div>
          <div style={{ ...statCardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>已离职</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.resigned}</div>
          </div>
          <div style={{ ...statCardStyle, borderColor: 'rgba(96,165,250,0.3)' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>平均绩效分</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.avgPerformance}</div>
          </div>
        </div>

        {/* 班次分布 */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(30,41,59,0.4)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 13, color: '#64748b',
        }}>
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>📅 今日班次分布:</span>
          <span>早班 <strong style={{ color: '#22c55e' }}>{stats.morningShift}</strong></span>
          <span style={{ color: '#475569' }}>·</span>
          <span>中班 <strong style={{ color: '#eab308' }}>{stats.afternoonShift}</strong></span>
          <span style={{ color: '#475569' }}>·</span>
          <span>晚班 <strong style={{ color: '#60a5fa' }}>{stats.nightShift}</strong></span>
          <span style={{ color: '#475569' }}>·</span>
          <span>休息 <strong style={{ color: '#94a3b8' }}>{stats.restShift}</strong></span>
        </div>

        {/* 搜索与筛选 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <SearchFilterInput
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="搜索姓名/电话/部门..."
            width={320}
          />
          {/* 状态筛选 */}
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${statusFilter === tab.key ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.15)'}`,
                background: statusFilter === tab.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: statusFilter === tab.key ? '#818cf8' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: statusFilter === tab.key ? 600 : 400,
              }}
            >
              {tab.label}
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({tab.key === 'all' ? stats.total : stats[tab.key as keyof StaffStats] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* 数据表格 */}
        <DataTable
          columns={COLUMNS}
          rows={pageItems}
          rowKey={(r: StaffRecord) => r.id}
        />

        {/* 空状态 */}
        {pageItems.length === 0 && multiFiltered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', borderRadius: 14,
            background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)',
            marginTop: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>未找到匹配的员工</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>尝试调整搜索条件或筛选状态</div>
          </div>
        )}

        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            共 {multiFiltered.length} 条记录，当前第 {page}/{totalPages} 页
          </span>
          <Pagination
            page={page}
            total={multiFiltered.length}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[8, 16, 32]}
          />
        </div>
      </div>
    </PageShell>
  );
}

const statCardStyle: React.CSSProperties = {
  flex: '1 1 auto', minWidth: 100, padding: '14px 18px',
  borderRadius: 12, background: 'rgba(30,41,59,0.6)',
  border: '1px solid rgba(148,163,184,0.12)',
};
