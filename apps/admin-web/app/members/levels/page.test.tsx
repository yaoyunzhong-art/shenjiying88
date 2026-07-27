import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-levels-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-levels-data.ts'), 'utf-8')

describe('members/levels/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载等级列表快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberLevelsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberLevelsSnapshot()'))
    assert.ok(PAGE_SRC.includes('<MemberLevelsClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'member:read'"))
  })
})

describe('members/levels/client 结构固证', () => {
  it('client 应保留筛选、创建、删除与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useSearchFilter'))
    assert.ok(CLIENT_SRC.includes('handleCreateLevel'))
    assert.ok(CLIENT_SRC.includes('setDeleteDialogOpen(true)'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
  })
})

describe('members/levels/data 结构固证', () => {
  it('data 应定义等级列表快照合同与创建校验', () => {
    assert.ok(DATA_SRC.includes('export interface MemberLevelsSnapshot'))
    assert.ok(DATA_SRC.includes('export const DEFAULT_CREATE_FORM'))
    assert.ok(DATA_SRC.includes('export function validateCreateLevelForm'))
    assert.ok(DATA_SRC.includes('export function normalizeLevelConfig'))
    assert.ok(DATA_SRC.includes('loadMemberLevelsSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'members-levels-fallback'"))
  })
})
