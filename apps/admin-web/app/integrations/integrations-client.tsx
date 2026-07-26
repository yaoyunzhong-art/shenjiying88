'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Integration, IntegrationsSnapshotDelivery } from './integrations-data'

type IntTab = 'active' | 'inactive' | 'all'

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    wechat: '微信',
    douyin: '抖音',
    alipay: '支付宝',
    meituan: '美团',
    dianping: '大众点评',
    custom: '自定义',
  }
  return map[provider] ?? provider
}

function providerColor(provider: string): string {
  const colors: Record<string, string> = {
    wechat: 'bg-green-100 text-green-700',
    douyin: 'bg-blue-100 text-blue-700',
    alipay: 'bg-blue-100 text-blue-700',
    meituan: 'bg-yellow-100 text-yellow-700',
    dianping: 'bg-red-100 text-red-700',
    custom: 'bg-gray-100 text-gray-600',
  }
  return colors[provider] ?? 'bg-gray-100 text-gray-600'
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    payment: '支付',
    social: '社交',
    delivery: '配送',
    crm: '客户管理',
    erp: '企业资源',
    custom: '自定义',
  }
  return map[type] ?? type
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '已激活',
    inactive: '未激活',
    error: '异常',
    pending: '待审核',
  }
  return map[status] ?? status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

function syncLabel(status: string): string {
  const map: Record<string, string> = { success: '成功', failed: '失败' }
  return map[status] ?? '-'
}

export default function IntegrationsClient({
  snapshot,
}: {
  snapshot: IntegrationsSnapshotDelivery
}) {
  const router = useRouter()
  const [tabView, setTabView] = useState<IntTab>('active')
  const [isRefreshing, startRefresh] = useTransition()
  const integrations = snapshot.integrations

  const filtered = useMemo(
    () =>
      integrations.filter((integration) => {
        if (tabView === 'all') return true
        if (tabView === 'active') return integration.status === 'active'
        return integration.status !== 'active'
      }),
    [integrations, tabView]
  )

  const summary = useMemo(() => {
    const activeCount = integrations.filter((integration) => integration.status === 'active').length
    const inactiveCount = integrations.filter((integration) => integration.status === 'inactive').length
    const errorCount = integrations.filter((integration) => integration.status === 'error').length
    return {
      totalCount: integrations.length,
      activeCount,
      inactiveCount,
      errorCount,
    }
  }, [integrations])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">第三方集成</h1>
          <p className="text-sm text-gray-500 mt-1">API密钥管理 · 第三方平台对接 · 集成状态监控</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">集成总数</p>
          <p className="text-2xl font-bold mt-1">{summary.totalCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{summary.activeCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已禁用</p>
          <p className="text-2xl font-bold mt-1 text-gray-500">{summary.inactiveCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{summary.errorCount}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'all'] as IntTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ active: '活跃', inactive: '其他', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

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
          filtered.map((integration: Integration) => (
            <div key={integration.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{integration.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${providerColor(integration.provider)}`}>
                      {providerLabel(integration.provider)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(integration.status)}`}>
                      {statusLabel(integration.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{typeLabel(integration.type)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    {integration.lastSyncAt && (
                      <span>
                        上次同步: {new Date(integration.lastSyncAt).toLocaleString('zh-CN')}
                        {integration.lastSyncStatus && (
                          <span className={`ml-1 ${integration.lastSyncStatus === 'failed' ? 'text-red-500' : 'text-green-500'}`}>
                            ({syncLabel(integration.lastSyncStatus)})
                          </span>
                        )}
                      </span>
                    )}
                    <span>Endpoint: {integration.endpoints.length}个</span>
                  </div>
                  {integration.status === 'error' && integration.errorMessage && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      ⚠ {integration.errorMessage}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-1 text-xs">
                  {integration.endpoints.slice(0, 2).map((endpoint) => (
                    <span key={endpoint.name} className="px-2 py-1 bg-gray-50 rounded text-gray-500">
                      {endpoint.method}
                    </span>
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
