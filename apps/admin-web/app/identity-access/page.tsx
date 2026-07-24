'use client';

/**
 * identity-access/page.tsx — 身份认证与访问控制
 *
 * 策略列表（策略名/类型/OAuth/SAML/JWT/状态/绑定角色）
 * 8条种子策略 | 搜索+类型筛选 | 统计卡片 | CRUD弹窗 | 分页 | 空状态
 */

import React, { useState, useMemo, useCallback } from 'react';
import { AdminPermissionGate } from '../components/admin-permission-gate';

// ============================================================
// 类型定义
// ============================================================

type PolicyStatus = 'active' | 'inactive';
type PolicyType = 'OAuth' | 'SAML' | 'JWT' | '自定义';

interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  description: string;
  boundRoles: string[];
  boundPermissions: string[];
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 映射表
// ============================================================

const STATUS_LABELS: Record<PolicyStatus, string> = { active: '启用', inactive: '禁用' };
const TYPES: PolicyType[] = ['OAuth', 'SAML', 'JWT', '自定义'];

// ============================================================
// 种子数据（8条策略）
// ============================================================

const DEFAULT_POLICIES: Policy[] = [
  { id: 'pol-001', name: '微信OAuth登录', type: 'OAuth', description: '微信开放平台OAuth2.0登录认证', boundRoles: ['customer'], boundPermissions: ['identity:wechat:login'], status: 'active', createdAt: '2026-01-15', updatedAt: '2026-06-10' },
  { id: 'pol-002', name: '企业SAML SSO', type: 'SAML', description: '企业内部SAML 2.0单点登录', boundRoles: ['employee', 'admin'], boundPermissions: ['identity:saml:login', 'identity:session:write'], status: 'active', createdAt: '2026-02-01', updatedAt: '2026-06-08' },
  { id: 'pol-003', name: '手机验证码登录', type: '自定义', description: '手机号+验证码快速登录', boundRoles: ['customer', 'employee'], boundPermissions: ['identity:sms:login'], status: 'active', createdAt: '2026-03-10', updatedAt: '2026-05-20' },
  { id: 'pol-004', name: 'JWT Token鉴权', type: 'JWT', description: 'JSON Web Token 接口鉴权', boundRoles: ['admin'], boundPermissions: ['identity:token:issue', 'identity:token:verify'], status: 'active', createdAt: '2026-01-20', updatedAt: '2026-06-15' },
  { id: 'pol-005', name: '支付宝OAuth登录', type: 'OAuth', description: '支付宝开放平台OAuth2.0登录', boundRoles: ['customer'], boundPermissions: ['identity:alipay:login'], status: 'inactive', createdAt: '2026-04-05', updatedAt: '2026-04-05' },
  { id: 'pol-006', name: 'LDAP目录认证', type: '自定义', description: 'LDAP企业目录服务统一认证', boundRoles: ['employee', 'admin'], boundPermissions: ['identity:ldap:bind', 'identity:profile:read'], status: 'inactive', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'pol-007', name: '钉钉扫码登录', type: 'OAuth', description: '钉钉开放平台OAuth2.0扫码登录', boundRoles: ['employee'], boundPermissions: ['identity:dingtalk:login'], status: 'active', createdAt: '2026-03-20', updatedAt: '2026-06-12' },
  { id: 'pol-008', name: 'API Key认证', type: '自定义', description: '第三方应用API Key签名认证', boundRoles: ['partner'], boundPermissions: ['identity:apikey:verify'], status: 'inactive', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
];

// ============================================================
// 辅助函数
// ============================================================

const getEmptyPolicy = (): Omit<Policy, 'id'> => ({
  name: '', type: 'OAuth', description: '', boundRoles: [], boundPermissions: [], status: 'active',
  createdAt: new Date().toISOString().slice(0, 10),
  updatedAt: new Date().toISOString().slice(0, 10),
});

// ============================================================
// 样式
// ============================================================

const S: Record<string, React.CSSProperties> = {
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
  statSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  toolBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  searchInput: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(30,41,59,0.6)',
    color: '#e2e8f0', outline: 'none', width: 220,
  },
  select: {
    padding: '6px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(30,41,59,0.6)',
    color: '#e2e8f0', outline: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600,
    color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.1)',
  },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148,163,184,0.06)' },
  actionCell: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid rgba(148,163,184,0.06)', display: 'flex', gap: 6 },
  modalOverlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#1e293b', borderRadius: 16, border: '1px solid rgba(148,163,184,0.15)',
    padding: 28, width: 520, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' },
  formInput: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.6)',
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
    border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8',
  },
  pageBtnActive: {
    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 600,
  },
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600,
};
const btnDanger: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
};
const btnGhost: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8',
};

