import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { AIReviewerModule } from './ai-reviewer.module'

describe('AIReviewerModule', () => {
  it('should be defined', () => {
    expect(AIReviewerModule).toBeDefined()
  })

  it('should have controllers array with AIReviewerController', () => {
    const metadata = Reflect.getMetadata('controllers', AIReviewerModule)
    expect(metadata).toBeDefined()
    expect(metadata).toHaveLength(1)
    expect(metadata[0].name).toBe('AIReviewerController')
  })

  it('should have providers array with AIReviewerService', () => {
    const metadata = Reflect.getMetadata('providers', AIReviewerModule)
    expect(metadata).toBeDefined()
    expect(metadata).toHaveLength(1)
    expect(metadata[0].name).toBe('AIReviewerService')
  })

  it('should export AIReviewerService', () => {
    const metadata = Reflect.getMetadata('exports', AIReviewerModule)
    expect(metadata).toBeDefined()
    expect(metadata).toHaveLength(1)
    expect(metadata[0].name).toBe('AIReviewerService')
  })
})
