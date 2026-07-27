import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-detail-data.ts'), 'utf-8')
})

describe('AiDecisionDetailPage — 服务端壳层', () => {
  it('应为 async server component 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function AiDecisionDetailPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAiDecisionDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import AiDecisionDetailClient from './ai-decision-detail-client'"))
  })

  it('应渲染来源态证据与客户端详情组件', () => {
    assert.ok(PAGE_SRC.includes("requiredPermission: 'rules:ai-decisions:id:read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('<AiDecisionDetailClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
  })
})

describe('AiDecisionDetailData — 快照合同', () => {
  it('应定义 mock 快照合同与确定性构造器', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'rules-ai-decision-detail-mock'"))
    assert.ok(DATA_SRC.includes('export function buildAiDecisionDetail'))
    assert.ok(DATA_SRC.includes('function hashCode'))
    assert.ok(DATA_SRC.includes('export async function loadAiDecisionDetailSnapshot'))
  })

  it('应保留上下文、推理和异常字段', () => {
    assert.ok(DATA_SRC.includes('inputContext: Record<string, unknown>'))
    assert.ok(DATA_SRC.includes('reasoning: string'))
    assert.ok(DATA_SRC.includes('anomalyFlags: string[]'))
    assert.ok(DATA_SRC.includes('ai-model-v2.3.1'))
  })
})

describe('AiDecisionDetailClient — 客户端渲染层', () => {
  it('应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('应保留输入上下文、推理过程和决策结果区块', () => {
    assert.ok(CLIENT_SRC.includes('输入上下文'))
    assert.ok(CLIENT_SRC.includes('推理过程'))
    assert.ok(CLIENT_SRC.includes('决策结果'))
    assert.ok(CLIENT_SRC.includes('异常标记'))
  })
})
