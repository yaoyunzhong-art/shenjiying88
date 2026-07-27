import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'studio-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'studio-data.ts'), 'utf-8')

describe('agents/studio E54 结构固证', () => {
  it('page 为服务端包装层并读取 Agent Studio 快照', () => {
    assert.equal(PAGE_SRC.includes("'use client'"), false)
    assert.ok(PAGE_SRC.includes('export default async function AgentStudioPage'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('loadAgentStudioSnapshot'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAgentStudioSnapshot()'))
    assert.ok(PAGE_SRC.includes('<AgentStudioClient snapshot={snapshot} />'))
  })

  it('page 透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'agents:studio:read'"))
  })

  it('client 继续承接工作台交互并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('snapshot: AgentStudioSnapshot'))
    assert.ok(CLIENT_SRC.includes('const { configs, deliveryMode } = snapshot'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"))
  })

  it('data 复用 loadAgentConfigs(no-store) 并补齐 E54 证据字段', () => {
    assert.ok(DATA_SRC.includes('loadAgentConfigs({ cache: \'no-store\' })'))
    assert.ok(DATA_SRC.includes('export interface AgentStudioSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'agent-studio-api' | 'agent-studio-fallback'"))
    assert.ok(DATA_SRC.includes('controlPlaneSource'))
    assert.ok(DATA_SRC.includes('businessDataSource'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })
})
