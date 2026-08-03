import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-detail-data.ts'), 'utf-8')

describe('Member detail page structure', () => {
  it('page 应为详情 server wrapper 并消费 params 快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberDetailPageSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<MemberDetailClient snapshot={snapshot} />'))
  })

  it('page 应展示详情来源态证据并保留权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"))
    assert.ok(PAGE_SRC.includes('Delivery {snapshot.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {snapshot.controlPlaneSource}'))
  })

  it('client 应保留 tabs、详情展示与 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'))
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
  })

  it('data 应定义详情快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface MemberDetailPageSnapshot'))
    assert.ok(DATA_SRC.includes('buildMockMember'))
    assert.ok(DATA_SRC.includes('buildPointRecords'))
    assert.ok(DATA_SRC.includes('loadMemberDetailPageSnapshot'))
  })
})
