import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'dev-tools-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'dev-tools-data.ts'), 'utf-8')
})

describe('DevToolsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function DevToolsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应读取 dev-tools 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes("import { loadDevToolsSnapshot } from './dev-tools-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadDevToolsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入权限门禁与来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'dev-tools:read'"))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('DevToolsData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('entries: DevToolEntry[]'))
    assert.ok(DATA_SRC.includes('recentActivities: DevToolsActivity[]'))
    assert.ok(DATA_SRC.includes('environments: DevEnvironmentStatus[]'))
    assert.ok(DATA_SRC.includes('services: DevServiceStatus[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义本地样本与加载器', () => {
    assert.ok(DATA_SRC.includes('export const defaultDevToolEntries'))
    assert.ok(DATA_SRC.includes('export const defaultRecentActivities'))
    assert.ok(DATA_SRC.includes('export const defaultEnvironments'))
    assert.ok(DATA_SRC.includes('export const defaultServiceStatuses'))
    assert.ok(DATA_SRC.includes('export async function loadDevToolsSnapshot'))
  })
})

describe('DevToolsClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留搜索、分类和快照展示', () => {
    assert.ok(CLIENT_SRC.includes('searchQuery'))
    assert.ok(CLIENT_SRC.includes('categoryFilter'))
    assert.ok(CLIENT_SRC.includes('filterEntries'))
    assert.ok(CLIENT_SRC.includes('snapshot.recentActivities.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.environments.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.services.map'))
  })
})
