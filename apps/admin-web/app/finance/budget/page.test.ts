import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'budget-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'budget-data.ts'), 'utf-8')

test('Budget — page 不应再内嵌客户端取数', () => {
  assert.ok(!PAGE_SRC.includes("'use client'"))
  assert.ok(!PAGE_SRC.includes('useEffect('))
  assert.ok(!PAGE_SRC.includes('fetch('))
})

test('Budget — data 应承担服务端快照合同', () => {
  assert.ok(DATA_SRC.includes('loadBudgetSnapshot'))
  assert.ok(DATA_SRC.includes('defaultBudgets'))
  assert.ok(DATA_SRC.includes('defaultApprovals'))
})

test('Budget — client 应承担 tab 与审批交互', () => {
  assert.ok(CLIENT_SRC.includes("'use client'"))
  assert.ok(CLIENT_SRC.includes('setTab'))
  assert.ok(CLIENT_SRC.includes('updateApproval'))
})