const typeTagStyle = (t: PolicyType): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: t === 'OAuth' ? '#60a5fa' : t === 'SAML' ? '#a78bfa' : t === 'JWT' ? '#f59e0b' : '#22c55e',
  background: t === 'OAuth' ? 'rgba(96,165,250,0.12)' : t === 'SAML' ? 'rgba(167,139,250,0.12)' : t === 'JWT' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
});
const statusTagStyle = (s: PolicyStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: s === 'active' ? '#22c55e' : '#94a3b8',
  background: s === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
});
const roleTagStyle: React.CSSProperties = {
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: '#94a3b8', background: 'rgba(148,163,184,0.12)', marginRight: 4,
};
const permissionTagStyle: React.CSSProperties = {
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: '#86efac', background: 'rgba(34,197,94,0.12)', marginRight: 4, marginBottom: 4,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: active ? '1px solid #3b82f6' : '1px solid rgba(148,163,184,0.15)',
  background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
  color: active ? '#60a5fa' : '#94a3b8', fontWeight: active ? 600 : 400,
});

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '身份访问控制访问受限',
  description:
    '身份认证与访问控制页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看认证策略、角色绑定与权限配置。',
} as const;

// ============================================================
// 页面组件
// ============================================================

export default function IdentityAccessPage() {
  const [policies, setPolicies] = useState<Policy[]>(DEFAULT_POLICIES);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Policy, 'id'>>(getEmptyPolicy());
  const [rolesInput, setRolesInput] = useState('');
  const [permissionsInput, setPermissionsInput] = useState('');

  // ---- 派生 ----
  const stats = useMemo(() => ({
    total: policies.length,
    oauth: policies.filter(p => p.type === 'OAuth').length,
    saml: policies.filter(p => p.type === 'SAML').length,
    custom: policies.filter(p => p.type === '自定义').length,
    jwt: policies.filter(p => p.type === 'JWT').length,
    active: policies.filter(p => p.status === 'active').length,
  }), [policies]);

  const filteredPolicies = useMemo(() => {
    let r = policies;
    if (typeFilter !== 'all') r = r.filter(i => i.type === typeFilter);
    if (statusFilter !== 'all') r = r.filter(i => i.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.boundRoles.some(rr => rr.toLowerCase().includes(q)) ||
        i.boundPermissions.some(permission => permission.toLowerCase().includes(q))
      );
    }
    return r;
  }, [policies, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const pagedPolicies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, page, pageSize]);

  const safeSetPage = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);

  // ---- 弹窗 ----
  const openCreate = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyPolicy());
    setRolesInput('');
    setPermissionsInput('');
    setShowModal(true);
  }, []);
  const openEdit = useCallback((item: Policy) => {
    setEditingId(item.id);
    setFormData({ name: item.name, type: item.type, description: item.description, boundRoles: item.boundRoles, boundPermissions: item.boundPermissions, status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt });
    setRolesInput(item.boundRoles.join(', '));
    setPermissionsInput(item.boundPermissions.join(', '));
    setShowModal(true);
  }, []);
  const closeModal = useCallback(() => { setShowModal(false); setEditingId(null); }, []);
  const handleFormChange = useCallback((field: keyof Omit<Policy, 'id'>, value: string | string[]) => setFormData(prev => ({ ...prev, [field]: value })), []);

  const handleSave = useCallback(() => {
    if (!formData.name) return;
    const roles = rolesInput.split(',').map(r => r.trim()).filter(Boolean);
    const permissions = permissionsInput.split(',').map(permission => permission.trim()).filter(Boolean);
    const data = { ...formData, boundRoles: roles, boundPermissions: permissions };
    if (editingId) {
      setPolicies(prev => prev.map(p => p.id === editingId ? { ...p, ...data } : p));
    } else {
      const maxId = policies.reduce((m, p) => Math.max(m, parseInt(p.id.replace('pol-', ''), 10)), 0);
      setPolicies(prev => [...prev, { id: `pol-${String(maxId + 1).padStart(3, '0')}`, ...data }]);
    }
    closeModal();
  }, [formData, rolesInput, permissionsInput, editingId, policies, closeModal]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除该策略吗？')) setPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetFilter = useCallback(() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); safeSetPage(1); }, [safeSetPage]);

  const statCards = useMemo(() => [
    { label: '总策略', value: stats.total, sub: '条' },
    { label: 'OAuth', value: stats.oauth, sub: '条' },
    { label: 'SAML', value: stats.saml, sub: '条' },
    { label: 'JWT', value: stats.jwt, sub: '条' },
    { label: '已启用', value: stats.active, sub: '条' },
  ], [stats]);

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={S.page}>
        <h1 style={S.title}>🔐 身份认证与访问控制</h1>
        <p style={S.subtitle}>认证策略管理（OAuth/SAML/JWT/自定义），支持搜索、类型筛选、CRUD操作。</p>

        {/* 统计卡片 */}
        <div style={S.statsRow}>
          {statCards.map(s => (
            <div key={s.label} style={S.statCard}>
              <div style={S.statLabel}>{s.label}</div>
              <div style={S.statValue}>{s.value}</div>
              <div style={S.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 工具栏 */}
        <div style={S.toolBar}>
          <div style={S.filterRow}>
            <input style={S.searchInput} placeholder="🔍 搜索策略名称/描述/类型..." value={search} onChange={e => { setSearch(e.target.value); safeSetPage(1); }} />
            <select style={S.select} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); safeSetPage(1); }}>
              <option value="all">全部类型</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button key={s} style={tabStyle(statusFilter === s)} onClick={() => { setStatusFilter(s); safeSetPage(1); }}>
                  {s === 'all' ? '全部' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <button style={btnPrimary} onClick={openCreate}>+ 新增策略</button>
        </div>

        {/* 列表 */}
        {pagedPolicies.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>🔐</div>
            <div style={S.emptyText}>暂无匹配的认证策略</div>
            <button style={{ ...btnGhost, marginTop: 12 }} onClick={resetFilter}>清除筛选</button>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>策略名称</th>
                <th style={S.th}>类型</th>
                <th style={S.th}>描述</th>
                <th style={S.th}>绑定角色</th>
                <th style={S.th}>绑定权限</th>
                <th style={S.th}>状态</th>
                <th style={S.th}>更新时间</th>
                <th style={S.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedPolicies.map(p => (
                <tr key={p.id}>
                  <td style={{ ...S.td, fontWeight: 500, color: '#e2e8f0' }}>{p.name}</td>
                  <td style={S.td}><span style={typeTagStyle(p.type)}>{p.type}</span></td>
                  <td style={{ ...S.td, fontSize: 12, color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</td>
                  <td style={S.td}>{p.boundRoles.map(r => <span key={r} style={roleTagStyle}>{r}</span>)}</td>
                  <td style={S.td}>
                    {p.boundPermissions.length > 0 ? p.boundPermissions.map(permission => (
                      <span key={permission} style={permissionTagStyle}>{permission}</span>
                    )) : <span style={{ color: '#64748b' }}>暂无权限</span>}
                  </td>
                  <td style={S.td}><span style={statusTagStyle(p.status)}>● {STATUS_LABELS[p.status]}</span></td>
                  <td style={{ ...S.td, fontSize: 12 }}>{p.updatedAt}</td>
                  <td style={S.actionCell}>
                    <button style={btnGhost} onClick={() => openEdit(p)}>编辑</button>
                    <button style={btnDanger} onClick={() => handleDelete(p.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {filteredPolicies.length > 0 && (
          <div style={S.paginationRow}>
            <span>共 {filteredPolicies.length} 条，第 {page}/{totalPages} 页</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={S.pageBtn} disabled={page <= 1} onClick={() => safeSetPage(page - 1)}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={p === page ? S.pageBtnActive : S.pageBtn} onClick={() => safeSetPage(p)}>{p}</button>
              ))}
              <button style={S.pageBtn} disabled={page >= totalPages} onClick={() => safeSetPage(page + 1)}>下一页</button>
            </div>
          </div>
        )}

        {/* 新增/编辑弹窗 */}
        {showModal && (
          <div style={S.modalOverlay} onClick={closeModal}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={S.modalTitle}>{editingId ? '编辑策略' : '新增策略'}</div>

              <div style={S.formField}>
                <label style={S.formLabel}>策略名称 *</label>
                <input style={S.formInput} value={formData.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="例如: 微信OAuth登录" />
              </div>

              <div style={S.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={S.formLabel}>认证类型</label>
                  <select style={S.formInput} value={formData.type} onChange={e => handleFormChange('type', e.target.value as PolicyType)}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.formLabel}>状态</label>
                  <select style={S.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as PolicyStatus)}>
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>
              </div>

              <div style={S.formField}>
                <label style={S.formLabel}>描述</label>
                <input style={S.formInput} value={formData.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="策略描述" />
              </div>

              <div style={S.formField}>
                <label style={S.formLabel}>绑定角色（逗号分隔）</label>
                <input style={S.formInput} value={rolesInput} onChange={e => setRolesInput(e.target.value)} placeholder="例如: admin, employee, customer" />
              </div>

              <div style={S.formField}>
                <label style={S.formLabel}>绑定权限（逗号分隔）</label>
                <input style={S.formInput} value={permissionsInput} onChange={e => setPermissionsInput(e.target.value)} placeholder="例如: identity:login, identity:session:write" />
              </div>

              <div style={S.formBtnRow}>
                <button style={btnGhost} onClick={closeModal}>取消</button>
                <button style={btnPrimary} onClick={handleSave}>{editingId ? '保存修改' : '确认新增'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGate>
  );
}
