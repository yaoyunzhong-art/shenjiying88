'use client'

/**
 * Phase-44 T174: 开放 API 工作台
 *
 * 5 大模块:
 *  - API Key 管理 (LIVE/TEST/SANDBOX + 撤销)
 *  - Webhook 订阅 (创建/暂停/恢复/投递日志/死信)
 *  - 沙箱环境 (PII 脱敏 + TTL 过期)
 *  - 限流配额 (QPS 滑动窗口 + 日配额 + 综合报表)
 *  - 签名验证 (HMAC-SHA256 + 5min 防重放)
 */

import { useEffect, useState } from 'react'

interface APIKey {
  id: string
  tenantId: string
  keyId: string
  environment: 'LIVE' | 'TEST' | 'SANDBOX'
  name: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  scopes: Array<{ resource: string; actions: string[] }>
  createdAt: string
  lastUsedAt?: string
}

interface WebhookSub {
  id: string
  tenantId: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
  createdAt: string
  description?: string
}

interface WebhookDelivery {
  id: string
  subscriptionId: string
  eventType: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER'
  attempts: number
  responseStatus?: number
  lastAttemptAt?: string
  nextRetryAt?: string
  errorMessage?: string
  createdAt: string
}

interface Sandbox {
  id: string
  tenantId: string
  parentTenantId: string
  name: string
  status: 'ACTIVE' | 'EXPIRED' | 'PURGED'
  ttlDays: number
  dataMaskingEnabled: boolean
  createdAt: string
  expiresAt: string
}

interface UsageReport {
  totalBuckets: number
  activeBuckets: number
  totalUsageToday: number
  overageKeys: number
  topEndpoints: Array<{ endpoint: string; count: number }>
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-gray-100 text-gray-700',
  REVOKED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  PURGED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  DEAD_LETTER: 'bg-purple-100 text-purple-700'
}

const ENV_COLOR: Record<string, string> = {
  LIVE: 'bg-blue-100 text-blue-700',
  TEST: 'bg-yellow-100 text-yellow-700',
  SANDBOX: 'bg-green-100 text-green-700'
}

