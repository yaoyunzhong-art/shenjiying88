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

interface IdempotencyRecordItem {
  key: string
  eventType: string
  payloadHash: string
  status: string
  envelopeId: string
  createdAt: string
  updatedAt: string
}

interface ModalState {
  visible: boolean
  item: IdempotencyRecordItem | null
}

const SEED_RECORDS: IdempotencyRecordItem[] = [
  { key: 'idem-001', eventType: 'OrderCreated', payloadHash: 'sha256:a1b2c3d4e5f678901234567890abcdef12345678', status: 'processed', envelopeId: 'env-001', createdAt: '2026-07-19 14:30:01', updatedAt: '2026-07-19 14:30:02' },
  { key: 'idem-002', eventType: 'PaymentSettled', payloadHash: 'sha256:b2c3d4e5f6a178901234567890abcdef12345679', status: 'processed', envelopeId: 'env-002', createdAt: '2026-07-19 14:29:55', updatedAt: '2026-07-19 14:29:56' },
  { key: 'idem-003', eventType: 'InventoryAdjusted', payloadHash: 'sha256:c3d4e5f6a1b278901234567890abcdef12345680', status: 'pending', envelopeId: 'env-003', createdAt: '2026-07-19 14:28:10', updatedAt: '2026-07-19 14:28:10' },
  { key: 'idem-004', eventType: 'RefundInitiated', payloadHash: 'sha256:d4e5f6a1b2c378901234567890abcdef12345681', status: 'failed', envelopeId: 'env-005', createdAt: '2026-07-19 14:20:45', updatedAt: '2026-07-19 14:20:50' },
  { key: 'idem-005', eventType: 'PriceUpdated', payloadHash: 'sha256:e5f6a1b2c3d478901234567890abcdef12345682', status: 'pending', envelopeId: 'env-007', createdAt: '2026-07-19 13:50:00', updatedAt: '2026-07-19 13:50:00' },
  { key: 'idem-006', eventType: 'UserRegistered', payloadHash: 'sha256:f6a1b2c3d4e578901234567890abcdef12345683', status: 'processed', envelopeId: 'env-006', createdAt: '2026-07-19 14:15:30', updatedAt: '2026-07-19 14:15:31' },
  { key: 'idem-007', eventType: 'ShipmentDispatched', payloadHash: 'sha256:a1b2f6a1b2c378901234567890abcdef12345684', status: 'processed', envelopeId: 'env-004', createdAt: '2026-07-19 14:25:00', updatedAt: '2026-07-19 14:25:01' },
  { key: 'idem-008', eventType: 'StockAlertTriggered', payloadHash: 'sha256:b2c3f6a1b2c378901234567890abcdef12345685', status: 'processed', envelopeId: 'env-008', createdAt: '2026-07-19 12:00:00', updatedAt: '2026-07-19 12:00:01' },
]

const STATUS_COLORS: Record<string, string> = {
  processed: '#2ed573',
  pending: '#ffa502',
  failed: '#ff4757',
}

const EVENT_TYPE_OPTIONS = ['全部', 'OrderCreated', 'PaymentSettled', 'InventoryAdjusted', 'RefundInitiated', 'PriceUpdated', 'UserRegistered', 'ShipmentDispatched', 'StockAlertTriggered']

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '幂等记录访问受限',
  description:
    '幂等记录详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看幂等键、Payload 校验和、处理状态与关联信封。',
} as const;

export default function IntegrationOrchestrationIdempotencyDetailPage() {
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 6

  useEffect(() => {
    setLoading(true)
    setError(null)
    queueMicrotask(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#8892b0' }}>
            <div style={{ fontSize: 14 }}>加载中...</div>
          </div>
        </div>
      </AdminPermissionGate>
    )
  }

  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#ff4757' }}>
            <div style={{ fontSize: 14 }}>错误: {error}</div>
          </div>
        </div>
      </AdminPermissionGate>
    )
  }

  const filtered = useMemo(() => {
    let result = SEED_RECORDS
    if (eventTypeFilter) result = result.filter(r => r.eventType === eventTypeFilter)
    if (statusFilter) result = result.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.key.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.envelopeId.toLowerCase().includes(q) ||
        r.payloadHash.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, eventTypeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_RECORDS.length,
    processed: SEED_RECORDS.filter(r => r.status === 'processed').length,
    pending: SEED_RECORDS.filter(r => r.status === 'pending').length,
    failed: SEED_RECORDS.filter(r => r.status === 'failed').length,
  }), [])

  const openModal = useCallback((item: IdempotencyRecordItem) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.container}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>幂等记录：{search || '全部记录'}</h1>
          <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看幂等记录元数据、payload 校验和与对应事件信封。</p>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>记录总数</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{ ...styles.card, borderColor: '#2ed573' }}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已处理</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.processed}</div>
          </div>
          <div style={{ ...styles.card, borderColor: '#ffa502' }}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>待处理</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.pending}</div>
          </div>
          <div style={{ ...styles.card, borderColor: '#ff4757' }}>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>处理失败</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.failed}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={styles.input}
            placeholder="搜索幂等 key / 事件类型 / 信封 ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select style={{ ...styles.input, width: 160, cursor: 'pointer' }} value={eventTypeFilter} onChange={e => { setEventTypeFilter(e.target.value); setPage(1) }}>
            {EVENT_TYPE_OPTIONS.map(et => <option key={et} value={et === '全部' ? '' : et}>{et}</option>)}
          </select>
          <select style={{ ...styles.input, width: 120, cursor: 'pointer' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">全部状态</option>
            <option value="processed">已处理</option>
            <option value="pending">待处理</option>
            <option value="failed">失败</option>
          </select>
          <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
        </div>

        {paginated.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配幂等记录</div>
            <div style={{ color: '#8892b0', fontSize: 14 }}>该幂等键未在当前范围内出现，可能事件已归档或上游未触发。</div>
          </div>
        ) : (
          <>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>幂等 Key</th>
                    <th style={styles.th}>事件类型</th>
                    <th style={styles.th}>Payload 校验和</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>关联信封</th>
                    <th style={styles.th}>创建时间</th>
                    <th style={styles.th}>更新时间</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(item => (
                    <tr key={item.key}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.key}</td>
                      <td style={styles.td}>{item.eventType}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: '#8892b0' }}>
                        {item.payloadHash.slice(0, 20)}...
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.envelopeId}</td>
                      <td style={styles.td}>{item.createdAt}</td>
                      <td style={styles.td}>{item.updatedAt}</td>
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>幂等记录详情</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span style={{ color: '#8892b0' }}>幂等 Key：</span>{modal.item.key}</div>
                <div><span style={{ color: '#8892b0' }}>事件类型：</span>{modal.item.eventType}</div>
                <div><span style={{ color: '#8892b0' }}>Payload 校验和：</span><code style={{ background: '#16213e', padding: '2px 6px', borderRadius: 4, fontSize: 13, wordBreak: 'break-all' }}>{modal.item.payloadHash}</code></div>
                <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
                <div><span style={{ color: '#8892b0' }}>关联信封：</span>{modal.item.envelopeId}</div>
                <div><span style={{ color: '#8892b0' }}>创建时间：</span>{modal.item.createdAt}</div>
                <div><span style={{ color: '#8892b0' }}>更新时间：</span>{modal.item.updatedAt}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>关闭</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGate>
  )
}
