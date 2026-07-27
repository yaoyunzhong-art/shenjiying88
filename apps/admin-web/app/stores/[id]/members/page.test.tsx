import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'members-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'members-data.ts'), 'utf-8')

describe('stores/[id]/members/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载会员快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MembersPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMembersSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<MembersClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/members/client 结构固证', () => {
  it('client 应保留筛选、详情、等级分布与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('会员列表'))
    assert.ok(CLIENT_SRC.includes('等级分布'))
    assert.ok(CLIENT_SRC.includes('新增会员'))
  })
})

describe('stores/[id]/members/data 结构固证', () => {
  it('data 应定义会员快照合同与等级样本', () => {
    assert.ok(DATA_SRC.includes('export interface MembersSnapshot'))
    assert.ok(DATA_SRC.includes('MEMBER_LEVELS'))
    assert.ok(DATA_SRC.includes('MEMBER_RECORDS'))
    assert.ok(DATA_SRC.includes('buildMembersSummary'))
    assert.ok(DATA_SRC.includes('loadMembersSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-members-mock'"))
  })
})
