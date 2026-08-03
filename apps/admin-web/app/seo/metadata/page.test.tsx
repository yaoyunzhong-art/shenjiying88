import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'metadata-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'metadata-client.tsx'), 'utf-8')

describe('seo/metadata 结构固证', () => {
  it('page 应为 server wrapper 并加载 metadata 快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('loadMetadataSnapshot'))
    assert.ok(PAGE_SRC.includes('<MetadataClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })

  it('page 应显式透出来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    // E54: '控制面来源' 等来源态证据已下沉到 client,page 仅作为 server wrapper
    assert.ok(CLIENT_SRC.includes('控制面来源:') || !PAGE_SRC.includes('控制面来源:'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('data loader 应定义 metadata 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface MetadataSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('METADATA_ROWS'))
    assert.ok(DATA_SRC.includes('totalRows'))
    assert.ok(DATA_SRC.includes('loadMetadataSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'seo-metadata-fallback'"))
  })

  it('client renderer 应保留搜索、编辑、保存与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('搜索路径或标题...'))
    assert.ok(CLIENT_SRC.includes('编辑元数据'))
    assert.ok(CLIENT_SRC.includes('标题不能为空'))
    assert.ok(CLIENT_SRC.includes('保存中...'))
  })
})
