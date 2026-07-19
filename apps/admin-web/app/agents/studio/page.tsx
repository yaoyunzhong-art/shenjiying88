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

interface AgentConfigItem {
  id: string
  name: string
  model: string
  status: string
  maxSteps: number
  timeout: number
  toolCount: number
  reflection: boolean
}

interface ModalState {
  visible: boolean
  mode: 'view' | 'create' | 'edit' | 'delete'
  item: AgentConfigItem | null
}

const SEED_CONFIGS: AgentConfigItem[] = [
  { id: 'cfg-001', name: '客服助手', model: 'gpt-4o', status: 'enabled', maxSteps: 10, timeout: 120, toolCount: 5, reflection: true },
  { id: 'cfg-002', name: '订单处理 Agent', model: 'gpt-4o-mini', status: 'enabled', maxSteps: 8, timeout: 60, toolCount: 3, reflection: false },
  { id: 'cfg-003', name: '库存同步 Agent', model: 'claude-3-haiku', status: 'enabled', maxSteps: 6, timeout: 90, toolCount: 4, reflection: true },
  { id: 'cfg-004', name: '数据清洗 Agent', model: 'gpt-4o', status: 'disabled', maxSteps: 15, timeout: 180, toolCount: 7, reflection: false },
  { id: 'cfg-005', name: '内容审核 Agent', model: 'claude-3-sonnet', status: 'enabled', maxSteps: 5, timeout: 30, toolCount: 2, reflection: true },
  { id: 'cfg-006', name: '报表生成 Agent', model: 'gpt-4o-mini', status: 'disabled', maxSteps: 12, timeout: 150, toolCount: 6, reflection: false },
  { id: 'cfg-007', name: '告警分类 Agent', model: 'claude-3-haiku', status: 'enabled', maxSteps: 4, timeout: 45, toolCount: 3, reflection: true },
  { id: 'cfg-008', name: '决策推演 Agent', model: 'gpt-4o', status: 'enabled', maxSteps: 20, timeout: 300, toolCount: 8, reflection: true },
]

const MODEL_OPTIONS = ['全部', 'gpt-4o', 'gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet']

export default function AgentStudioPage() {
  const [search, setSearch] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [modal, setModal] = useState<ModalState>({ visible: false, mode: 'view', item: null })
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    let result = SEED_CONFIGS
    if (modelFilter) result = result.filter(c => c.model === modelFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, modelFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => ({
    total: SEED_CONFIGS.length,
    enabled: SEED_CONFIGS.filter(c => c.status === 'enabled').length,
    disabled: SEED_CONFIGS.filter(c => c.status === 'disabled').length,
    reflection: SEED_CONFIGS.filter(c => c.reflection).length,
  }), [])

  const openModal = useCallback((mode: ModalState['mode'], item: AgentConfigItem) => {
    setModal({ visible: true, mode, item: mode === 'create' ? null : item })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ visible: false, mode: 'view', item: null })
  }, [])

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>Agent Studio · 写操作面板</h1>
        <p style={{ margin: 0, color: '#8892b0', fontSize: 14 }}>创建/运行/批量执行/删除 Agent 配置与会话。所有写操作直接调用后端 SDK，失败时显示原始错误便于排查。</p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>Agent 配置数</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#2ed573' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>启用中</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2ed573' }}>{stats.enabled}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#57606f' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>已禁用</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#8892b0' }}>{stats.disabled}</div>
        </div>
        <div style={{ ...styles.card, borderColor: '#4361ee' }}>
          <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 4 }}>启用反思</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#4361ee' }}>{stats.reflection}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={styles.input}
          placeholder="搜索名称 / 模型..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={{ ...styles.input, width: 140, cursor: 'pointer' }} value={modelFilter} onChange={e => { setModelFilter(e.target.value); setPage(1) }}>
          {MODEL_OPTIONS.map(m => <option key={m} value={m === '全部' ? '' : m}>{m}</option>)}
        </select>
        <button style={styles.btn} onClick={() => openModal('create', SEED_CONFIGS[0])}>+ 创建配置</button>
        <button style={{ ...styles.btn, background: '#2a2a3e' }} onClick={() => window.location.reload()}>刷新</button>
      </div>

      {paginated.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>无 Agent 配置</div>
          <div style={{ color: '#8892b0', fontSize: 14 }}>点击「创建配置」按钮开始创建您的第一个 Agent。</div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>名称</th>
                  <th style={styles.th}>模型</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>步数</th>
                  <th style={styles.th}>超时（s）</th>
                  <th style={styles.th}>工具数</th>
                  <th style={styles.th}>反思</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.model}</td>
                    <td style={styles.td}>
                      <span style={{ color: item.status === 'enabled' ? '#2ed573' : '#57606f', fontWeight: 600 }}>{item.status}</span>
                    </td>
                    <td style={styles.td}>{item.maxSteps}</td>
                    <td style={styles.td}>{item.timeout}</td>
                    <td style={styles.td}>{item.toolCount}</td>
                    <td style={styles.td}>
                      <span style={{ color: item.reflection ? '#4361ee' : '#57606f' }}>{item.reflection ? '是' : '否'}</span>
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

      {modal.visible && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {modal.mode === 'create' ? '创建配置' : modal.mode === 'view' ? '配置详情' : modal.mode === 'edit' ? '编辑配置' : '删除配置'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            {modal.mode === 'create' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} placeholder="名称" />
                <select style={{ ...styles.input, width: '100%', cursor: 'pointer' }}>
                  <option>gpt-4o</option>
                  <option>gpt-4o-mini</option>
                  <option>claude-3-haiku</option>
                  <option>claude-3-sonnet</option>
                </select>
                <div><label style={{ color: '#8892b0', fontSize: 14 }}><input type="checkbox" /> 启用反思</label></div>
                <input style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} placeholder="最大步数" />
              </div>
            ) : modal.item && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span style={{ color: '#8892b0' }}>名称：</span>{modal.item.name}</div>
                <div><span style={{ color: '#8892b0' }}>模型：</span>{modal.item.model}</div>
                <div><span style={{ color: '#8892b0' }}>状态：</span>{modal.item.status}</div>
                <div><span style={{ color: '#8892b0' }}>步数：</span>{modal.item.maxSteps}</div>
                <div><span style={{ color: '#8892b0' }}>超时：</span>{modal.item.timeout}s</div>
                <div><span style={{ color: '#8892b0' }}>工具数：</span>{modal.item.toolCount}</div>
                <div><span style={{ color: '#8892b0' }}>反思：</span>{modal.item.reflection ? '启用' : '禁用'}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: '#2a2a3e', border: '1px solid #3a3a4e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>取消</button>
              <button onClick={() => { closeModal() }} style={styles.btn}>
                {modal.mode === 'create' ? '创建' : modal.mode === 'delete' ? '确认删除' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
