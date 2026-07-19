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

interface SessionItem {
  id: string
  agentName: string
  status: string
  userInput: string
  currentStep: number
  totalSteps: number
  duration: string
  createdAt: string
}

interface ModalState {
  visible: boolean
  item: SessionItem | null
}

const SEED_SESSIONS: SessionItem[] = [
  { id: 'sess-001', agentName: '客服助手', status: 'completed', userInput: '查询订单 ORD-20260719001 的状态', currentStep: 3, totalSteps: 3, duration: '4.2s', createdAt: '2026-07-19 14:30:00' },
  { id: 'sess-002', agentName: '订单处理 Agent', status: 'running', userInput: '为订单 ORD-20260719002 执行退款流程', currentStep: 2, totalSteps: 5, duration: '12.5s', createdAt: '2026-07-19 14:29:55' },
  { id: 'sess-003', agentName: '库存同步 Agent', status: 'completed', userInput: '检查 SKU-1002 的当前库存', currentStep: 2, totalSteps: 2, duration: '2.1s', createdAt: '2026-07-19 14:28:10' },
  { id: 'sess-004', agentName: '数据清洗 Agent', status: 'failed', userInput: '清洗 customer_profiles 表中的重复数据', currentStep: 4, totalSteps: 6, duration: '45.0s', createdAt: '2026-07-19 14:25:00' },
  { id: 'sess-005', agentName: '内容审核 Agent', status: 'completed', userInput: '审核商品描述：新款运动鞋', currentStep: 2, totalSteps: 2, duration: '1.8s', createdAt: '2026-07-19 14:20:45' },
  { id: 'sess-006', agentName: '告警分类 Agent', status: 'running', userInput: '分析 ALT-005 告警并分类', currentStep: 1, totalSteps: 3, duration: '5.3s', createdAt: '2026-07-19 14:15:30' },
  { id: 'sess-007', agentName: '决策推演 Agent', status: 'pending', userInput: '模拟促销活动对库存的影响', currentStep: 0, totalSteps: 10, duration: '0.0s', createdAt: '2026-07-19 14:10:00' },
  { id: 'sess-008', agentName: '报表生成 Agent', status: 'completed', userInput: '生成昨日销售报表', currentStep: 5, totalSteps: 5, duration: '18.3s', createdAt: '2026-07-19 13:50:00' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: '#2ed573',
  running: '#ffa502',
  failed: '#ff4757',
  pending: '#57606f',
}

const STATUS_OPTIONS = ['全部', 'completed', 'running', 'failed', 'pending']

export default function AgentSessionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    let result = SEED_SESSIONS
    if (statusFilter) result = result.filter(s => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.agentName.toLowerCase().includes(q) ||
        s.userInput.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_SESSIONS.length,
    running: SEED_SESSIONS.filter(s => s.status === 'running').length,
    completed: SEED_SESSIONS.filter(s => s.status === 'completed').length,
    failed: SEED_SESSIONS.filter(s => s.status === 'failed').length,
    avgDuration: (SEED_SESSIONS
      .filter(s => s.status === 'completed' || s.status === 'failed')
      .reduce((sum, s) => sum + parseFloat(s.duration.replace('s', '')), 0) /
      Math.max(1, SEED_SESSIONS.filter(s => s.status === 'completed' || s.status === 'failed').length)
    ).toFixed(1),
  }), [])

  const openModal = useCallback((item: SessionItem) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>Agent 会话追踪</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看 ReAct Agent 会话的实时状态、用户输入、当前步数与最终输出，作为会话级可观测面板。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>总会话</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ffa502' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>运行中</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.running}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已完成</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.completed}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ff4757' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>失败</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.failed}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          style={styles.input}
          placeholder="搜索会话 ID / Agent / 输入..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={{ ...styles.input, width: 130, cursor: 'pointer' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s === '全部' ? '' : s}>{s}</option>)}
        </select>
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无会话记录</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>当前没有符合筛选条件的 Agent 会话记录。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>会话 ID</th>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>用户输入</th>
                  <th style={styles.th}>步数</th>
                  <th style={styles.th}>耗时</th>
                  <th style={styles.th}>创建时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.id}</td>
                    <td style={styles.td}>{item.agentName}</td>
                    <td style={styles.td}>
                      <span style={{ color: STATUS_COLORS[item.status] ?? '#e0e0e0', fontWeight: 600 }}>{item.status}</span>
                    </td>
                    <td style={styles.td}>{item.userInput}</td>
                    <td style={styles.td}>{item.currentStep} / {item.totalSteps}</td>
                    <td style={styles.td}>{item.duration}</td>
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>会话详情</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>会话 ID：</span>{modal.item.id}</div>
              <div><span style={{ color: '#8892b0' }}>Agent：</span>{modal.item.agentName}</div>
              <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
              <div><span style={{ color: '#8892b0' }}>用户输入：</span>{modal.item.userInput}</div>
              <div><span style={{ color: '#8892b0' }}>步数进度：</span>{modal.item.currentStep} / {modal.item.totalSteps}</div>
              <div><span style={{ color: '#8892b0' }}>耗时：</span>{modal.item.duration}</div>
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
