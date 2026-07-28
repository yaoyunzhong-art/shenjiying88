import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')

describe('stores/[id]/reservations/page.tsx 结构固证', () => {
  it('page 应保持最小 server wrapper 并桥接快照到 client', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function ReservationsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadReservationsSnapshot'))
    assert.ok(PAGE_SRC.includes('<ReservationsClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('page 应保留服务端参数解包', () => {
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(!PAGE_SRC.includes('searchParams'))
  })
})
