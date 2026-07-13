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

it('contract mapper: bootstrap foundation metadata handles null', () => {
  assert.deepEqual(toBootstrapFoundationMetadata(null), {
    foundationDependencies: [],
    foundationContracts: []
  })
})

it('contract mapper: bootstrap foundation metadata preserves provided values', () => {
  const result = toBootstrapFoundationMetadata({
    dependsOn: ['FoundationCoreModule', 'AuthModule'],
    handoffContracts: ['BootstrapSetupContract']
  })
  assert.deepEqual(result, {
    foundationDependencies: ['FoundationCoreModule', 'AuthModule'],
    foundationContracts: ['BootstrapSetupContract']
  })
})

it('contract mapper: bootstrap foundation metadata partial - only dependsOn', () => {
  const result = toBootstrapFoundationMetadata({
    dependsOn: ['ConfigModule']
  })
  assert.deepEqual(result, {
    foundationDependencies: ['ConfigModule'],
    foundationContracts: []
  })
})

it('contract mapper: bootstrap foundation metadata partial - only handoffContracts', () => {
  const result = toBootstrapFoundationMetadata({
    handoffContracts: ['HealthCheckContract']
  })
  assert.deepEqual(result, {
    foundationDependencies: [],
    foundationContracts: ['HealthCheckContract']
  })
})

it('contract mapper: regional login policy is explicit contract object', () => {
  assert.deepEqual(toRegionalLoginPolicyContract('/cn-mainland/tenant-demo/login', true), {
    defaultLoginPath: '/cn-mainland/tenant-demo/login',
    ssoEnabled: true
  })
})

it('contract mapper: regional login policy with sso disabled', () => {
  assert.deepEqual(toRegionalLoginPolicyContract('/us-east/login', false), {
    defaultLoginPath: '/us-east/login',
    ssoEnabled: false
  })
})

it('contract mapper: regional login policy root path', () => {
  assert.deepEqual(toRegionalLoginPolicyContract('/', true), {
    defaultLoginPath: '/',
    ssoEnabled: true
  })
})
