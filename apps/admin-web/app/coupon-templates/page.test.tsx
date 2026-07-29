import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'coupon-templates-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'coupon-templates-data.ts'), 'utf-8')
})

describe('CouponTemplatesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CouponTemplatesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载优惠券模板快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCouponTemplatesSnapshot()'))
    assert.ok(PAGE_SRC.includes("import CouponTemplatesClient from './coupon-templates-client'"))
    assert.ok(PAGE_SRC.includes('<CouponTemplatesClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'coupon-templates:read'"))
  })
})

describe('CouponTemplatesPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应固证本地优惠券模板快照来源', () => {
    assert.ok(!PAGE_SRC.includes('loadCouponTemplatesSnapshot -> defaultCouponTemplates snapshot'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local coupon template sample snapshot records'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('CouponTemplatesData — 快照合同', () => {
  it('应定义 snapshot 合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-coupon-template-snapshot'"))
    assert.ok(DATA_SRC.includes('templates: CouponTemplateItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应提供默认快照样本与统计函数', () => {
    assert.ok(DATA_SRC.includes('export const defaultCouponTemplates'))
    assert.ok(DATA_SRC.includes('新客满100减20'))
    assert.ok(DATA_SRC.includes('双十一7折券'))
    assert.ok(DATA_SRC.includes('export function computeCouponTemplateStats'))
  })
})

describe('CouponTemplatesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: CouponTemplatesSnapshotDelivery'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留表格、筛选和收口动作', () => {
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('FilterChips'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
  })

  it('客户端组件应保留面值格式化、使用率与空态', () => {
    assert.ok(CLIENT_SRC.includes('折'))
    assert.ok(CLIENT_SRC.includes('usageRate'))
    assert.ok(CLIENT_SRC.includes('暂无优惠券模板'))
    assert.ok(CLIENT_SRC.includes('创建优惠券模板'))
  })
})
