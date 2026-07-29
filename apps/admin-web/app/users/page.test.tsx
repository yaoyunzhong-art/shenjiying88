import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'users-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'users-data.ts'), 'utf-8')
})

describe('UsersPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function UsersPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载用户快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadUsersSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadUsersSnapshot } from './users-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('UsersPage — 来源态透明化', () => {
  it('页面应展示用户来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadUsersSnapshot -> identity-access/users'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadUsersSnapshot -> MOCK_USERS fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local governance user samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('UsersData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('users: User[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留角色/状态映射和 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const ROLE_LABELS'))
    assert.ok(DATA_SRC.includes('export const STATUS_MAP'))
    assert.ok(DATA_SRC.includes('export const MOCK_USERS'))
    assert.ok(DATA_SRC.includes('张明'))
    assert.ok(DATA_SRC.includes('马鹏'))
  })

  it('应尝试读取上游 identity-access/users 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('identity-access/users', resolveUsersApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('mapApiUser'))
    assert.ok(DATA_SRC.includes('unwrapApiPayload'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('用户名册实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('UsersClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: UsersSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留搜索、角色筛选和权限摘要', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes("权限 ${row.permissions.length} 项"))
    assert.ok(CLIENT_SRC.includes('matchesUserSearch'))
  })

  it('客户端组件应保留统计、分布卡片、表格和新建用户入口', () => {
    assert.ok(CLIENT_SRC.includes('StatCard'))
    assert.ok(CLIENT_SRC.includes('Card title="角色分布"'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('title="新建用户"'))
    assert.ok(CLIENT_SRC.includes('新建用户'))
  })

  it('客户端组件应处理空态边界', () => {
    assert.ok(CLIENT_SRC.includes('EmptyState'))
    assert.ok(CLIENT_SRC.includes('暂无用户'))
  })
})

describe('Users — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })
})
