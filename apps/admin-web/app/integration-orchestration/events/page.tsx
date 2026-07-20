'use client'
import React, { useState, useMemo, useCallback, useEffect } from 'react'

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh' },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px' },
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' },
  select: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' },
  modal: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#1a1a2e', borderRadius: '12px', padding: '24px', width: '600px', maxWidth: '90vw', border: '1px solid #2a2a3e' },
}

interface EventEnvelope {
  envelopeId: string
  eventName: string
  source: string
  status: string
  retryCount: number
  createdAt: string
}

interface ModalState {
  visible: boolean
  item: EventEnvelope | null
}

const SEED_EVENTS: EventEnvelope[] = [
  { envelopeId: 'env-001', eventName: 'OrderCreated', source: 'order-service', status: 'delivered', retryCount: 0, createdAt: '2026-07-19 14:30:01' },
  { envelopeId: 'env-002', eventName: 'PaymentSettled', source: 'payment-gateway', status: 'delivered', retryCount: 0, createdAt: '2026-07-19 14:29:55' },
  { envelopeId: 'env-003', eventName: 'InventoryAdjusted', source: 'inventory-sync', status: 'pending', retryCount: 2, createdAt: '2026-07-19 14:28:10' },
  { envelopeId: 'env-004', eventName: 'ShipmentDispatched', source: 'fulfillment', status: 'delivered', retryCount: 0, createdAt: '2026-07-19 14:25:00' },
  { envelopeId: 'env-005', eventName: 'RefundInitiated', source: 'payment-gateway', status: 'failed', retryCount: 3, createdAt: '2026-07-19 14:20:45' },
  { envelopeId: 'env-006', eventName: 'UserRegistered', source: 'auth-service', status: 'delivered', retryCount: 0, createdAt: '2026-07-19 14:15:30' },
  { envelopeId: 'env-007', eventName: 'PriceUpdated', source: 'pricing-engine', status: 'pending', retryCount: 1, createdAt: '2026-07-19 13:50:00' },
  { envelopeId: 'env-008', eventName: 'StockAlertTriggered', source: 'inventory-sync', status: 'delivered', retryCount: 0, createdAt: '2026-07-19 12:00:00' },
]

const STATUS_COLORS: Record<string, string> = {
  delivered: '#2ed573',
  pending: '#ffa502',
  failed: '#ff4757',
}

export default function IntegrationOrchestrationEventsPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
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
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#8892b0' }}>
          <div style={{ fontSize: 14 }}>加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#ff4757' }}>
          <div style={{ fontSize: 14 }}>错误: {error}</div>
        </div>
      </div>
    )
  }

  const sources = useMemo(() => [...new Set(SEED_EVENTS.map(e => e.source))].sort(), [])

  const filtered = useMemo(() => {
    let result = SEED_EVENTS
    if (sourceFilter) result = result.filter(e => e.source === sourceFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.envelopeId.toLowerCase().includes(q) ||
        e.eventName.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, sourceFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_EVENTS.length,
    delivered: SEED_EVENTS.filter(e => e.status === 'delivered').length,
    failed: SEED_EVENTS.filter(e => e.status === 'failed').length,
    totalRetries: SEED_EVENTS.reduce((s, e) => s + e.retryCount, 0),
  }), [])

  const openModal = useCallback((item: EventEnvelope) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>事件信封列表</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看所有 domain event / webhook envelope，支持按来源筛选。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>事件总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已投递</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.delivered}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ff4757' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>投递失败</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.failed}</div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>累计重试次数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalRetries}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder="搜索事件 ID / 名称 / 来源..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={styles.select} value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }}>
          <option value="">全部来源</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📨</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配事件</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>当前筛选条件下没有事件信封记录，请调整筛选条件。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>信封 ID</th>
                  <th style={styles.th}>事件名称</th>
                  <th style={styles.th}>来源</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>重试次数</th>
                  <th style={styles.th}>创建时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.envelopeId}>
                    <td style={styles.td}>{item.envelopeId}</td>
                    <td style={styles.td}>{item.eventName}</td>
                    <td style={styles.td}>{item.source}</td>
                    <td style={styles.td}>
                      <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                    </td>
                    <td style={styles.td}>{item.retryCount}</td>
                    <td style={styles.td}>{item.createdAt}</td>
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>事件信封详情</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>信封 ID：</span>{modal.item.envelopeId}</div>
              <div><span style={{ color: '#8892b0' }}>事件名称：</span>{modal.item.eventName}</div>
              <div><span style={{ color: '#8892b0' }}>来源：</span>{modal.item.source}</div>
              <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
              <div><span style={{ color: '#8892b0' }}>重试次数：</span>{modal.item.retryCount}</div>
              <div><span style={{ color: '#8892b0' }}>创建时间：</span>{modal.item.createdAt}</div>
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
