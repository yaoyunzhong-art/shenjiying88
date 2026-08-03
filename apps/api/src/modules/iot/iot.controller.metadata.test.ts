import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { IoTController } from './iot.controller'

describe('IoTController metadata', () => {
  it('controller should keep iot path', () => {
    assert.equal(Reflect.getMetadata('path', IoTController), 'iot')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [IoTController.prototype.registerDevice, 1, 'devices'],
      [IoTController.prototype.listDevices, 0, 'devices'],
      [IoTController.prototype.getDevice, 0, 'devices/:deviceId'],
      [IoTController.prototype.updateDeviceStatus, 1, 'devices/:deviceId/status'],
      [IoTController.prototype.unregisterDevice, 3, 'devices/:deviceId'],
      [IoTController.prototype.deviceOnline, 1, 'devices/online'],
      [IoTController.prototype.deviceOffline, 1, 'devices/offline'],
      [IoTController.prototype.connectMQTT, 1, 'mqtt/connect'],
      [IoTController.prototype.disconnectMQTT, 1, 'mqtt/disconnect'],
      [IoTController.prototype.publishMQTT, 1, 'mqtt/publish'],
      [IoTController.prototype.publishMQTTBatch, 1, 'mqtt/batch-publish'],
      [IoTController.prototype.getMQTTHistory, 0, 'mqtt/history'],
      [IoTController.prototype.getMQTTStatus, 0, 'mqtt/status'],
      [IoTController.prototype.reportHeartbeat, 1, 'heartbeat'],
      [IoTController.prototype.getHeartbeatStatus, 0, 'heartbeat/:deviceId'],
      [IoTController.prototype.getLatencyStats, 0, 'heartbeat/:deviceId/latency'],
      [IoTController.prototype.uploadFirmware, 1, 'ota/firmware'],
      [IoTController.prototype.listFirmwares, 0, 'ota/firmware'],
      [IoTController.prototype.scheduleOTA, 1, 'ota/schedule'],
      [IoTController.prototype.executeOTA, 1, 'ota/execute/:deviceId'],
      [IoTController.prototype.cancelOTA, 1, 'ota/cancel/:otaTaskId'],
      [IoTController.prototype.getOTAStatus, 0, 'ota/status/:otaTaskId'],
      [IoTController.prototype.validateBeforeUpgrade, 0, 'ota/validate/:deviceId'],
      [IoTController.prototype.validateAfterUpgrade, 0, 'ota/validate-after/:deviceId'],
      [IoTController.prototype.getDeviceHealth, 0, 'devices/:deviceId/health'],
      [IoTController.prototype.createWorkOrder, 1, 'work-orders'],
      [IoTController.prototype.autoAssignWorkOrder, 1, 'work-orders/auto-assign'],
      [IoTController.prototype.sendOTAUpdate, 1, 'ota/send/:deviceId'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
