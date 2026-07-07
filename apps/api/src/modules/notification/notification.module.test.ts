import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [notification] [D] module 测试补全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MetricsModule } from '../observability/metrics.module'
import { NotificationController } from './notification.controller'
import { NotificationModule } from './notification.module'
import { NotificationService } from './notification.service'

it('NotificationModule wires controller, provider, and export', () => {
  const importsList = Reflect.getMetadata('imports', NotificationModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', NotificationModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', NotificationModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', NotificationModule) as unknown[] | undefined

  assert.ok(importsList?.includes(MetricsModule))
  assert.ok(controllers?.includes(NotificationController))
  assert.ok(providers?.includes(NotificationService))
  assert.ok(exportsList?.includes(NotificationService))
})

it('NotificationModule 导入 MetricsModule 支撑 observability', () => {
  const importsList = Reflect.getMetadata('imports', NotificationModule) as unknown[] | undefined
  assert.ok(importsList?.includes(MetricsModule))
})

it('NotificationController is mounted at /notifications', () => {
  const path = Reflect.getMetadata('path', NotificationController)
  assert.equal(path, 'notifications')
})

it('NotificationController exposes template + dispatch routes', () => {
  const proto = NotificationController.prototype as unknown as Record<string, unknown>
  const routes: Array<{ method: string; path: string; handler: string }> = []
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue
    const member = proto[key] as object
    const method = Reflect.getMetadata('method', member)
    const path = Reflect.getMetadata('path', member)
    if (method !== undefined && path !== undefined) {
      routes.push({ method: String(method), path: String(path), handler: key })
    }
  }
  const hasRoute = (verb: number, pathValue: string) =>
    routes.some((r) => r.method === String(verb) && r.path === pathValue)

  // NestJS RequestMethod enum: GET=0, POST=1, PUT=2, DELETE=3, PATCH=4
  assert.ok(hasRoute(1, 'templates'), 'POST /notifications/templates')
  assert.ok(hasRoute(0, 'templates'), 'GET /notifications/templates')
  assert.ok(hasRoute(0, 'templates/:id'), 'GET /notifications/templates/:id')
  assert.ok(hasRoute(4, 'templates/:id'), 'PATCH /notifications/templates/:id') // PATCH=4 in NestJS
  assert.ok(hasRoute(1, 'send'), 'POST /notifications/send')
  assert.ok(hasRoute(0, 'dispatches'), 'GET /notifications/dispatches')
  assert.ok(hasRoute(0, 'dispatches/:id'), 'GET /notifications/dispatches/:id')
  assert.ok(hasRoute(1, 'dispatches/:id/retry'), 'POST /notifications/dispatches/:id/retry')
  assert.ok(hasRoute(1, 'dispatches/:id/cancel'), 'POST /notifications/dispatches/:id/cancel')
})
