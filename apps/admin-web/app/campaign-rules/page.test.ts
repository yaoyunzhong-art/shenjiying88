import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')

describe('CampaignRulesPage smoke', () => {
  it('应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CampaignRulesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('应接入权限边界与来源态证据', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'campaign-rules:read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
  })
})
