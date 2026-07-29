/**
 * admin/tenants/page.test.tsx — 租户配额管理页面源码级固证
 * E54 拍平后：page.tsx 是 server wrapper，render 业务下沉到 TenantsClient。
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'tenants-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, '../../tenants-data.ts'), 'utf-8')

describe('admin/tenants page — E54 结构', () => {
  it('page 为最小 server wrapper', () => {
    assert.ok(PAGE_SRC.includes('export default async function AdminTenantsPage'))
    assert.ok(PAGE_SRC.includes('loadTenantsSnapshot'))
    assert.ok(PAGE_SRC.includes('<TenantsClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('page 不再含权限门禁与 sourceEvidence 模板', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'admin.tenants.read'"), 'E54 拍平：requiredPermission 应已移除')
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('admin/tenants client — 业务壳层下沉', () => {
  it('client 保留 use client 与刷新钩子', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useSnapshotRefresh'))
  })
})

describe('admin/tenants data — 快照合同', () => {
  it('data 暴露 loadTenantsSnapshot', () => {
    assert.ok(DATA_SRC.includes('export function loadTenantsSnapshot') || DATA_SRC.includes('export async function loadTenantsSnapshot'))
  })
})