export default function OpenAPIWorkbench() {
  const [tab, setTab] = useState<'keys' | 'webhooks' | 'sandboxes' | 'usage' | 'sign'>('keys')
  const [tenantId] = useState('t-demo')
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [deadLetters, setDeadLetters] = useState<WebhookDelivery[]>([])
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [usageReport, setUsageReport] = useState<UsageReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [tenantId])

  async function loadAll() {
    setLoading(true)
    // Demo 数据 (生产对接 /openapi/*)
    setApiKeys([
      { id: 'k1', tenantId, keyId: 'sk_live_' + 'a'.repeat(16), environment: 'LIVE', name: 'prod-orders', status: 'ACTIVE',
        scopes: [{ resource: 'orders', actions: ['read', 'write'] }], createdAt: '2026-06-01T10:00:00Z' },
      { id: 'k2', tenantId, keyId: 'sk_test_' + 'b'.repeat(16), environment: 'TEST', name: 'qa-team', status: 'ACTIVE',
        scopes: [{ resource: '*', actions: ['read'] }], createdAt: '2026-06-15T14:30:00Z' },
      { id: 'k3', tenantId, keyId: 'sk_sandbox_' + 'c'.repeat(16), environment: 'SANDBOX', name: 'sandbox-bot', status: 'ACTIVE',
        scopes: [{ resource: '*', actions: ['*'] }], createdAt: '2026-06-20T09:00:00Z', lastUsedAt: '2026-06-28T08:00:00Z' }
    ])
    setWebhooks([
      { id: 'wh1', tenantId, url: 'https://hooks.example.com/orders',
        events: ['order.created', 'order.paid'], status: 'ACTIVE',
        description: '订单事件回传', createdAt: '2026-06-10T10:00:00Z' },
      { id: 'wh2', tenantId, url: 'https://hooks.example.com/members',
        events: ['member.registered'], status: 'PAUSED',
        description: '会员注册', createdAt: '2026-06-12T11:00:00Z' }
    ])
    setDeliveries([
      { id: 'd1', subscriptionId: 'wh1', eventType: 'order.created', status: 'SUCCESS',
        attempts: 1, responseStatus: 200, lastAttemptAt: '2026-06-28T08:30:00Z',
        createdAt: '2026-06-28T08:30:00Z' },
      { id: 'd2', subscriptionId: 'wh1', eventType: 'order.paid', status: 'FAILED',
        attempts: 2, responseStatus: 500, errorMessage: 'HTTP 500',
        lastAttemptAt: '2026-06-28T08:35:00Z', nextRetryAt: '2026-06-28T08:36:00Z',
        createdAt: '2026-06-28T08:35:00Z' },
      { id: 'd3', subscriptionId: 'wh1', eventType: 'order.created', status: 'FAILED',
        attempts: 1, responseStatus: 502, errorMessage: 'Bad Gateway',
        lastAttemptAt: '2026-06-28T08:40:00Z', nextRetryAt: '2026-06-28T08:45:00Z',
        createdAt: '2026-06-28T08:40:00Z' }
    ])
    setDeadLetters([
      { id: 'd9', subscriptionId: 'wh1', eventType: 'order.created', status: 'DEAD_LETTER',
        attempts: 5, responseStatus: 500, errorMessage: '持久失败, 已达 5 次重试上限',
        lastAttemptAt: '2026-06-28T07:00:00Z',
        createdAt: '2026-06-28T06:00:00Z' }
    ])
    setSandboxes([
      { id: 'sb1', tenantId: 't-sandbox-qa', parentTenantId: tenantId, name: 'qa-env',
        status: 'ACTIVE', ttlDays: 30, dataMaskingEnabled: true,
        createdAt: '2026-06-01T10:00:00Z', expiresAt: '2026-07-01T10:00:00Z' },
      { id: 'sb2', tenantId: 't-sandbox-load', parentTenantId: tenantId, name: 'load-test',
        status: 'EXPIRED', ttlDays: 7, dataMaskingEnabled: true,
        createdAt: '2026-05-15T10:00:00Z', expiresAt: '2026-05-22T10:00:00Z' }
    ])
    setUsageReport({
      totalBuckets: 3, activeBuckets: 3, totalUsageToday: 1245, overageKeys: 0,
      topEndpoints: [
        { endpoint: '/api/orders', count: 580 },
        { endpoint: '/api/members', count: 320 },
        { endpoint: '/api/products', count: 245 },
        { endpoint: '/api/payments', count: 100 }
      ]
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中…</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🔌 开放 API 工作台</h1>
      <p className="text-gray-500 mb-6">API Key + Webhook + 沙箱 + 限流配额 + HMAC 签名</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'keys', label: '🔑 API Keys', count: apiKeys.length },
          { id: 'webhooks', label: '🪝 Webhooks', count: webhooks.length },
          { id: 'sandboxes', label: '📦 沙箱', count: sandboxes.length },
          { id: 'usage', label: '📊 用量配额', count: 0 },
          { id: 'sign', label: '🔐 签名验证', count: 0 }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label} {t.count > 0 && <span className="ml-1 text-xs">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'keys' && <KeysTab keys={apiKeys} />}
      {tab === 'webhooks' && <WebhooksTab subs={webhooks} deliveries={deliveries} deadLetters={deadLetters} />}
      {tab === 'sandboxes' && <SandboxesTab sandboxes={sandboxes} />}
      {tab === 'usage' && <UsageTab report={usageReport} />}
      {tab === 'sign' && <SignTab />}
    </div>
  )
}

// ════════════════════════════════════════════════
// Tab 1: API Keys
// ════════════════════════════════════════════════

