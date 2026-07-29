import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'cashier-workbench-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'cashier-workbench-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'cashier-workbench-legacy.tsx'), 'utf-8')

describe('workbench/cashier 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function CashierWorkbenchPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCashierWorkbenchSnapshot()'))
    assert.ok(PAGE_SRC.includes('<CashierWorkbenchClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'workbench.read'"))
  })

  it('client 应保留 router.refresh 刷新链路', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('<LegacyView snapshot={snapshot} />'))
  })

  it('data 应定义 API/fallback 快照合同与角色桥接证据', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'cashier-workbench-api'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'cashier-workbench-fallback'"))
    assert.ok(DATA_SRC.includes('mapToBackendRole'))
    assert.ok(DATA_SRC.includes('getBizClient()'))
    assert.ok(DATA_SRC.includes('FALLBACK_SESSION + generateFallbackTxns'))
  })

  it('legacy 应保留收银工作台主交互与来源态展示', () => {
    assert.ok(LEGACY_SRC.includes('快速收银'))
    assert.ok(LEGACY_SRC.includes('最近交易'))
    assert.ok(LEGACY_SRC.includes('会员查询'))
    assert.ok(LEGACY_SRC.includes('交接班'))
    assert.ok(LEGACY_SRC.includes('tenant-config 角色映射'))
  })
})
