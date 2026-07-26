import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DocController } from './doc.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

describe('DocController metadata', () => {
  it('controller should stay public for docs endpoints', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, DocController), true)
  })

  it('controller should allow skipping tenant guard', () => {
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, DocController), true)
  })
})
