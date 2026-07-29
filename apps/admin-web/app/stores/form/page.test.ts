import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'store-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'store-form-data.ts'), 'utf-8')

describe('stores/form/page.test.ts 辅助结构固证', () => {
  it('页面源码已迁移为 E54 三层壳', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
  })
})
