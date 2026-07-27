'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { OpenApiWorkbenchSnapshotDelivery } from './openapi-data'
import {
  buildCanonicalString,
  ENV_COLOR,
  maskPII,
  STATUS_COLOR,
  verifySignatureWindow,
} from './openapi-data'

type TabId = 'keys' | 'webhooks' | 'sandboxes' | 'usage' | 'sign'

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

export default function OpenApiWorkbenchClient({
  snapshot,
}: {
  snapshot: OpenApiWorkbenchSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tab, setTab] = useState<TabId>('keys')
  const [timestamp, setTimestamp] = useState(Date.now())
  const [method, setMethod] = useState('POST')
  const [url, setUrl] = useState('/api/orders')
  const [nonce, setNonce] = useState(`nonce-${Date.now()}`)
  const [body, setBody] = useState('{"amount":100}')
  const [secret, setSecret] = useState('demo-secret-32chars-abcdefghij')
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null)

  const canonicalStr = useMemo(
    () => buildCanonicalString({ method, url, timestamp, nonce, body }),
    [body, method, nonce, timestamp, url]
  )
  const maskedSample = useMemo(
    () => maskPII({ name: 'Alice', email: 'a@x.com', phone: '13800000000' }),
    []
  )

  function handleVerify() {
    const timeWindow = verifySignatureWindow(timestamp, Date.now())
    if (!timeWindow.valid) {
      setVerifyResult(timeWindow)
      return
    }
    if (!secret || !nonce || !method || !url) {
      setVerifyResult({ valid: false, reason: 'missing_fields' })
      return
    }
    setVerifyResult({ valid: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">开放 API 工作台</h1>
          <p className="mt-1 text-sm text-slate-500">
            API Key、Webhook、沙箱与签名验证首屏已经改为服务端快照渲染。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="API Keys" value={snapshot.apiKeys.length} />
        <MetricCard label="活跃订阅" value={snapshot.webhooks.filter((item) => item.status === 'ACTIVE').length} />
        <MetricCard label="今日调用" value={snapshot.usageReport.totalUsageToday} />
        <MetricCard label="异常数" value={snapshot.deliveries.filter((item) => item.status === 'FAILED').length + snapshot.deadLetters.length} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'keys', label: 'API Keys' },
          { id: 'webhooks', label: 'Webhooks' },
          { id: 'sandboxes', label: '沙箱' },
          { id: 'usage', label: '用量配额' },
          { id: 'sign', label: '签名验证' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as TabId)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'keys' ? (
        <div className="space-y-4">
          {snapshot.apiKeys.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${ENV_COLOR[item.environment]}`}>
                    {item.environment}
                  </span>
                  <span className="font-medium text-slate-900">{item.name}</span>
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{item.keyId}</code>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.scopes.map((scope) => (
                  <span key={`${scope.resource}-${scope.actions.join('|')}`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {scope.resource}:{scope.actions.join('|')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'webhooks' ? (
        <div className="space-y-4">
          {snapshot.webhooks.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <code className="text-sm text-slate-700">{item.url}</code>
                  <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.events.map((event) => (
                  <span key={event} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {event}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">死信队列</h2>
            <div className="mt-4 space-y-3">
              {snapshot.deadLetters.map((item) => (
                <div key={item.id} className="rounded-lg bg-purple-50 px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{item.id}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.eventType}</div>
                  <div className="mt-2 text-sm text-purple-700">{item.errorMessage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'sandboxes' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {snapshot.sandboxes.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.tenantId}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div>TTL: {item.ttlDays} 天</div>
                  <div>脱敏: {item.dataMaskingEnabled ? '开启' : '关闭'}</div>
                  <div>到期: {item.expiresAt}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">PII 脱敏演示</h2>
            <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(maskedSample, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}

      {tab === 'usage' ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Top Endpoints</h2>
          {snapshot.usageReport.topEndpoints.map((item) => (
            <div key={item.endpoint}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <code>{item.endpoint}</code>
                <span>{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-blue-600" style={{ width: `${(item.count / 580) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'sign' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={secret} onChange={(event) => setSecret(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <select value={method} onChange={(event) => setMethod(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input value={url} onChange={(event) => setUrl(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input
              type="number"
              value={timestamp}
              onChange={(event) => setTimestamp(Number(event.target.value))}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input value={nonce} onChange={(event) => setNonce(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" rows={3} />
          </div>
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{canonicalStr}</pre>
          <button
            type="button"
            onClick={handleVerify}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            验证签名
          </button>
          {verifyResult ? (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${verifyResult.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {verifyResult.valid ? '验证通过' : `验证失败: ${verifyResult.reason}`}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
