import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'maintenance-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'maintenance-data.ts'), 'utf-8')
})

describe('MaintenancePage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function MaintenancePage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 maintenance 快照并导出动态配置', () => {
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadMaintenanceSnapshot()'))
    assert.ok(!PAGE_SRC.includes(")import { loadMaintenanceSnapshot } from './maintenance-data'"))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'maintenance:read'"))
  })
})

describe('MaintenancePage — 来源态透明化', () => {
  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadMaintenanceSnapshot -> logistics-management/maintenance-tasks'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadMaintenanceSnapshot -> defaultTasks fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes(')local maintenance task samples'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('MaintenanceData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('tasks: MaintenanceTask[]'))
    assert.ok(DATA_SRC.includes('stats: MaintenanceStatsSnapshot'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留 fallback 样本与统计函数', () => {
    assert.ok(DATA_SRC.includes('export const defaultTasks'))
    assert.ok(DATA_SRC.includes('北京朝阳店'))
    assert.ok(DATA_SRC.includes('computeMaintenanceStats'))
    assert.ok(DATA_SRC.includes('critical: tasks.filter'))
  })

  it('应尝试读取上游 maintenance-tasks 接口并在失败时回退', () => {
    assert.ok(DATA_SRC.includes("new URL("))
    assert.ok(DATA_SRC.includes("'logistics-management/maintenance-tasks'"))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('后勤维护实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('MaintenanceClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留统计卡、tab 筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes('任务总数'))
    assert.ok(CLIENT_SRC.includes('待处理'))
    assert.ok(CLIENT_SRC.includes('进行中'))
    assert.ok(CLIENT_SRC.includes('暂无任务'))
    assert.ok(CLIENT_SRC.includes('setTabView'))
    assert.ok(CLIENT_SRC.includes('filteredTasks.length === 0'))
  })

  it('客户端应渲染任务核心字段和来源态提示', () => {
    assert.ok(CLIENT_SRC.includes('Delivery {snapshot.deliveryMode}'))
    assert.ok(CLIENT_SRC.includes('MAINTENANCE_TYPE_MAP'))
    assert.ok(CLIENT_SRC.includes('MAINTENANCE_PRIORITY_MAP'))
    assert.ok(CLIENT_SRC.includes('完成备注'))
  })
})

describe('Maintenance — 反例与边界', () => {
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

  it('客户端应处理 fallback 错误提示边界', () => {
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有后勤任务'))
  })
})
