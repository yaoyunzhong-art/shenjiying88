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

interface SignalItem {
  signal: string
  description: string
  coverage: string
  lag: string
  owner: string
  route: string
  status: string
}

interface ModalState {
  visible: boolean
  item: SignalItem | null
}

const SEED_SIGNALS: SignalItem[] = [
  { signal: 'payment.avg_latency', description: '支付网关平均延迟', coverage: '98.5%', lag: '1.2s', owner: '张三', route: 'slack:payments-alerts', status: 'healthy' },
  { signal: 'order.throughput', description: '订单处理吞吐量', coverage: '97.2%', lag: '0.8s', owner: '李四', route: 'pagerduty:orders', status: 'healthy' },
  { signal: 'inventory.sync_lag', description: '库存同步滞后时间', coverage: '85.0%', lag: '5.3s', owner: '王五', route: 'email:ops@domain.com', status: 'degraded' },
  { signal: 'auth.login_failure_rate', description: '登录失败率', coverage: '99.1%', lag: '0.3s', owner: '赵六', route: 'slack:auth-alerts', status: 'healthy' },
  { signal: 'fulfillment.sla_breach', description: '履约 SLA 违约率', coverage: '92.8%', lag: '2.1s', owner: '钱七', route: 'pagerduty:fulfillment', status: 'healthy' },
  { signal: 'cache.hit_ratio', description: '缓存命中率', coverage: '76.3%', lag: '3.7s', owner: '张三', route: 'slack:infra-alerts', status: 'degraded' },
  { signal: 'queue.backlog_depth', description: '消息队列积压深度', coverage: '88.9%', lag: '4.5s', owner: '孙八', route: 'email:ops@domain.com', status: 'critical' },
  { signal: 'cdn.error_rate', description: 'CDN 回源错误率', coverage: '95.5%', lag: '1.0s', owner: '周九', route: 'slack:cdn-alerts', status: 'healthy' },
]

const STATUS_COLORS: Record<string, string> = {
  healthy: '#2ed573',
  degraded: '#ffa502',
  critical: '#ff4757',
}

export default function ResilienceSignalDetailPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    let result = SEED_SIGNALS
    if (statusFilter) result = result.filter(s => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.signal.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_SIGNALS.length,
    healthy: SEED_SIGNALS.filter(s => s.status === 'healthy').length,
    degraded: SEED_SIGNALS.filter(s => s.status === 'degraded').length,
    critical: SEED_SIGNALS.filter(s => s.status === 'critical').length,
  }), [])

  const openModal = useCallback((item: SignalItem) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>可观测信号：{search || '全部信号'}</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看信号的覆盖率、采集滞后、负责人与告警路由。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>信号总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>健康</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.healthy}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ffa502' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>降级</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.degraded}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ff4757' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>严重</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.critical}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder="搜索信号名称 / 描述 / 负责人..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={{ ...styles.input, width: 140, cursor: 'pointer' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">全部状态</option>
          <option value="healthy">健康</option>
          <option value="degraded">降级</option>
          <option value="critical">严重</option>
        </select>
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配信号</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>该信号不在当前 resilience 范围内，可能未配置或已下线。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>信号名称</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>覆盖率</th>
                  <th style={styles.th}>滞后时间</th>
                  <th style={styles.th}>负责人</th>
                  <th style={styles.th}>告警路由</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.signal}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.signal}</td>
                    <td style={styles.td}>{item.description}</td>
                    <td style={styles.td}>{item.coverage}</td>
                    <td style={styles.td}>{item.lag}</td>
                    <td style={styles.td}>{item.owner}</td>
                    <td style={{ ...styles.td, fontSize: 13, color: '#8892b0' }}>{item.route}</td>
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>信号详情</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>信号名称：</span>{modal.item.signal}</div>
              <div><span style={{ color: '#8892b0' }}>描述：</span>{modal.item.description}</div>
              <div><span style={{ color: '#8892b0' }}>覆盖率：</span>{modal.item.coverage}</div>
              <div><span style={{ color: '#8892b0' }}>滞后时间：</span>{modal.item.lag}</div>
              <div><span style={{ color: '#8892b0' }}>负责人：</span>{modal.item.owner}</div>
              <div><span style={{ color: '#8892b0' }}>告警路由：</span>{modal.item.route}</div>
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
