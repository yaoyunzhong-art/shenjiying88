import assert from 'node:assert/strict'
import test from 'node:test'
import {
  toBootstrapFoundationMetadata,
  toRegionalLoginPolicyContract
} from './bootstrap.contract'

test('contract mapper: bootstrap foundation metadata normalizes empty dependency summary', () => {
  assert.deepEqual(toBootstrapFoundationMetadata(undefined), {
    foundationDependencies: [],
    foundationContracts: []
  })
})

test('contract mapper: regional login policy is explicit contract object', () => {
  assert.deepEqual(toRegionalLoginPolicyContract('/cn-mainland/tenant-demo/login', true), {
    defaultLoginPath: '/cn-mainland/tenant-demo/login',
    ssoEnabled: true
  })
})

