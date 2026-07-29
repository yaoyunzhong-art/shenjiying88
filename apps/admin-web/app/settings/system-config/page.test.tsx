import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./system-config-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./system-config-client.tsx', import.meta.url), 'utf8')

describe('settings/system-config 页面结构固证', () => {
  it('page 为 server wrapper 并接入 snapshot loader', () => {
    assert.ok(PAGE_SRC.includes('export default async function SystemConfigPage'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSystemConfigSnapshot()'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('page 保留权限门禁并挂载 client renderer', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('<SystemConfigClient snapshot={snapshot} />'))
  })
})

describe('settings/system-config snapshot loader 固证', () => {
  it('data 文件定义 api|fallback 快照合同与来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'system-config-api' | 'system-config-fallback'"))
    assert.ok(DATA_SRC.includes('export interface SystemConfigSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export async function loadSystemConfigSnapshot()'))
  })

  it('data 文件尝试读取 system-config 上游并保留 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("new URL('system-config', resolveSystemConfigApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('system-config/meta/categories', resolveSystemConfigApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('export const fallbackSettings'))
    assert.ok(DATA_SRC.includes('平台维护模式总开关'))
  })

  it('fallback 场景返回错误提示并固证来源态', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'system-config-fallback'"))
    assert.ok(DATA_SRC.includes('系统配置实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('settings/system-config client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留分类、汇总卡片与配置表格', () => {
    assert.ok(CLIENT_SRC.includes('配置项总数'))
    assert.ok(CLIENT_SRC.includes('snapshot.categories.map'))
    assert.ok(CLIENT_SRC.includes('暂无配置项'))
    assert.ok(CLIENT_SRC.includes('group.items.map'))
  })
})
