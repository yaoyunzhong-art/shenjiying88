import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(
  resolve(import.meta.dirname, 'integration-orchestration-idempotency-detail-data.ts'),
  'utf-8'
)

test('integration-orchestration/idempotency/[key]: 使用服务端 page + data + client 三层结构', () => {
  assert.ok(PAGE_SRC.includes('IntegrationOrchestrationIdempotencyDetailClient'))
  assert.ok(PAGE_SRC.includes('loadIntegrationOrchestrationIdempotencyDetailPageSnapshot'))
  assert.ok(DATA_SRC.includes('export async function loadIntegrationOrchestrationIdempotencyDetailPageSnapshot'))
})
