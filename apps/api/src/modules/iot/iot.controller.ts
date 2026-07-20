import { Controller, Get, Post, Delete, Param, Body, Query, UsePipes, ValidationPipe, HttpException, HttpStatus, UseGuards } from '@nestjs/common'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'
import type {
  ESP32Device,
  MQTTMessage,
  HeartbeatStatus,
  OTATaskRecord,
  DeviceHealthReport,
  FirmwareRecord,
  WorkOrderRecord,
  WorkOrderIssue,
} from './iot.entity'
import {
  RegisterDeviceDto,
  UpdateDeviceStatusDto,
  DeviceFilterDto,
  DeviceOnlineDto,
  DeviceOfflineDto,
  MQTTPublishDto,
  MQTTBatchPublishDto,
  HeartbeatReportDto,
  UploadFirmwareDto,
  ScheduleOTADto,
  CreateWorkOrderDto,
  AutoAssignWorkOrderDto,
  DeviceHealthQueryDto,
} from './iot.dto'
import { TenantGuard } from '../agent/tenant.guard'

/**
 * IoT 设备管理控制器
 *
 * 提供设备注册、MQTT 通信、心跳监控、OTA 固件升级、工单管理等 RESTful 接口
 */
@Controller('iot')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class IoTController {
  constructor(
    private readonly deviceService: ESP32DeviceService,
    private readonly mqttService: MQTTBrokerService,
    private readonly heartbeatService: AdaptiveHeartbeatService,
    private readonly iotHardwareService: IoTHardwareService,
    private readonly otaService: OTAFirmwareService,
    private readonly deviceValidator: DeviceStateValidator,
    private readonly workOrderService: WorkOrderAutoAssignService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 设备管理
  // ═══════════════════════════════════════════════════════════════════════════

  /** 注册新设备 */
  @Post('devices')
  registerDevice(@Body() dto: RegisterDeviceDto): ESP32Device {
    const existing = this.deviceService.getDevice(dto.deviceId)
    if (existing) {
      throw new HttpException('设备已存在', HttpStatus.CONFLICT)
    }
    return this.deviceService.registerDevice(dto.deviceId, dto.type as any)
  }

  /** 获取设备列表（支持过滤） */
  @Get('devices')
  listDevices(@Query() filter?: DeviceFilterDto): { total: number; devices: ESP32Device[] } {
    const devices = this.deviceService.listDevices({
      type: filter?.type as any,
      status: filter?.status as any,
    })
    return { total: devices.length, devices }
  }

  /** 获取设备详情 */
  @Get('devices/:deviceId')
  getDevice(@Param('deviceId') deviceId: string): ESP32Device {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return device
  }

  /** 更新设备状态 */
  @Post('devices/:deviceId/status')
  updateDeviceStatus(
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDeviceStatusDto,
  ): ESP32Device {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    const updated = this.deviceService.updateDeviceStatus(deviceId, dto.status as any)
    if (!updated) {
      throw new HttpException('状态更新失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
    return updated
  }

  /** 删除设备 */
  @Delete('devices/:deviceId')
  unregisterDevice(@Param('deviceId') deviceId: string): { success: boolean } {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    this.deviceService.removeDevice(deviceId)
    return { success: true }
  }

  /** 设备上线 */
  @Post('devices/online')
  async deviceOnline(@Body() dto: DeviceOnlineDto): Promise<ESP32Device> {
    return this.iotHardwareService.deviceOnline(dto.deviceId, dto.type as any)
  }

  /** 设备下线 */
  @Post('devices/offline')
  deviceOffline(@Body() dto: DeviceOfflineDto): { success: boolean } {
    this.iotHardwareService.deviceOffline(dto.deviceId)
    return { success: true }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MQTT 通信
  // ═══════════════════════════════════════════════════════════════════════════

  /** 连接 MQTT Broker */
  @Post('mqtt/connect')
  connectMQTT(@Body('brokerUrl') brokerUrl: string): { success: boolean; connected: boolean } {
    const success = this.mqttService.connect(brokerUrl)
    return { success, connected: this.mqttService.isConnected() }
  }

  /** 断开 MQTT Broker */
  @Post('mqtt/disconnect')
  disconnectMQTT(): { success: boolean; connected: boolean } {
    this.mqttService.disconnect()
    return { success: true, connected: false }
  }

  /** MQTT 发布消息 */
  @Post('mqtt/publish')
  publishMQTT(@Body() dto: MQTTPublishDto): { success: boolean } {
    const success = this.mqttService.publish(dto.topic, dto.payload, dto.qos ?? 0)
    if (!success) {
      throw new HttpException('MQTT 发布失败：未连接到 Broker', HttpStatus.SERVICE_UNAVAILABLE)
    }
    return { success: true }
  }

  /** MQTT 批量发布 */
  @Post('mqtt/batch-publish')
  publishMQTTBatch(@Body() dto: MQTTBatchPublishDto): { successCount: number } {
    const count = this.mqttService.publishBatch(dto.messages)
    return { successCount: count }
  }

  /** MQTT 消息历史 */
  @Get('mqtt/history')
  getMQTTHistory(@Query('topic') topic?: string): MQTTMessage[] {
    return this.mqttService.getMessageHistory(topic)
  }

  /** MQTT 连接状态 */
  @Get('mqtt/status')
  getMQTTStatus(): { connected: boolean; brokerUrl: string | null; messageCount: number } {
    return {
      connected: this.mqttService.isConnected(),
      brokerUrl: (this.mqttService as any).brokerUrl ?? null,
      messageCount: (this.mqttService as any).messageHistory?.length ?? 0,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 心跳监控
  // ═══════════════════════════════════════════════════════════════════════════

  /** 上报心跳 */
  @Post('heartbeat')
  reportHeartbeat(@Body() dto: HeartbeatReportDto): HeartbeatStatus {
    return this.iotHardwareService.handleHeartbeat(dto.deviceId, dto.latency)
  }

  /** 获取心跳状态 */
  @Get('heartbeat/:deviceId')
  getHeartbeatStatus(@Param('deviceId') deviceId: string): HeartbeatStatus {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.heartbeatService.getHeartbeatStatus(deviceId)
  }

  /** 获取延迟统计 */
  @Get('heartbeat/:deviceId/latency')
  getLatencyStats(@Param('deviceId') deviceId: string): { avg: number; min: number; max: number; count: number } {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.heartbeatService.getLatencyStats(deviceId)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OTA 固件升级
  // ═══════════════════════════════════════════════════════════════════════════

  /** 上传固件（模拟） */
  @Post('ota/firmware')
  async uploadFirmware(@Body() dto: UploadFirmwareDto): Promise<FirmwareRecord> {
    const binary = Buffer.from(`mock-firmware-${dto.deviceType}-${dto.version}`)
    return this.otaService.uploadFirmware(dto.deviceType, dto.version, binary, dto.uploadedBy)
  }

  /** 列出可用固件 */
  @Get('ota/firmware')
  async listFirmwares(@Query('deviceType') deviceType: string): Promise<FirmwareRecord[]> {
    if (!deviceType) {
      throw new HttpException('deviceType 参数必填', HttpStatus.BAD_REQUEST)
    }
    return this.otaService.listFirmwares(deviceType)
  }

  /** 批量安排 OTA 升级 */
  @Post('ota/schedule')
  async scheduleOTA(@Body() dto: ScheduleOTADto): Promise<OTATaskRecord[]> {
    return this.otaService.scheduleOTA(dto.deviceIds, dto.firmwareVersion)
  }

  /** 执行 OTA 升级 */
  @Post('ota/execute/:deviceId')
  async executeOTA(@Param('deviceId') deviceId: string): Promise<OTATaskRecord> {
    return this.otaService.executeOTA(deviceId)
  }

  /** 取消 OTA 升级 */
  @Post('ota/cancel/:otaTaskId')
  async cancelOTA(@Param('otaTaskId') otaTaskId: string): Promise<{ success: boolean }> {
    const success = await this.otaService.cancelOTA(otaTaskId)
    return { success }
  }

  /** 获取 OTA 状态 */
  @Get('ota/status/:otaTaskId')
  async getOTAStatus(@Param('otaTaskId') otaTaskId: string): Promise<OTATaskRecord | null> {
    return this.otaService.getOTAStatus(otaTaskId)
  }

  /** OTA 升级前校验 */
  @Get('ota/validate/:deviceId')
  async validateBeforeUpgrade(@Param('deviceId') deviceId: string): Promise<{ valid: boolean; reasons: string[] }> {
    return this.deviceValidator.validateBeforeUpgrade(deviceId)
  }

  /** OTA 升级后校验 */
  @Get('ota/validate-after/:deviceId')
  async validateAfterUpgrade(@Param('deviceId') deviceId: string): Promise<{ valid: boolean; issues: string[] }> {
    return this.deviceValidator.validateAfterUpgrade(deviceId)
  }

  /** 设备健康度评分 */
  @Get('devices/:deviceId/health')
  async getDeviceHealth(@Param('deviceId') deviceId: string): Promise<DeviceHealthReport> {
    return this.deviceValidator.getDeviceHealth(deviceId)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 工单管理
  // ═══════════════════════════════════════════════════════════════════════════

  /** 创建工单 */
  @Post('work-orders')
  async createWorkOrder(@Body() dto: CreateWorkOrderDto): Promise<WorkOrderRecord> {
    const device = this.deviceService.getDevice(dto.deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.workOrderService.createWorkOrder(dto.issue, dto.deviceId)
  }

  /** 自动指派工单 */
  @Post('work-orders/auto-assign')
  async autoAssignWorkOrder(@Body() dto: AutoAssignWorkOrderDto): Promise<WorkOrderRecord | null> {
    const issue: WorkOrderIssue = {
      deviceId: dto.deviceId,
      deviceType: dto.deviceType,
      description: dto.description,
      priority: dto.priority as any,
      requiredSkills: dto.requiredSkills,
    }
    return this.workOrderService.autoAssign(issue)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OTA 固件升级（设备侧接口）
  // ═══════════════════════════════════════════════════════════════════════════

  /** 设备端：发送 OTA 固件更新指令 */
  @Post('ota/send/:deviceId')
  sendOTAUpdate(
    @Param('deviceId') deviceId: string,
    @Body('firmwareUrl') firmwareUrl: string,
  ): { success: boolean } {
    const device = this.deviceService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    if (!firmwareUrl) {
      throw new HttpException('firmwareUrl 必填', HttpStatus.BAD_REQUEST)
    }
    const success = this.iotHardwareService.sendOTAUpdate(deviceId, firmwareUrl)
    return { success }
  }
}
