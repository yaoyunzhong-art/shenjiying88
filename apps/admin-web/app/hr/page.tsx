'use client';

/**
 * hr/page.tsx — HR 管理模块
 *
 * 员工信息管理，支持列表浏览、部门/Tab筛选、CRUD弹窗、统计概览
 * 模块: HR 员工管理 | 新增/编辑/删除 | 统计卡片 | Tab筛选 | 搜索
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type EmployeeStatus = 'active' | 'probation' | 'resigned';

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  phone: string;
  email: string;
  joinDate: string;
  emergencyContact?: string;
  remark?: string;
}

// ============================================================
// 状态中文映射
// ============================================================

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: '在职',
  probation: '试用',
  resigned: '离职',
};

const STATUS_ACTIONS = ['active', 'probation', 'resigned'] as EmployeeStatus[];

// ============================================================
// 默认样本数据（8个员工）
// ============================================================

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'E001', name: '张明', department: '技术部', position: '高级工程师', status: 'active', phone: '13800138001', email: 'zm@company.com', joinDate: '2025-03-01', emergencyContact: '李芳 13900139001' },
  { id: 'E002', name: '李芳', department: '运营部', position: '运营经理', status: 'active', phone: '13800138002', email: 'lf@company.com', joinDate: '2025-01-15' },
  { id: 'E003', name: '王强', department: '市场部', position: '市场专员', status: 'probation', phone: '13800138003', email: 'wq@company.com', joinDate: '2026-06-01' },
  { id: 'E004', name: '赵丽', department: '财务部', position: '财务主管', status: 'active', phone: '13800138004', email: 'zl@company.com', joinDate: '2024-09-01', emergencyContact: '钱七 13900139004' },
  { id: 'E005', name: '钱七', department: '门店管理', position: '店长', status: 'resigned', phone: '13800138005', email: 'qq@company.com', joinDate: '2023-06-01' },
  { id: 'E006', name: '孙八', department: '客服部', position: '客服专员', status: 'active', phone: '13800138006', email: 'sb@company.com', joinDate: '2025-11-01', emergencyContact: '周九 13900139006' },
  { id: 'E007', name: '周九', department: '技术部', position: '前端开发', status: 'active', phone: '13800138007', email: 'zj@company.com', joinDate: '2026-02-15' },
  { id: 'E008', name: '吴十', department: '人事部', position: 'HR专员', status: 'probation', phone: '13800138008', email: 'ws@company.com', joinDate: '2026-05-20' },
];

// ============================================================
// 辅助函数
// ============================================================

const DEPARTMENTS = ['技术部', '运营部', '市场部', '财务部', '人事部', '客服部', '门店管理'];

function getEmptyEmployee(): Omit<Employee, 'id'> {
  return {
    name: '',
    department: '',
    position: '',
    status: 'probation',
    phone: '',
    email: '',
    joinDate: new Date().toISOString().slice(0, 10),
    emergencyContact: '',
  };
}

function filterByTab(employees: Employee[], tab: string): Employee[] {
  if (tab === 'all') return employees;
  return employees.filter(e => e.status === tab);
}

function filterBySearch(employees: Employee[], search: string): Employee[] {
  if (!search) return employees;
  const q = search.toLowerCase();
  return employees.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.department.toLowerCase().includes(q) ||
    e.position.toLowerCase().includes(q) ||
    e.phone.includes(q)
  );
}

function filterByDept(employees: Employee[], dept: string): Employee[] {
  if (!dept || dept === 'all') return employees;
  return employees.filter(e => e.department === dept);
}

// ============================================================
// 样式
// ============================================================

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: active ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.15)',
  background: active ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
  color: active ? '#60a5fa' : '#94a3b8', fontWeight: active ? 600 : 400,
});

const statusTagStyle = (status: EmployeeStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: status === 'active' ? '#22c55e' : status === 'probation' ? '#f59e0b' : '#ef4444',
  background: status === 'active' ? 'rgba(34, 197, 94, 0.12)' : status === 'probation' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
});

const deptTagStyle: React.CSSProperties = {
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: '#94a3b8', background: 'rgba(148, 163, 184, 0.12)',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600,
};

const btnDanger: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
};

const btnGhost: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(148, 163, 184, 0.2)', background: 'transparent', color: '#94a3b8',
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  statCard: {
    flex: '1 1 160px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.1)', padding: '16px 20px',
  },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  statSubLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  toolBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  searchInput: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(30, 41, 59, 0.6)',
    color: '#e2e8f0', outline: 'none', width: 180,
  },
  select: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(30, 41, 59, 0.6)',
    color: '#e2e8f0', outline: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600,
    color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  actionCell: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid rgba(148, 163, 184, 0.06)', display: 'flex', gap: 6 },
  modalOverlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#1e293b', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.15)',
    padding: 28, width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' },
  formInput: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.6)',
    color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' as const,
  },
  formRow: { display: 'flex', gap: 12, marginBottom: 14 },
  formBtnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText: { fontSize: 14, color: '#64748b' },
  successBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11,
    color: '#22c55e', background: 'rgba(34, 197, 94, 0.12)',
  },
};

// ============================================================
// 页面组件
// ============================================================

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(getEmptyEmployee());

  // ---- 派生数据 ----
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  const probationEmployees = useMemo(() => employees.filter(e => e.status === 'probation'), [employees]);
  const resignedEmployees = useMemo(() => employees.filter(e => e.status === 'resigned'), [employees]);

  const filteredEmployees = useMemo(() => {
    let result = employees;
    result = filterByTab(result, statusFilter);
    result = filterByDept(result, deptFilter);
    result = filterBySearch(result, search);
    return result;
  }, [employees, search, deptFilter, statusFilter]);

  // ---- 统计 ----
  const stats = useMemo(() => [
    { label: '总人数', value: employees.length, sub: '人' },
    { label: '在职', value: activeEmployees.length, sub: '人' },
    { label: '试用期', value: probationEmployees.length, sub: '人' },
    { label: '离职', value: resignedEmployees.length, sub: '人' },
    { label: '涉及部门', value: new Set(employees.filter(e => e.status !== 'resigned').map(e => e.department)).size, sub: '个' },
  ], [employees, activeEmployees, probationEmployees, resignedEmployees]);

  // ---- 弹窗 ----
  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyEmployee());
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((emp: Employee) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name,
      department: emp.department,
      position: emp.position,
      status: emp.status,
      phone: emp.phone,
      email: emp.email,
      joinDate: emp.joinDate,
      emergencyContact: emp.emergencyContact || '',
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
  }, []);

  // ---- 表单处理 ----
  const handleFormChange = useCallback((field: keyof Omit<Employee, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name || !formData.department || !formData.position) return;

    if (editingId) {
      // 编辑
      setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...formData } : e));
    } else {
      // 新增
      const maxId = employees.reduce((max, e) => {
        const num = parseInt(e.id.replace('E', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newEmployee: Employee = {
        id: `E${String(maxId + 1).padStart(3, '0')}`,
        ...formData,
      };
      setEmployees(prev => [...prev, newEmployee]);
    }
    closeModal();
  }, [formData, editingId, employees, closeModal]);

  const handleDelete = useCallback((id: string) => {
    const confirmed = window.confirm('确定要删除该员工吗？');
    if (confirmed) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>👥 HR 管理</h1>
      <p style={styles.subtitle}>员工信息管理，支持新增、编辑、删除、搜索与筛选。</p>

      {/* 概览统计 */}
      <div style={styles.statsRow}>
        {stats.map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statSubLabel}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div style={styles.toolBar}>
        <div style={styles.filterRow}>
          {/* 搜索框 */}
          <input
            style={styles.searchInput}
            placeholder="🔍 搜索姓名/部门/职位..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* 部门筛选 */}
          <select style={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="all">全部部门</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* 状态Tab */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'probation', 'resigned'] as const).map(tab => (
              <button
                key={tab}
                style={tabStyle(statusFilter === tab)}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === 'all' ? '全部' : STATUS_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <button style={btnPrimary} onClick={openCreateModal}>
          + 新增员工
        </button>
      </div>

      {/* 员工列表 */}
      {filteredEmployees.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <div style={styles.emptyText}>暂无匹配的员工数据</div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>编号</th>
              <th style={styles.th}>姓名</th>
              <th style={styles.th}>部门</th>
              <th style={styles.th}>职位</th>
              <th style={styles.th}>联系方式</th>
              <th style={styles.th}>入职日期</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(e => (
              <tr key={e.id}>
                <td style={{ ...styles.td, color: '#64748b', fontFamily: 'monospace' }}>{e.id}</td>
                <td style={styles.td}>{e.name}</td>
                <td style={styles.td}><span style={deptTagStyle}>{e.department}</span></td>
                <td style={styles.td}>{e.position}</td>
                <td style={{ ...styles.td, fontSize: 12 }}>{e.phone}</td>
                <td style={styles.td}>{e.joinDate}</td>
                <td style={styles.td}>
                  <span style={statusTagStyle(e.status)}>● {STATUS_LABELS[e.status]}</span>
                </td>
                <td style={styles.actionCell}>
                  <button style={btnGhost} onClick={() => openEditModal(e)}>编辑</button>
                  <button style={btnDanger} onClick={() => handleDelete(e.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页提示 */}
      {filteredEmployees.length > 0 && (
        <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b', marginTop: 12 }}>
          共 {filteredEmployees.length} 条记录
        </div>
      )}

      {/* 新增/编辑 弹窗 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>{editingId ? '编辑员工' : '新增员工'}</div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>姓名 *</label>
              <input style={styles.formInput} value={formData.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="请输入姓名" />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>部门 *</label>
                <select style={styles.formInput} value={formData.department} onChange={e => handleFormChange('department', e.target.value)}>
                  <option value="">请选择</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>职位 *</label>
                <input style={styles.formInput} value={formData.position} onChange={e => handleFormChange('position', e.target.value)} placeholder="请输入职位" />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>状态</label>
                <select style={styles.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as EmployeeStatus)}>
                  {STATUS_ACTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>入职日期 *</label>
                <input style={styles.formInput} type="date" value={formData.joinDate} onChange={e => handleFormChange('joinDate', e.target.value)} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>手机号 *</label>
                <input style={styles.formInput} value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="请输入手机号" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>邮箱</label>
                <input style={styles.formInput} value={formData.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="请输入邮箱" />
              </div>
            </div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>紧急联系人</label>
              <input style={styles.formInput} value={formData.emergencyContact || ''} onChange={e => handleFormChange('emergencyContact', e.target.value)} placeholder="姓名 手机号" />
            </div>

            <div style={styles.formBtnRow}>
              <button style={btnGhost} onClick={closeModal}>取消</button>
              <button style={btnPrimary} onClick={handleSave}>
                {editingId ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
