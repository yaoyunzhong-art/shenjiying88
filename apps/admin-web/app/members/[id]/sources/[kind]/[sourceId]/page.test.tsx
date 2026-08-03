import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-operation-source-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-operation-source-detail-data.ts'), 'utf-8')

describe('members/[id]/sources/[kind]/[sourceId]/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载来源详情快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberOperationSourceDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberOperationSourceDetailSnapshot(memberId, kind, sourceId)'))
    assert.ok(PAGE_SRC.includes('<MemberOperationSourceDetailClient'))
    assert.ok(PAGE_SRC.includes('snapshot={snapshot}'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"))
  })
})

describe('members/[id]/sources/[kind]/[sourceId]/client 结构固证', () => {
  it('client 应保留来源轨迹、批量动作与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleBatchReplay'))
    assert.ok(CLIENT_SRC.includes('handleBatchDecision'))
    assert.ok(CLIENT_SRC.includes('timelineCategory'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
  })
})

describe('members/[id]/sources/[kind]/[sourceId]/data 结构固证', () => {
  it('data 应包装 view-model 快照并补齐来源态字段', () => {
    assert.ok(DATA_SRC.includes('export interface MemberOperationSourceDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadMemberOperationSourceDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadAdminMemberOperationSourceDetail'))
    assert.ok(DATA_SRC.includes('sourceLabel'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })
})
