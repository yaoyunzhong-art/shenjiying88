import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'member-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'member-data.ts'), 'utf-8')
})

describe('MemberPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function MemberPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应接入快照加载与动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadMemberSnapshot } from './member-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"))
  })
})

describe('MemberData — 快照合同', () => {
  it('应包装 loadAdminMemberList 并补齐来源态合同', () => {
    assert.ok(DATA_SRC.includes("import { loadAdminMemberList } from '../members-view-model'"))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('members: MemberItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应固证 api 与 fallback 来源', () => {
    assert.ok(DATA_SRC.includes('loadAdminMemberList()'))
    assert.ok(DATA_SRC.includes('export const FALLBACK_MEMBERS = MOCK_MEMBERS'))
    assert.ok(DATA_SRC.includes('会员实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('MemberClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留搜索、等级筛选、状态筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes('setKeyword'))
    assert.ok(CLIENT_SRC.includes('setTier'))
    assert.ok(CLIENT_SRC.includes('setStatus'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有会员数据'))
  })

  it('客户端应渲染会员核心字段', () => {
    assert.ok(CLIENT_SRC.includes('会员管理'))
    assert.ok(CLIENT_SRC.includes('钻石会员'))
    assert.ok(CLIENT_SRC.includes('累计消费'))
    assert.ok(CLIENT_SRC.includes('最近到店'))
  })
})
