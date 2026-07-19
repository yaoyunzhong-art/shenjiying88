'use client';

/**
 * integration-orchestration/page.tsx — 集成编排
 *
 * 集成流程编排（流程名/类型/Webhook/API/状态/触发方式/最后执行）
 * 6条种子流程 | 搜索+类型筛选 | 统计卡片 | CRUD弹窗 | 分页 | 空状态
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

type FlowStatus = 'active' | 'inactive' | 'error';
type FlowType = 'Webhook' | 'API' | 'EventBus' | '定时任务';
type TriggerType = '事件驱动' | '定时调度' | '手动触发' | '条件触发';

interface IntegrationFlow {
  id: string;
  name: string;
  type: FlowType;
  description: string;
  trigger: TriggerType;
  endpoint: string;
  status: FlowStatus;
  lastExecutedAt: string | null;
  successRate: number;
  createdAt: string;
}

// ============================================================
// 映射
// ============================================================

const STATUS_LABELS: Record<FlowStatus, string> = { active: '运行中', inactive: '已停用', error: '异常' };
const FLOW_TYPES: FlowType[] = ['Webhook', 'API', 'EventBus', '定时任务'];
const TRIGGER_TYPES: TriggerType[] = ['事件驱动', '定时调度', '手动触发', '条件触发'];

// ============================================================
// 种子数据（6条流程）
// ============================================================

const DEFAULT_FLOWS: IntegrationFlow[] = [
  { id: 'flow-001', name: '订单同步Webhook', type: 'Webhook', description: '接收电商平台订单推送，同步至ERP系统', trigger: '事件驱动', endpoint: '/webhook/order/sync', status: 'active', lastExecutedAt: '2026-07-19 14:32:18', successRate: 99.2, createdAt: '2026-01-10' },
  { id: 'flow-002', name: '会员积分结算API', type: 'API', description: '月度会员积分汇总结算，对接财务系统', trigger: '定时调度', endpoint: '/api/member/points/settle', status: 'active', lastExecutedAt: '2026-07-19 03:00:05', successRate: 100, createdAt: '2026-02-15' },
  { id: 'flow-003', name: '短信发送编排', type: 'EventBus', description: '事件总线消费，触发短信通知发送', trigger: '事件驱动', endpoint: 'eventbus://sms/send', status: 'active', lastExecutedAt: '2026-07-19 15:01:22', successRate: 97.8, createdAt: '2026-03-01' },
  { id: 'flow-004', name: '数据备份ETL', type: '定时任务', description: '每日凌晨数据备份，压缩归档至OSS', trigger: '定时调度', endpoint: 'cron://0 2 * * *', status: 'active', lastExecutedAt: '2026-07-19 02:00:12', successRate: 100, createdAt: '2026-01-20' },
  { id: 'flow-005', name: '第三方库存回调', type: 'Webhook', description: '接收供应商库存变更回调，更新本地库存', trigger: '事件驱动', endpoint: '/webhook/inventory/callback', status: 'error', lastExecutedAt: '2026-07-18 22:15:43', successRate: 85.3, createdAt: '2026-04-10' },
  { id: 'flow-006', name: '对账文件生成', type: 'API', description: '生成每日对账文件并推送至银行SFTP', trigger: '定时调度', endpoint: '/api/reconciliation/generate', status: 'inactive', lastExecutedAt: null, successRate: 0, createdAt: '2026-05-01' },
];

// ============================================================
// 样式
// ============================================================

const S: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  statCard: {
    flex: '1 1 140px', background: 'rgba(30,41,59,0.8)', borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.1)', padding: '16px 20px',
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

const typeTagStyle = (t: FlowType): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: t === 'Webhook' ? '#60a5fa' : t === 'API' ? '#22c55e' : t === 'EventBus' ? '#a78bfa' : '#f59e0b',
  background: t === 'Webhook' ? 'rgba(96,165,250,0.12)' : t === 'API' ? 'rgba(34,197,94,0.12)' : t === 'EventBus' ? 'rgba(167,139,250,0.12)' : 'rgba(245,158,11,0.12)',
});
const statusTagStyle = (s: FlowStatus): React.CSSProperties => ({
  fontSize: 11, display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  color: s === 'active' ? '#22c55e' : s === 'error' ? '#ef4444' : '#94a3b8',
  background: s === 'active' ? 'rgba(34,197,94,0.12)' : s === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.12)',
});
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  border: active ? '1px solid #3b82f6' : '1px solid rgba(148,163,184,0.15)',
  background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
  color: active ? '#60a5fa' : '#94a3b8', fontWeight: active ? 600 : 400,
});

// ============================================================
// 页面组件
// ============================================================

export default function IntegrationOrchestrationPage() {
  const [flows, setFlows] = useState<IntegrationFlow[]>(DEFAULT_FLOWS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<IntegrationFlow, 'id'>>({
    name: '', type: 'Webhook', description: '', trigger: '事件驱动',
    endpoint: '', status: 'active', lastExecutedAt: null, successRate: 100,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  // ---- 派生 ----
  const stats = useMemo(() => ({
    total: flows.length,
    webhook: flows.filter(f => f.type === 'Webhook').length,
    api: flows.filter(f => f.type === 'API').length,
    eventbus: flows.filter(f => f.type === 'EventBus').length,
    active: flows.filter(f => f.status === 'active').length,
    error: flows.filter(f => f.status === 'error').length,
  }), [flows]);

  const filteredFlows = useMemo(() => {
    let r = flows;
    if (typeFilter !== 'all') r = r.filter(f => f.type === typeFilter);
    if (statusFilter !== 'all') r = r.filter(f => f.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.endpoint.toLowerCase().includes(q)
      );
    }
    return r;
  }, [flows, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFlows.length / pageSize));
  const pagedFlows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFlows.slice(start, start + pageSize);
  }, [filteredFlows, page, pageSize]);

  const safeSetPage = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);

  // ---- 弹窗 ----
  const openCreate = useCallback(() => {
    setEditingId(null);
    setFormData({ name: '', type: 'Webhook', description: '', trigger: '事件驱动', endpoint: '', status: 'active', lastExecutedAt: null, successRate: 100, createdAt: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  }, []);
  const openEdit = useCallback((item: IntegrationFlow) => {
    setEditingId(item.id);
    setFormData({ name: item.name, type: item.type, description: item.description, trigger: item.trigger, endpoint: item.endpoint, status: item.status, lastExecutedAt: item.lastExecutedAt, successRate: item.successRate, createdAt: item.createdAt });
    setShowModal(true);
  }, []);
  const closeModal = useCallback(() => { setShowModal(false); setEditingId(null); }, []);
  const handleFormChange = useCallback((field: keyof Omit<IntegrationFlow, 'id'>, value: string | number | null) => setFormData(prev => ({ ...prev, [field]: value })), []);

  const handleSave = useCallback(() => {
    if (!formData.name) return;
    if (editingId) {
      setFlows(prev => prev.map(f => f.id === editingId ? { ...f, ...formData } : f));
    } else {
      const maxId = flows.reduce((m, f) => Math.max(m, parseInt(f.id.replace('flow-', ''), 10)), 0);
      setFlows(prev => [...prev, { id: `flow-${String(maxId + 1).padStart(3, '0')}`, ...formData, lastExecutedAt: null } as IntegrationFlow]);
    }
    closeModal();
  }, [formData, editingId, flows, closeModal]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除该流程吗？')) setFlows(prev => prev.filter(f => f.id !== id));
  }, []);

  const resetFilter = useCallback(() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); safeSetPage(1); }, [safeSetPage]);

  const statCards = useMemo(() => [
    { label: '总流程', value: stats.total, sub: '条' },
    { label: 'Webhook', value: stats.webhook, sub: '条' },
    { label: 'API', value: stats.api, sub: '条' },
    { label: 'EventBus', value: stats.eventbus, sub: '条' },
    { label: '运行中', value: stats.active, sub: '条' },
  ], [stats]);

  return (
    <div style={S.page}>
      <h1 style={S.title}>🔗 集成编排</h1>
      <p style={S.subtitle}>集成流程编排管理（Webhook/API/EventBus/定时任务），支持搜索、类型筛选、CRUD操作。</p>

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
          <input style={S.searchInput} placeholder="🔍 搜索流程名称/描述/端点..." value={search} onChange={e => { setSearch(e.target.value); safeSetPage(1); }} />
          <select style={S.select} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); safeSetPage(1); }}>
            <option value="all">全部类型</option>
            {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'inactive', 'error'] as const).map(s => (
              <button key={s} style={tabStyle(statusFilter === s)} onClick={() => { setStatusFilter(s); safeSetPage(1); }}>
                {s === 'all' ? '全部' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={openCreate}>+ 新增流程</button>
      </div>

      {/* 列表 */}
      {pagedFlows.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🔗</div>
          <div style={S.emptyText}>暂无匹配的集成流程</div>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={resetFilter}>清除筛选</button>
        </div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>流程名称</th>
              <th style={S.th}>类型</th>
              <th style={S.th}>触发方式</th>
              <th style={S.th}>端点</th>
              <th style={S.th}>成功率</th>
              <th style={S.th}>状态</th>
              <th style={S.th}>最后执行</th>
              <th style={S.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedFlows.map(f => (
              <tr key={f.id}>
                <td style={{ ...S.td, fontWeight: 500, color: '#e2e8f0' }}>{f.name}</td>
                <td style={S.td}><span style={typeTagStyle(f.type)}>{f.type}</span></td>
                <td style={{ ...S.td, fontSize: 12 }}>{f.trigger}</td>
                <td style={{ ...S.td, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{f.endpoint}</td>
                <td style={S.td}>
                  <span style={{ color: f.successRate >= 99 ? '#22c55e' : f.successRate >= 90 ? '#f59e0b' : '#ef4444' }}>
                    {f.successRate}%
                  </span>
                </td>
                <td style={S.td}><span style={statusTagStyle(f.status)}>● {STATUS_LABELS[f.status]}</span></td>
                <td style={{ ...S.td, fontSize: 11 }}>{f.lastExecutedAt || '-'}</td>
                <td style={S.actionCell}>
                  <button style={btnGhost} onClick={() => openEdit(f)}>编辑</button>
                  <button style={btnDanger} onClick={() => handleDelete(f.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {filteredFlows.length > 0 && (
        <div style={S.paginationRow}>
          <span>共 {filteredFlows.length} 条，第 {page}/{totalPages} 页</span>
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
            <div style={S.modalTitle}>{editingId ? '编辑流程' : '新增流程'}</div>

            <div style={S.formField}>
              <label style={S.formLabel}>流程名称 *</label>
              <input style={S.formInput} value={formData.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="例如: 订单同步Webhook" />
            </div>

            <div style={S.formRow}>
              <div style={{ flex: 1 }}>
                <label style={S.formLabel}>类型</label>
                <select style={S.formInput} value={formData.type} onChange={e => handleFormChange('type', e.target.value as FlowType)}>
                  {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.formLabel}>状态</label>
                <select style={S.formInput} value={formData.status} onChange={e => handleFormChange('status', e.target.value as FlowStatus)}>
                  <option value="active">运行中</option>
                  <option value="inactive">已停用</option>
                  <option value="error">异常</option>
                </select>
              </div>
            </div>

            <div style={S.formField}>
              <label style={S.formLabel}>描述</label>
              <input style={S.formInput} value={formData.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="流程描述" />
            </div>

            <div style={S.formRow}>
              <div style={{ flex: 1 }}>
                <label style={S.formLabel}>触发方式</label>
                <select style={S.formInput} value={formData.trigger} onChange={e => handleFormChange('trigger', e.target.value as TriggerType)}>
                  {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.formLabel}>端点地址</label>
                <input style={S.formInput} value={formData.endpoint} onChange={e => handleFormChange('endpoint', e.target.value)} placeholder="/webhook/xxx" />
              </div>
            </div>

            <div style={S.formField}>
              <label style={S.formLabel}>成功率（%）</label>
              <input style={S.formInput} type="number" min={0} max={100} value={formData.successRate} onChange={e => handleFormChange('successRate', Number(e.target.value))} />
            </div>

            <div style={S.formBtnRow}>
              <button style={btnGhost} onClick={closeModal}>取消</button>
              <button style={btnPrimary} onClick={handleSave}>{editingId ? '保存修改' : '确认新增'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
