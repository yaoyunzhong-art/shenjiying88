import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'settings-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'settings-data.ts'), 'utf-8')

describe('stores/[id]/settings/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载设置快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SettingsPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSettingsSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<SettingsClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/settings/client 结构固证', () => {
  it('client 应保留配置编辑、导入与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('setShowImportModal'))
    assert.ok(CLIENT_SRC.includes('保存全部配置'))
    assert.ok(CLIENT_SRC.includes('导入配置'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
  })
})

describe('stores/[id]/settings/data 结构固证', () => {
  it('data 应定义设置快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface SettingsSnapshot'))
    assert.ok(DATA_SRC.includes('SETTINGS_CATEGORIES'))
    assert.ok(DATA_SRC.includes('SETTINGS_NOTIFICATIONS'))
    assert.ok(DATA_SRC.includes('buildSettingsSummary'))
    assert.ok(DATA_SRC.includes('loadSettingsSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-settings-mock'"))
  })
})
