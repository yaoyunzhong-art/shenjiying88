'use client'
import React, { useState, useMemo, useCallback } from 'react'
import { AdminPermissionGate } from '../../components/admin-permission-gate'

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

interface ToolItem {
  id: string
  name: string
  description: string
  riskLevel: string
  category: string
  parameters: string
}

interface ModalState {
  visible: boolean
  item: ToolItem | null
}

const SEED_TOOLS: ToolItem[] = [
  { id: 'tool-001', name: 'query_order', description: '查询订单详情，含状态、金额、物流信息', riskLevel: 'low', category: '数据查询', parameters: 'orderId: string' },
  { id: 'tool-002', name: 'refund_order', description: '执行订单退款操作，需用户确认', riskLevel: 'high', category: '资金操作', parameters: 'orderId: string, amount: number, reason: string' },
  { id: 'tool-003', name: 'update_inventory', description: '更新 SKU 库存数量', riskLevel: 'medium', category: '库存管理', parameters: 'sku: string, delta: number' },
  { id: 'tool-004', name: 'send_email', description: '发送邮件通知', riskLevel: 'low', category: '通知', parameters: 'to: string, subject: string, body: string' },
  { id: 'tool-005', name: 'create_coupon', description: '创建优惠券模板', riskLevel: 'medium', category: '营销', parameters: 'name: string, discount: number, expireAt: string' },
  { id: 'tool-006', name: 'approve_fulfillment', description: '审批通过履约流程', riskLevel: 'high', category: '履约', parameters: 'orderId: string, provider: string' },
  { id: 'tool-007', name: 'search_products', description: '搜索商品目录', riskLevel: 'low', category: '数据查询', parameters: 'query: string, limit: number' },
  { id: 'tool-008', name: 'cancel_shipment', description: '取消已发货物流单', riskLevel: 'high', category: '履约', parameters: 'shipmentId: string, reason: string' },
]

const RISK_COLORS: Record<string, string> = {
  low: '#2ed573',
  medium: '#ffa502',
  high: '#ff4757',
}

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const CATEGORY_OPTIONS = ['全部', '数据查询', '资金操作', '库存管理', '通知', '营销', '履约']

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Agent 工具注册中心访问受限',
  description:
    'Agent 工具注册中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看工具定义、风险等级与参数治理信息。',
} as const

export default function AgentToolsPage() {
  // 三态条件渲染
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)
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
  if (!SEED_TOOLS || SEED_TOOLS.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>暂无数据</div>
      </AdminPermissionGate>
    )
  }

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    let result = SEED_TOOLS
    if (categoryFilter) result = result.filter(t => t.category === categoryFilter)
    if (riskFilter) result = result.filter(t => t.riskLevel === riskFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, categoryFilter, riskFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_TOOLS.length,
    high: SEED_TOOLS.filter(t => t.riskLevel === 'high').length,
    medium: SEED_TOOLS.filter(t => t.riskLevel === 'medium').length,
    low: SEED_TOOLS.filter(t => t.riskLevel === 'low').length,
  }), [])

  const openModal = useCallback((item: ToolItem) => {
    setModal({ visible: true, item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, item: null })
  }, [])

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>Agent 工具注册中心</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>查看 Agent 可调用的工具定义、参数 schema 与风险等级，作为 runtime governance 与 tool risk gating 的依据。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>工具总数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ff4757' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>高风险</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4757' }}>{stats.high}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#ffa502' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>中风险</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa502' }}>{stats.medium}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>低风险</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.low}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={styles.input}
          placeholder="搜索工具名称 / 描述..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={{ ...styles.input, width: 130, cursor: 'pointer' }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c === '全部' ? '' : c}>{c}</option>)}
        </select>
        <select style={{ ...styles.input, width: 120, cursor: 'pointer' }} value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1) }}>
          <option value="">全部风险</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
        </select>
        <button style={styles.btn} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无匹配工具</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>当前筛选条件下没有已注册工具，请调整筛选条件。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>工具 ID</th>
                  <th style={styles.th}>名称</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>分类</th>
                  <th style={styles.th}>风险等级</th>
                  <th style={styles.th}>参数</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{item.id}</td>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.description}</td>
                    <td style={styles.td}>{item.category}</td>
                    <td style={styles.td}>
                      <span style={{ color: RISK_COLORS[item.riskLevel] ?? '#e0e0e0', fontWeight: 600 }}>{RISK_LABELS[item.riskLevel]}</span>
                    </td>
                    <td style={{ ...styles.td, fontSize: 13, fontFamily: 'monospace' }}>{item.parameters}</td>
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>工具详情</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ color: '#8892b0' }}>工具 ID：</span>{modal.item.id}</div>
              <div><span style={{ color: '#8892b0' }}>名称：</span>{modal.item.name}</div>
              <div><span style={{ color: '#8892b0' }}>描述：</span>{modal.item.description}</div>
              <div><span style={{ color: '#8892b0' }}>分类：</span>{modal.item.category}</div>
              <div><span style={{ color: '#8892b0' }}>风险等级：</span>{RISK_LABELS[modal.item.riskLevel]}</div>
              <div><span style={{ color: '#8892b0' }}>参数：</span><code style={{ background: '#16213e', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{modal.item.parameters}</code></div>
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
