import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')
const SHELL_CLIENT_SRC = readFileSync(
  resolve(__dirname, 'audit-trail-record-detail-shell-client.tsx'),
  'utf-8',
)
const RENDERER_SRC = readFileSync(resolve(__dirname, 'audit-trail-record-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(__dirname, 'audit-trail-record-detail-data.ts'), 'utf-8')
const VIEW_MODEL_SRC = readFileSync(resolve(__dirname, '../../../audit-trail-detail-view-model.ts'), 'utf-8')

describe('audit-trail/records/[auditId] 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function AuditTrailRecordDetailPage'))
    assert.ok(PAGE_SRC.includes('const resolved = await params'))
    assert.ok(PAGE_SRC.includes('readAuditTrailRecordDetailParam'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAuditTrailRecordDetailSnapshot(auditId)'))
    assert.ok(PAGE_SRC.includes('<AuditTrailRecordDetailShellClient snapshot={snapshot} />'))
  })

  it('page 应透出来源态证据与刷新策略', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('shell client 应保留 router.refresh 并桥接详情 renderer', () => {
    assert.ok(SHELL_CLIENT_SRC.includes("'use client'"))
    assert.ok(SHELL_CLIENT_SRC.includes('router.refresh()'))
    assert.ok(SHELL_CLIENT_SRC.includes('刷新快照'))
    assert.ok(SHELL_CLIENT_SRC.includes('<AuditTrailRecordDetailClient snapshot={snapshot} />'))
  })

  it('data 应复用 audit trail detail view-model', () => {
    assert.ok(DATA_SRC.includes('loadAuditTrailRecordDetail'))
    assert.ok(DATA_SRC.includes('type AuditTrailRecordDetail'))
    assert.ok(DATA_SRC.includes('sourceLabel'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })

  it('renderer 应继续消费 snapshot 并展示关联记录', () => {
    assert.ok(RENDERER_SRC.includes("'use client'"))
    assert.ok(RENDERER_SRC.includes('relatedRecords'))
    assert.ok(RENDERER_SRC.includes('JSON.stringify(record.details, null, 2)'))
    assert.ok(RENDERER_SRC.includes('NotFoundPanel'))
  })

  it('view-model 应保留详情查询与关联记录能力', () => {
    assert.ok(VIEW_MODEL_SRC.includes('export async function loadAuditTrailRecordDetail'))
    assert.ok(VIEW_MODEL_SRC.includes('export interface AuditTrailRecordDetail'))
    assert.ok(VIEW_MODEL_SRC.includes('function pickRelatedRecords'))
    assert.ok(VIEW_MODEL_SRC.includes('workspaceHref'))
  })
})
