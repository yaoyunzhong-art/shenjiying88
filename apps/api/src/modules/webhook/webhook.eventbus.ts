/**
 * Phase 95 Webhook 事件总线 (V10 Sprint 2 Day 19)
 *
 * 简化版事件总线 (类似 NestJS EventEmitter)
 * - on(eventType, listener): 订阅特定事件
 * - on('*', listener): 订阅所有事件
 * - emit(payload): 异步触发所有匹配 listener
 */

import type { WebhookEventType, WebhookEventPayload } from './webhook.entity'

type Listener = (payload: WebhookEventPayload) => void | Promise<void>

class WebhookEventBus {
  private readonly listeners = new Map<WebhookEventType, Set<Listener>>()
  private readonly globalListeners = new Set<Listener>()

  on(eventType: WebhookEventType | '*', listener: Listener): void {
    if (eventType === '*') {
      this.globalListeners.add(listener)
      return
    }
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(listener)
  }

  off(eventType: WebhookEventType | '*', listener: Listener): void {
    if (eventType === '*') {
      this.globalListeners.delete(listener)
      return
    }
    this.listeners.get(eventType)?.delete(listener)
  }

  async emit(payload: WebhookEventPayload): Promise<void> {
    const listeners = [
      ...(this.listeners.get(payload.eventType) ?? []),
      ...this.globalListeners,
    ]
    await Promise.allSettled(
      listeners.map((l) => Promise.resolve(l(payload))),
    )
  }

  clear(): void {
    this.listeners.clear()
    this.globalListeners.clear()
  }

  countListeners(eventType?: WebhookEventType): number {
    if (!eventType) {
      let total = this.globalListeners.size
      for (const set of this.listeners.values()) total += set.size
      return total
    }
    return (this.listeners.get(eventType)?.size ?? 0) + this.globalListeners.size
  }
}

/** 单例 */
export const webhookEventBus = new WebhookEventBus()
