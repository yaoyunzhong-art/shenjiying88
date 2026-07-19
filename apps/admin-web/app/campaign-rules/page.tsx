'use client';

/**
 * campaign-rules/page.tsx — 活动规则管理
 *
 * 规则列表（规则名/活动类型/条件/动作/优先级/状态）
 * 搜索 + 活动类型筛选 | 统计卡片 | CRUD弹窗 | 分页 | 空状态
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type RuleStatus = 'active' | 'inactive' | 'draft';
type CampaignType = '满减' | '折扣' | '赠品' | '返券' | '积分加倍';

interface CampaignRule {
  id: string;
  name: string;
  campaignType: CampaignType;
  condition: string;
  action: string;
  priority: number;
  status: RuleStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 映射表
// ============================================================

const STATUS_LABELS: Record<RuleStatus, string> = { active: '启用', inactive: '停用', draft: '草稿' };
const TYPES: CampaignType[] = ['满减', '折扣', '赠品', '返券', '积分加倍'];

// ============================================================
// 种子数据（6条活动规则）
// ============================================================

const DEFAULT_RULES: CampaignRule[] = [
  { id: 'rule-001', name: '满200减30', campaignType: '满减', condition: '订单金额 ≥ 200', action: '减免30元', priority: 1, status: 'active', description: '通用满减活动，订单满200减30', createdAt: '2026-01-10', updatedAt: '2026-06-15' },
  { id: 'rule-002', name: '全场8折', campaignType: '折扣', condition: '无门槛', action: '订单总价×0.8', priority: 2, status: 'active', description: '全场商品8折优惠', createdAt: '2026-02-20', updatedAt: '2026-06-10' },
  { id: 'rule-003', name: '买二送一', campaignType: '赠品', condition: '同一商品购买≥2件', action: '赠送同款1件', priority: 3, status: 'inactive', description: '买二送一促销活动（已结束）', createdAt: '2026-03-01', updatedAt: '2026-05-01' },
  { id: 'rule-004', name: '新会员首单送券', campaignType: '返券', condition: '注册日期≤30天且首单', action: '赠送满100减20优惠券', priority: 4, status: 'active', description: '新注册会员首单赠送优惠券', createdAt: '2026-04-15', updatedAt: '2026-06-20' },
  { id: 'rule-005', name: '会员日双倍积分', campaignType: '积分加倍', condition: '每周六会员日', action: '消费积分×2', priority: 5, status: 'active', description: '会员日双倍积分活动', createdAt: '2026-03-05', updatedAt: '2026-06-18' },
  { id: 'rule-006', name: '中秋满500送礼物', campaignType: '赠品', condition: '订单金额 ≥ 500', action: '赠送中秋礼盒', priority: 6, status: 'draft', description: '中秋限定满赠活动（待发布）', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
];

// ============================================================
// 辅助函数
// ============================================================

function getEmptyRule(): Omit<CampaignRule, 'id'> {
  return {
    name: '', campaignType: '满减', condition: '', action: '', priority: 0,
    status: 'draft', description: '',
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

function filterByType(items: CampaignRule[], type: string): CampaignRule[] {
  if (!type || type === 'all') return items;
  return items.filter(i => i.campaignType === type);
}

function filterByStatus(items: CampaignRule[], status: string): CampaignRule[] {
  if (!status || status === 'all') return items;
  return items.filter(i => i.status === status);
}

function filterBySearch(items: CampaignRule[], search: string): CampaignRule[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q) ||
    i.condition.toLowerCase().includes(q) ||
    i.action.toLowerCase().includes(q)
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

const statusTagStyle = (status: RuleStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: status === 'active' ? '#22c55e' : status === 'inactive' ? '#ef4444' : '#f59e0b',
  background: status === 'active' ? 'rgba(34, 197, 94, 0.12)' : status === 'inactive' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
});

const typeTagStyle = (type: CampaignType): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: type === '满减' ? '#ef4444' : type === '折扣' ? '#60a5fa' : type === '赠品' ? '#a78bfa' : type === '返券' ? '#22c55e' : '#f59e0b',
  background: type === '满减' ? 'rgba(239, 68, 68, 0.12)' : type === '折扣' ? 'rgba(96, 165, 250, 0.12)' : type === '赠品' ? 'rgba(167, 139, 250, 0.12)' : type === '返券' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
});

const priorityTagStyle = (p: number): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: p <= 2 ? '#ef4444' : p <= 4 ? '#f59e0b' : '#94a3b8',
  background: p <= 2 ? 'rgba(239, 68, 68, 0.12)' : p <= 4 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.12)',
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

export default function CampaignRulesPage() {
  const [rules, setRules] = useState<CampaignRule[]>(DEFAULT_RULES);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<CampaignRule, 'id'>>(getEmptyRule());

  // ---- 派生数据 ----
  const stats = useMemo(() => ({
    total: rules.length,
    fullReduction: rules.filter(r => r.campaignType === '满减').length,
    discount: rules.filter(r => r.campaignType === '折扣').length,
    gift: rules.filter(r => r.campaignType === '赠品').length,
    coupon: rules.filter(r => r.campaignType === '返券').length,
    active: rules.filter(r => r.status === 'active').length,
  }), [rules]);

  const filteredRules = useMemo(() => {
    let result = rules;
    result = filterByType(result, typeFilter);
    result = filterByStatus(result, statusFilter);
    result = filterBySearch(result, search);
    return result;
  }, [rules, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const pagedRules = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, page, pageSize]);

  const safeSetPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  // ---- 弹窗 ----
  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyRule());
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: CampaignRule) => {
    setEditingId(item.id);
    setFormData({
      name: item.name, campaignType: item.campaignType,
      condition: item.condition, action: item.action,
      priority: item.priority, status: item.status,
      description: item.description,
      createdAt: item.createdAt, updatedAt: item.updatedAt,
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
  }, []);

  const handleFormChange = useCallback((field: keyof Omit<CampaignRule, 'id'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name) return;

    if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...formData } : r));
    } else {
      const maxId = rules.reduce((max, r) => {
        const num = parseInt(r.id.replace('rule-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newRule: CampaignRule = { id: `rule-${String(maxId + 1).padStart(3, '0')}`, ...formData };
      setRules(prev => [...prev, newRule]);
    }
    closeModal();
  }, [formData, editingId, rules, closeModal]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除该规则吗？')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  const statCards = useMemo(() => [
    { label: '总规则', value: stats.total, sub: '条' },
    { label: '满减', value: stats.fullReduction, sub: '条' },
    { label: '折扣', value: stats.discount, sub: '条' },
    { label: '赠品', value: stats.gift, sub: '条' },
    { label: '已启用', value: stats.active, sub: '条' },
  ], [stats]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🏷️ 活动规则</h1>
      <p style={styles.subtitle}>管理活动营销规则（满减/折扣/赠品/返券/积分加倍），支持搜索、类型筛选、CRUD操作。</p>

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
            placeholder="🔍 搜索规则名称/条件/动作..."
            value={search}
            onChange={e => { setSearch(e.target.value); safeSetPage(1); }}
          />
          <select style={styles.select} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); safeSetPage(1); }}>
            <option value="all">全部类型</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'inactive', 'draft'] as const).map(s => (
              <button key={s} style={tabStyle(statusFilter === s)} onClick={() => { setStatusFilter(s); safeSetPage(1); }}>
                {s === 'all' ? '全部' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={openCreateModal}>+ 新增规则</button>
      </div>

      {/* 列表 */}
      {pagedRules.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏷️</div>
          <div style={styles.emptyText}>暂无匹配的活动规则</div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>规则名称</th>
              <th style={styles.th}>活动类型</th>
              <th style={styles.th}>条件</th>
              <th style={styles.th}>动作</th>
              <th style={styles.th}>优先级</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRules.map(r => (
              <tr key={r.id}>
                <td style={{ ...styles.td, fontWeight: 500, color: '#e2e8f0' }}>{r.name}</td>
                <td style={styles.td}><span style={typeTagStyle(r.campaignType)}>{r.campaignType}</span></td>
                <td style={{ ...styles.td, fontSize: 12, color: '#94a3b8' }}>{r.condition}</td>
                <td style={{ ...styles.td, fontSize: 12, color: '#94a3b8' }}>{r.action}</td>
                <td style={styles.td}><span style={priorityTagStyle(r.priority)}>P{r.priority}</span></td>
                <td style={styles.td}><span style={statusTagStyle(r.status)}>● {STATUS_LABELS[r.status]}</span></td>
                <td style={styles.actionCell}>
                  <button style={btnGhost} onClick={() => openEditModal(r)}>编辑</button>
                  <button style={btnDanger} onClick={() => handleDelete(r.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {filteredRules.length > 0 && (
        <div style={styles.paginationRow}>
          <span>共 {filteredRules.length} 条，第 {page}/{totalPages} 页</span>
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
            <div style={styles.modalTitle}>{editingId ? '编辑规则' : '新增规则'}</div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>规则名称 *</label>
              <input style={styles.formInput} value={formData.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="例如: 满200减30" />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>活动类型</label>
                <select style={styles.formInput} value={formData.campaignType} onChange={e => handleFormChange('campaignType', e.target.value as CampaignType)}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>优先级</label>
                <input style={styles.formInput} type="number" value={formData.priority} onChange={e => handleFormChange('priority', parseInt(e.target.value, 10) || 0)} placeholder="数值越小优先级越高" />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>条件</label>
                <input style={styles.formInput} value={formData.condition} onChange={e => handleFormChange('condition', e.target.value)} placeholder="例如: 订单金额 ≥ 200" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>动作</label>
                <input style={styles.formInput} value={formData.action} onChange={e => handleFormChange('action', e.target.value)} placeholder="例如: 减免30元" />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>状态</label>
                <select style={styles.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as RuleStatus)}>
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>描述</label>
                <input style={styles.formInput} value={formData.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="规则描述" />
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
