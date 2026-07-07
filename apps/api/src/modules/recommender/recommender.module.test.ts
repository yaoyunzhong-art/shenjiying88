import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { Test } from '@nestjs/testing'
import { RecommenderModule } from './recommender.module'
import { RecommenderService } from './recommender.service'
import { RecommenderController } from './recommender.controller'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'

describe('RecommenderModule', () => {
  it('should be defined', () => {
    expect(RecommenderModule).toBeDefined()
  })

  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    expect(moduleRef).toBeDefined()
  })

  it('should provide RecommenderService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const service = moduleRef.get<RecommenderService>(RecommenderService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(RecommenderService)
  })

  it('should provide RecommenderController', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const controller = moduleRef.get<RecommenderController>(RecommenderController)
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(RecommenderController)
  })

  it('should provide ContextBuilderService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const service = moduleRef.get<ContextBuilderService>(ContextBuilderService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(ContextBuilderService)
  })

  it('should provide RagRetrievalService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const service = moduleRef.get<RagRetrievalService>(RagRetrievalService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(RagRetrievalService)
  })

  it('should provide PersonalizedRecommenderService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const service = moduleRef.get<PersonalizedRecommenderService>(
      PersonalizedRecommenderService,
    )
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(PersonalizedRecommenderService)
  })

  it('should have controller wired with services', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RecommenderModule],
    }).compile()
    const controller = moduleRef.get<RecommenderController>(RecommenderController)
    expect(controller).toBeDefined()
    // Verify controller method signatures exist
    expect(typeof controller.recommend).toBe('function')
    expect(typeof controller.getContext).toBe('function')
    expect(typeof controller.recordFeedback).toBe('function')
    expect(typeof controller.search).toBe('function')
    expect(typeof controller.getStats).toBe('function')
  })
})
