import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-workspace-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-data.ts'), 'utf-8')
})

describe('IntegrationOrchestrationPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function IntegrationOrchestrationPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载服务端快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadIntegrationOrchestrationPageSnapshot } from './integration-orchestration-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadIntegrationOrchestrationPageSnapshot({'))
    assert.ok(PAGE_SRC.includes('<IntegrationOrchestrationWorkspaceClient'))
    assert.ok(PAGE_SRC.includes('foundationDependencies={snapshot.foundationDependencies}'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('IntegrationOrchestrationPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 语义（DATA 层仍承担）', () => {
    assert.ok(DATA_SRC.includes('loadIntegrationOrchestrationWorkspace(api) + getAdminWorkbenchConsumerSnapshot(api)'))
    assert.ok(DATA_SRC.includes('loadIntegrationOrchestrationWorkspace/getAdminWorkbenchConsumerSnapshot fallback'))
    assert.ok(DATA_SRC.includes('local integration orchestration samples'))
    assert.ok(DATA_SRC.includes('治理证据需结合上游可达性复核'))
  })
})

describe('IntegrationOrchestrationData — 快照合同', () => {
  it('应组合 workspace 与 workbench bootstrap 快照', () => {
    assert.ok(DATA_SRC.includes("loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' })"))
    assert.ok(DATA_SRC.includes('getAdminWorkbenchConsumerSnapshot()'))
    assert.ok(DATA_SRC.includes('foundationDependencies: [...workbenchSnapshot.foundationDependencies]'))
    assert.ok(DATA_SRC.includes('consumerDescriptor: workbenchSnapshot.consumerDescriptor'))
  })

  it('应显式暴露双来源 delivery mode', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("workspaceDeliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("bootstrapDeliveryMode: 'api' | 'fallback'"))
    assert.ok(
      DATA_SRC.includes(
        'integration-orchestration-workspace:${workspaceSnapshot.deliveryMode}|workbench:${workbenchSnapshot.deliveryMode}'
      )
    )
  })
})

describe('IntegrationOrchestrationWorkspaceClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh")), "E54: router.refresh() OR handleRefresh")
  })

  it('客户端组件应保留 tabs、搜索与工作台收口动作', () => {
    assert.ok(CLIENT_SRC.includes("type TabKey = 'overview' | 'sources' | 'events' | 'idempotency'"))
    assert.ok(CLIENT_SRC.includes('setActiveTab'))
    if (
      !CLIENT_SRC.includes('SearchFilterInput') &&
      !CLIENT_SRC.includes('SearchFilter') &&
      !CLIENT_SRC.includes('SearchInput') &&
      !CLIENT_SRC.includes('searchKeyword')
    ) {
      assert.fail('E54: client 应保留搜索/筛选输入控件')
    }
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
  })
})
