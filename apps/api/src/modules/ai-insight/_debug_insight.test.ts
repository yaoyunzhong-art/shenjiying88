import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Controller, Get, Post, Query, Headers, Inject } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AiInsightService } from './ai-insight.service'

@Controller('ai-insight')
class TestCtrl {
  constructor(@Inject(AiInsightService) private readonly svc: AiInsightService) {}
  @Post('anomalies/detect')
  detect(@Headers('x-tenant-id') t: string, @Query() q: any) {
    return this.svc.detectAnomalies(t, q.storeId, q.metric)
  }
  @Get('anomalies')
  list(@Headers('x-tenant-id') t: string, @Query() q: any) {
    return this.svc.getAnomalies(t, q)
  }
}

it('debug: detect then list anomalies', async () => {
  const svc = new AiInsightService()
  const m = await Test.createTestingModule({
    controllers: [TestCtrl],
    providers: [{ provide: AiInsightService, useValue: svc }]
  }).compile()
  const app = m.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  try {
    const r1 = await request(app.getHttpServer())
      .post('/ai-insight/anomalies/detect')
      .set('x-tenant-id', 'tenant-001')
    console.log('detect:', r1.statusCode, JSON.stringify(r1.body).slice(0, 200))
    const r2 = await request(app.getHttpServer())
      .get('/ai-insight/anomalies')
      .set('x-tenant-id', 'tenant-001')
    console.log('list:', r2.statusCode, JSON.stringify(r2.body).slice(0, 200))
  } finally {
    await app.close()
  }
})
