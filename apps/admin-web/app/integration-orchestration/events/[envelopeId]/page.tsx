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

interface EnvelopeDetailItem {
  field: string
  value: string
}

interface IdempotencyRecord {
  key: string
  eventType: string
  hash: string
  status: string
  envelopeId: string
  createdAt: string
}

interface ModalState {
  visible: boolean
  item: EnvelopeDetailItem | IdempotencyRecord | null
  itemType: 'field' | 'idempotency'
}

const SEED_FIELDS: EnvelopeDetailItem[] = [
  { field: 'envelopeId', value: 'env-001' },
  { field: 'eventName', value: 'OrderCreated' },
  { field: 'source', value: 'order-service' },
  { field: 'eventVersion', value: 'v1.2' },
  { field: 'tenantId', value: 'tenant-demo' },
  { field: 'traceId', value: 'trace-abc-123-def-456' },
  { field: 'status', value: 'delivered' },
  { field: 'retryCount', value: '0' },
]

const SEED_IDEMPOTENCY_RECORDS: IdempotencyRecord[] = [
  { key: 'idem-001', eventType: 'OrderCreated', hash: 'a1b2c3d4e5f6...', status: 'processed', envelopeId: 'env-001', createdAt: '2026-07-19 14:30:01' },
  { key: 'idem-002', eventType: 'PaymentSettled', hash: 'b2c3d4e5f6a1...', status: 'processed', envelopeId: 'env-002', createdAt: '2026-07-19 14:29:55' },
  { key: 'idem-003', eventType: 'InventoryAdjusted', hash: 'c3d4e5f6a1b2...', status: 'pending', envelopeId: 'env-003', createdAt: '2026-07-19 14:28:10' },
  { key: 'idem-004', eventType: 'RefundInitiated', hash: 'd4e5f6a1b2c3...', status: 'failed', envelopeId: 'env-005', createdAt: '2026-07-19 14:20:45' },
  { key: 'idem-005', eventType: 'PriceUpdated', hash: 'e5f6a1b2c3d4...', status: 'pending', envelopeId: 'env-007', createdAt: '2026-07-19 13:50:00' },
  { key: 'idem-006', eventType: 'UserRegistered', hash: 'f6a1b2c3d4e5...', status: 'processed', envelopeId: 'env-006', createdAt: '2026-07-19 14:15:30' },
]

const IDEM_STATUS_COLORS: Record<string, string> = {
  processed: '#2ed573',
  pending: '#ffa502',
  failed: '#ff4757',
}

export default function IntegrationOrchestrationEventDetailPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null, itemType: 'field' })
  const [page, setPage] = useState(1)
  const pageSize = 6
  const [activeTab, setActiveTab] = useState<'fields' | 'idempotency'>('fields')

  const filteredIdempotency = useMemo(() => {
    let result = SEED_IDEMPOTENCY_RECORDS
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.key.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.envelopeId.toLowerCase().includes(q)
      )
    }
    return result
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredIdempotency.length / pageSize))
  const paginated = filteredIdempotency.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_FIELDS.length,
    processed: SEED_IDEMPOTENCY_RECORDS.filter(r => r.status === 'processed').length,
    failed: SEED_IDEMPOTENCY_RECORDS.filter(r => r.status === 'failed').length,
    pending: SEED_IDEMPOTENCY_RECORDS.filter(r => r.status === 'pending').length,
  }), [])

  const openFieldModal = useCallback((item: EnvelopeDetailItem) => {
    setModal({ visible: true, item, itemType: 'field' })
  }, [])

  const openIdemModal = useCallback((item: IdempotencyRecord) => {
    setModal({ visible: true, item, itemType: 'idempotency' })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null, itemType: 'field' })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>事件信封：env-001</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看 envelope 详细字段、payload 与相关幂等记录。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>字段总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已处理幂等</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.processed}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ffa502' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>待处理</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.pending}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ff4757' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>失败</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.failed}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          style={{ ...styles.btn, background: activeTab === 'fields' ? '#4361ee' : '#2a2a3e' }}
          onClick={() => { setActiveTab('fields'); setPage(1) }}
        >
          字段详情
        </button>
        <button
          style={{ ...styles.btn, background: activeTab === 'idempotency' ? '#4361ee' : '#2a2a3e' }}
          onClick={() => { setActiveTab('idempotency'); setPage(1) }}
        >
          幂等记录
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder={activeTab === 'fields' ? '搜索字段名...' : '搜索幂等 key / 事件类型...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {activeTab === 'fields' && (
        <div style={styles.card}>
          {SEED_FIELDS.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#8892b0' }}>无可用字段信息</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>字段</th>
                  <th style={styles.th}>值</th>
                </tr>
              </thead>
              <tbody>
                {SEED_FIELDS.map((item, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{item.field}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'idempotency' && (
        <>
          {paginated.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配幂等记录</div>
              <div style={{ color: '#8892b0', fontSize: 14 }}>该 envelope 下暂无相关幂等记录，可能事件已归档。</div>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>幂等 Key</th>
                      <th style={styles.th}>事件类型</th>
                      <th style={styles.th}>校验和（前12位）</th>
                      <th style={styles.th}>状态</th>
                      <th style={styles.th}>关联信封</th>
                      <th style={styles.th}>创建时间</th>
                      <th style={styles.th}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(item => (
                      <tr key={item.key}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.key}</td>
                        <td style={styles.td}>{item.eventType}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.hash}</td>
                        <td style={styles.td}>
                          <span style={{ color: IDEM_STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                        </td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.envelopeId}</td>
                        <td style={styles.td}>{item.createdAt}</td>
                        <td style={styles.td}>
                          <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12 }} onClick={() => openIdemModal(item)}>查看</button>
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
        </>
      )}

      {modal.visible && modal.item && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {modal.itemType === 'field' ? '字段详情' : '幂等记录详情'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            {modal.itemType === 'field' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span style={{ color: '#8892b0' }}>字段名：</span>{(modal.item as EnvelopeDetailItem).field}</div>
                <div><span style={{ color: '#8892b0' }}>值：</span>{(modal.item as EnvelopeDetailItem).value}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span style={{ color: '#8892b0' }}>幂等 Key：</span>{(modal.item as IdempotencyRecord).key}</div>
                <div><span style={{ color: '#8892b0' }}>事件类型：</span>{(modal.item as IdempotencyRecord).eventType}</div>
                <div><span style={{ color: '#8892b0' }}>校验和：</span>{(modal.item as IdempotencyRecord).hash}</div>
                <div><span style={{ color: '#8892b0' }}>状态：</span>{(modal.item as IdempotencyRecord).status}</div>
                <div><span style={{ color: '#8892b0' }}>关联信封：</span>{(modal.item as IdempotencyRecord).envelopeId}</div>
                <div><span style={{ color: '#8892b0' }}>创建时间：</span>{(modal.item as IdempotencyRecord).createdAt}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
