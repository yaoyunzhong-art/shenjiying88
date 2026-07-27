import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-data.ts'), 'utf-8')

test('integration-orchestration page: 使用服务端 page + data + client 三层结构', () => {
  assert.ok(PAGE_SRC.includes('IntegrationOrchestrationWorkspaceClient'))
  assert.ok(PAGE_SRC.includes('loadIntegrationOrchestrationPageSnapshot'))
  assert.ok(DATA_SRC.includes('export async function loadIntegrationOrchestrationPageSnapshot'))
})

test('integration-orchestration page: 展示 delivery mode 与 sourceLabel 证据', () => {
  assert.ok(PAGE_SRC.includes('sourceEvidence.deliveryMode'))
  assert.ok(PAGE_SRC.includes('sourceEvidence.sourceLabel'))
  assert.ok(PAGE_SRC.includes('sourceEvidence.refreshPath'))
})

test('integration-orchestration page: data 层应合并 workspace 和 bootstrap 的 delivery mode', () => {
  assert.ok(DATA_SRC.includes('workspaceDeliveryMode'))
  assert.ok(DATA_SRC.includes('bootstrapDeliveryMode'))
  assert.ok(DATA_SRC.includes('getAdminWorkbenchConsumerSnapshot'))
})
