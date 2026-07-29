import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-client.tsx'), 'utf-8')

describe('ai-decision/page.ts', () => {
  test('page 是服务端 wrapper', () => {
    assert.match(PAGE_SRC, /export default async function AiDecisionPage/)
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('loadAiDecisionSnapshot'))
    assert.ok(PAGE_SRC.includes('AiDecisionClient'))
  })

  test('page 显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('sourceEvidence.sourceLabel'))
    assert.ok(PAGE_SRC.includes('sourceEvidence.refreshPath'))
  })

  test('client 保留主要交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('AIDecisionPanel'))
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('handleCreate'))
    assert.ok(CLIENT_SRC.includes('handleExport'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })
})
