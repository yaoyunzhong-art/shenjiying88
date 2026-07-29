import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-detail-data.ts'), 'utf-8')

test('ai-decisions detail page 使用 E54 server wrapper', () => {
  assert.ok(PAGE_SRC.includes('export default async function AiDecisionDetailPage'))
  assert.ok(PAGE_SRC.includes('loadAiDecisionDetailSnapshot'))
  assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
  assert.ok(!PAGE_SRC.includes("'use client'"))
})

test('ai-decisions detail client 保留刷新与关键区块', () => {
  assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  assert.ok(CLIENT_SRC.includes('重试执行'))
  assert.ok(CLIENT_SRC.includes('回退操作'))
  assert.ok(CLIENT_SRC.includes('输入上下文'))
})

test('ai-decisions detail data 保留 mock 快照合同', () => {
  assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
  assert.ok(DATA_SRC.includes("sourceLabel: 'rules-ai-decision-detail-mock'"))
  assert.ok(DATA_SRC.includes('buildAiDecisionDetail'))
})
