import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { adminMarketingRoute, getAdminMarketingDashboardSnapshot } from '../marketing-data'
import { createFallbackMarketingWorkbenchState, createMarketingWorkbenchStateFromSnapshot } from './live-dashboard'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')

describe('marketing/page.test.ts', () => {
  it('保留营销路由与快照数据约定', () => {
    assert.equal(adminMarketingRoute.href, '/marketing')
    const snapshot = getAdminMarketingDashboardSnapshot()
    assert.ok(snapshot.generatedAt)
    assert.ok(snapshot.recentCampaigns.length > 0)
  })

  it('保留 live dashboard 映射与 fallback', () => {
    const fallback = createFallbackMarketingWorkbenchState()
    const mapped = createMarketingWorkbenchStateFromSnapshot({})
    assert.deepStrictEqual(mapped, fallback)
  })

  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })
})
