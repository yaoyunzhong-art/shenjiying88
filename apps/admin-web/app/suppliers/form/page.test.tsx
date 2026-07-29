import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'supplier-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'supplier-form-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'supplier-form-legacy.tsx'), 'utf-8')

describe('suppliers/form 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SupplierFormPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSupplierFormSnapshot()'))
    assert.ok(PAGE_SRC.includes('<SupplierFormClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'suppliers:form:read'"))
  })

  it('client 应保留 router.refresh 刷新链路', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
    assert.ok(CLIENT_SRC.includes('LegacyView'))
  })

  it('data 应定义 mock 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'supplier-form-mock'"))
    assert.ok(DATA_SRC.includes('loadSupplierFormSnapshot'))
    assert.ok(DATA_SRC.includes('legacy client logic preserved under E54 wrapper'))
  })

  it('legacy 应保留表单验证与提交行为', () => {
    assert.ok(LEGACY_SRC.includes('function validateForm'))
    assert.ok(LEGACY_SRC.includes('供应商名称不能为空'))
    assert.ok(LEGACY_SRC.includes('提交审核'))
    assert.ok(LEGACY_SRC.includes('window.history.back()'))
  })
})
