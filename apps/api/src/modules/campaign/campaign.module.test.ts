import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { CampaignController } from './campaign.controller'
import { CampaignModule } from './campaign.module'
import { CampaignService } from './campaign.service'

test('CampaignModule wires controller, provider, and export', () => {
  const controllers = Reflect.getMetadata('controllers', CampaignModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', CampaignModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', CampaignModule) as unknown[] | undefined

  assert.ok(controllers?.includes(CampaignController))
  assert.ok(providers?.includes(CampaignService))
  assert.ok(exportsList?.includes(CampaignService))
})

test('CampaignModule imports Member and Loyalty modules for plan-driven actions', () => {
  const importsList = Reflect.getMetadata('imports', CampaignModule) as unknown[] | undefined
  const importNames = (importsList ?? []).map((entry) => (entry as { name?: string }).name)
  assert.ok(importNames.includes('MemberModule'))
  assert.ok(importNames.includes('LoyaltyModule'))
})

test('CampaignController is mounted at /campaigns', () => {
  const path = Reflect.getMetadata('path', CampaignController)
  assert.equal(path, 'campaigns')
})

test('CampaignController exposes register, list, get, update, dispatches, evaluate routes', () => {
  const proto = CampaignController.prototype as unknown as Record<string, unknown>
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

  // NestJS RequestMethod enum:
  //   GET = 0, POST = 1, PUT = 2, DELETE = 3, PATCH = 4
  assert.ok(hasRoute(1, '/'), 'POST /campaigns')
  assert.ok(hasRoute(0, '/'), 'GET /campaigns')
  assert.ok(hasRoute(0, ':planId'), 'GET /campaigns/:planId')
  assert.ok(hasRoute(4, ':planId/status'), 'PATCH /campaigns/:planId/status')
  assert.ok(hasRoute(0, ':planId/dispatches'), 'GET /campaigns/:planId/dispatches')
  assert.ok(hasRoute(0, 'dispatches/list'), 'GET /campaigns/dispatches/list')
  assert.ok(hasRoute(1, 'evaluate'), 'POST /campaigns/evaluate')
})
