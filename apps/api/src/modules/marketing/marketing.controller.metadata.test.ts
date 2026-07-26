import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MarketingController } from './marketing.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

describe('MarketingController metadata', () => {
  it('controller should stay public for anonymous marketing flows', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, MarketingController), true)
  })

  it('controller should allow skipping tenant guard', () => {
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, MarketingController), true)
  })

  it('controller should not require explicit permissions or tenant scope', () => {
    assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, MarketingController), undefined)
    assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, MarketingController), undefined)
  })
})
