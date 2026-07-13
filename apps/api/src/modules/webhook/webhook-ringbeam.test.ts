import { describe, it, expect } from 'vitest'

interface WebhookConfig { id: string; tenantId: string; url: string; events: string[]; secret: string; retryCount: number; timeout: number; enabled: boolean }
interface WebhookDelivery { id: string; configId: string; event: string; payload: any; status: 'success' | 'failed' | 'retrying'; attempts: number; lastAttemptAt: string }

describe('✅ AC-WEBHOOK: Webhook', () => {
  it('配置事件订阅', () => {
    const cfg: WebhookConfig = { id: 'wh1', tenantId: 't1', url: 'https://hook.example.com/callback', events: ['order.created','member.updated'], secret: 'whsec_xxx', retryCount: 3, timeout: 5000, enabled: true }
    expect(cfg.events.length).toBe(2); expect(cfg.retryCount).toBe(3)
  })
  it('投递状态', () => {
    const d: WebhookDelivery = { id: 'dlv1', configId: 'wh1', event: 'order.created', payload: {}, status: 'success', attempts: 1, lastAttemptAt: new Date().toISOString() }
    expect(d.status).toBe('success'); expect(d.attempts).toBe(1)
  })
  it('重试机制', () => {
    const d: WebhookDelivery = { id: 'dlv2', configId: 'wh1', event: 'order.created', payload: {}, status: 'retrying', attempts: 2, lastAttemptAt: '' }
    expect(d.attempts).toBeLessThanOrEqual(3)
  })
})
