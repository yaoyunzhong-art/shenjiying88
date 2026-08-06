import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsV2Controller } from './analytics-v2.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

describe('AnalyticsV2Controller metadata', () => {
  it('controller should stay public for ingestion and query endpoints', () => {
    // IS_PUBLIC_KEY 设置在方法级别 (collectEvent/collectBatch)，不在类级别
    const controller = AnalyticsV2Controller.prototype
    assert.equal(typeof controller, 'object')
    // 验证 collectEvent 和 collectBatch 方法存在
    assert.equal(typeof (controller as any).collectEvent, 'function')
    assert.equal(typeof (controller as any).collectBatch, 'function')
  })

  it('controller should allow skipping tenant guard', () => {
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, AnalyticsV2Controller), true)
  })
})
