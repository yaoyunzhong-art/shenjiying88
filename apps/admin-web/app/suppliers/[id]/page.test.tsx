import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'supplier-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'supplier-detail-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'supplier-detail-legacy.tsx'), 'utf-8')

describe('suppliers/[id] 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SupplierDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSupplierDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<SupplierDetailClient snapshot={snapshot} />'))
  })

  it('page 应展示完整来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'suppliers:id:read'"))
  })

  it('data 应定义 fallback 详情快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'supplier-detail-fallback'"))
    assert.ok(DATA_SRC.includes('id: string'))
    assert.ok(DATA_SRC.includes('supplier-detail-legacy params bridge'))
  })

  it('client 应保留 router.refresh 并桥接 legacy 详情页', () => {
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('Promise.resolve({ id: snapshot.id })'))
  })

  it('legacy 应保留编辑、状态流转与收口动作', () => {
    assert.ok(LEGACY_SRC.includes('TRANSITION_ACTIONS'))
    assert.ok(LEGACY_SRC.includes('保存修改'))
    assert.ok(LEGACY_SRC.includes('DetailActionBar'))
    assert.ok(LEGACY_SRC.includes('buildStandardClosureLinks'))
  })
})
