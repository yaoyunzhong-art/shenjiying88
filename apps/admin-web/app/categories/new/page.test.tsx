import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'new-category-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'new-category-client.tsx'), 'utf-8')

describe('categories/new E54 结构固证', () => {
  it('page 应加载新建分类快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadNewCategorySnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<NewCategoryClient snapshot={snapshot} />'))
  })

  it('data loader 应定义新建分类快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface NewCategorySnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-new-category-snapshot'"))
    assert.ok(DATA_SRC.includes('getCategoryUniqueParents'))
  })

  it('client renderer 应支持 router.refresh 与表单校验', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleSubmit'))
    assert.ok(CLIENT_SRC.includes('创建分类'))
  })
})
