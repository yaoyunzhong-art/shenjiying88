import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'platform-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'platform-client.tsx'), 'utf-8')

describe('dev-tools/platform page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadPlatformSnapshot } from './platform-data'"))
    assert.ok(PAGE_SRC.includes('<PlatformClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })

  it('data 固证 mock 来源', () => {
    assert.ok(DATA_SRC.includes('export async function loadPlatformSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'dev-tools-platform-mock'"))
    assert.ok(DATA_SRC.includes('docItems: DOC_ITEMS'))
  })

  it('client 保留标签切换与刷新交互', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('tabKey'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('开发者接入'))
  })
})
