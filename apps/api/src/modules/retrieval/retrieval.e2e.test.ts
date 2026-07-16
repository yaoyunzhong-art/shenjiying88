import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Retrieval RAG 检索 HTTP 链路
 *
 * 链路:
 *   HTTP → RetrievalController → RetrievalService → QdrantClientWrapper + EmbeddingService + CacheService
 *
 * 验证:
 *   - POST /api/retrieval/query — 全文搜索
 *   - POST /api/retrieval/query/knowledge — 知识库搜索
 *   - GET /api/retrieval/health — 健康检查
 *   - 索引创建与向量搜索骨架流程
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { RetrievalService } from './retrieval.service'
import { retrievalConfig } from './config/retrieval.config'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { CACHE_SERVICE, CacheModule } from '../../infrastructure/cache/cache.module'
import type { CacheService } from '../../infrastructure/cache/cache.module'
import type { RetrievalQuery, RetrievalResponse } from './retrieval.types'

@Controller('api/retrieval')
class TestRetrievalController {
  constructor(
    @Inject(RetrievalService) private readonly retrievalService: RetrievalService
  ) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(): Promise<RetrievalResponse> {
    const q: RetrievalQuery = { query: 'loyalty rule engine', topK: 10, hybrid: true }
    return this.retrievalService.retrieveCode(q)
  }

  @Post('query/knowledge')
  @HttpCode(HttpStatus.OK)
  async queryKnowledge(): Promise<RetrievalResponse> {
    const q: RetrievalQuery = { query: 'deployment guide', topK: 5, collections: ['knowledge_docs'] }
    return this.retrievalService.retrieveKnowledge(q)
  }

  @Get('health')
  async health(): Promise<Record<string, unknown>> {
    const components = await this.retrievalService.getComponentHealth()
    return {
      qdrant: components.qdrant,
      embedder: components.embedder,
      lastIndexAt: components.lastIndexAt,
      checkedAt: new Date().toISOString(),
      module: 'retrieval',
      phase: 'phase-19',
    }
  }
}

async function buildApp() {
  // Use InMemory cache to avoid Redis dependency
  const moduleImports = [
    CacheModule.forRootInMemory(),
    ConfigModule.forFeature(retrievalConfig),
  ]

  const moduleRef = await Test.createTestingModule({
    imports: moduleImports,
    controllers: [TestRetrievalController],
    providers: [
      { provide: RetrievalService, useClass: RetrievalService },
      { provide: QdrantClientWrapper, useClass: QdrantClientWrapper },
      { provide: EmbeddingService, useClass: EmbeddingService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app }
}

it('e2e: POST /api/retrieval/query returns skeleton empty response', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/retrieval/query')
      .send({})
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.results))
    assert.equal(res.body.results.length, 0)
    assert.equal(res.body.totalHits, 0)
    assert.equal(res.body.latencyMs, 0)
    assert.equal(res.body.cacheHit, false)
    assert.deepStrictEqual(res.body.collections, ['code_chunks'])
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/retrieval/query/knowledge returns knowledge collection skeleton', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/retrieval/query/knowledge')
      .send({})
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.results))
    assert.equal(res.body.results.length, 0)
    assert.deepStrictEqual(res.body.collections, ['knowledge_docs'])
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/retrieval/health returns component status', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/retrieval/health')
    assert.equal(res.statusCode, 200)
    assert.ok(['ok', 'degraded', 'unavailable'].includes(res.body.qdrant))
    assert.ok(['ok', 'degraded', 'unavailable'].includes(res.body.embedder))
    assert.equal(res.body.module, 'retrieval')
    assert.equal(res.body.phase, 'phase-19')
    assert.ok(typeof res.body.checkedAt === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: health returned lastIndexAt is null when no index operation', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/retrieval/health')
    assert.equal(res.body.lastIndexAt, null)
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/retrieval/query with hybrid flag still returns skeleton', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/retrieval/query')
      .send({ hybrid: true })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.totalHits, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/retrieval/query/knowledge returns 200 with empty results for any body', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/retrieval/query/knowledge')
      .send({ query: 'anything', topK: 100, threshold: 0.1 })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.totalHits, 0)
  } finally {
    await app.close()
  }
})
