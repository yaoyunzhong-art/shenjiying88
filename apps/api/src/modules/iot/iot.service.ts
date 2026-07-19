/**
 * iot.service.ts — IoT Service (canonical name)
 *
 * IoT 模块入口。
 * 统一导出设备管理 & OTA 升级的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   ESP32DeviceService        ESP32 设备管理 (注册/心跳/状态)
 *   MQTTBrokerService         MQTT 消息代理 (发布/订阅/主题管理)
 *   AdaptiveHeartbeatService  自适应心跳 (动态间隔/超时检测)
 *   IoTHardwareService        硬件抽象层 (传感器 / GPIO)
 *   OTAFirmwareService        OTA 固件升级 (上传/分发/回滚)
 *   DeviceStateValidator      设备状态校验
 *   WorkOrderAutoAssignService 工单自动分配 (技能匹配/距离/负载)
 *
 * 实体类型 ─────────────────────
 *   DeviceType               ESP32_S3 / ESP32_C3 / ESP32 / ESP8266
 *   DeviceStatus             ONLINE / OFFLINE / BUSY / ERROR
 *   NetworkStatus            online / offline / weak
 *   DeviceState              idle / upgrading / error / maintenance
 *   ESP32Device              设备实体
 *   MQTTMessage              消息实体
 *   HeartbeatRecord          心跳记录
 *   HeartbeatStatus          心跳状态
 *   OTAStatus                升级状态枚举
 *   FirmwareBinary/Record    固件
 *   OTATaskRecord            OTA 任务
 *   DeviceInfo               设备信息
 *   WorkOrderPriority/Status 工单枚举
 *   DeviceHealthReport       健康报告
 *   WorkOrderRecord/Issue    工单记录/问题
 *   TechnicianInfo           技术人员
 *   DeviceFilter             设备过滤
 *   DeviceListResponse       列表响应
 *   OTAPreValidateResult     OTA 前置校验
 *   OTAPostValidateResult    OTA 后置校验
 *   LatencyStats             延迟统计
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { ESP32DeviceService, OTAFirmwareService, DeviceType } from './iot.service'
 *   const devSvc = app.get(ESP32DeviceService)
 *   const otaSvc = app.get(OTAFirmwareService)
 *   const device = devSvc.registerDevice({ type: 'ESP32_S3', name: 'sensor-01' })
 *   const task = otaSvc.startUpgrade(device.deviceId, firmwareId)
 *
 * @module IoT
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

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  DeviceType,
  DeviceStatus,
  NetworkStatus,
  DeviceState,
  ESP32Device,
  MQTTMessage,
  HeartbeatRecord,
  HeartbeatStatus,
  OTAStatus,
  FirmwareBinary,
  FirmwareRecord,
  OTATaskRecord,
  DeviceInfo,
  WorkOrderPriority,
  WorkOrderStatus,
  DeviceHealthReport,
  WorkOrderRecord,
  TechnicianInfo,
  WorkOrderIssue,
  DeviceFilter,
  DeviceListResponse,
  OTAPreValidateResult,
  OTAPostValidateResult,
  LatencyStats,
} from './iot.entity'

// ─── IoT 常量 ──────────────────────────────────────────────────────────────
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 60_000 // 1 min
export const MIN_HEARTBEAT_INTERVAL_MS = 5_000 // 5 sec
export const MAX_HEARTBEAT_INTERVAL_MS = 600_000 // 10 min
export const HEARTBEAT_TIMEOUT_MULTIPLIER = 3 // 3 missed heartbeats = timeout
export const OTA_MAX_RETRY = 3
export const OTA_CHUNK_SIZE_BYTES = 65_536 // 64KB
