import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * i18n.module.test.ts - Phase-20 T44
 * 用途: 校验 I18nModule 可正确编译和实例化
 */
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { I18nModule } from './i18n.module'
import { I18nController } from './i18n.controller'
import { I18nService } from './i18n.service'
import { LocaleRouterService } from './locale-router.service'

describe('I18nModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nModule],
    }).compile()

    assert.ok(moduleRef)
  })

  it('should provide I18nService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nModule],
    }).compile()

    const service = moduleRef.get<I18nService>(I18nService)
    assert.ok(service)
    assert.ok(service instanceof I18nService)
  })

  it('should provide I18nController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nModule],
    }).compile()

    const controller = moduleRef.get<I18nController>(I18nController)
    assert.ok(controller)
    assert.ok(controller instanceof I18nController)
  })

  it('should provide LocaleRouterService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nModule],
    }).compile()

    const service = moduleRef.get<LocaleRouterService>(LocaleRouterService)
    assert.ok(service)
    assert.ok(service instanceof LocaleRouterService)
  })

  it('I18nService t() should work through module', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nModule],
    }).compile()

    const service = moduleRef.get<I18nService>(I18nService)
    service.registerTranslations('zh-CN', { 'hello': '你好' })
    assert.equal(service.t('hello'), '你好')
    assert.equal(service.t('nonexistent'), 'nonexistent')
  })

  it('set of providers is correct', () => {
    const metadata = Reflect.getMetadata('providers', I18nModule)
    assert.ok(metadata)
    assert.ok(metadata.includes(I18nService))
    assert.ok(metadata.includes(LocaleRouterService))
  })

  it('set of controllers is correct', () => {
    const metadata = Reflect.getMetadata('controllers', I18nModule)
    assert.ok(metadata)
    assert.ok(metadata.includes(I18nController))
  })

  it('has Global decorator', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', I18nModule)
    assert.equal(isGlobal, true)
  })
})
