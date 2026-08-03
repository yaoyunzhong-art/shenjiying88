import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsV2Controller } from './analytics-v2.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

describe('AnalyticsV2Controller metadata', () => {
  it('controller should stay public for ingestion and query endpoints', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, AnalyticsV2Controller), true)
  })

  it('controller should allow skipping tenant guard', () => {
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, AnalyticsV2Controller), true)
  })
})
