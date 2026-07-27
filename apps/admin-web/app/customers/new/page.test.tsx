import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'customer-new-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'customer-new-data.ts'), 'utf-8')

describe('customers/new E54 structure', () => {
  it('page is a server wrapper', () => {
    assert.equal(PAGE_SRC.includes("'use client'"), false)
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCustomerNewSnapshot()'))
    assert.ok(PAGE_SRC.includes('<CustomerNewShellClient snapshot={snapshot} />'))
  })

  it('client owns refresh and renders legacy view', () => {
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('<CustomerNewLegacy />'))
  })

  it('data exposes E54 snapshot contract', () => {
    assert.ok(DATA_SRC.includes('export interface CustomerNewSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'customers-new-mock'"))
  })
})
