import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap'
import {
  formatIdentityCheckLabel,
  loadIdentityAccessWorkspace,
  summarizeIdentityValidation,
} from '../identity-access-view-model'

describe('IdentityAccessPage 结构固证', () => {
  it('fallback 模式下透出来源态与治理依赖', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch

    try {
      const workspaceSnapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' })
      const workbenchSnapshot = await getAdminWorkbenchConsumerSnapshot()
      assert.equal(workspaceSnapshot.deliveryMode, 'fallback')
      assert.equal(workbenchSnapshot.consumerDescriptor.consumer, 'workbench')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('fallback workspace 保留三类校验结果', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch

    try {
      const snapshot = await loadIdentityAccessWorkspace()
      assert.equal(snapshot.workspace.roleValidation?.status, 'allowed')
      assert.equal(snapshot.workspace.permissionValidation?.status, 'allowed')
      assert.equal(snapshot.workspace.tenantScopeValidation?.status, 'allowed')
      assert.equal(formatIdentityCheckLabel('tenant-scope'), '租户边界校验')
      assert.match(summarizeIdentityValidation(snapshot.workspace.permissionValidation), /权限校验/)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
