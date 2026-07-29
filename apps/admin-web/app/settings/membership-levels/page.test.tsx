import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./membership-levels-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./membership-levels-client.tsx', import.meta.url), 'utf8')

describe('settings/membership-levels 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function MembershipLevelsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMembershipLevelsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('settings/membership-levels snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface MembershipLevelsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-membership-levels-snapshot'"))
    assert.ok(DATA_SRC.includes('export async function loadMembershipLevelsSnapshot()'))
  })

  it('data 文件保留等级样本和治理规则', () => {
    assert.ok(DATA_SRC.includes('MEMBERSHIP_LEVELS'))
    assert.ok(DATA_SRC.includes('MEMBERSHIP_RULES'))
    assert.ok(DATA_SRC.includes('普通会员'))
    assert.ok(DATA_SRC.includes('钻石会员'))
    assert.ok(DATA_SRC.includes('升级门槛'))
    assert.ok(DATA_SRC.includes('summarizeMembershipLevels'))
  })
})

describe('settings/membership-levels client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留等级切换、详情卡和升降级规则渲染', () => {
    assert.ok(CLIENT_SRC.includes('activeLevel'))
    assert.ok(CLIENT_SRC.includes('等级定义'))
    assert.ok(CLIENT_SRC.includes('当前等级详情'))
    assert.ok(CLIENT_SRC.includes('升降级规则'))
    assert.ok(CLIENT_SRC.includes('snapshot.rules.map'))
  })
})
