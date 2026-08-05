import { describe, it, expect } from 'vitest'
import { CacheModule, CACHE_SERVICE, InMemoryCacheService, type CacheService } from '../../../infrastructure/cache/cache.module'

describe('import-test', () => {
  it('can import from license dir', () => {
    expect(CacheModule).toBeDefined()
  })
})
