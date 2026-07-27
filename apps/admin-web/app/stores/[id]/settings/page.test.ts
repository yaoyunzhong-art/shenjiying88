import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'settings-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'settings-data.ts'), 'utf-8')

describe('stores/[id]/settings/page.test.ts 兼容固证', () => {
  it('page 保持三层入口与来源态证据', () => {
    assert.ok(PAGE_SRC.includes('export default async function SettingsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSettingsSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })

  it('client 保持刷新与配置写操作占位', () => {
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('保存全部配置'))
    assert.ok(CLIENT_SRC.includes('导入配置'))
  })

  it('data 保持配置样本与快照加载器', () => {
    assert.ok(DATA_SRC.includes('SETTINGS_CATEGORIES'))
    assert.ok(DATA_SRC.includes('SETTINGS_NOTIFICATIONS'))
    assert.ok(DATA_SRC.includes('loadSettingsSnapshot'))
  })
})
