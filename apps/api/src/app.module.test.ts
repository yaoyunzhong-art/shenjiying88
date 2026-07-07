import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// AppModule 使用了 ConfigModule.forRoot，其中 validate 会同步校验运行所需的最小 env 集合。
// import 语句会被 tsx 做静态提升，早于顶层 process.env 赋值，因此必须用 require 动态加载。
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret'
process.env.API_PORT = process.env.API_PORT ?? '3001'
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost'
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379'
process.env.LYT_MODE = process.env.LYT_MODE ?? 'mock'
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test'

import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { CouponV2 } from './modules/coupon/coupon.entity'
import { CouponRedemptionLog } from './modules/coupon/coupon-redemption-log.entity'
import { ReportController } from './modules/reports/report.controller'
import { MarketingController } from './modules/marketing/marketing.controller'
import { MarketingModule } from './modules/marketing/marketing.module'
import { ReportModule } from './modules/reports/report.module'
import { ReportService } from './modules/reports/report.service'
import assert from 'node:assert/strict'

const { AppModule } = require('./app.module')

describe('AppModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .compile()

    assert.ok(moduleRef)
    assert.ok(moduleRef instanceof TestingModule)
  })

  it('should expose self from module reference', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .compile()

    const appModule = moduleRef.get<typeof AppModule>(AppModule)
    assert.ok(appModule)
    assert.ok(appModule instanceof AppModule)
  })

  it('should mount ReportModule into AppModule graph', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .compile()

    const reportModuleRef = moduleRef.select(ReportModule)
    assert.ok(reportModuleRef)
  })

  it('should resolve reports controller and service from mounted ReportModule', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .compile()

    const reportModuleRef = moduleRef.select(ReportModule)
    const reportController = reportModuleRef.get(ReportController, { strict: true })
    const reportService = reportModuleRef.get(ReportService, { strict: true })

    assert.ok(reportController)
    assert.ok(reportService)
  })

  it('should mount MarketingModule into AppModule graph', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({} as DataSource)
      .overrideProvider(getRepositoryToken(CouponV2))
      .useValue({} as Repository<CouponV2>)
      .overrideProvider(getRepositoryToken(CouponRedemptionLog))
      .useValue({} as Repository<CouponRedemptionLog>)
      .compile()

    const marketingModuleRef = moduleRef.select(MarketingModule)
    assert.ok(marketingModuleRef)
    const marketingController = marketingModuleRef.get(MarketingController, { strict: true })
    assert.ok(marketingController)
  })
})
