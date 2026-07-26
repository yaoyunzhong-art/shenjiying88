import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  loadConfigurationPageSnapshot,
  normalizeConfigurationQuery,
} from './configuration-data'

const PAGE_SRC = fs.readFileSync(require.resolve('./page'), 'utf-8')
const CLIENT_SRC = fs.readFileSync(
  require.resolve('./configuration-workspace-client'),
  'utf-8',
)

test('normalizeConfigurationQuery 支持 string 与 string[] 参数', () => {
  const query = normalizeConfigurationQuery({
    tenantId: ['tenant-a', 'tenant-b'],
    brandId: 'brand-a',
    storeId: ['store-a'],
    marketCode: undefined,
  })

  assert.deepEqual(query, {
    tenantId: 'tenant-a',
    brandId: 'brand-a',
    storeId: 'store-a',
    marketCode: undefined,
  })
})

test('loadConfigurationPageSnapshot 返回带来源标签的快照结构', async () => {
  const snapshot = await loadConfigurationPageSnapshot({ tenantId: 'tenant-demo' })

  assert.ok(snapshot.generatedAt)
  assert.ok(snapshot.sourceLabel)
  assert.ok(['api', 'fallback'].includes(snapshot.deliveryMode))
  assert.ok(snapshot.note.length > 0)
  assert.ok(Array.isArray(snapshot.overview.scopeChain))
  assert.ok(snapshot.overview.scopeChain.length > 0)
})

test('configuration/page.tsx 固证 server wrapper 与来源态证据', () => {
  assert.match(PAGE_SRC, /export const dynamic = 'force-dynamic'/)
  assert.match(PAGE_SRC, /loadConfigurationPageSnapshot/)
  assert.match(PAGE_SRC, /normalizeConfigurationQuery/)
  assert.match(PAGE_SRC, /const sourceEvidence = \{/)
  assert.match(
    PAGE_SRC,
    /refreshPath: 'ConfigurationPage -> loadConfigurationPageSnapshot'/,
  )
  assert.match(PAGE_SRC, /ConfigurationWorkspaceClient/)
})

test('configuration-workspace-client.tsx 固证 client renderer 刷新路径', () => {
  assert.match(CLIENT_SRC, /'use client'/)
  assert.match(CLIENT_SRC, /useRouter\(\)/)
  assert.match(CLIENT_SRC, /router\.refresh\(/)
  assert.match(CLIENT_SRC, /scopeChain/)
  assert.match(CLIENT_SRC, /FilterChips/)
})
