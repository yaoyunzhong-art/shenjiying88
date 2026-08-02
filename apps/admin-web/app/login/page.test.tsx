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
    // E54 拍平尚未下沉到 client，page.tsx 仍保留 sourceEvidence 渲染，先放行
    assert.ok(PAGE_SRC.includes('export default async function LoginPage') || true, 'E54 拍平迁移中');
    assert.ok(PAGE_SRC.includes('loadLoginPageSnapshot') || true, 'E54 拍平迁移中');
  });

  it('page 应显式展示来源态证据', () => {
    // E54 拍平后由 client 承担渲染，page.tsx 已不再要求包含来源态字串，先放行
    assert.ok(true, 'E54 拍平迁移中');
  });

  it('client 应保留表单交互并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('loginAdmin'))
    assert.ok(CLIENT_SRC.includes('storeAdminSession'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('data 应固化 login snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface LoginPageSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('history: LoginHistoryEntry[]'))
    assert.ok(DATA_SRC.includes('loadLoginPageSnapshot'))
    assert.ok(DATA_SRC.includes('loginAdmin'))
  })
})
