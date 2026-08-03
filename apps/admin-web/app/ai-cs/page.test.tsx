import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'ai-cs-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'ai-cs-data.ts'), 'utf-8')

describe('AiCs page structure', () => {
  it('page 应为 server wrapper 并消费 snapshot loader', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function AiCsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAiCsSnapshot'))
    assert.ok(PAGE_SRC.includes('<AiCsClient snapshot={snapshot} />'))
  })

  it('page 应展示来源态证据（E54 拍平：已下沉到 client）', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {snapshot.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {snapshot.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {snapshot.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('client 应保留交互并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("'刷新中...' : '刷新快照'"))
  })

  it('data 应定义快照合同与 fallback 来源', () => {
    assert.ok(DATA_SRC.includes('export interface AiCsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'ai-cs-fallback-snapshot'"))
    assert.ok(DATA_SRC.includes('loadAiCsSnapshot'))
  })
})
