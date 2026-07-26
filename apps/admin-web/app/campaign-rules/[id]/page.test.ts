import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')

describe('CampaignRuleDetailPage smoke', () => {
  it('应为 async server component 并接入 notFound', () => {
    assert.ok(PAGE_SRC.includes('export default async function CampaignRuleDetailPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('notFound()'))
  })

  it('应展示详情来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('CampaignRuleDetailClient snapshot={snapshot}'))
  })
})
