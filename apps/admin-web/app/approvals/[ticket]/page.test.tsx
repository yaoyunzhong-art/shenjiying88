import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = fs.readFileSync(path.resolve(__dirname, 'approval-detail-client.tsx'), 'utf-8')
const DATA_SRC = fs.readFileSync(path.resolve(__dirname, 'approval-detail-data.ts'), 'utf-8')
const LEGACY_SRC = fs.readFileSync(path.resolve(__dirname, 'approval-detail-legacy.tsx'), 'utf-8')

describe('approvals/[ticket] 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function ApprovalDetailPage'))
    assert.ok(PAGE_SRC.includes('const { ticket } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadApprovalDetailSnapshot(ticket)'))
    assert.ok(PAGE_SRC.includes('<ApprovalDetailClient snapshot={snapshot} />'))
  })

  it('page 应透出来源态证据与刷新策略', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
  })

  it('client 应保留 router.refresh 并桥接 legacy 详情页', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('Promise.resolve({ ticket: snapshot.ticket })'))
    assert.ok(CLIENT_SRC.includes('<ApprovalDetailLegacy params={Promise.resolve({ ticket: snapshot.ticket })} />'))
  })

  it('data 应串联 detail 与 outcome audit 读模型', () => {
    assert.ok(DATA_SRC.includes('loadGovernanceApprovalDetail'))
    assert.ok(DATA_SRC.includes('loadGovernanceApprovalOutcomeAuditLogs'))
    assert.ok(DATA_SRC.includes("sourceLabel: deliveryMode === 'api' ? 'approval-detail-api' : 'approval-detail-fallback'"))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })

  it('legacy 详情页仍保留旧 client 交互实现', () => {
    assert.ok(LEGACY_SRC.includes("'use client'"))
    assert.ok(LEGACY_SRC.includes('useEffect'))
    assert.ok(LEGACY_SRC.includes('decideGovernanceApproval'))
    assert.ok(LEGACY_SRC.includes('resubmitGovernanceApproval'))
  })
})
