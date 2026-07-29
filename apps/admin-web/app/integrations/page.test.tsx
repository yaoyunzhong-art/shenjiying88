import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'integrations-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'integrations-data.ts'), 'utf-8')
})

describe('IntegrationsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function IntegrationsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 integrations 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadIntegrationsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadIntegrationsSnapshot } from './integrations-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'integrations:read'"))
  })
})

describe('IntegrationsPage — 来源态透明化', () => {
  it('页面应展示第三方集成来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadIntegrationsSnapshot -> openapi/integrations'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadIntegrationsSnapshot -> defaultIntegrations fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local integrations samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('IntegrationsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('integrations: Integration[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultIntegrations'))
    assert.ok(DATA_SRC.includes('微信支付'))
    assert.ok(DATA_SRC.includes('美团外卖'))
    assert.ok(DATA_SRC.includes('自建CRM'))
  })

  it('应尝试读取上游 openapi/integrations 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('openapi/integrations', resolveIntegrationsApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ integrations: Integration[] }>'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('第三方集成实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('IntegrationsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: IntegrationsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 tabs、列表和空态', () => {
    assert.ok(CLIENT_SRC.includes("type IntTab = 'active' | 'inactive' | 'all'"))
    assert.ok(CLIENT_SRC.includes('活跃'))
    assert.ok(CLIENT_SRC.includes('全部'))
    assert.ok(CLIENT_SRC.includes('暂无集成'))
    assert.ok(CLIENT_SRC.includes('filtered.length === 0'))
  })

  it('客户端组件应保留 provider、type、status 展示', () => {
    assert.ok(CLIENT_SRC.includes('providerLabel'))
    assert.ok(CLIENT_SRC.includes('typeLabel'))
    assert.ok(CLIENT_SRC.includes('statusLabel'))
    assert.ok(CLIENT_SRC.includes('statusColor'))
  })

  it('客户端组件应保留同步状态、端点数量和错误提示展示', () => {
    assert.ok(CLIENT_SRC.includes('syncLabel'))
    assert.ok(CLIENT_SRC.includes('上次同步:'))
    assert.ok(CLIENT_SRC.includes('Endpoint:'))
    assert.ok(CLIENT_SRC.includes('integration.errorMessage'))
  })
})

describe('Integrations — 反例与边界', () => {
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

  it('客户端应处理当前筛选为空的边界', () => {
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有第三方集成'))
  })
})
