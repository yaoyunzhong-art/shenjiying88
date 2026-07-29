import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'brand-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'brand-client.tsx'), 'utf-8')

describe('dev-tools/brand page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadBrandSnapshot } from './brand-data'"))
    assert.ok(PAGE_SRC.includes('<BrandClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('data 固证 mock 来源', () => {
    assert.ok(DATA_SRC.includes('export async function loadBrandSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'dev-tools-brand-mock'"))
    assert.ok(DATA_SRC.includes('brands: BRANDS'))
  })

  it('client 保留交互与刷新', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('搜索品牌'))
    assert.ok(CLIENT_SRC.includes('Table'))
    assert.ok(CLIENT_SRC.includes('Statistic'))
  })
})
