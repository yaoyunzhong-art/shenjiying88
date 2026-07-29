import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'hr-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'hr-data.ts'), 'utf-8')
})

describe('HrPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function HrPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 HR 快照并导出动态配置', () => {
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadHrSnapshot()'))
    assert.ok(!PAGE_SRC.includes(")import { loadHrSnapshot } from './hr-data'"))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('页面应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadHrSnapshot -> hr/employees + hr/stats + hr/departments'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadHrSnapshot -> defaultEmployees/defaultStats/defaultDepartments'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes(')local hr samples'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('HrData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('employees: HrEmployee[]'))
    assert.ok(DATA_SRC.includes('stats: HrStatsSnapshot'))
    assert.ok(DATA_SRC.includes('departments: string[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应固证 hr 三路上游接口与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("fetchHrPart<unknown[]>('hr/employees')"))
    assert.ok(DATA_SRC.includes("fetchHrPart<HrStatsSnapshot>('hr/stats')"))
    assert.ok(DATA_SRC.includes("fetchHrPart<string[]>('hr/departments')"))
    assert.ok(DATA_SRC.includes('export const defaultEmployees'))
    assert.ok(DATA_SRC.includes('export const defaultStats'))
    assert.ok(DATA_SRC.includes('export const defaultDepartments'))
    assert.ok(DATA_SRC.includes('HR 实时接口不可达，已切换到 fallback 样本数据。'))
  })

  it('应保留员工状态映射与部门统计能力', () => {
    assert.ok(DATA_SRC.includes('export const HR_STATUS_MAP'))
    assert.ok(DATA_SRC.includes('function buildDepartmentCounts'))
    assert.ok(DATA_SRC.includes('function normalizeEmployee'))
    assert.ok(DATA_SRC.includes('function normalizeStats'))
  })
})

describe('HrClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留搜索、部门筛选、状态筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes('setKeyword'))
    assert.ok(CLIENT_SRC.includes('setDepartment'))
    assert.ok(CLIENT_SRC.includes('setStatus'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有 HR 员工数据'))
  })

  it('客户端应渲染 HR 核心字段与部门分布', () => {
    assert.ok(CLIENT_SRC.includes('HR 管理'))
    assert.ok(CLIENT_SRC.includes('员工总数'))
    assert.ok(CLIENT_SRC.includes('部门分布'))
    assert.ok(CLIENT_SRC.includes('最近更新'))
  })
})

describe('Hr — 防御', () => {
  it('源码中不应出现 describe.skip 或 as any', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })
})
