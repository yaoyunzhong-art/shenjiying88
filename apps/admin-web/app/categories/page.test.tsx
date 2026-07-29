import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'categories-list-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'categories-list-client.tsx'), 'utf-8')

describe('categories E54 结构固证', () => {
  it('page 应加载分类快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCategoriesListSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<CategoriesListClient snapshot={snapshot} />'))
  })

  it('data loader 应定义分类快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface CategoriesListSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-categories-list-snapshot'"))
    assert.ok(DATA_SRC.includes('MOCK_CATEGORIES'))
  })

  it('client renderer 应支持 router.refresh 与层级筛选', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("scope === 'root'"))
    assert.ok(CLIENT_SRC.includes('新建分类'))
  })
})
