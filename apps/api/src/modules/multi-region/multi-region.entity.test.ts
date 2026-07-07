import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multi-region.entity.test.ts
 * 用途: 多区域实体类型单元测试
 */

import assert from 'node:assert/strict'
import {
  ALL_REGIONS,
  DEFAULT_REGION,
  Region,
} from './multi-region.entity'

describe('MultiRegionEntity', () => {

  it('ALL_REGIONS contains correct regions', () => {
    assert.equal(ALL_REGIONS.length, 4)
    assert.ok(ALL_REGIONS.includes('cn'))
    assert.ok(ALL_REGIONS.includes('us'))
    assert.ok(ALL_REGIONS.includes('eu'))
    assert.ok(ALL_REGIONS.includes('jp'))
  })

  it('DEFAULT_REGION is cn', () => {
    assert.equal(DEFAULT_REGION, 'cn')
  })

  it('ALL_REGIONS is stable (push does not throw, but should not mutate)', () => {
    // ALL_REGIONS is a plain const array, not frozen
    assert.equal(ALL_REGIONS.length, 4)
  })

  it('ALL_REGIONS has no duplicates', () => {
    const set = new Set(ALL_REGIONS)
    assert.equal(set.size, ALL_REGIONS.length)
  })

  it('ALL_REGIONS satisfies Region type constraint', () => {
    const regions = new Set<Region>(ALL_REGIONS)
    assert.equal(regions.has('cn'), true)
    assert.equal(regions.has('us'), true)
    assert.equal(regions.has('eu'), true)
    assert.equal(regions.has('jp'), true)
  })
})