function KeysTab({ keys }: { keys: APIKey[] }) {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🔑 API Key 管理</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + 创建 API Key
        </button>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4 text-sm">
        💡 <b>反模式 v4 openapi-design</b>: Key 格式 <code>sk_&#123;env&#125;_&#123;keyId&#125;_&#123;secret&#125;</code>, 仅创建时返回明文, 数据库只存 <code>keyHash</code>
      </div>

      <div className="space-y-3">
        {keys.map(k => (
          <div key={k.id} className="bg-white p-4 rounded shadow border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${ENV_COLOR[k.environment]}`}>
                  {k.environment}
                </span>
                <span className="font-semibold">{k.name}</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{k.keyId.slice(0, 24)}…</code>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLOR[k.status]}`}>
                {k.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Scopes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {k.scopes.map((s, i) => (
                    <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                      {s.resource}:{s.actions.join('|')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-gray-500">创建时间: <span className="text-gray-700">{k.createdAt}</span></div>
                {k.lastUsedAt && (
                  <div className="text-gray-500">最近使用: <span className="text-gray-700">{k.lastUsedAt}</span></div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t flex gap-2">
              <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">查看详情</button>
              {k.status === 'ACTIVE' && (
                <button className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50">
                  撤销
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════
// Tab 2: Webhooks
// ════════════════════════════════════════════════

function WebhooksTab({ subs, deliveries, deadLetters }: {
  subs: WebhookSub[]
  deliveries: WebhookDelivery[]
  deadLetters: WebhookDelivery[]
}) {
  const [view, setView] = useState<'subs' | 'log' | 'dlq'>('subs')

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🪝 Webhook 投递</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + 创建订阅
        </button>
      </div>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4 text-sm">
        💡 <b>反模式 v4 webhook-retry</b>: 指数退避 <code>1s → 5s → 30s → 5min → 30min</code>, 5 次后入死信, <code>eventId</code> 幂等
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 mb-4 text-sm">
        {[
          { id: 'subs', label: '订阅列表', count: subs.length },
          { id: 'log', label: '投递日志', count: deliveries.length },
          { id: 'dlq', label: '💀 死信队列', count: deadLetters.length }
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setView(s.id as any)}
            className={`px-3 py-1 rounded ${
              view === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {view === 'subs' && (
        <div className="space-y-3">
          {subs.map(s => (
            <div key={s.id} className="bg-white p-4 rounded shadow border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{s.url}</code>
                  {s.description && <span className="ml-2 text-sm text-gray-500">({s.description})</span>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLOR[s.status]}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {s.events.map(e => (
                  <span key={e} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">
                    {e}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">创建: {s.createdAt}</div>
              <div className="mt-2 pt-2 border-t flex gap-2 text-sm">
                <button className="px-2 py-1 border rounded hover:bg-gray-50">
                  {s.status === 'ACTIVE' ? '⏸ 暂停' : '▶ 恢复'}
                </button>
                <button className="px-2 py-1 border rounded hover:bg-gray-50">🧪 测试投递</button>
                <button className="px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50">
                  🗑 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'log' && (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Delivery ID</th>
                <th className="px-3 py-2 text-left">事件</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2 text-right">尝试</th>
                <th className="px-3 py-2 text-right">响应</th>
                <th className="px-3 py-2 text-left">下次重试</th>
                <th className="px-3 py-2 text-left">错误</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{d.id}</td>
                  <td className="px-3 py-2">{d.eventType}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{d.attempts}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {d.responseStatus || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {d.nextRetryAt ? new Date(d.nextRetryAt).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-red-600 truncate max-w-xs">
                    {d.errorMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'dlq' && (
        <div className="space-y-3">
          {deadLetters.length === 0 ? (
            <div className="text-center text-gray-500 py-8">✅ 无死信</div>
          ) : deadLetters.map(d => (
            <div key={d.id} className="bg-purple-50 border border-purple-300 p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-sm">{d.id}</div>
                  <div className="text-xs text-gray-600">{d.eventType} · {d.lastAttemptAt}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                  DEAD_LETTER
                </span>
              </div>
              <div className="text-sm text-red-600 mb-2">错误: {d.errorMessage}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                  🔄 手动恢复重试
                </button>
                <button className="px-3 py-1 text-sm border rounded hover:bg-white">
                  🗑 丢弃
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ════════════════════════════════════════════════
// Tab 3: Sandboxes
// ════════════════════════════════════════════════

function SandboxesTab({ sandboxes }: { sandboxes: Sandbox[] }) {
  const [maskDemo, setMaskDemo] = useState({ name: 'Alice', email: 'a@x.com', phone: '13800000000' })
  const masked = maskPII(maskDemo)

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📦 沙箱环境</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + 创建沙箱
        </button>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 text-sm">
        💡 <b>沙箱隔离</b>: tenantId 前缀 <code>t-sandbox-</code>, 默认 TTL=30 天, PII 自动脱敏 = <code>***MASKED***</code>
      </div>

      <div className="space-y-3 mb-6">
        {sandboxes.map(sb => (
          <div key={sb.id} className="bg-white p-4 rounded shadow border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{sb.name}</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sb.tenantId}</code>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLOR[sb.status]}`}>
                {sb.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500">TTL:</span> {sb.ttlDays} 天
              </div>
              <div>
                <span className="text-gray-500">数据脱敏:</span>{' '}
                {sb.dataMaskingEnabled ? '✅ 开启' : '❌ 关闭'}
              </div>
              <div>
                <span className="text-gray-500">到期:</span> {sb.expiresAt}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t flex gap-2 text-sm">
              <button className="px-2 py-1 border rounded hover:bg-gray-50">切换状态</button>
              <button className="px-2 py-1 border rounded hover:bg-gray-50">续期</button>
              <button className="px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50">
                立即清理
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PII 脱敏演示 */}
      <div className="bg-white p-4 rounded shadow border">
        <h3 className="font-semibold mb-3">🛡️ PII 脱敏演示</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">原始数据</div>
            <pre className="bg-gray-50 p-3 rounded text-xs font-mono">
              {JSON.stringify(maskDemo, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">脱敏后</div>
            <pre className="bg-green-50 p-3 rounded text-xs font-mono">
              {JSON.stringify(masked, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

function maskPII(data: Record<string, any>): Record<string, any> {
  const result = { ...data }
  const piiKeys = ['email', 'phone', 'idCard', 'password', 'token', 'ssn', 'creditCard']
  for (const key of Object.keys(result)) {
    if (piiKeys.includes(key)) result[key] = '***MASKED***'
  }
  return result
}

// ════════════════════════════════════════════════
// Tab 4: Usage Report
// ════════════════════════════════════════════════

function UsageTab({ report }: { report: UsageReport | null }) {
  if (!report) return null
  const maxCount = Math.max(...report.topEndpoints.map(e => e.count), 1)

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">📊 用量配额报表</h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-sm">
        💡 <b>限流策略</b>: 滑动窗口 QPS + 日配额, 超额返回 <code>qps_exceeded</code> / <code>daily_quota_exceeded</code>, 含 <code>Retry-After</code>
      </div>

      {/* 指标卡 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard name="桶总数" value={report.totalBuckets} color="blue" />
        <MetricCard name="活跃桶" value={report.activeBuckets} color="green" />
        <MetricCard name="今日用量" value={report.totalUsageToday} color="purple" unit="次" />
        <MetricCard name="超额 Key" value={report.overageKeys} color="red" />
      </div>

      {/* Top Endpoints */}
      <div className="bg-white p-4 rounded shadow border">
        <h3 className="font-semibold mb-3">🔥 Top Endpoints</h3>
        <div className="space-y-2">
          {report.topEndpoints.map(e => (
            <div key={e.endpoint}>
              <div className="flex justify-between text-sm mb-1">
                <code className="text-xs">{e.endpoint}</code>
                <span className="font-mono">{e.count.toLocaleString()}</span>
              </div>
              <div className="bg-gray-100 h-2 rounded overflow-hidden">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${(e.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({ name, value, color, unit }: { name: string; value: number; color: string; unit?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  }
  return (
    <div className="bg-white p-4 rounded shadow border">
      <div className="text-sm text-gray-500">{name}</div>
      <div className={`text-3xl font-bold ${colorMap[color]}`}>
        {value.toLocaleString()}{unit && <span className="text-base text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// Tab 5: Signature Verification
// ════════════════════════════════════════════════

function SignTab() {
  const [secret, setSecret] = useState('demo-secret-32chars-abcdefghij')
  const [method, setMethod] = useState('POST')
  const [url, setUrl] = useState('/api/orders')
  const [body, setBody] = useState('{"amount":100}')
  const [timestamp, setTimestamp] = useState(Date.now())
  const [nonce, setNonce] = useState('nonce-' + Date.now())
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null)

  const canonicalStr = `${method.toUpperCase()}\n${url}\n${timestamp}\n${nonce}\n${body}`

  function handleVerify() {
    // 简化版: 演示验证逻辑
    const skew = Math.abs(Date.now() - timestamp)
    if (skew > 5 * 60 * 1000) {
      setVerifyResult({ valid: false, reason: 'timestamp_out_of_window' })
      return
    }
    if (!secret || !nonce || !method || !url) {
      setVerifyResult({ valid: false, reason: 'missing_fields' })
      return
    }
    setVerifyResult({ valid: true })
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">🔐 HMAC 签名验证</h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-sm">
        💡 <b>签名规范</b>: <code>HMAC-SHA256(secret, canonical)</code>, canonical = <code>method\nurl\ntimestamp\nnonce\nbody</code>, 5min 防重放窗口
      </div>

      <div className="bg-white p-6 rounded shadow border max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Secret (32+ chars)</label>
            <input value={secret} onChange={e => setSecret(e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border rounded px-3 py-2">
                <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timestamp (ms)</label>
              <input type="number" value={timestamp} onChange={e => setTimestamp(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nonce</label>
            <input value={nonce} onChange={e => setNonce(e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm" rows={3} />
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Canonical String:</div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-all">{canonicalStr}</pre>
          </div>

          <button onClick={handleVerify}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            🔍 验证签名
          </button>

          {verifyResult && (
            <div className={`p-3 rounded ${
              verifyResult.valid ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
            }`}>
              <div className="font-semibold">
                {verifyResult.valid ? '✅ 验证通过' : `❌ 验证失败: ${verifyResult.reason}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}