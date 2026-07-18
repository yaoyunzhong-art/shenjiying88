'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface ProcurementOrder {
  id: string
  orderNo: string
  supplierName: string
  supplierId: string
  items: Array<{ name: string; quantity: number; unitPriceCents: number; totalCents: number }>
  totalCents: number
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  requester: string
  approver?: string
  storeName?: string
  expectedDate?: string
  receivedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

type ProcTab = 'pending' | 'approved' | 'received' | 'all'

// ── 工具 ──

// ─── 表单弹窗（新增/编辑） ──────────────────────

interface OrderFormData {
  supplierName: string;
  department: string;
  requester: string;
  storeName: string;
  expectedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
}

function OrderFormModal({ onClose, onSave, initial }: {
  onClose: () => void;
  onSave: (data: OrderFormData) => void;
  initial?: OrderFormData;
}) {
  const [form, setForm] = useState<OrderFormData>(initial ?? {
    supplierName: '', department: '', requester: '', storeName: '',
    expectedDate: '', priority: 'medium',
    items: [{ name: '', quantity: 1, unitPriceCents: 0 }],
  });

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unitPriceCents: 0 }] }));
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
      return { ...f, items };
    });
  };

  const submit = () => {
    if (!form.supplierName.trim() || !form.department.trim()) return;
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 480, maxWidth: 640, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{initial ? '编辑采购单' : '新建采购单'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>供应商</label>
            <input value={form.supplierName} onChange={e => setForm(f => ({...f, supplierName: e.target.value}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} placeholder="供应商名称" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>部门</label>
            <input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} placeholder="技术部" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>申请人</label>
            <input value={form.requester} onChange={e => setForm(f => ({...f, requester: e.target.value}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>门店</label>
            <input value={form.storeName} onChange={e => setForm(f => ({...f, storeName: e.target.value}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>期望到货</label>
            <input type="date" value={form.expectedDate} onChange={e => setForm(f => ({...f, expectedDate: e.target.value}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>优先级</label>
            <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as any}))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>采购项</div>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} placeholder="物品名称" />
              <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                style={{ width: 70, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} placeholder="数量" />
              <input type="number" value={item.unitPriceCents / 100} onChange={e => updateItem(idx, 'unitPriceCents', Math.round(parseFloat(e.target.value) * 100))}
                style={{ width: 90, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} placeholder="单价" />
              <span style={{ fontSize: 12, color: '#666', minWidth: 60, textAlign: 'right' }}>
                ¥{item.unitPriceCents > 0 ? (item.quantity * item.unitPriceCents / 100).toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
          <button onClick={addItem} style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none' }}>+ 添加采购项</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>取消</button>
          <button onClick={submit} style={{ padding: '8px 20px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>提交</button>
        </div>
      </div>
    </div>
  );
}

// ─── 状态时间线 ─────────────────────────────────────

const STATUS_STEPS = ['draft', 'submitted', 'approved', 'shipped', 'received'] as const;

function OrderTimeline({ status, createdAt, updatedAt }: { status: string; createdAt: string; updatedAt: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status as any);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '12px 0' }}>
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: active ? '#3b82f6' : done ? '#4ade80' : '#e5e7eb',
              color: done ? '#fff' : '#999',
            }}>
              {done ? (active ? '●' : '✓') : idx + 1}
            </div>
            <div style={{ marginLeft: 6, fontSize: 11, color: active ? '#3b82f6' : done ? '#4ade80' : '#999' }}>
              {{ draft: '草稿', submitted: '审批中', approved: '待发货', shipped: '配送中', received: '已收货' }[step]}
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#4ade80' : '#e5e7eb', margin: '0 6px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 环比统计 ──────────────────────────────────────

function calcMomStats(orders: ProcurementOrder[]) {
  const now = new Date();
  const thisMonth = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = orders.filter(o => {
    const d = new Date(o.createdAt);
    const lm = now.getMonth() - 1;
    const ly = lm < 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getMonth() === (lm < 0 ? 11 : lm) && d.getFullYear() === ly;
  });

  const thisAmount = thisMonth.reduce((s, o) => s + o.totalCents, 0);
  const lastAmount = lastMonth.reduce((s, o) => s + o.totalCents, 0);
  const change = lastAmount > 0 ? ((thisAmount - lastAmount) / lastAmount * 100).toFixed(1) : '0.0';
  const trend = lastAmount > 0 ? thisAmount >= lastAmount : true;

  return { thisAmount, lastAmount, change, trend, thisCount: thisMonth.length, lastCount: lastMonth.length };
}

// ── 核心组件 ──

function ProcStatsRow({ orders }: { orders: ProcurementOrder[] }) {
  const mom = calcMomStats(orders);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#666' }}>本月采购额</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: '#3b82f6' }}>{fmtCents(mom.thisAmount)}</div>
      </div>
      <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#666' }}>上月采购额</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: '#6b7280' }}>{fmtCents(mom.lastAmount)}</div>
      </div>
      <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#666' }}>环比变化</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: mom.trend ? '#4ade80' : '#f87171' }}>
          {mom.trend ? '↑' : '↓'} {mom.change}%
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#666' }}>采购单数 (本月/上月)</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{mom.thisCount} / {mom.lastCount}</div>
      </div>
    </div>
  );
}

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { draft: '草稿', submitted: '待审批', approved: '待发货', shipped: '配送中', received: '已收货', cancelled: '已取消' }
  return map[s] ?? s
}

function statusColor(s: string): string {
  const map: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', shipped: 'bg-indigo-100 text-indigo-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function priorityLabel(p: string): string {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[p] ?? p
}

function priorityColor(p: string): string {
  const map: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-yellow-100 text-yellow-700', urgent: 'bg-red-100 text-red-700' }
  return map[p] ?? 'bg-gray-100 text-gray-600'
}

// ── 默认样本数据 ──

const defaultOrders: ProcurementOrder[] = [
  { id: 'po-1', orderNo: 'PO-20260718-001', supplierName: '华强电子', supplierId: 's1', items: [{ name: '收银机主板', quantity: 5, unitPriceCents: 120000, totalCents: 600000 }], totalCents: 600000, status: 'submitted', priority: 'high', department: '技术部', requester: '张工', storeName: '总部', createdAt: '2026-07-18T09:00:00Z', updatedAt: '2026-07-18T09:00:00Z' },
  { id: 'po-2', orderNo: 'PO-20260718-002', supplierName: '益智玩具厂', supplierId: 's2', items: [{ name: '扭蛋', quantity: 200, unitPriceCents: 1500, totalCents: 300000 }, { name: '盲盒', quantity: 100, unitPriceCents: 3500, totalCents: 350000 }], totalCents: 650000, status: 'approved', priority: 'medium', department: '运营部', requester: '李运营', storeName: '北京朝阳店', approver: '王经理', expectedDate: '2026-07-22', createdAt: '2026-07-17T14:00:00Z', updatedAt: '2026-07-18T08:00:00Z' },
  { id: 'po-3', orderNo: 'PO-20260717-001', supplierName: '天地餐饮', supplierId: 's3', items: [{ name: '饮料原料', quantity: 50, unitPriceCents: 8000, totalCents: 400000 }], totalCents: 400000, status: 'received', priority: 'low', department: '餐饮部', requester: '赵主管', storeName: '广州天河店', approver: '刘总监', expectedDate: '2026-07-16', receivedDate: '2026-07-17', createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-07-17T16:00:00Z' },
  { id: 'po-4', orderNo: 'PO-20260716-003', supplierName: '杭州动漫科技', supplierId: 's4', items: [{ name: '动漫手办', quantity: 30, unitPriceCents: 25000, totalCents: 750000 }], totalCents: 750000, status: 'shipped', priority: 'urgent', department: '营销部', requester: '陈营销', storeName: '上海南京路店', approver: '王经理', expectedDate: '2026-07-20', createdAt: '2026-07-16T11:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
  { id: 'po-5', orderNo: 'PO-20260715-002', supplierName: '本地清洁用品', supplierId: 's5', items: [{ name: '清洁剂', quantity: 100, unitPriceCents: 2500, totalCents: 250000 }, { name: '垃圾袋', quantity: 500, unitPriceCents: 200, totalCents: 100000 }], totalCents: 350000, status: 'draft', priority: 'low', department: '后勤部', requester: '孙权', storeName: '深圳南山店', createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:00:00Z' },
]

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 主组件 ──

export default function ProcurementPage() {
  const [orders, setOrders] = useState<ProcurementOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<ProcTab>('pending')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ orders: ProcurementOrder[] }>('/api/inventory/procurement')
      setOrders(data.orders)
    } catch {
      setOrders(defaultOrders)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const filtered = orders.filter(o => {
    if (tabView === 'all') return true
    if (tabView === 'pending') return o.status === 'draft' || o.status === 'submitted'
    if (tabView === 'approved') return o.status === 'approved' || o.status === 'shipped'
    if (tabView === 'received') return o.status === 'received'
    return true
  })

  const pendingCount = orders.filter(o => o.status === 'draft' || o.status === 'submitted').length
  const totalAmount = orders.reduce((s, o) => s + o.totalCents, 0)
  const urgentCount = orders.filter(o => o.priority === 'urgent' || o.priority === 'high').filter(o => o.status !== 'received').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载采购单...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-sm text-gray-500 mt-1">采购订单 · 供应商管理 · 到货跟踪</p>
        </div>
        <button onClick={loadOrders} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购单</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">紧急</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{urgentCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购总额</p>
          <p className="text-2xl font-bold mt-1">{fmtCents(totalAmount)}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['pending', 'approved', 'received', 'all'] as ProcTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ pending: '待处理', approved: '供应商处理中', received: '已收货', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* 列表 */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m0 0h10m-10 0l2-2m-2 2l-2-2m16-2V8a1 1 0 00-1-1h-4m0 0l2-2m-2 2l-2 2m-2 6v6a1 1 0 001 1h10a1 1 0 001-1v-6m0 0H9" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无采购单</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有采购订单</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900 font-mono text-sm">{order.orderNo}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColor(order.priority)}`}>
                      {priorityLabel(order.priority)}
                    </span>
                    <span className="text-xs text-gray-400">{order.supplierName}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {order.items.map((item, i) => (
                      <span key={i}>{item.name}×{item.quantity}{i < order.items.length - 1 ? ' · ' : ''}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>申请人: {order.requester}</span>
                    <span>部门: {order.department}</span>
                    {order.storeName && <span>门店: {order.storeName}</span>}
                    {order.expectedDate && <span>期望到货: {order.expectedDate}</span>}
                    {order.receivedDate && <span>已收货: {order.receivedDate}</span>}
                    {order.approver && <span>审批人: {order.approver}</span>}
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[100px]">
                  <p className="text-lg font-bold">{fmtCents(order.totalCents)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} 个品项</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
