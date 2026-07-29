import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = fs.readFileSync(path.resolve(__dirname, 'training-page-client.tsx'), 'utf-8')
const DATA_SRC = fs.readFileSync(path.resolve(__dirname, 'training-page-data.ts'), 'utf-8')
const LEGACY_SRC = fs.readFileSync(path.resolve(__dirname, 'training-legacy.tsx'), 'utf-8')

describe('training 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function TrainingPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTrainingPageSnapshot()'))
    assert.ok(PAGE_SRC.includes('<TrainingPageClient snapshot={snapshot} />'))
  })

  it('page 应透出来源态证据与刷新策略', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('client 应保留 router.refresh 并桥接 legacy 列表页', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    if (
      !CLIENT_SRC.includes("router.refresh()") &&
      !CLIENT_SRC.includes("handleRefresh()") &&
      !CLIENT_SRC.includes("handleRefresh") &&
      !CLIENT_SRC.includes("onRefresh")
    ) {
      assert.fail('E54: client 应保留 router.refresh() OR handleRefresh')
    }
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('<TrainingLegacy />'))
  })

  it('data 应定义 fallback snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface TrainingPageShellSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'training-page-fallback'"))
    assert.ok(DATA_SRC.includes('refreshPath'))
    assert.ok(DATA_SRC.includes('note'))
  })

  it('legacy 列表页仍保留旧 client/mock 交互实现', () => {
    assert.ok(LEGACY_SRC.includes("'use client'"))
    assert.ok(LEGACY_SRC.includes('MOCK_TRAININGS'))
    assert.ok(LEGACY_SRC.includes('filterByTab'))
    assert.ok(LEGACY_SRC.includes('DataTable'))
  })
})
