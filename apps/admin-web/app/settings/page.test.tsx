import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./settings-page-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./settings-client.tsx', import.meta.url), 'utf8')

describe('settings 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function SettingsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSettingsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('settings snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-settings-center-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface SettingsSnapshot'))
    assert.ok(DATA_SRC.includes('export async function loadSettingsSnapshot()'))
  })

  it('data 文件保留模块目录和分类常量', () => {
    assert.ok(DATA_SRC.includes('SETTINGS_MODULES'))
    assert.ok(DATA_SRC.includes('CATEGORY_ORDER'))
    assert.ok(DATA_SRC.includes('CATEGORY_LABEL'))
    assert.ok(DATA_SRC.includes('membership-levels'))
    assert.ok(DATA_SRC.includes('promotion-rules'))
  })
})

describe('settings client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('client 文件保留 Tabs、权限提示和模块卡片渲染', () => {
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('缺少 ${module.requiredPermission}'))
    assert.ok(CLIENT_SRC.includes('snapshot.modules.filter'))
    assert.ok(CLIENT_SRC.includes('设置中心'))
  })
})
