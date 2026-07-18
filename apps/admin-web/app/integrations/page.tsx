'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface Integration {
  id: string
  name: string
  provider: string               // 'wechat' | 'douyin' | 'alipay' | 'meituan' | 'dianping' | 'custom'
  type: 'payment' | 'social' | 'delivery' | 'crm' | 'erp' | 'custom'
  description: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  apiKeyId?: string
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed'
  errorMessage?: string
  configFields: Array<{ key: string; label: string; value: string }>
  endpoints: Array<{ name: string; url: string; method: string }>
  tenantId: string
  createdAt: string
  updatedAt: string
}

type IntTab = 'active' | 'inactive' | 'all'

// ── 工具 ──

function providerLabel(p: string): string {
  const map: Record<string, string> = { wechat: '微信', douyin: '抖音', alipay: '支付宝', meituan: '美团', dianping: '大众点评', custom: '自定义' }
  return map[p] ?? p
}

function providerColor(p: string): string {
  const colors: Record<string, string> = { wechat: 'bg-green-100 text-green-700', douyin: 'bg-blue-100 text-blue-700', alipay: 'bg-blue-100 text-blue-700', meituan: 'bg-yellow-100 text-yellow-700', dianping: 'bg-red-100 text-red-700', custom: 'bg-gray-100 text-gray-600' }
  return colors[p] ?? 'bg-gray-100 text-gray-600'
}

function typeLabel(t: string): string {
  const map: Record<string, string> = { payment: '支付', social: '社交', delivery: '配送', crm: '客户管理', erp: '企业资源', custom: '自定义' }
  return map[t] ?? t
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { active: '已激活', inactive: '未激活', error: '异常', pending: '待审核' }
  return map[s] ?? s
}

function statusColor(s: string): string {
  const map: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-500', error: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function syncLabel(s: string): string {
  const map: Record<string, string> = { success: '成功', failed: '失败' }
  return map[s] ?? '-'
}

// ── 默认样本数据 ──

const defaultIntegrations: Integration[] = [
  { id: 'int-1', name: '微信支付', provider: 'wechat', type: 'payment', description: '微信支付商户平台对接', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: 'wx_****1234' }, { key: 'mchId', label: '商户号', value: '1234567890' }], endpoints: [{ name: '支付回调', url: 'https://api.example.com/pay/callback', method: 'POST' }], tenantId: 't1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
  { id: 'int-2', name: '抖音小程序', provider: 'douyin', type: 'social', description: '抖音小程序对接', status: 'active', lastSyncAt: '2026-07-17T08:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: 'tt_****5678' }, { key: 'secret', label: '密钥', value: '****' }], endpoints: [{ name: '订单同步', url: 'https://api.example.com/dy/orders', method: 'POST' }, { name: '退款回调', url: 'https://api.example.com/dy/refund', method: 'POST' }], tenantId: 't1', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-17T08:00:00Z' },
  { id: 'int-3', name: '美团外卖', provider: 'meituan', type: 'delivery', description: '美团外卖订单推送', status: 'error', lastSyncAt: '2026-07-18T06:00:00Z', lastSyncStatus: 'failed', errorMessage: 'Token过期，请重新授权', configFields: [{ key: 'shopId', label: '门店ID', value: 'mt_****9012' }, { key: 'token', label: 'Token', value: '********' }], endpoints: [{ name: '订单推送', url: 'https://api.example.com/mt/orders', method: 'POST' }], tenantId: 't1', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
  { id: 'int-4', name: '支付宝开放平台', provider: 'alipay', type: 'payment', description: '支付宝商户集成', status: 'active', lastSyncAt: '2026-07-16T12:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: '2026****3456' }, { key: 'publicKey', label: '公钥', value: 'MIIB****' }], endpoints: [{ name: '支付通知', url: 'https://api.example.com/alipay/notify', method: 'POST' }], tenantId: 't1', createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-07-16T12:00:00Z' },
  { id: 'int-5', name: '自建CRM', provider: 'custom', type: 'crm', description: '自建客户系统对接', status: 'inactive', configFields: [{ key: 'apiKey', label: 'API Key', value: 'ak_****7890' }], endpoints: [{ name: '客户同步', url: 'https://crm.example.com/api/sync', method: 'POST' }], tenantId: 't1', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
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

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<IntTab>('active')

  const loadIntegrations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ integrations: Integration[] }>('/api/openapi/integrations')
      setIntegrations(data.integrations)
    } catch {
      setIntegrations(defaultIntegrations)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadIntegrations() }, [loadIntegrations])

  const filtered = integrations.filter(i => {
    if (tabView === 'all') return true
    if (tabView === 'active') return i.status === 'active'
    if (tabView === 'inactive') return i.status !== 'active'
    return true
  })

  const activeCount = integrations.filter(i => i.status === 'active').length
  const inactiveCount = integrations.filter(i => i.status === 'inactive').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载集成列表...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">第三方集成</h1>
          <p className="text-sm text-gray-500 mt-1">API密钥管理 · 第三方平台对接 · 集成状态监控</p>
        </div>
        <button onClick={loadIntegrations} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">集成总数</p>
          <p className="text-2xl font-bold mt-1">{integrations.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已禁用</p>
          <p className="text-2xl font-bold mt-1 text-gray-500">{inactiveCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{errorCount}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'all'] as IntTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ active: '活跃', inactive: '其他', all: '全部' }[tab]}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无集成</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有第三方集成</p>
          </div>
        ) : (
          filtered.map(int => (
            <div key={int.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{int.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${providerColor(int.provider)}`}>
                      {providerLabel(int.provider)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(int.status)}`}>
                      {statusLabel(int.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{typeLabel(int.type)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{int.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    {int.lastSyncAt && (
                      <span>上次同步: {new Date(int.lastSyncAt).toLocaleString('zh-CN')}
                        {int.lastSyncStatus && (
                          <span className={`ml-1 ${int.lastSyncStatus === 'failed' ? 'text-red-500' : 'text-green-500'}`}>
                            ({syncLabel(int.lastSyncStatus)})
                          </span>
                        )}
                      </span>
                    )}
                    <span>Endpoint: {int.endpoints.length}个</span>
                  </div>
                  {int.status === 'error' && int.errorMessage && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      ⚠ {int.errorMessage}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-1 text-xs">
                  {int.endpoints.slice(0, 2).map(ep => (
                    <span key={ep.name} className="px-2 py-1 bg-gray-50 rounded text-gray-500">{ep.method}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
