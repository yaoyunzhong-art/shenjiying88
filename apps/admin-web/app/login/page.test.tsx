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
    assert.ok(PAGE_SRC.includes("import { headers } from 'next/headers'"))
    assert.ok(PAGE_SRC.includes('export default async function LoginPage'))
    assert.ok(PAGE_SRC.includes('const requestHeaders = await headers()'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadLoginPageSnapshot({ requestHeaders })'))
    assert.ok(!PAGE_SRC.includes('const sourceEvidence = {'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<LoginClient snapshot={snapshot} />'))
  })

  it('page 应显式展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadLoginPageSnapshot -> auth/me'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadLoginPageSnapshot -> adminWebBootstrap + MOCK_LOGIN_HISTORY fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('client 应保留表单交互并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('loginAdmin'))
    assert.ok(CLIENT_SRC.includes('storeAdminSession'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('data 应固化 login snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface LoginPageSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('history: LoginHistoryEntry[]'))
    assert.ok(DATA_SRC.includes('loadLoginPageSnapshot'))
    assert.ok(DATA_SRC.includes('loginAdmin'))
  })
})
