import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BrandCustomModule } from './brand-custom.module'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'

describe('BrandCustomModule', () => {
  it('should be defined', () => {
    expect(BrandCustomModule).toBeDefined()
  })

  it('should have BrandCustomController', () => {
    const module = Reflect.getMetadata('controllers', BrandCustomModule)
    expect(module).toContain(BrandCustomController)
  })

  it('should have BrandCustomService', () => {
    const providers = Reflect.getMetadata('providers', BrandCustomModule)
    expect(providers).toContain(BrandCustomService)
  })

  it('should export BrandCustomService', () => {
    const exports = Reflect.getMetadata('exports', BrandCustomModule)
    expect(exports).toContain(BrandCustomService)
  })
})
