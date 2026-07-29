import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-reports-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'member-reports-data.ts'), 'utf-8')

describe('Member reports page structure', () => {
  it('page 应为 server wrapper 并加载报表快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function MemberReportsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberReportsPageSnapshot()'))
    assert.ok(!PAGE_SRC.includes('const sourceEvidence = {'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<MemberReportsClient snapshot={snapshot} />'))
  })

  it('page 应显式展示来源态证据并保留权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('API字段: {snapshot.apiBackedFields.join'))
    assert.ok(PAGE_SRC.includes('Fallback字段: {snapshot.fallbackFields.join'))
  })

  it('client 应保留 tabs、导出动作与 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('导出报告(PDF)'))
    assert.ok(CLIENT_SRC.includes('RFM分群分析'))
  })

  it('data 应定义报表快照合同与 totals 聚合', () => {
    assert.ok(DATA_SRC.includes('export interface MemberReportsPageSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('buildMemberMetrics'))
    assert.ok(DATA_SRC.includes('buildLiveRfmSegments'))
    assert.ok(DATA_SRC.includes('computeMemberReportsTotals'))
    assert.ok(DATA_SRC.includes('loadMemberReportsPageSnapshot'))
  })
})
