import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'audit-logs-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'audit-logs-data.ts'), 'utf-8')

describe('audit-logs E54 结构固证', () => {
  it('page 为服务端包装层并加载快照', () => {
    assert.equal(PAGE_SRC.includes("'use client'"), false)
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('loadAuditLogsPageSnapshot'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAuditLogsPageSnapshot()'))
    assert.ok(PAGE_SRC.includes('<AuditLogsClient snapshot={snapshot} />'))
  })

  it('page 显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('client 承担交互并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("type=\"text\""))
    assert.ok(CLIENT_SRC.includes('filterLogs(snapshot.logs, tab, searchQuery)'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"))
  })

  it('data 提供 E54 快照契约与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface AuditLogsPageSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'audit-logs-mock'"))
    assert.ok(DATA_SRC.includes('DEFAULT_LOGS'))
    assert.ok(DATA_SRC.includes('computeStats(DEFAULT_LOGS)'))
    assert.ok(DATA_SRC.includes('failureCount'))
  })
})
