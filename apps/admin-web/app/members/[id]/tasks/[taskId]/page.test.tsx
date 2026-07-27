import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-operation-task-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-operation-task-detail-data.ts'), 'utf-8')

describe('members/[id]/tasks/[taskId]/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载运营任务详情快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberOperationTaskDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberOperationTaskDetailSnapshot(memberId, taskId)'))
    assert.ok(
      PAGE_SRC.includes(
        '<MemberOperationTaskDetailClient snapshot={snapshot} memberId={memberId} taskId={taskId} />'
      )
    )
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

describe('members/[id]/tasks/[taskId]/client 结构固证', () => {
  it('client 应保留任务概览、回执列表与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('ListPanel'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
    assert.ok(CLIENT_SRC.includes('buildMemberOperationsReceiptDetailHref'))
    assert.ok(CLIENT_SRC.includes('TaskLinkCard'))
  })
})

describe('members/[id]/tasks/[taskId]/data 结构固证', () => {
  it('data 应包装 view-model 快照并补齐来源态字段', () => {
    assert.ok(DATA_SRC.includes('export interface MemberOperationTaskDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadMemberOperationTaskDetailSnapshot'))
    assert.ok(DATA_SRC.includes('loadAdminMemberOperationTaskDetail'))
    assert.ok(DATA_SRC.includes('sourceLabel'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })
})
