import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { IoTModule } from './iot.module'
import { IoTController } from './iot.controller'

/**
 * IoT 模块端到端测试
 *
 * 模拟完整的 IoT 设备生命周期：
 * 注册 -> 上线 -> 心跳上报 -> MQTT 通信 -> OTA 升级 -> 健康检查 -> 工单创建 -> 下线
 */
describe('IoT Module E2E', () => {
  let controller: IoTController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [IoTModule],
    }).compile()
    controller = module.get<IoTController>(IoTController)
  })

  it('should complete full device lifecycle (register → online → heartbeat → MQTT → OTA → health → offline)', async () => {
    // 1+2. 设备上线（自动完成注册 + 状态更新）
    const online = await controller.deviceOnline({
      deviceId: 'e2e-esp-001',
      type: 'ESP32_S3' as any,
    })
    expect(online.deviceId).toBe('e2e-esp-001')
    expect(online.status).toBe('ONLINE')

    // 3. 心跳上报
    const heartbeat = controller.reportHeartbeat({
      deviceId: 'e2e-esp-001',
      latency: 25,
    })
    expect(heartbeat.deviceId).toBe('e2e-esp-001')
    expect(heartbeat.isTimeout).toBe(false)

    // 4. MQTT 连接 + 发布消息
    const mqttConn = controller.connectMQTT('mqtt://e2e-broker:1883')
    expect(mqttConn.connected).toBe(true)

    const pubResult = controller.publishMQTT({
      topic: 'devices/e2e-esp-001/cmd',
      payload: JSON.stringify({ action: 'restart' }),
    })
    expect(pubResult.success).toBe(true)

    // 5. 检查 MQTT 历史
    const history = controller.getMQTTHistory()
    expect(history.length).toBeGreaterThan(0)

    // 6. 上传固件
    const firmware = await controller.uploadFirmware({
      deviceType: 'ESP32_S3',
      version: '2.0.0',
    })
    expect(firmware.version).toBe('2.0.0')

    // 7. 安排 OTA 升级
    const tasks = await controller.scheduleOTA({
      deviceIds: ['e2e-esp-001'],
      firmwareVersion: '2.0.0',
    })
    expect(tasks.length).toBe(1) // dev-001 在 mock 数据中
    expect(tasks[0].status).toBe('scheduled')

    // 8. 执行 OTA 升级
    // 注意：OTA 需要在已注册设备上执行，使用 mock 预设的 dev-001
    const otaTask = await controller.executeOTA('dev-001')
    expect(otaTask.status).toBe('upgrading')

    // 9. 获取 OTA 状态
    const statusCheck = await controller.getOTAStatus(otaTask.id)
    expect(statusCheck).not.toBeNull()

    // 10. 获取设备健康度
    const health = await controller.getDeviceHealth('dev-001')
    expect(health.score).toBeGreaterThanOrEqual(0)

    // 11. 创建工单
    const workOrder = await controller.createWorkOrder({
      deviceId: 'e2e-esp-001',
      issue: '需要固件升级',
    })
    expect(workOrder.status).toBe('open')
    expect(workOrder.deviceId).toBe('e2e-esp-001')

    // 12. 自动指派工单
    const assigned = await controller.autoAssignWorkOrder({
      deviceId: 'e2e-esp-001',
      deviceType: 'ESP32_S3',
      description: '固件升级偏离',
      priority: 'P2' as any,
    })
    expect(assigned).not.toBeNull()

    // 13. 心跳状态查询
    const hs = controller.getHeartbeatStatus('e2e-esp-001')
    expect(hs.avgLatency).toBeGreaterThanOrEqual(0)

    // 14. MQTT 批量发布
    const batchResult = controller.publishMQTTBatch({
      messages: [
        { topic: 'devices/e2e-esp-001/ota', payload: 'check' },
        { topic: 'devices/e2e-esp-001/status', payload: 'ok' },
      ],
    })
    expect(batchResult.successCount).toBe(2)

    // 15. 设备下线
    const offline = controller.deviceOffline({ deviceId: 'e2e-esp-001' })
    expect(offline.success).toBe(true)

    // 16. 删除设备
    const delResult = controller.unregisterDevice('e2e-esp-001')
    expect(delResult.success).toBe(true)
  })

  it('should handle error cases gracefully', async () => {
    // 获取不存在设备的异常
    expect(() => controller.getDevice('nonexistent')).toThrow(/设备未找到/)
    expect(() => controller.unregisterDevice('nonexistent')).toThrow(/设备未找到/)

    // MQTT 未连接时发布应报错
    expect(() =>
      controller.publishMQTT({ topic: 't', payload: 'p' }),
    ).toThrow()

    // 空固件列表
    await expect(controller.listFirmwares('')).rejects.toThrow()
  })

  it('should manage multiple devices independently', async () => {
    const devices = ['multi-1', 'multi-2', 'multi-3']
    for (const id of devices) {
      controller.registerDevice({ deviceId: id, type: 'ESP32' as any })
    }

    const result = controller.listDevices({})
    expect(result.total).toBe(3)

    // 验证每个设备都是独立的
    const d1 = controller.getDevice('multi-1')
    expect(d1.deviceId).toBe('multi-1')
    expect(d1.status).toBe('OFFLINE')

    // 更新其中一个
    controller.updateDeviceStatus('multi-1', { status: 'ONLINE' as any })
    expect(controller.getDevice('multi-1').status).toBe('ONLINE')
    expect(controller.getDevice('multi-2').status).toBe('OFFLINE') // 不受影响
  })

  it('should validate OTA schedule and execution', async () => {
    // 安排 OTA
    const tasks = await controller.scheduleOTA({
      deviceIds: ['dev-001', 'dev-004'],
      firmwareVersion: '3.0.0',
    })
    expect(tasks.length).toBe(2)

    // 执行 OTA
    const executed = await controller.executeOTA('dev-001')
    expect(executed.status).toBe('upgrading')

    // 获取 OTA 状态
    const status = await controller.getOTAStatus(executed.id)
    expect(status).not.toBeNull()

    // 升级前校验
    const preValidate = await controller.validateBeforeUpgrade('dev-003')
    expect(preValidate.valid).toBe(false) // weak signal
    expect(preValidate.reasons.length).toBeGreaterThan(0)
  })

  it('should handle MQTT subscribe/publish pattern', () => {
    controller.connectMQTT('mqtt://e2e:1883')

    // 订阅主题
    const messages: string[] = []
    const unsub = mqttSubscribeHelper(controller, 'test/#', (msg) => {
      messages.push(msg.payload)
    })

    // 发布消息
    controller.publishMQTT({ topic: 'test/hello', payload: 'world' })
    controller.publishMQTT({ topic: 'test/foo', payload: 'bar' })

    // 取消订阅
    unsub()
  })
})

// Simple MQTT subscription helper using the injected mqttService
function mqttSubscribeHelper(
  controller: IoTController,
  topic: string,
  handler: (msg: { topic: string; payload: string }) => void,
): () => void {
  // Access mqttService from the controller's internal state
  const mqttService = (controller as any).mqttService
  return mqttService.subscribe(topic, handler)
}
