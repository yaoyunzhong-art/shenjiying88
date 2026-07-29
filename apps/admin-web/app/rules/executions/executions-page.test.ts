import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')

describe('RuleExecutionsPage smoke', () => {
  it('应为 async server component 并接入来源态', () => {
    assert.ok(PAGE_SRC.includes('export default async function RuleExecutionsPage'))
    assert.ok(PAGE_SRC.includes('loadRuleExecutionsSnapshot'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })

  it('应接入权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'rules:executions:read'"))
  })
})
