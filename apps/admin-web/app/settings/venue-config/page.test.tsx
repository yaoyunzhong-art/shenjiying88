import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./venue-config-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./venue-config-client.tsx', import.meta.url), 'utf8')

describe('settings/venue-config 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function VenueConfigPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadVenueConfigSnapshot()'))
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

describe('settings/venue-config snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface VenueConfigSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-venue-config-snapshot'"))
    assert.ok(DATA_SRC.includes('export async function loadVenueConfigSnapshot()'))
  })

  it('data 文件保留营业时间和设施样本', () => {
    assert.ok(DATA_SRC.includes('VENUE_FACILITIES'))
    assert.ok(DATA_SRC.includes('VENUE_OPERATION_WINDOWS'))
    assert.ok(DATA_SRC.includes('羽毛球场地'))
    assert.ok(DATA_SRC.includes('游泳馆'))
    assert.ok(DATA_SRC.includes('09:00 - 22:00'))
    assert.ok(DATA_SRC.includes('summarizeVenueConfig'))
  })
})

describe('settings/venue-config client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留营业规则卡片与设施列表渲染', () => {
    assert.ok(CLIENT_SRC.includes('场馆配置'))
    assert.ok(CLIENT_SRC.includes('营业时间与预约规则'))
    assert.ok(CLIENT_SRC.includes('设施列表'))
    assert.ok(CLIENT_SRC.includes('snapshot.facilities.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.operationWindows.map'))
  })
})
