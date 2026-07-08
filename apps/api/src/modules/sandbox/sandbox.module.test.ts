import { describe, it, expect } from 'vitest'
import { Test } from '@nestjs/testing'
import { SandboxModule } from './sandbox.module'
import { SandboxService, ISVAppStore, SDKMultiLangService, SandboxIsvService } from './sandbox-isv.service'
import { SandboxController } from './sandbox.controller'

describe('SandboxModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    expect(module).toBeDefined()
  })

  it('should provide SandboxController', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const controller = module.get<SandboxController>(SandboxController)
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(SandboxController)
  })

  it('should provide SandboxService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const service = module.get<SandboxService>(SandboxService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(SandboxService)
  })

  it('should provide ISVAppStore', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const store = module.get<ISVAppStore>(ISVAppStore)
    expect(store).toBeDefined()
    expect(store).toBeInstanceOf(ISVAppStore)
  })

  it('should provide SDKMultiLangService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const sdkService = module.get<SDKMultiLangService>(SDKMultiLangService)
    expect(sdkService).toBeDefined()
    expect(sdkService).toBeInstanceOf(SDKMultiLangService)
  })

  it('should provide SandboxIsvService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const isvService = module.get<SandboxIsvService>(SandboxIsvService)
    expect(isvService).toBeDefined()
    expect(isvService).toBeInstanceOf(SandboxIsvService)
  })

  it('should export SandboxService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const exported = module.get<SandboxService>(SandboxService)
    expect(exported).toBeInstanceOf(SandboxService)
  })

  it('should export ISVAppStore', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const exported = module.get<ISVAppStore>(ISVAppStore)
    expect(exported).toBeInstanceOf(ISVAppStore)
  })

  it('should export SDKMultiLangService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const exported = module.get<SDKMultiLangService>(SDKMultiLangService)
    expect(exported).toBeInstanceOf(SDKMultiLangService)
  })

  it('should export SandboxIsvService', async () => {
    const module = await Test.createTestingModule({
      imports: [SandboxModule],
    }).compile()

    const exported = module.get<SandboxIsvService>(SandboxIsvService)
    expect(exported).toBeInstanceOf(SandboxIsvService)
  })
})
