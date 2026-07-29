import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-operation-receipt-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-operation-receipt-detail-data.ts'), 'utf-8')

describe('members/[id]/receipts/[executionId]/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载回执详情快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberOperationReceiptDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberOperationReceiptDetailSnapshot(memberId, executionId)'))
    assert.ok(PAGE_SRC.includes('<MemberOperationReceiptDetailClient'))
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

describe('members/[id]/receipts/[executionId]/client 结构固证', () => {
  it('client 应保留回执概览、runtime 互链与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleReplay'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
    assert.ok(CLIENT_SRC.includes('buildMemberOperationsRuntimeDetailHref'))
    assert.ok(CLIENT_SRC.includes('runtimeStateColor'))
  })
})

describe('members/[id]/receipts/[executionId]/data 结构固证', () => {
  it('data 应包装 view-model 快照并补齐来源态字段', () => {
    assert.ok(DATA_SRC.includes('export interface MemberOperationReceiptDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadMemberOperationReceiptDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadAdminMemberOperationReceiptDetail'))
    assert.ok(DATA_SRC.includes('sourceLabel'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })
})
