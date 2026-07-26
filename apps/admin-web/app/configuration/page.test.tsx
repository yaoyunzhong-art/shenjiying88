import assert from 'node:assert/strict'
import test from 'node:test'

import { loadConfigurationPageSnapshot } from './configuration-data'

test('configuration snapshot 在 fallback 时仍保留结构化治理字段', async () => {
  const snapshot = await loadConfigurationPageSnapshot({ tenantId: 'tenant-demo' })

  assert.ok(typeof snapshot.overview.configuration.entries.total === 'number')
  assert.ok(
    typeof snapshot.overview.configuration.featureFlags.total === 'number',
  )
  assert.ok(typeof snapshot.overview.configuration.secrets.total === 'number')
  assert.ok(
    typeof snapshot.overview.configuration.certificates.total === 'number',
  )
})

test('configuration snapshot 生成时间与 overview.generatedAt 可读', async () => {
  const snapshot = await loadConfigurationPageSnapshot({ tenantId: 'tenant-demo' })

  assert.ok(typeof snapshot.generatedAt === 'string')
  assert.ok(typeof snapshot.overview.generatedAt === 'string')
})
