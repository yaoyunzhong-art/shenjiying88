/**
 * Phase 95 Webhook 创建表单 (V10 Sprint 2 Day 21)
 */

import React, { useState } from 'react'
import { useCreateWebhook } from './useWebhook'
import {
  PLATFORM_LABELS,
  EVENT_LABELS,
  ALL_EVENTS,
  type WebhookPlatform,
  type WebhookEventType,
} from './types'

export interface WebhookFormProps {
  onSuccess?: (id: string) => void
  onCancel?: () => void
}

const PLATFORM_URL_PREFIX: Record<WebhookPlatform, string> = {
  feishu: 'https://open.feishu.cn/open-apis/bot/v2/hook/',
  dingtalk: 'https://oapi.dingtalk.com/robot/send?access_token=',
  wecom: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=',
  generic: 'https://',
}

export function WebhookForm({ onSuccess, onCancel }: WebhookFormProps) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<WebhookPlatform>('feishu')
  const [url, setUrl] = useState(PLATFORM_URL_PREFIX.feishu)
  const [secret, setSecret] = useState('')
  const [maxRetries, setMaxRetries] = useState(3)
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(new Set())
  const create = useCreateWebhook()

  const handlePlatformChange = (p: WebhookPlatform) => {
    setPlatform(p)
    setUrl(PLATFORM_URL_PREFIX[p])
  }

  const toggleEvent = (e: WebhookEventType) => {
    const next = new Set(selectedEvents)
    if (next.has(e)) next.delete(e)
    else next.add(e)
    setSelectedEvents(next)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!name || !url || !secret || selectedEvents.size === 0) return
    const result = await create.mutateAsync({
      name,
      platform,
      url,
      secret,
      events: Array.from(selectedEvents),
      maxRetries,
      description: description || undefined,
    })
    onSuccess?.(result.id)
  }

  return (
    <form
      data-testid="webhook-form"
      onSubmit={handleSubmit}
      style={{ padding: 16, maxWidth: 600 }}
    >
      <h2 style={{ margin: '0 0 16px' }}>新建 Webhook</h2>

      <Field label="名称">
        <input
          type="text"
          data-testid="input-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="平台">
        <select
          data-testid="select-platform"
          value={platform}
          onChange={(e) => handlePlatformChange(e.target.value as WebhookPlatform)}
          style={inputStyle}
        >
          {(Object.keys(PLATFORM_LABELS) as WebhookPlatform[]).map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>
      </Field>

      <Field label="URL">
        <input
          type="url"
          data-testid="input-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Secret (HMAC 密钥)">
        <input
          type="password"
          data-testid="input-secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
      </Field>

      <Field label="最大重试次数">
        <input
          type="number"
          data-testid="input-max-retries"
          value={maxRetries}
          min={0}
          max={10}
          onChange={(e) => setMaxRetries(Number(e.target.value))}
          style={inputStyle}
        />
      </Field>

      <Field label="描述 (可选)">
        <input
          type="text"
          data-testid="input-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="订阅事件">
        <div data-testid="events-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_EVENTS.map((e) => (
            <label
              key={e}
              data-testid={`event-toggle-${e}`}
              data-checked={selectedEvents.has(e) ? 'true' : 'false'}
              style={{
                padding: '4px 10px',
                border: `1px solid ${selectedEvents.has(e) ? '#3b82f6' : '#cbd5e1'}`,
                background: selectedEvents.has(e) ? '#eff6ff' : '#fff',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={selectedEvents.has(e)}
                onChange={() => toggleEvent(e)}
                style={{ marginRight: 4 }}
              />
              {EVENT_LABELS[e]}
            </label>
          ))}
        </div>
      </Field>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          data-testid="btn-submit"
          disabled={create.isPending}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: create.isPending ? 'wait' : 'pointer',
          }}
        >
          {create.isPending ? '创建中...' : '创建'}
        </button>
        {onCancel && (
          <button
            type="button"
            data-testid="btn-cancel"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  fontSize: 14,
}
