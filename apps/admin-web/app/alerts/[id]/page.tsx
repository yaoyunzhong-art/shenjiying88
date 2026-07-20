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
  dangerBtn: { background: '#e63946', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' },
  modal: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#1a1a2e', borderRadius: '12px', padding: '24px', width: '500px', maxWidth: '90vw', border: '1px solid #2a2a3e' },
}

interface AlertItem {
  id: string
  title: string
  severity: string
  source: string
  status: string
  owner: string
  createdAt: string
}

interface ModalState {
  visible: boolean
  mode: 'view' | 'edit' | 'delete'
  item: AlertItem | null
}

const SEED_ALERTS: AlertItem[] = [
  { id: 'ALT-001', title: '支付网关超时率异常', severity: 'critical', source: 'payment-gateway', status: 'open', owner: '张三', createdAt: '2026-07-19 14:23' },
  { id: 'ALT-002', title: '库存同步失败超过阈值', severity: 'high', source: 'inventory-sync', status: 'acknowledged', owner: '李四', createdAt: '2026-07-19 12:10' },
  { id: 'ALT-003', title: '用户登录失败率上升', severity: 'high', source: 'auth-service', status: 'open', owner: '王五', createdAt: '2026-07-19 09:45' },
  { id: 'ALT-004', title: '订单履约延迟告警', severity: 'medium', source: 'fulfillment', status: 'muted', owner: '张三', createdAt: '2026-07-18 22:30' },
  { id: 'ALT-005', title: '缓存命中率低于50%', severity: 'low', source: 'cache-layer', status: 'open', owner: '', createdAt: '2026-07-18 18:00' },
  { id: 'ALT-006', title: '数据库连接池耗尽', severity: 'critical', source: 'database', status: 'resolved', owner: '赵六', createdAt: '2026-07-18 15:20' },
  { id: 'ALT-007', title: '消息队列积压超过1万', severity: 'high', source: 'message-queue', status: 'open', owner: '钱七', createdAt: '2026-07-17 11:05' },
  { id: 'ALT-008', title: 'CDN回源错误率升高', severity: 'medium', source: 'cdn', status: 'acknowledged', owner: '李四', createdAt: '2026-07-17 08:30' },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff4757',
  high: '#ffa502',
  medium: '#eccc68',
  low: '#7bed9f',
}

const STATUS_COLORS: Record<string, string> = {
  open: '#ff4757',
  acknowledged: '#ffa502',
  muted: '#57606f',
  resolved: '#2ed573',
}

export default function AlertDetailPage() {
  // 三态条件渲染
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, mode: 'view', item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  // 模拟数据加载完成
  useEffect(() => { setLoading(false) }, [])

  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!SEED_ALERTS || SEED_ALERTS.length === 0) return <div>暂无数据</div>;

  const filtered = useMemo(() => {
    if (!search.trim()) return SEED_ALERTS
    const q = search.toLowerCase()
    return SEED_ALERTS.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      a.owner.toLowerCase().includes(q)
    )
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const statCards = useMemo(() => ({
    total: SEED_ALERTS.length,
    critical: SEED_ALERTS.filter(a => a.severity === 'critical').length,
    open: SEED_ALERTS.filter(a => a.status === 'open').length,
    resolved: SEED_ALERTS.filter(a => a.status === 'resolved').length,
  }), [])

  const openModal = useCallback((mode: ModalState['mode'], item: AlertItem) => {
    setModal({ visible: true, mode, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, mode: 'view', item: null })
  }, [])

  return (
    <div style={styles.container}>
      {/* 标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>告警详情</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看和管理集群告警事件，支持确认、静默、归档等处置操作。</p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>告警总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{statCards.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#e63946' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>严重告警</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{statCards.critical}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ffa502' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>待处理</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{statCards.open}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已解决</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{statCards.resolved}</div>
        </div>
      </div>

      {/* 搜索条 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder="搜索告警 ID / 标题 / 来源 / 负责人..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {/* 空状态 */}
      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配告警</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>没有符合搜索条件的告警记录，请调整筛选条件或检查数据源。</div>
        </div>
      ) : (
        <>
          {/* 数据表格 */}
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>标题</th>
                  <th style={styles.th}>严重程度</th>
                  <th style={styles.th}>来源</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>负责人</th>
                  <th style={styles.th}>创建时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.title}</td>
                    <td style={styles.td}>
                      <span style={{ color: SEVERITY_COLORS[item.severity] ?? '#e0e0e0', fontWeight: 600 }}>
                        {item.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>{item.source}</td>
                    <td style={styles.td}>
                      <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0' }}>{item.status}</span>
                    </td>
                    <td style={styles.td}>{item.owner || '-'}</td>
                    <td style={{ ...styles.td, fontSize: 13, color: '#8892b0' }}>{item.createdAt}</td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => openModal('view', item)}>查看</button>
                      <button style={{ ...styles.btn, padding: '4px 10px', fontSize: 12, background: '#2ed573', marginRight: 6 }} onClick={() => openModal('edit', item)}>确认</button>
                      <button style={styles.dangerBtn} onClick={() => openModal('delete', item)}>静默</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
            <button disabled={page <= 1} style={{ ...styles.btn, opacity: page <= 1 ? 0.5 : 1 }} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</button>
            <span style={{ color: '#8892b0', fontSize: 14 }}>第 {page} / {totalPages} 页</span>
            <button disabled={page >= totalPages} style={{ ...styles.btn, opacity: page >= totalPages ? 0.5 : 1 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</button>
          </div>
        </>
      )}

      {/* Modal */}
      {modal.visible && modal.item && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {modal.mode === 'view' ? '告警详情' : modal.mode === 'edit' ? '确认告警' : '静默告警'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>ID：</span>{modal.item.id}</div>
              <div><span style={{ color: '#8892b0' }}>标题：</span>{modal.item.title}</div>
              <div><span style={{ color: '#8892b0' }}>严重程度：</span>{modal.item.severity}</div>
              <div><span style={{ color: '#8892b0' }}>来源：</span>{modal.item.source}</div>
              <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
              <div><span style={{ color: '#8892b0' }}>负责人：</span>{modal.item.owner || '未分配'}</div>
              <div><span style={{ color: '#8892b0' }}>创建时间：</span>{modal.item.createdAt}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>取消</button>
              <button onClick={() => { closeModal() }} style={styles.btn}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
