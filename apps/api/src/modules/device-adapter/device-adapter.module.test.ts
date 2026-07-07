import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { DeviceAdapterModule } from './device-adapter.module'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceAdapterService } from './device-adapter.service'

describe('DeviceAdapterModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DeviceAdapterModule],
    }).compile()
  })

  it('should compile the module', () => {
    expect(module).toBeDefined()
  })

  it('should provide the controller', () => {
    const controller = module.get<DeviceAdapterController>(DeviceAdapterController)
    expect(controller).toBeInstanceOf(DeviceAdapterController)
  })

  it('should provide the service', () => {
    const service = module.get<DeviceAdapterService>(DeviceAdapterService)
    expect(service).toBeInstanceOf(DeviceAdapterService)
  })

  it('should export the service', () => {
    const exported = module.get<DeviceAdapterService>(DeviceAdapterService)
    expect(exported.registerDevice).toBeDefined()
    expect(exported.listDevices).toBeDefined()
    expect(exported.connect).toBeDefined()
    expect(exported.posTransaction).toBeDefined()
  })
})
