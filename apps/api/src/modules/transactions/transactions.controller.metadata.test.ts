import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TransactionsController } from './transactions.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

describe('TransactionsController metadata', () => {
  const callbackHandler = TransactionsController.prototype.applyPaymentCallback

  it('payment callback should stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, callbackHandler), true)
  })

  it('payment callback should allow skipping tenant guard', () => {
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, callbackHandler), true)
  })

  it('payment callback should stay permissionless and tenant-scope-free', () => {
    assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, callbackHandler), undefined)
    assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, callbackHandler), undefined)
  })
})
