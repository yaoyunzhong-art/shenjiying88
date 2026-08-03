import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'resilience-signal-detail-data.ts'), 'utf-8')

test('signal detail page 使用 E54 server wrapper', () => {
  assert.ok(PAGE_SRC.includes('export default async function ResilienceSignalDetailPage'))
  assert.ok(PAGE_SRC.includes('loadResilienceSignalDetailPageSnapshot'))
  assert.ok(!PAGE_SRC.includes("'use client'"))
})

test('signal detail data 使用 no-store loader', () => {
  assert.ok(DATA_SRC.includes("loadResilienceSignalDetail(signal, query, { cache: 'no-store' })"))
  assert.ok(DATA_SRC.includes('sourceLabel'))
})
