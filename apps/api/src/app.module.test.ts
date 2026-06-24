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
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

 
const { AppModule } = require('./app.module')

describe('AppModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    assert.ok(moduleRef)
    assert.ok(moduleRef instanceof TestingModule)
  })

  test('should expose self from module reference', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    const appModule = moduleRef.get<typeof AppModule>(AppModule)
    assert.ok(appModule)
    assert.ok(appModule instanceof AppModule)
  })
})
