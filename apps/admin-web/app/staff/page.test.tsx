import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'staff-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'staff-data.ts'), 'utf-8')
})

describe('StaffPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function StaffPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应接入快照加载和动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStaffSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadStaffSnapshot } from './staff-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'staff:read'"))
  })
})

describe('StaffData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('staff: StaffItem[]'))
    assert.ok(DATA_SRC.includes('stats: ReturnType<typeof computeStaffStats>'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应固证上游 hr/employees 与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("new URL('hr/employees', resolveStaffApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('export const MOCK_STAFF = FALLBACK_STAFF'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('员工实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('StaffClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端应保留搜索、筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes('setKeyword'))
    assert.ok(CLIENT_SRC.includes('setStatus'))
    assert.ok(CLIENT_SRC.includes('setRole'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有员工数据'))
  })

  it('客户端应渲染员工核心字段', () => {
    assert.ok(CLIENT_SRC.includes('员工管理'))
    assert.ok(CLIENT_SRC.includes('总人数'))
    assert.ok(CLIENT_SRC.includes('高绩效人数'))
    assert.ok(CLIENT_SRC.includes('最近活跃'))
  })
})
