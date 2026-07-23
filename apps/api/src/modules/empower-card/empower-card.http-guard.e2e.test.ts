import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { EmpowerCardController } from './empower-card.controller'
import { EmpowerCardService } from './empower-card.service'
import { TenantGuard } from '../agent/tenant.guard'
import { IdentityAccessGuard } from '../foundation/identity-access/identity-access.guard'
import { IdentityAccessService } from '../foundation/identity-access/identity-access.service'

const mockEmpowerCardService = {
  healthCheck: async () => ({
    status: 'ok' as const,
    timestamp: '2026-07-23T15:52:37.634Z',
    cardsCount: 3,
    lastImport: null,
    matchApiReachable: true,
    quoteApiReachable: true,
    lastMatch: null,
  }),
  getById: async (id: string) => ({
    id,
    tag: '运营',
    summary: '门店周末活动方案模板',
    source: '运营手册',
    freshnessScore: 100,
    moduleMapping: 'ops-manual',
    quoteCount: 0,
    lastQuotedAt: null,
    confidence: 80,
    expertVetted: false,
    detailUrl: null,
    createdAt: '2026-07-23T00:00:00.000Z',
    updatedAt: '2026-07-23T00:00:00.000Z',
  }),
  list: async () => [],
  create: async () => {
    throw new Error('not implemented in test')
  },
  search: async () => ({ cards: [], total: 0 }),
  autoMatchForDispatch: async () => [],
  recordQuote: async () => undefined,
  applyDecay: async () => ({ decayed: 0, archived: 0 }),
  getTodayEmpowerScore: async () => ({ score: 0, quotes: 0, newCards: 0 }),
} as const

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [EmpowerCardController],
    providers: [
      Reflector,
      TenantGuard,
      IdentityAccessService,
      IdentityAccessGuard,
      { provide: EmpowerCardService, useValue: mockEmpowerCardService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalGuards(
    app.get(IdentityAccessGuard),
  )
  await app.init()

  return app
}

describe('EmpowerCardController HTTP guard boundary', () => {
  it('e2e: GET /empower-cards/health is public and tenant-optional', async () => {
    const app = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/empower-cards/health')

      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.status, 'ok')
      assert.equal(res.body.data.cardsCount, 3)
    } finally {
      await app.close()
    }
  })

  it('e2e: GET /empower-cards/:id remains non-public', async () => {
    const app = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/empower-cards/card-001')

      assert.equal(res.statusCode, 401)
      assert.equal(
        res.body.message,
        'This endpoint is not publicly accessible. Mark with @Public() or provide authentication.'
      )
      assert.equal(res.body.error, 'Unauthorized')
    } finally {
      await app.close()
    }
  })
})
