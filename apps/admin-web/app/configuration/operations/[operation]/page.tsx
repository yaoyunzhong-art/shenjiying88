'use client'
import React, { useState, useMemo, useCallback } from 'react'

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh' },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px' },
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' },
  modal: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#1a1a2e', borderRadius: '12px', padding: '24px', width: '500px', maxWidth: '90vw', border: '1px solid #2a2a3e' },
}

interface OperationItem {
  operation: string
  displayName: string
  rbacRoles: string
  approvalRequired: string
  auditLevel: string
  status: string
  module: string
}

interface ModalState {
  visible: boolean
  item: OperationItem | null
}

const SEED_OPERATIONS: OperationItem[] = [
  { operation: 'order.refund', displayName: '订单退款', rbacRoles: 'admin,finance_ops', approvalRequired: '>= 1000 元', auditLevel: 'full', status: 'active', module: 'order-service' },
  { operation: 'inventory.adjust', displayName: '库存调整', rbacRoles: 'admin,warehouse_mgr', approvalRequired: '>= 100 件', auditLevel: 'summary', status: 'active', module: 'inventory-sync' },
  { operation: 'payment.manual_capture', displayName: '手动收款', rbacRoles: 'admin,finance_ops', approvalRequired: '始终需要', auditLevel: 'full', status: 'active', module: 'payment-gateway' },
  { operation: 'user.deactivate', displayName: '停用用户', rbacRoles: 'admin', approvalRequired: '始终需要', auditLevel: 'full', status: 'active', module: 'auth-service' },
  { operation: 'coupon.create', displayName: '创建优惠券', rbacRoles: 'admin,marketing', approvalRequired: '>= 50% 折扣', auditLevel: 'summary', status: 'active', module: 'campaign-rules' },
  { operation: 'fulfillment.reassign', displayName: '重新分配履约', rbacRoles: 'admin,fulfillment_mgr', approvalRequired: '始终需要', auditLevel: 'full', status: 'paused', module: 'fulfillment' },
  { operation: 'price.override', displayName: '价格覆盖', rbacRoles: 'admin,pricing_mgr', approvalRequired: '>= 20% 变更', auditLevel: 'full', status: 'active', module: 'pricing-engine' },
  { operation: 'config.edit', displayName: '修改配置', rbacRoles: 'admin,devops', approvalRequired: '生产环境需要', auditLevel: 'full', status: 'active', module: 'configuration-governance' },
]

const STATUS_COLORS: Record<string, string> = {
  active: '#2ed573',
  paused: '#ffa502',
  deprecated: '#57606f',
}

const MODULE_OPTIONS = ['全部', 'order-service', 'inventory-sync', 'payment-gateway', 'auth-service', 'campaign-rules', 'fulfillment', 'pricing-engine', 'configuration-governance']

export default function ConfigurationOperationDetailPage() {
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  // 三态条件渲染
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)
  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!SEED_OPERATIONS || SEED_OPERATIONS.length === 0) return <div>暂无数据</div>;

  const filtered = useMemo(() => {
    let result = SEED_OPERATIONS
    if (moduleFilter) result = result.filter(o => o.module === moduleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.operation.toLowerCase().includes(q) ||
        o.displayName.toLowerCase().includes(q) ||
        o.module.toLowerCase().includes(q) ||
        o.rbacRoles.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, moduleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_OPERATIONS.length,
    active: SEED_OPERATIONS.filter(o => o.status === 'active').length,
    fullAudit: SEED_OPERATIONS.filter(o => o.auditLevel === 'full').length,
    approvalRequired: SEED_OPERATIONS.filter(o => o.approvalRequired !== '无').length,
  }), [])

  const openModal = useCallback((item: OperationItem) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>配置操作边界</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看单一操作的 RBAC 与审批边界，并深链到治理审批/审计/Foundation 上下文。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>操作总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>启用中</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.active}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#4361ee' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>需审批</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#4361ee' }}>{stats.approvalRequired}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#e63946' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>全量审计</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e63946' }}>{stats.fullAudit}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder="搜索操作名 / 模块 / 角色..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={{ ...styles.input, width: 180, cursor: 'pointer' }} value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1) }}>
          {MODULE_OPTIONS.map(m => <option key={m} value={m === '全部' ? '' : m}>{m}</option>)}
        </select>
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配操作</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>该操作未在 configuration-governance 元数据中注册，可能已下线或拼写错误。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>操作标识</th>
                  <th style={styles.th}>显示名称</th>
                  <th style={styles.th}>所属模块</th>
                  <th style={styles.th}>RBAC 角色</th>
                  <th style={styles.th}>审批条件</th>
                  <th style={styles.th}>审计等级</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.operation}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.operation}</td>
                    <td style={styles.td}>{item.displayName}</td>
                    <td style={styles.td}>{item.module}</td>
                    <td style={styles.td}>{item.rbacRoles}</td>
                    <td style={styles.td}>{item.approvalRequired}</td>
                    <td style={styles.td}>{item.auditLevel}</td>
                    <td style={styles.td}>
                      <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                    </td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12 }} onClick={() => openModal(item)}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
            <button disabled={page <= 1} style={{ ...styles.btn, opacity: page <= 1 ? 0.5 : 1 }} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</button>
            <span style={{ color: '#8892b0', fontSize: 14 }}>第 {page} / {totalPages} 页</span>
            <button disabled={page >= totalPages} style={{ ...styles.btn, opacity: page >= totalPages ? 0.5 : 1 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</button>
          </div>
        </>
      )}

      {modal.visible && modal.item && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>操作边界详情</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>操作标识：</span>{modal.item.operation}</div>
              <div><span style={{ color: '#8892b0' }}>显示名称：</span>{modal.item.displayName}</div>
              <div><span style={{ color: '#8892b0' }}>所属模块：</span>{modal.item.module}</div>
              <div><span style={{ color: '#8892b0' }}>RBAC 角色：</span>{modal.item.rbacRoles}</div>
              <div><span style={{ color: '#8892b0' }}>审批条件：</span>{modal.item.approvalRequired}</div>
              <div><span style={{ color: '#8892b0' }}>审计等级：</span>{modal.item.auditLevel}</div>
              <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
