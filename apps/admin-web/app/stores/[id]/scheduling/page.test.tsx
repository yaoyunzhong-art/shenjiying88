import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'scheduling-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'scheduling-data.ts'), 'utf-8')
})

describe('SchedulingPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function SchedulingPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应接收动态路由参数并加载门店排班快照', () => {
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSchedulingSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import { loadSchedulingSnapshot } from './scheduling-data'"))
  })

  it('页面应导出 dynamic/revalidate 并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('SchedulingPage — 来源态透明化', () => {
  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadSchedulingSnapshot -> logistics/clean-schedules'))
    assert.ok(PAGE_SRC.includes('loadSchedulingSnapshot -> buildFallbackSchedules fallback'))
    assert.ok(PAGE_SRC.includes('local clean schedule samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('SchedulingData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('storeId: string'))
    assert.ok(DATA_SRC.includes('schedules: CleanScheduleItem[]'))
    assert.ok(DATA_SRC.includes('stats: SchedulingStatsSnapshot'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留 fallback 样本、状态映射与统计函数', () => {
    assert.ok(DATA_SRC.includes('buildFallbackSchedules'))
    assert.ok(DATA_SRC.includes('张三'))
    assert.ok(DATA_SRC.includes('A 区机台'))
    assert.ok(DATA_SRC.includes('computeSchedulingStats'))
    assert.ok(DATA_SRC.includes('coverageRate'))
  })

  it('应尝试读取 clean-schedules 上游并在失败时回退', () => {
    assert.ok(DATA_SRC.includes("'logistics/clean-schedules'"))
    assert.ok(DATA_SRC.includes("'x-tenant-id': DEFAULT_TENANT_ID"))
    assert.ok(DATA_SRC.includes('filter((item) => item.storeId === storeId)'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('门店排班实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('SchedulingClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端应保留 route proxy 动作链路', () => {
    assert.ok(CLIENT_SRC.includes('buildActorHeaders'))
    assert.ok(CLIENT_SRC.includes('/api/logistics/clean-schedules'))
    assert.ok(CLIENT_SRC.includes('/check-in'))
    assert.ok(CLIENT_SRC.includes("message.success('排班创建成功')"))
    assert.ok(CLIENT_SRC.includes("message.success('签到成功')"))
  })

  it('客户端应保留排班列表、区域视图和统计分析', () => {
    assert.ok(CLIENT_SRC.includes("label: '排班列表'"))
    assert.ok(CLIENT_SRC.includes("label: '区域视图'"))
    assert.ok(CLIENT_SRC.includes("label: '统计分析'"))
    assert.ok(CLIENT_SRC.includes('Table'))
    assert.ok(CLIENT_SRC.includes('暂无排班数据'))
  })

  it('客户端应保留筛选、新建排班与签到按钮', () => {
    assert.ok(CLIENT_SRC.includes('setShiftFilter'))
    assert.ok(CLIENT_SRC.includes('setStatusFilter'))
    assert.ok(CLIENT_SRC.includes('title="新建排班"'))
    assert.ok(CLIENT_SRC.includes('签到'))
    assert.ok(CLIENT_SRC.includes('调班申请'))
  })
})

describe('Scheduling — 反例与边界', () => {
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

  it('客户端应处理 snapshot.error 与空态边界', () => {
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('暂无排班'))
    assert.ok(CLIENT_SRC.includes('filteredSchedules.length === 0'))
  })
})
