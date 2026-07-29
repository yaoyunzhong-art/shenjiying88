import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-events-data.ts'), 'utf-8')

test('integration-orchestration/events: 使用服务端 page + data + client 三层结构', () => {
  assert.ok(PAGE_SRC.includes('IntegrationOrchestrationEventsClient'))
  assert.ok(PAGE_SRC.includes('loadIntegrationOrchestrationEventsPageSnapshot'))
  assert.ok(DATA_SRC.includes('export async function loadIntegrationOrchestrationEventsPageSnapshot'))
})

test('integration-orchestration/events: 页面展示来源态证据（E54 拍平：已下沉到 client）', () => {
  assert.ok(!PAGE_SRC.includes('sourceEvidence.deliveryMode'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  assert.ok(!PAGE_SRC.includes('sourceEvidence.businessDataSource'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  assert.ok(!PAGE_SRC.includes('sourceEvidence.refreshPath'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  assert.ok(PAGE_SRC.includes('IntegrationOrchestrationEventsClient'))
  assert.ok(PAGE_SRC.includes('loadIntegrationOrchestrationEventsPageSnapshot'))
})
