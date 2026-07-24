'use client'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'

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

interface RetryPolicyItem {
  key: string
  capability: string
  maxRetries: number
  backoff: string
  recoveryAction: string
  escalationTarget: string
  status: string
}

interface ModalState {
  visible: boolean
  mode: 'view' | 'edit' | 'delete'
  item: RetryPolicyItem | null
}

const SEED_POLICIES: RetryPolicyItem[] = [
  { key: 'payment.retry', capability: 'payment-gateway', maxRetries: 3, backoff: 'exponential(1s, 30s)', recoveryAction: 'reset_connection', escalationTarget: 'SRE-oncall', status: 'active' },
  { key: 'order.retry', capability: 'order-service', maxRetries: 2, backoff: 'linear(5s, 5s)', recoveryAction: 'retry_sync', escalationTarget: '订单小组', status: 'active' },
  { key: 'inventory.retry', capability: 'inventory-sync', maxRetries: 5, backoff: 'exponential(2s, 60s)', recoveryAction: 'clear_cache_and_retry', escalationTarget: '库存小组', status: 'active' },
  { key: 'auth.retry', capability: 'auth-service', maxRetries: 1, backoff: 'fixed(10s)', recoveryAction: 'refresh_token', escalationTarget: '安全团队', status: 'active' },
  { key: 'fulfillment.retry', capability: 'fulfillment', maxRetries: 3, backoff: 'exponential(1s, 15s)', recoveryAction: 're_enqueue', escalationTarget: '履约小组', status: 'paused' },
  { key: 'sms.retry', capability: 'notification-sms', maxRetries: 3, backoff: 'linear(1s, 5s)', recoveryAction: 'switch_provider', escalationTarget: '通知小组', status: 'active' },
  { key: 'email.retry', capability: 'notification-email', maxRetries: 2, backoff: 'fixed(30s)', recoveryAction: 'retry_send', escalationTarget: '通知小组', status: 'active' },
  { key: 'cdn.retry', capability: 'cdn-origin', maxRetries: 1, backoff: 'fixed(5s)', recoveryAction: 'fallback_to_secondary', escalationTarget: 'CDN 运维', status: 'inactive' },
]

const STATUS_COLORS: Record<string, string> = {
  active: '#2ed573',
  paused: '#ffa502',
  inactive: '#57606f',
}

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '重试策略详情访问受限',
  description:
    '重试策略详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看重试上限、退避策略、恢复动作与升级目标。',
} as const

export default function ResilienceRetryPolicyDetailPage() {
  // 三态条件渲染
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, mode: 'view', item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  useEffect(() => { setLoading(false) }, [])

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>加载中...</div>
      </AdminPermissionGate>
    )
  }
  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>数据获取失败: {error}</div>
      </AdminPermissionGate>
    )
  }
  if (!SEED_POLICIES || SEED_POLICIES.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>暂无数据</div>
      </AdminPermissionGate>
    )
  }

  const filtered = useMemo(() => {
    let result = SEED_POLICIES
    if (statusFilter) result = result.filter(p => p.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.key.toLowerCase().includes(q) ||
        p.capability.toLowerCase().includes(q) ||
        p.recoveryAction.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_POLICIES.length,
    active: SEED_POLICIES.filter(p => p.status === 'active').length,
    paused: SEED_POLICIES.filter(p => p.status === 'paused').length,
    avgMaxRetries: (SEED_POLICIES.reduce((s, p) => s + p.maxRetries, 0) / SEED_POLICIES.length).toFixed(1),
  }), [])

  const openModal = useCallback((mode: ModalState['mode'], item: RetryPolicyItem) => {
    setModal({ visible: true, mode, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, mode: 'view', item: null })
  }, [])

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.container}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>重试策略</h1>
          <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看重试上限、退避策略、恢复动作与升级目标。</p>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>策略总数</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{ ...styles.card, borderColor: '#2ed573' }}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>启用中</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.active}</div>
          </div>
          <div style={{ ...styles.card, borderColor: '#ffa502' }}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>暂停</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.paused}</div>
          </div>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>平均最大重试</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avgMaxRetries}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <input
            style={styles.input}
            placeholder="搜索策略 key / 能力 / 恢复动作..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select style={{ ...styles.input, width: 130, cursor: 'pointer' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="paused">暂停</option>
            <option value="inactive">停用</option>
          </select>
          <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
        </div>

        {paginated.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配策略</div>
            <div style={{ color: '#8892b0', fontSize: 14 }}>该策略 key 不在当前 resilience 范围内，请检查筛选条件。</div>
          </div>
        ) : (
          <>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>策略 Key</th>
                    <th style={styles.th}>能力</th>
                    <th style={styles.th}>最大重试</th>
                    <th style={styles.th}>退避策略</th>
                    <th style={styles.th}>恢复动作</th>
                    <th style={styles.th}>升级目标</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(item => (
                    <tr key={item.key}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.key}</td>
                      <td style={styles.td}>{item.capability}</td>
                      <td style={styles.td}>{item.maxRetries}</td>
                      <td style={{ ...styles.td, fontSize: 13 }}>{item.backoff}</td>
                      <td style={{ ...styles.td, fontSize: 13 }}>{item.recoveryAction}</td>
                      <td style={styles.td}>{item.escalationTarget}</td>
                      <td style={styles.td}>
                        <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                      </td>
                      <td style={styles.td}>
                        <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => openModal('view', item)}>查看</button>
                        <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12, background: '#2ed573', marginRight: 6 }} onClick={() => openModal('edit', item)}>编辑</button>
                        <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12, background: '#e63946' }} onClick={() => openModal('delete', item)}>删除</button>
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {modal.mode === 'view' ? '策略详情' : modal.mode === 'edit' ? '编辑策略' : '删除策略'}
                </h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span style={{ color: '#8892b0' }}>策略 Key：</span>{modal.item.key}</div>
                <div><span style={{ color: '#8892b0' }}>能力：</span>{modal.item.capability}</div>
                <div><span style={{ color: '#8892b0' }}>最大重试：</span>{modal.item.maxRetries}</div>
                <div><span style={{ color: '#8892b0' }}>退避策略：</span>{modal.item.backoff}</div>
                <div><span style={{ color: '#8892b0' }}>恢复动作：</span>{modal.item.recoveryAction}</div>
                <div><span style={{ color: '#8892b0' }}>升级目标：</span>{modal.item.escalationTarget}</div>
                <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
                {modal.mode === 'edit' && (
                  <div style={{ marginTop: 12 }}>
                    <input style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} defaultValue={`maxRetries=${modal.item.maxRetries}`} placeholder="修改参数..." />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>取消</button>
                <button onClick={() => { closeModal() }} style={styles.btn}>
                  {modal.mode === 'view' ? '关闭' : modal.mode === 'edit' ? '保存' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGate>
  )
}
