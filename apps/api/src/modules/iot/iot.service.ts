/**
 * iot.service.ts — IoT Service (canonical name)
 *
 * 🐜 V17: 模块补齐 — 规范文件名
 *
 * 委托至 iot-hardware.service.ts 和 ota-upgrade.service.ts。
 */

export {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
export {
  OTAFirmwareService,
  DeviceStateValidator,
  WorkOrderAutoAssignService,
} from './ota-upgrade.service'
