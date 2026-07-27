import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-client.tsx'), 'utf-8')

describe('ai-decision page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadAiDecisionSnapshot } from './ai-decision-data'"))
    assert.ok(PAGE_SRC.includes('<AiDecisionClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })

  it('data 固证 mock 来源', () => {
    assert.ok(DATA_SRC.includes('export async function loadAiDecisionSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'ai-decision-mock'"))
    assert.ok(DATA_SRC.includes('MOCK_DECISIONS'))
    assert.ok(DATA_SRC.includes('DEFAULT_FORM'))
  })

  it('client 保留表格、筛选与创建交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('AIDecisionPanel'))
    assert.ok(CLIENT_SRC.includes('handleCreate'))
    assert.ok(CLIENT_SRC.includes('handleExport'))
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
  })
})
