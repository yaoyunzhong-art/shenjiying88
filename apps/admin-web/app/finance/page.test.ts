import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'finance-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'finance-data.ts'), 'utf-8')

test('Finance — page 不应再内嵌客户端取数', () => {
  assert.ok(!PAGE_SRC.includes("'use client'"))
  assert.ok(!PAGE_SRC.includes('useEffect('))
  assert.ok(!PAGE_SRC.includes('fetch('))
})

test('Finance — data 应承担服务端取数', () => {
  assert.ok(DATA_SRC.includes("cache: 'no-store'"))
  assert.ok(DATA_SRC.includes('async function fetchPayments'))
  assert.ok(DATA_SRC.includes('async function fetchRefunds'))
})

test('Finance — client 应承担交互渲染', () => {
  assert.ok(CLIENT_SRC.includes("'use client'"))
  assert.ok(CLIENT_SRC.includes('useState('))
  assert.ok(CLIENT_SRC.includes('useMemo('))
})
