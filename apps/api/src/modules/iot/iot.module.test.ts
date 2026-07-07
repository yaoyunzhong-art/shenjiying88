import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { IoTModule } from './iot.module'
import { IoTController } from './iot.controller'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'

describe('IoTModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [IoTModule],
    }).compile()
  })

  it('should compile the module', () => {
    expect(module).toBeDefined()
  })

  it('should provide the controller', () => {
    const controller = module.get<IoTController>(IoTController)
    expect(controller).toBeInstanceOf(IoTController)
  })

  it('should provide ESP32DeviceService', () => {
    const svc = module.get<ESP32DeviceService>(ESP32DeviceService)
    expect(svc).toBeInstanceOf(ESP32DeviceService)
  })

  it('should provide MQTTBrokerService', () => {
    const svc = module.get<MQTTBrokerService>(MQTTBrokerService)
    expect(svc).toBeInstanceOf(MQTTBrokerService)
  })

  it('should provide AdaptiveHeartbeatService', () => {
    const svc = module.get<AdaptiveHeartbeatService>(AdaptiveHeartbeatService)
    expect(svc).toBeInstanceOf(AdaptiveHeartbeatService)
  })

  it('should provide IoTHardwareService', () => {
    const svc = module.get<IoTHardwareService>(IoTHardwareService)
    expect(svc).toBeInstanceOf(IoTHardwareService)
  })

  it('should provide OTAFirmwareService', () => {
    const svc = module.get<OTAFirmwareService>(OTAFirmwareService)
    expect(svc).toBeInstanceOf(OTAFirmwareService)
  })

  it('should provide DeviceStateValidator', () => {
    const svc = module.get<DeviceStateValidator>(DeviceStateValidator)
    expect(svc).toBeInstanceOf(DeviceStateValidator)
  })

  it('should provide WorkOrderAutoAssignService', () => {
    const svc = module.get<WorkOrderAutoAssignService>(WorkOrderAutoAssignService)
    expect(svc).toBeInstanceOf(WorkOrderAutoAssignService)
  })

  it('should export ESP32DeviceService', () => {
    const exported = module.get<ESP32DeviceService>(ESP32DeviceService)
    expect(exported.registerDevice).toBeDefined()
    expect(exported.listDevices).toBeDefined()
  })

  it('should export MQTTBrokerService', () => {
    const exported = module.get<MQTTBrokerService>(MQTTBrokerService)
    expect(exported.publish).toBeDefined()
    expect(exported.subscribe).toBeDefined()
  })

  it('should export AdaptiveHeartbeatService', () => {
    const exported = module.get<AdaptiveHeartbeatService>(AdaptiveHeartbeatService)
    expect(exported.recordHeartbeat).toBeDefined()
    expect(exported.getHeartbeatStatus).toBeDefined()
  })

  it('should export OTAFirmwareService', () => {
    const exported = module.get<OTAFirmwareService>(OTAFirmwareService)
    expect(exported.uploadFirmware).toBeDefined()
    expect(exported.listFirmwares).toBeDefined()
  })

  it('should export IoTHardwareService', () => {
    const exported = module.get<IoTHardwareService>(IoTHardwareService)
    expect(exported.deviceOnline).toBeDefined()
    expect(exported.deviceOffline).toBeDefined()
  })
})
