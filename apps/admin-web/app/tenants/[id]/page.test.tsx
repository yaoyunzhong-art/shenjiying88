import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'tenant-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'tenant-detail-data.ts'), 'utf-8')

describe('tenants/[id] 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTenantDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<TenantDetailClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'tenant:read'"))
  })

  it('page 不应再承载旧单文件编辑实现', () => {
    assert.ok(!PAGE_SRC.includes('useState'))
    assert.ok(!PAGE_SRC.includes('validateForm('))
    assert.ok(!PAGE_SRC.includes('submitTenantEdit('))
    assert.ok(!PAGE_SRC.includes('DetailShell'))
  })

  it('client 应承接刷新与编辑交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('useFormSubmit'))
    assert.ok(CLIENT_SRC.includes('validateForm'))
    assert.ok(CLIENT_SRC.includes('submitTenantEdit'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义租户详情快照合同与表单能力', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'tenant-detail-mock'"))
    assert.ok(DATA_SRC.includes('export interface TenantDetailSnapshot'))
    assert.ok(DATA_SRC.includes('getTenantById'))
    assert.ok(DATA_SRC.includes('validateForm'))
    assert.ok(DATA_SRC.includes('submitTenantEdit'))
    assert.ok(DATA_SRC.includes('loadTenantDetailSnapshot'))
  })
})
