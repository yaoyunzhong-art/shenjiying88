'use client';

/**
 * configuration/page.tsx — 配置管理
 *
 * 系统配置项列表，支持搜索/分组筛选/CRUD弹窗/统计卡片/分页
 * 模块: 配置管理 | 配置项key/value/分组/环境/状态
 */

import React, { useState, useMemo, useCallback } from 'react';
import { AdminPermissionGate } from '../components/admin-permission-gate';

// ============================================================
// 类型定义
// ============================================================

type ConfigStatus = 'enabled' | 'disabled';
type ConfigEnv = 'production' | 'staging' | 'development';
type ConfigGroup = '系统' | '用户' | '安全' | '通知' | '支付' | '会员';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  group: ConfigGroup;
  env: ConfigEnv;
  status: ConfigStatus;
  description: string;
  updatedAt: string;
}

// ============================================================
// 映射表
// ============================================================

const STATUS_LABELS: Record<ConfigStatus, string> = { enabled: '启用', disabled: '禁用' };
const ENV_LABELS: Record<ConfigEnv, string> = { production: '生产', staging: '预发布', development: '开发' };
const GROUPS: ConfigGroup[] = ['系统', '用户', '安全', '通知', '支付', '会员'];
const ENVS: ConfigEnv[] = ['production', 'staging', 'development'];

// ============================================================
// 种子数据（8条配置）
// ============================================================

const DEFAULT_CONFIGS: ConfigItem[] = [
  { id: 'cfg-001', key: 'site.title', value: '申继英管理后台', group: '系统', env: 'production', status: 'enabled', description: '站点标题', updatedAt: '2026-06-01' },
  { id: 'cfg-002', key: 'site.logo', value: '/logo.png', group: '系统', env: 'production', status: 'enabled', description: '站点Logo路径', updatedAt: '2026-06-01' },
  { id: 'cfg-003', key: 'site.icp', value: '粤ICP备2024XXXXXX号', group: '系统', env: 'production', status: 'enabled', description: '工信部备案号', updatedAt: '2026-05-15' },
  { id: 'cfg-004', key: 'service.hotline', value: '400-888-8888', group: '通知', env: 'production', status: 'enabled', description: '客服电话', updatedAt: '2026-04-20' },
  { id: 'cfg-005', key: 'payment.timeout_ms', value: '5000', group: '支付', env: 'production', status: 'enabled', description: '支付超时（毫秒）', updatedAt: '2026-06-10' },
  { id: 'cfg-006', key: 'member.default_level', value: 'bronze', group: '会员', env: 'staging', status: 'disabled', description: '默认会员等级', updatedAt: '2026-05-30' },
  { id: 'cfg-007', key: 'security.max_login_attempts', value: '5', group: '安全', env: 'production', status: 'enabled', description: '最大登录尝试次数', updatedAt: '2026-06-05' },
  { id: 'cfg-008', key: 'user.session_timeout', value: '3600', group: '用户', env: 'development', status: 'disabled', description: '用户会话超时（秒）', updatedAt: '2026-06-08' },
];

// ============================================================
// 辅助函数
// ============================================================

function getEmptyConfig(): Omit<ConfigItem, 'id'> {
  return {
    key: '', value: '', group: '系统', env: 'development', status: 'enabled', description: '', updatedAt: new Date().toISOString().slice(0, 10),
  };
}

function filterByGroup(items: ConfigItem[], group: string): ConfigItem[] {
  if (!group || group === 'all') return items;
  return items.filter(i => i.group === group);
}

function filterByEnv(items: ConfigItem[], env: string): ConfigItem[] {
  if (!env || env === 'all') return items;
  return items.filter(i => i.env === env);
}

function filterByStatus(items: ConfigItem[], status: string): ConfigItem[] {
  if (!status || status === 'all') return items;
  return items.filter(i => i.status === status);
}

function filterBySearch(items: ConfigItem[], search: string): ConfigItem[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(i =>
    i.key.toLowerCase().includes(q) ||
    i.value.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q) ||
    i.group.toLowerCase().includes(q)
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

const statusTagStyle = (status: ConfigStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: status === 'enabled' ? '#22c55e' : '#94a3b8',
  background: status === 'enabled' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)',
});

const groupTagStyle: React.CSSProperties = {
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: '#94a3b8', background: 'rgba(148, 163, 184, 0.12)',
};

const envTagStyle = (env: ConfigEnv): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: env === 'production' ? '#22c55e' : env === 'staging' ? '#f59e0b' : '#60a5fa',
  background: env === 'production' ? 'rgba(34, 197, 94, 0.12)' : env === 'staging' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(96, 165, 250, 0.12)',
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
    color: '#e2e8f0', outline: 'none', width: 200,
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

