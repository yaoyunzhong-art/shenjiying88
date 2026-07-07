import { Module } from '@nestjs/common'
import { IoTController } from './iot.controller'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'

/**
 * IoT 设备管理模块
 *
 * 提供 ESP32 设备注册管理、MQTT 物联网通信、自适应心跳监控、
 * OTA 固件升级、设备健康度评分、工单自动指派等能力。
 */
@Module({
  controllers: [IoTController],
  providers: [
    ESP32DeviceService,
    MQTTBrokerService,
    AdaptiveHeartbeatService,
    IoTHardwareService,
    OTAFirmwareService,
    DeviceStateValidator,
    WorkOrderAutoAssignService,
  ],
  exports: [
    ESP32DeviceService,
    MQTTBrokerService,
    AdaptiveHeartbeatService,
    IoTHardwareService,
    OTAFirmwareService,
  ],
})
export class IoTModule {}
