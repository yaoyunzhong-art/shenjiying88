'use client';

/**
 * member/page.tsx — 会员管理
 *
 * 会员列表（会员名/等级/积分/消费总额/注册日期/状态）
 * 搜索 + 等级筛选 | 统计卡片 | CRUD弹窗 | 分页 | 空状态
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type MemberLevel = '普通' | '银卡' | '金卡' | '钻石';
type MemberStatus = 'active' | 'frozen' | 'dormant' | 'cancelled';

interface Member {
  id: string;
  name: string;
  level: MemberLevel;
  points: number;
  totalSpent: number;
  phone: string;
  joinDate: string;
  status: MemberStatus;
  lastActiveAt: string;
}

// ============================================================
// 映射表
// ============================================================

const LEVELS: MemberLevel[] = ['普通', '银卡', '金卡', '钻石'];
const STATUS_LABELS: Record<MemberStatus, string> = { active: '正常', frozen: '冻结', dormant: '休眠', cancelled: '注销' };

// ============================================================
// 种子数据（8条会员记录）
// ============================================================

const DEFAULT_MEMBERS: Member[] = [
  { id: 'M001', name: '张三', level: '钻石', points: 32800, totalSpent: 15680.50, phone: '13800001001', joinDate: '2023-01-15', status: 'active', lastActiveAt: '2026-07-18' },
  { id: 'M002', name: '李四', level: '金卡', points: 7200, totalSpent: 4320.00, phone: '13800001002', joinDate: '2023-03-20', status: 'active', lastActiveAt: '2026-07-15' },
  { id: 'M003', name: '王五', level: '银卡', points: 1800, totalSpent: 880.50, phone: '13800001003', joinDate: '2023-06-01', status: 'frozen', lastActiveAt: '2026-05-20' },
  { id: 'M004', name: '赵六', level: '普通', points: 320, totalSpent: 125.00, phone: '13800001004', joinDate: '2024-02-10', status: 'active', lastActiveAt: '2026-07-17' },
  { id: 'M005', name: '孙七', level: '金卡', points: 15000, totalSpent: 8889.00, phone: '13800001005', joinDate: '2022-11-05', status: 'dormant', lastActiveAt: '2026-03-01' },
  { id: 'M006', name: '周八', level: '银卡', points: 5800, totalSpent: 2100.00, phone: '13800001006', joinDate: '2023-09-12', status: 'cancelled', lastActiveAt: '2026-01-08' },
  { id: 'M007', name: '吴九', level: '普通', points: 2100, totalSpent: 399.00, phone: '13800001007', joinDate: '2024-06-30', status: 'active', lastActiveAt: '2026-07-16' },
  { id: 'M008', name: '郑十', level: '钻石', points: 45000, totalSpent: 32150.80, phone: '13800001008', joinDate: '2022-08-01', status: 'active', lastActiveAt: '2026-07-19' },
];

// ============================================================
// 辅助函数
// ============================================================

function getEmptyMember(): Omit<Member, 'id'> {
  return {
    name: '', level: '普通', points: 0, totalSpent: 0, phone: '',
    joinDate: new Date().toISOString().slice(0, 10), status: 'active', lastActiveAt: new Date().toISOString().slice(0, 10),
  };
}

function filterByLevel(items: Member[], level: string): Member[] {
  if (!level || level === 'all') return items;
  return items.filter(i => i.level === level);
}

function filterByStatus(items: Member[], status: string): Member[] {
  if (!status || status === 'all') return items;
  return items.filter(i => i.status === status);
}

function filterBySearch(items: Member[], search: string): Member[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.phone.includes(q) ||
    i.level.toLowerCase().includes(q)
  );
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

const statusTagStyle = (status: MemberStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: status === 'active' ? '#22c55e' : status === 'frozen' ? '#60a5fa' : status === 'dormant' ? '#f59e0b' : '#ef4444',
  background: status === 'active' ? 'rgba(34, 197, 94, 0.12)' : status === 'frozen' ? 'rgba(96, 165, 250, 0.12)' : status === 'dormant' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
});

const levelTagStyle = (level: MemberLevel): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: level === '钻石' ? '#a78bfa' : level === '金卡' ? '#f59e0b' : level === '银卡' ? '#94a3b8' : '#64748b',
  background: level === '钻石' ? 'rgba(167, 139, 250, 0.12)' : level === '金卡' ? 'rgba(245, 158, 11, 0.12)' : level === '银卡' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.12)',
  fontWeight: level === '钻石' ? 600 : 400,
});

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
    flex: '1 1 140px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12,
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
    color: '#e2e8f0', outline: 'none', width: 220,
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
    padding: 28, width: 520, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const,
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
  paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#64748b' },
  pageBtn: {
    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: '1px solid rgba(148, 163, 184, 0.2)', background: 'transparent', color: '#94a3b8',
  },
  pageBtnActive: {
    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600,
  },
};

// ============================================================
// 页面组件
// ============================================================

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Member, 'id'>>(getEmptyMember());

  // ---- 派生数据 ----
  const stats = useMemo(() => ({
    total: members.length,
    normal: members.filter(m => m.level === '普通').length,
    silver: members.filter(m => m.level === '银卡').length,
    gold: members.filter(m => m.level === '金卡').length,
    diamond: members.filter(m => m.level === '钻石').length,
    active: members.filter(m => m.status === 'active').length,
  }), [members]);

  const filteredMembers = useMemo(() => {
    let result = members;
    result = filterByLevel(result, levelFilter);
    result = filterByStatus(result, statusFilter);
    result = filterBySearch(result, search);
    return result;
  }, [members, search, levelFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const pagedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  const safeSetPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  // ---- 弹窗 ----
  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyMember());
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Member) => {
    setEditingId(item.id);
    setFormData({
      name: item.name, level: item.level, points: item.points,
      totalSpent: item.totalSpent, phone: item.phone,
      joinDate: item.joinDate, status: item.status, lastActiveAt: item.lastActiveAt,
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
  }, []);

  const handleFormChange = useCallback((field: keyof Omit<Member, 'id'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name || !formData.phone) return;

    if (editingId) {
      setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...formData } : m));
    } else {
      const maxId = members.reduce((max, m) => {
        const num = parseInt(m.id.replace('M', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newMember: Member = { id: `M${String(maxId + 1).padStart(3, '0')}`, ...formData };
      setMembers(prev => [...prev, newMember]);
    }
    closeModal();
  }, [formData, editingId, members, closeModal]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除该会员吗？')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  }, []);

  const formatCurrency = useCallback((amount: number) =>
    `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, []);

  const formatPoints = useCallback((p: number) => p.toLocaleString('zh-CN'), []);

  const statCards = useMemo(() => [
    { label: '总会员', value: stats.total, sub: '人' },
    { label: '普通', value: stats.normal, sub: '人' },
    { label: '银卡', value: stats.silver, sub: '人' },
    { label: '金卡', value: stats.gold, sub: '人' },
    { label: '钻石', value: stats.diamond, sub: '人' },
  ], [stats]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>👤 会员管理</h1>
      <p style={styles.subtitle}>管理会员信息，支持新增、编辑、删除、搜索、等级与状态筛选。</p>

      {/* 统计卡片 */}
      <div style={styles.statsRow}>
        {statCards.map(s => (
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
          <input
            style={styles.searchInput}
            placeholder="🔍 搜索姓名/手机号..."
            value={search}
            onChange={e => { setSearch(e.target.value); safeSetPage(1); }}
          />
          <select style={styles.select} value={levelFilter} onChange={e => { setLevelFilter(e.target.value); safeSetPage(1); }}>
            <option value="all">全部等级</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'frozen', 'dormant', 'cancelled'] as const).map(s => (
              <button key={s} style={tabStyle(statusFilter === s)} onClick={() => { setStatusFilter(s); safeSetPage(1); }}>
                {s === 'all' ? '全部' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={openCreateModal}>+ 新增会员</button>
      </div>

      {/* 列表 */}
      {pagedMembers.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👤</div>
          <div style={styles.emptyText}>暂无匹配的会员数据</div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>编号</th>
              <th style={styles.th}>姓名</th>
              <th style={styles.th}>等级</th>
              <th style={styles.th}>积分</th>
              <th style={styles.th}>消费总额</th>
              <th style={styles.th}>手机号</th>
              <th style={styles.th}>注册日期</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedMembers.map(m => (
              <tr key={m.id}>
                <td style={{ ...styles.td, color: '#64748b', fontFamily: 'monospace' }}>{m.id}</td>
                <td style={{ ...styles.td, fontWeight: 500, color: '#e2e8f0' }}>{m.name}</td>
                <td style={styles.td}><span style={levelTagStyle(m.level)}>{m.level}</span></td>
                <td style={styles.td}>{formatPoints(m.points)}</td>
                <td style={styles.td}>{formatCurrency(m.totalSpent)}</td>
                <td style={{ ...styles.td, fontSize: 12 }}>{m.phone}</td>
                <td style={{ ...styles.td, fontSize: 12 }}>{m.joinDate}</td>
                <td style={styles.td}><span style={statusTagStyle(m.status)}>● {STATUS_LABELS[m.status]}</span></td>
                <td style={styles.actionCell}>
                  <button style={btnGhost} onClick={() => openEditModal(m)}>编辑</button>
                  <button style={btnDanger} onClick={() => handleDelete(m.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {filteredMembers.length > 0 && (
        <div style={styles.paginationRow}>
          <span>共 {filteredMembers.length} 条，第 {page}/{totalPages} 页</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={styles.pageBtn} disabled={page <= 1} onClick={() => safeSetPage(page - 1)}>上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} style={p === page ? styles.pageBtnActive : styles.pageBtn} onClick={() => safeSetPage(p)}>{p}</button>
            ))}
            <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => safeSetPage(page + 1)}>下一页</button>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>{editingId ? '编辑会员' : '新增会员'}</div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>姓名 *</label>
                <input style={styles.formInput} value={formData.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="请输入姓名" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>手机号 *</label>
                <input style={styles.formInput} value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="请输入手机号" />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>会员等级</label>
                <select style={styles.formInput} value={formData.level} onChange={e => handleFormChange('level', e.target.value as MemberLevel)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>状态</label>
                <select style={styles.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as MemberStatus)}>
                  <option value="active">正常</option>
                  <option value="frozen">冻结</option>
                  <option value="dormant">休眠</option>
                  <option value="cancelled">注销</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>积分</label>
                <input style={styles.formInput} type="number" value={formData.points} onChange={e => handleFormChange('points', parseInt(e.target.value, 10) || 0)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>消费总额</label>
                <input style={styles.formInput} type="number" step="0.01" value={formData.totalSpent} onChange={e => handleFormChange('totalSpent', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>注册日期</label>
                <input style={styles.formInput} type="date" value={formData.joinDate} onChange={e => handleFormChange('joinDate', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>最后活跃</label>
                <input style={styles.formInput} type="date" value={formData.lastActiveAt} onChange={e => handleFormChange('lastActiveAt', e.target.value)} />
              </div>
            </div>

            <div style={styles.formBtnRow}>
              <button style={btnGhost} onClick={closeModal}>取消</button>
              <button style={btnPrimary} onClick={handleSave}>{editingId ? '保存修改' : '确认新增'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
