import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'login-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'login-data.ts'), 'utf-8')

describe('Login page structure', () => {
  it('page 应为 async server component 并加载 login snapshot', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function LoginPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadLoginPageSnapshot()'))
    assert.ok(PAGE_SRC.includes('<LoginClient snapshot={snapshot} />'))
  })

  it('page 应显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {snapshot.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {snapshot.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {snapshot.refreshPath}'))
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'))
  })

  it('client 应保留表单交互并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('mockLoginApi'))
    assert.ok(CLIENT_SRC.includes('storeAdminSession'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('data 应固化 login snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface LoginPageSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('history: LoginHistoryEntry[]'))
    assert.ok(DATA_SRC.includes('loadLoginPageSnapshot'))
  })
})
