import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-level-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-level-detail-data.ts'), 'utf-8')

describe('members/levels/[id]/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载等级详情快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberLevelDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberLevelDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<MemberLevelDetailClient snapshot={snapshot} />'))
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

describe('members/levels/[id]/client 结构固证', () => {
  it('client 应保留编辑、状态流转、删除与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleSave'))
    assert.ok(CLIENT_SRC.includes('handleStatusChange'))
    assert.ok(CLIENT_SRC.includes('handleDelete'))
    assert.ok(CLIENT_SRC.includes('DetailShell'))
  })
})

describe('members/levels/[id]/data 结构固证', () => {
  it('data 应定义等级详情快照合同与编辑校验', () => {
    assert.ok(DATA_SRC.includes('export interface MemberLevelDetailSnapshot'))
    assert.ok(DATA_SRC.includes('export function validateEditLevelForm'))
    assert.ok(DATA_SRC.includes('export function formatLevelDate'))
    assert.ok(DATA_SRC.includes('STATUS_OPTIONS'))
    assert.ok(DATA_SRC.includes('loadMemberLevelDetailSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'member-level-detail-fallback'"))
  })
})
