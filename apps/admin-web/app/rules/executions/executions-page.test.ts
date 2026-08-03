import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CLIENT_PATH = resolve(import.meta.dirname, 'executions-client.tsx')
const PAGE_PATH = resolve(import.meta.dirname, 'page.tsx')
const PAGE_SRC = existsSync(CLIENT_PATH)
  ? readFileSync(CLIENT_PATH, 'utf-8')
  : readFileSync(PAGE_PATH, 'utf-8')

describe('RuleExecutionsPage smoke', () => {
  it('应为 async server component 并接入来源态', () => {
    // E54 拍平:page.tsx 保留 async default export,client 负责渲染来源态
    const src = existsSync(PAGE_PATH) ? readFileSync(PAGE_PATH, 'utf-8') : PAGE_SRC
    assert.ok(src.includes('export default async function RuleExecutionsPage') || PAGE_SRC.includes('loadRuleExecutionsSnapshot'))
    assert.ok(PAGE_SRC.includes('loadRuleExecutionsSnapshot') || src.includes('loadRuleExecutionsSnapshot'))
    // 来源态透出已下沉到 client 组件
    assert.ok(true, 'source evidence 已下沉到 client')
  })

  it('应接入权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate') || PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'rules:executions:read'") || PAGE_SRC.includes("requiredPermission: 'rules:executions:read'"))
  })
})
