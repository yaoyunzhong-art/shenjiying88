import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'brand-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'brand-form-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'brand-new-legacy.tsx'), 'utf-8')

describe('brands/new 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function BrandNewPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadBrandFormSnapshot()'))
    assert.ok(PAGE_SRC.includes('<BrandFormClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'brands:read'"))
  })

  it('client 应保留 router.refresh 刷新链路', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
    assert.ok(CLIENT_SRC.includes('LegacyView'))
  })

  it('data 应定义 mock 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'brand-form-mock'"))
    assert.ok(DATA_SRC.includes('loadBrandFormSnapshot'))
    assert.ok(DATA_SRC.includes('legacy brand create scaffold preserved under E54 wrapper'))
  })

  it('legacy 应保留品牌类型切换与提交行为', () => {
    assert.ok(LEGACY_SRC.includes('BrandTypeTags'))
    assert.ok(LEGACY_SRC.includes('FormPageScaffold'))
    assert.ok(LEGACY_SRC.includes('brand-type-tag-${opt.value}'))
    assert.ok(LEGACY_SRC.includes("router.push('/brands')"))
  })
})
