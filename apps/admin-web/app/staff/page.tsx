'use client';

/**
 * staff/page.tsx — 员工管理页
 *
 * 管理员工信息，支持列表浏览、Tab筛选、状态标记
 * 模块: 员工列表 | 概览统计 | Tab筛选 | 刷新
 */

import React, { useState, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type StaffPost = '店长' | '导玩员' | '收银员' | '保洁' | '安监' | '运营专员';
type StaffStatus = '在职' | '休假' | '离职';

interface StaffMember {
  id: string;
  name: string;
  post: StaffPost;
  store: string;
  phone: string;
  entryDate: string;
  status: StaffStatus;
}

// ============================================================
// 默认样本数据（10个员工）
// ============================================================

const DEFAULT_STAFF: StaffMember[] = [
  { id: 'S-001', name: '张伟', post: '店长', store: '深圳宝安店', phone: '13800001001', entryDate: '2024-03-01', status: '在职' },
  { id: 'S-002', name: '李娜', post: '导玩员', store: '深圳宝安店', phone: '13800001002', entryDate: '2024-06-15', status: '在职' },
  { id: 'S-003', name: '王强', post: '收银员', store: '广州天河店', phone: '13800001003', entryDate: '2024-01-10', status: '在职' },
  { id: 'S-004', name: '赵敏', post: '保洁', store: '深圳宝安店', phone: '13800001004', entryDate: '2024-08-20', status: '在职' },
  { id: 'S-005', name: '刘洋', post: '安监', store: '广州天河店', phone: '13800001005', entryDate: '2024-04-05', status: '在职' },
  { id: 'S-006', name: '陈静', post: '运营专员', store: '总部', phone: '13800001006', entryDate: '2024-02-28', status: '休假' },
  { id: 'S-007', name: '孙超', post: '导玩员', store: '广州天河店', phone: '13800001007', entryDate: '2025-01-12', status: '在职' },
  { id: 'S-008', name: '周婷', post: '收银员', store: '深圳宝安店', phone: '13800001008', entryDate: '2024-09-01', status: '在职' },
  { id: 'S-009', name: '吴刚', post: '店长', store: '总部', phone: '13800001009', entryDate: '2023-11-15', status: '离职' },
  { id: 'S-010', name: '郑雨', post: '运营专员', store: '广州天河店', phone: '13800001010', entryDate: '2024-12-03', status: '休假' },
];

// ============================================================
// 辅助函数
// ============================================================

function getStoreCount(staff: StaffMember[]): number {
  const stores = new Set(staff.filter(s => s.status !== '离职').map(s => s.store));
  return stores.size;
}

function filterStaffByTab(staff: StaffMember[], tab: string): StaffMember[] {
  if (tab === '全部') return staff;
  return staff.filter(s => s.status === tab);
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
const statusTagStyle = (status: StaffStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: status === '在职' ? '#22c55e' : status === '休假' ? '#f59e0b' : '#ef4444',
  background: status === '在职' ? 'rgba(34, 197, 94, 0.12)' : status === '休假' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
});
const postTagStyle = (post: StaffPost): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: '#94a3b8', background: 'rgba(148, 163, 184, 0.12)',
});

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 1060, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '16px 20px' },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  statSubLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },

  toolBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  refreshBtn: {
    padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    border: '1px solid rgba(148, 163, 184, 0.2)', background: 'transparent',
    color: '#94a3b8',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },


  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText: { fontSize: 14, color: '#64748b' },
};

// ============================================================
// 页面组件
// ============================================================

export default function StaffPage() {
  const [staff] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [activeTab, setActiveTab] = useState<string>('全部');
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredStaff = filterStaffByTab(staff, activeTab);
  const activeStaff = staff.filter(s => s.status === '在职');
  const onLeaveStaff = staff.filter(s => s.status === '休假');
  const resignedStaff = staff.filter(s => s.status === '离职');

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const stats = [
    { label: '总人数', value: staff.length },
    { label: '在职', value: activeStaff.length },
    { label: '休假', value: onLeaveStaff.length },
    { label: '离职', value: resignedStaff.length },
    { label: '覆盖门店', value: getStoreCount(staff) },
  ];

  return (
    <div style={styles.page} data-refresh-key={refreshKey}>
      <h1 style={styles.title}>👥 员工管理</h1>
      <p style={styles.subtitle}>管理各门店人员信息、岗位分配与在职状态。</p>

      {/* 概览统计 */}
      <div style={styles.statsRow}>
        {stats.map(s => (
          <div key={s.label} style={styles.statCard} data-stat={s.label}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statSubLabel}>{s.label === '覆盖门店' ? '个门店' : '人'}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: Tab + 刷新 */}
      <div style={styles.toolBar}>
        <div style={styles.tabRow}>
          {['全部', '在职', '休假'].map(tab => (
            <button
              key={tab}
              style={tabStyle(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
                {tab === '全部' ? staff.length : tab === '在职' ? activeStaff.length : onLeaveStaff.length}
              </span>
            </button>
          ))}
        </div>
        <button style={styles.refreshBtn} onClick={handleRefresh} data-testid="refresh-btn">
          🔄 刷新
        </button>
      </div>

      {/* 员工列表 */}
      {filteredStaff.length === 0 ? (
        <div style={styles.emptyState} data-testid="empty-state">
          <div style={styles.emptyIcon}>📋</div>
          <div style={styles.emptyText}>当前状态暂无员工数据</div>
        </div>
      ) : (
        <table style={styles.table} data-testid="staff-table">
          <thead>
            <tr>
              <th style={styles.th}>姓名</th>
              <th style={styles.th}>岗位</th>
              <th style={styles.th}>门店</th>
              <th style={styles.th}>联系方式</th>
              <th style={styles.th}>入职时间</th>
              <th style={styles.th}>状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(m => (
              <tr key={m.id}>
                <td style={styles.td}>{m.name}</td>
                <td style={styles.td}><span style={postTagStyle(m.post)}>{m.post}</span></td>
                <td style={styles.td}>{m.store}</td>
                <td style={styles.td}>{m.phone}</td>
                <td style={styles.td}>{m.entryDate}</td>
                <td style={styles.td}><span style={statusTagStyle(m.status)}>● {m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
