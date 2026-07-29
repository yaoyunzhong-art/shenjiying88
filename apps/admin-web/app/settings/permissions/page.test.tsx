import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'permissions-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'permissions-data.ts'), 'utf-8')
})

describe('PermissionsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function PermissionsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 permissions 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPermissionsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadPermissionsSnapshot } from './permissions-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('sourceLabel: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('PermissionsData — 快照合同', () => {
  it('应定义 fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'permissions-fallback'"))
    assert.ok(DATA_SRC.includes('roles: PermissionRolePreview[]'))
    assert.ok(DATA_SRC.includes('inheritanceRules: string[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留角色样本与治理说明', () => {
    assert.ok(DATA_SRC.includes('系统管理员'))
    assert.ok(DATA_SRC.includes('运营经理'))
    assert.ok(DATA_SRC.includes('浏览者'))
    assert.ok(DATA_SRC.includes('DEFAULT_GOVERNANCE_NOTES'))
    assert.ok(DATA_SRC.includes('fallback 样本'))
  })
})

describe('PermissionsClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留角色定义、权限继承规则与治理备注', () => {
    assert.ok(CLIENT_SRC.includes('角色定义'))
    assert.ok(CLIENT_SRC.includes('权限继承规则'))
    assert.ok(CLIENT_SRC.includes('治理备注'))
    assert.ok(CLIENT_SRC.includes('roles.map'))
  })
})
