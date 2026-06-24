import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsModule } from './analytics.module'
import { AnalyticsService } from './analytics.service'

test('AnalyticsModule wires controller, provider, and LoyaltyModule', () => {
  const controllers = Reflect.getMetadata('controllers', AnalyticsModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', AnalyticsModule) as unknown[] | undefined
  const importsList = Reflect.getMetadata('imports', AnalyticsModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', AnalyticsModule) as unknown[] | undefined

  assert.ok(controllers?.includes(AnalyticsController))
  assert.ok(providers?.includes(AnalyticsService))
  assert.ok(exportsList?.includes(AnalyticsService))

  const importNames = (importsList ?? []).map((entry) => (entry as { name?: string }).name)
  assert.ok(importNames.includes('LoyaltyModule'))
})

test('AnalyticsController is mounted at /analytics', () => {
  const path = Reflect.getMetadata('path', AnalyticsController)
  assert.equal(path, 'analytics')
})

test('AnalyticsController exposes snapshot, diagnostics, recommendations routes', () => {
  const proto = AnalyticsController.prototype as unknown as Record<string, unknown>
  const routes: Array<{ method: string; path: string }> = []
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue
    const member = proto[key] as object
    const method = Reflect.getMetadata('method', member)
    const path = Reflect.getMetadata('path', member)
    if (method !== undefined && path !== undefined) {
      routes.push({ method: String(method), path: String(path) })
    }
  }
  const hasRoute = (verb: number, pathValue: string) =>
    routes.some((r) => r.method === String(verb) && r.path === pathValue)

  assert.ok(hasRoute(0, 'snapshot'))
  assert.ok(hasRoute(0, 'diagnostics'))
  assert.ok(hasRoute(0, 'recommendations'))
})