export default function ConfigurationPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>(DEFAULT_CONFIGS);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ConfigItem, 'id'>>(getEmptyConfig());

  // ---- 派生数据 ----
  const stats = useMemo(() => ({
    total: configs.length,
    enabled: configs.filter(c => c.status === 'enabled').length,
    system: configs.filter(c => c.group === '系统').length,
    user: configs.filter(c => c.group === '用户').length,
    groups: new Set(configs.map(c => c.group)).size,
  }), [configs]);

  const filteredConfigs = useMemo(() => {
    let result = configs;
    result = filterByGroup(result, groupFilter);
    result = filterByEnv(result, envFilter);
    result = filterByStatus(result, statusFilter);
    result = filterBySearch(result, search);
    return result;
  }, [configs, search, groupFilter, envFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConfigs.length / pageSize));
  const pagedConfigs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredConfigs.slice(start, start + pageSize);
  }, [filteredConfigs, page, pageSize]);

  // 页码变化时重置
  const safeSetPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  // ---- 弹窗 ----
  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyConfig());
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: ConfigItem) => {
    setEditingId(item.id);
    setFormData({
      key: item.key,
      value: item.value,
      group: item.group,
      env: item.env,
      status: item.status,
      description: item.description,
      updatedAt: item.updatedAt,
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
  }, []);

  const handleFormChange = useCallback((field: keyof Omit<ConfigItem, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.key || !formData.value) return;
    if (editingId) {
      setConfigs(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
    } else {
      const maxId = configs.reduce((max, c) => {
        const num = parseInt(c.id.replace('cfg-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newItem: ConfigItem = { id: `cfg-${String(maxId + 1).padStart(3, '0')}`, ...formData };
      setConfigs(prev => [...prev, newItem]);
    }
    closeModal();
  }, [formData, editingId, configs, closeModal]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除该配置项吗？')) {
      setConfigs(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  const statCards = useMemo(() => [
    { label: '总配置项', value: stats.total, sub: '条' },
    { label: '已启用', value: stats.enabled, sub: '条' },
    { label: '系统配置', value: stats.system, sub: '条' },
    { label: '用户配置', value: stats.user, sub: '条' },
    { label: '分组数', value: stats.groups, sub: '个' },
  ], [stats]);

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="配置管理访问受限"
      description="配置管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看配置项、筛选器与治理动作。"
    >
      <div style={styles.page}>
      <h1 style={styles.title}>⚙️ 配置管理</h1>
      <p style={styles.subtitle}>系统配置项管理，支持新增、编辑、删除、搜索、分组/环境/状态筛选。</p>

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
            placeholder="🔍 搜索Key/值/描述..."
            value={search}
            onChange={e => { setSearch(e.target.value); safeSetPage(1); }}
          />
          <select style={styles.select} value={groupFilter} onChange={e => { setGroupFilter(e.target.value); safeSetPage(1); }}>
            <option value="all">全部分组</option>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select style={styles.select} value={envFilter} onChange={e => { setEnvFilter(e.target.value); safeSetPage(1); }}>
            <option value="all">全部环境</option>
            {ENVS.map(e => <option key={e} value={e}>{ENV_LABELS[e]}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'enabled', 'disabled'] as const).map(s => (
              <button key={s} style={tabStyle(statusFilter === s)} onClick={() => { setStatusFilter(s); safeSetPage(1); }}>
                {s === 'all' ? '全部' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={openCreateModal}>+ 新增配置</button>
      </div>

      {/* 列表 */}
      {pagedConfigs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <div style={styles.emptyText}>暂无匹配的配置项</div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Key</th>
              <th style={styles.th}>值</th>
              <th style={styles.th}>分组</th>
              <th style={styles.th}>环境</th>
              <th style={styles.th}>描述</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>更新时间</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedConfigs.map(c => (
              <tr key={c.id}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0' }}>{c.key}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{c.value}</td>
                <td style={styles.td}><span style={groupTagStyle}>{c.group}</span></td>
                <td style={styles.td}><span style={envTagStyle(c.env)}>{ENV_LABELS[c.env]}</span></td>
                <td style={{ ...styles.td, fontSize: 12, color: '#94a3b8' }}>{c.description}</td>
                <td style={styles.td}><span style={statusTagStyle(c.status)}>● {STATUS_LABELS[c.status]}</span></td>
                <td style={{ ...styles.td, fontSize: 12 }}>{c.updatedAt}</td>
                <td style={styles.actionCell}>
                  <button style={btnGhost} onClick={() => openEditModal(c)}>编辑</button>
                  <button style={btnDanger} onClick={() => handleDelete(c.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {filteredConfigs.length > 0 && (
        <div style={styles.paginationRow}>
          <span>共 {filteredConfigs.length} 条，第 {page}/{totalPages} 页</span>
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
            <div style={styles.modalTitle}>{editingId ? '编辑配置项' : '新增配置项'}</div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>配置Key *</label>
              <input style={{ ...styles.formInput, fontFamily: 'monospace' }} value={formData.key} onChange={e => handleFormChange('key', e.target.value)} placeholder="例如: site.title" />
            </div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>配置值 *</label>
              <input style={{ ...styles.formInput, fontFamily: 'monospace' }} value={formData.value} onChange={e => handleFormChange('value', e.target.value)} placeholder="配置值" />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>分组</label>
                <select style={styles.formInput} value={formData.group} onChange={e => handleFormChange('group', e.target.value as ConfigGroup)}>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>环境</label>
                <select style={styles.formInput} value={formData.env} onChange={e => handleFormChange('env', e.target.value as ConfigEnv)}>
                  {ENVS.map(e => <option key={e} value={e}>{ENV_LABELS[e]}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>状态</label>
                <select style={styles.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as ConfigStatus)}>
                  <option value="enabled">启用</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>描述</label>
                <input style={styles.formInput} value={formData.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="描述信息" />
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
    </AdminPermissionGate>
  );
}
