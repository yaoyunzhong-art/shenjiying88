/**
 * Phase 95 Webhook 平台适配器 (V10 Sprint 2 Day 19)
 *
 * 4 个适配器 (策略模式):
 * - Feishu (飞书): X-Lark-Signature
 * - DingTalk (钉钉): Sign (URL-safe base64)
 * - WeCom (企微): msg_signature (SHA1)
 * - Generic (通用): X-Webhook-Signature (HMAC-SHA256 hex)
 */

import * as crypto from 'node:crypto'
import type { WebhookPlatform, WebhookEventPayload } from './webhook.entity'

export interface PlatformAdapter {
  platform: WebhookPlatform
  sign(body: string, secret: string): string
  format(payload: WebhookEventPayload): Record<string, unknown>
  validateUrl(url: string): { valid: boolean; error?: string }
  isSuccess(statusCode: number): boolean
}

export const feishuAdapter: PlatformAdapter = {
  platform: 'feishu',
  sign(body, secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const stringToSign = `${timestamp}\n${body}`
    const hmac = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64')
    return `${timestamp},${hmac}`
  },
  format(payload) {
    return {
      msg_type: 'interactive',
      card: {
        header: { title: { tag: 'plain_text', content: getEventTitle(payload.eventType) } },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: `**事件**: ${payload.eventType}\n**时间**: ${payload.timestamp}\n${JSON.stringify(payload.data, null, 2)}`,
            },
          },
        ],
      },
      ...payload,
    }
  },
  validateUrl(url) {
    if (!url.startsWith('https://open.feishu.cn/')) {
      return { valid: false, error: '飞书 URL 必须以 https://open.feishu.cn/ 开头' }
    }
    return { valid: true }
  },
  isSuccess(statusCode) {
    return statusCode >= 200 && statusCode < 300
  },
}

export const dingtalkAdapter: PlatformAdapter = {
  platform: 'dingtalk',
  sign(body, secret) {
    const timestamp = Date.now().toString()
    const stringToSign = `${timestamp}\n${secret}`
    const hmac = crypto.createHmac('sha256', secret).update(stringToSign).digest()
    return `${timestamp},${hmac.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
  },
  format(payload) {
    return {
      msgtype: 'markdown',
      markdown: {
        title: getEventTitle(payload.eventType),
        text: `### ${getEventTitle(payload.eventType)}\n\n**事件**: ${payload.eventType}\n**时间**: ${payload.timestamp}\n\n${JSON.stringify(payload.data, null, 2)}`,
      },
      ...payload,
    }
  },
  validateUrl(url) {
    if (!url.startsWith('https://oapi.dingtalk.com/')) {
      return { valid: false, error: '钉钉 URL 必须以 https://oapi.dingtalk.com/ 开头' }
    }
    if (!url.includes('access_token=')) {
      return { valid: false, error: '钉钉 URL 必须包含 access_token= 参数' }
    }
    return { valid: true }
  },
  isSuccess(statusCode) {
    return statusCode >= 200 && statusCode < 300
  },
}

export const wecomAdapter: PlatformAdapter = {
  platform: 'wecom',
  sign(body, secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const sha1 = crypto.createHash('sha1').update(timestamp + secret + body).digest('hex')
    return `${timestamp},${sha1}`
  },
  format(payload) {
    return {
      msgtype: 'markdown',
      markdown: {
        content: `## ${getEventTitle(payload.eventType)}\n\n> 事件: <font color="comment">${payload.eventType}</font>\n> 时间: ${payload.timestamp}\n\n\`\`\`json\n${JSON.stringify(payload.data, null, 2)}\n\`\`\``,
      },
    }
  },
  validateUrl(url) {
    if (!url.startsWith('https://qyapi.weixin.qq.com/')) {
      return { valid: false, error: '企微 URL 必须以 https://qyapi.weixin.qq.com/ 开头' }
    }
    return { valid: true }
  },
  isSuccess(statusCode) {
    return statusCode >= 200 && statusCode < 300
  },
}

export const genericAdapter: PlatformAdapter = {
  platform: 'generic',
  sign(body, secret) {
    return crypto.createHmac('sha256', secret).update(body).digest('hex')
  },
  format(payload) {
    return payload as unknown as Record<string, unknown>
  },
  validateUrl(url) {
    try {
      const u = new URL(url)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') {
        return { valid: false, error: 'URL 必须使用 http(s) 协议' }
      }
      return { valid: true }
    } catch {
      return { valid: false, error: 'URL 格式不合法' }
    }
  },
  isSuccess(statusCode) {
    return statusCode >= 200 && statusCode < 300
  },
}

export const PLATFORM_ADAPTERS: Record<WebhookPlatform, PlatformAdapter> = {
  feishu: feishuAdapter,
  dingtalk: dingtalkAdapter,
  wecom: wecomAdapter,
  generic: genericAdapter,
}

export function getAdapter(platform: WebhookPlatform): PlatformAdapter {
  const adapter = PLATFORM_ADAPTERS[platform]
  if (!adapter) {
    throw new Error(`Unknown webhook platform: ${platform}`)
  }
  return adapter
}

function getEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    'license.expired': 'License 已过期',
    'canary.created': '灰度实验创建',
    'canary.promoted': '灰度晋级',
    'canary.rolled_back': '灰度回滚',
    'canary.completed': '灰度完成',
    'monitoring.alert.fired': '监控告警',
    'monitoring.alert.resolved': '告警恢复',
    'insight.generated': 'AI 洞察',
    'tenant.config.updated': '配置变更',
  }
  return titles[eventType] ?? eventType
}
