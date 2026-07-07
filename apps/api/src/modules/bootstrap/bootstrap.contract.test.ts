import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  toBootstrapFoundationMetadata,
  toRegionalLoginPolicyContract
} from './bootstrap.contract'

it('contract mapper: bootstrap foundation metadata normalizes empty dependency summary', () => {
  assert.deepEqual(toBootstrapFoundationMetadata(undefined), {
    foundationDependencies: [],
    foundationContracts: []
  })
})

it('contract mapper: regional login policy is explicit contract object', () => {
  assert.deepEqual(toRegionalLoginPolicyContract('/cn-mainland/tenant-demo/login', true), {
    defaultLoginPath: '/cn-mainland/tenant-demo/login',
    ssoEnabled: true
  })
})

