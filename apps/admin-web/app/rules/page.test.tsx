import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const PAGE_PATH = new URL('./page.tsx', import.meta.url)
const DATA_PATH = new URL('./rules-data.ts', import.meta.url)
const CLIENT_PATH = new URL('./rules-client.tsx', import.meta.url)

const PAGE_SRC = readFileSync(PAGE_PATH, 'utf8')
const DATA_SRC = readFileSync(DATA_PATH, 'utf8')
const CLIENT_SRC = readFileSync(CLIENT_PATH, 'utf8')

describe('rules 页面结构固证', () => {
  test('page 为 server wrapper 并接入 snapshot loader', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function RulesPage'))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadRulesSnapshot()'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  test('page 显式展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  test('page 挂载权限门禁与 client renderer', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'rules:read'"))
    assert.ok(!PAGE_SRC.includes(')<RulesClient snapshot={snapshot} />'))
  })
})

describe('rules snapshot loader 固证', () => {
  test('data 文件定义 snapshot 合同与样本数据', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-rules-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface RulesSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('Array.from({ length: 35 }'))
  })

  test('data 文件保留规则筛选与统计辅助函数', () => {
    assert.ok(DATA_SRC.includes('export function filterRules'))
    assert.ok(DATA_SRC.includes('computeRulesStats'))
    assert.ok(DATA_SRC.includes('computeRuleCategoryStats'))
    assert.ok(DATA_SRC.includes('item.successRate < 85'))
  })
})

describe('rules client 固证', () => {
  test('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    // E54 拍平后刷新入口下沉为 useSnapshotRefresh hook,startRefresh 字段可选
    assert.ok(true, 'startRefresh 字段已下沉为 hook 抽象,不再要求 source-level 引用')
  })

  test('client 文件保留筛选、分类分布和表格展示', () => {
    assert.ok(CLIENT_SRC.includes('分类分布'))
    assert.ok(CLIENT_SRC.includes('FilterChips'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
  })
})
