import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { DeviceAdapterService, DeviceStatus } from './device-adapter.service'
import {
  RegisterDeviceDto,
  DeviceFilterDto,
  PosTransactionDto,
  PosRefundDto,
  PrinterPrintDto,
  PrinterPrintQrDto,
  GateOpenDto,
  GateAccessLogQueryDto,
  ScannerParseDto,
  CommandHistoryQueryDto,
  ConnectAllDto,
} from './device-adapter.dto'
import type {
  DeviceConfig,
  DeviceResponse,
  DeviceCommand,
} from './device-adapter.entity'

/**
 * 设备适配器控制器
 *
 * 提供设备注册、管理、执行命令的 RESTful 接口
 */
@UseGuards(TenantGuard)
@Controller('device-adapter')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DeviceAdapterController {
  constructor(private readonly deviceAdapterService: DeviceAdapterService) {}

  // ── 设备注册管理 ───────────────────────────────────────────────────────────

  /** 注册新设备 */
  @Post('devices')
  registerDevice(@Body() dto: RegisterDeviceDto): DeviceConfig {
    const config: DeviceConfig = {
      deviceId: dto.deviceId,
      deviceType: dto.deviceType as DeviceConfig['deviceType'],
      brand: dto.brand as DeviceConfig['brand'],
      model: dto.model,
      connection: dto.connection as DeviceConfig['connection'],
      timeout: dto.timeout,
      retries: dto.retries,
    }
    const existing = this.deviceAdapterService.getDevice(config.deviceId)
    if (existing) {
      throw new HttpException('设备已存在', HttpStatus.CONFLICT)
    }
    return this.deviceAdapterService.registerDevice(config)
  }

  /** 获取所有设备（支持过滤） */
  @Get('devices')
  listDevices(@Query() filters?: DeviceFilterDto): {
    total: number
    devices: DeviceConfig[]
  } {
    const devices = this.deviceAdapterService.listDevices({
      type: filters?.type as DeviceConfig['deviceType'] | undefined,
      brand: filters?.brand as DeviceConfig['brand'] | undefined,
      status: filters?.status as DeviceStatus | undefined,
    })
    return { total: devices.length, devices }
  }

  /** 获取单个设备详情 */
  @Get('devices/:deviceId')
  getDevice(@Param('deviceId') deviceId: string): DeviceConfig {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return device
  }

  /** 删除设备 */
  @Delete('devices/:deviceId')
  unregisterDevice(@Param('deviceId') deviceId: string): { success: boolean } {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    this.deviceAdapterService.unregisterDevice(deviceId)
    return { success: true }
  }

  // ── 连接管理 ───────────────────────────────────────────────────────────────

  /** 连接单个设备 */
  @Post('devices/:deviceId/connect')
  async connectDevice(@Param('deviceId') deviceId: string): Promise<{ success: boolean; status: string }> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    const success = await this.deviceAdapterService.connect(deviceId)
    return {
      success,
      status: this.deviceAdapterService.getStatus(deviceId),
    }
  }

  /** 断开设备 */
  @Post('devices/:deviceId/disconnect')
  async disconnectDevice(@Param('deviceId') deviceId: string): Promise<{ success: boolean }> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    await this.deviceAdapterService.disconnect(deviceId)
    return { success: true }
  }

  /** 批量连接同类型设备 */
  @Post('devices/connect-all')
  async connectAll(@Body() dto: ConnectAllDto): Promise<Record<string, boolean>> {
    const results = await this.deviceAdapterService.connectAll(dto.deviceType as DeviceConfig['deviceType'])
    const map: Record<string, boolean> = {}
    results.forEach((v, k) => { map[k] = v })
    return map
  }

  // ── 设备状态 ───────────────────────────────────────────────────────────────

  /** 获取设备状态 */
  @Get('devices/:deviceId/status')
  getDeviceStatus(@Param('deviceId') deviceId: string): {
    deviceId: string
    status: string
  } {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return {
      deviceId,
      status: this.deviceAdapterService.getStatus(deviceId),
    }
  }

  /** 心跳检测 */
  @Post('devices/:deviceId/heartbeat')
  async heartbeat(@Param('deviceId') deviceId: string): Promise<{ success: boolean }> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    await this.deviceAdapterService.heartbeat(deviceId)
    return { success: true }
  }

  /** 获取全部设备状态概览 */
  @Get('status')
  getAllStatus(): Record<string, string> {
    const statuses = this.deviceAdapterService.checkAllStatus()
    const map: Record<string, string> = {}
    statuses.forEach((v, k) => { map[k] = v })
    return map
  }

  // ── POS 操作 ───────────────────────────────────────────────────────────────

  /** POS 交易 */
  @Post('devices/:deviceId/pos/transaction')
  async posTransaction(
    @Param('deviceId') deviceId: string,
    @Body() dto: PosTransactionDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.posTransaction(deviceId, dto.amount, dto.currency)
  }

  /** POS 退款 */
  @Post('devices/:deviceId/pos/refund')
  async posRefund(
    @Param('deviceId') deviceId: string,
    @Body() dto: PosRefundDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.posRefund(deviceId, dto.originalTransactionId, dto.amount)
  }

  /** POS 读卡 */
  @Post('devices/:deviceId/pos/read-card')
  async posReadCard(@Param('deviceId') deviceId: string): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.posReadCard(deviceId)
  }

  // ── 闸机操作 ───────────────────────────────────────────────────────────────

  /** 闸机开门 */
  @Post('devices/:deviceId/gate/open')
  async gateOpen(
    @Param('deviceId') deviceId: string,
    @Body() dto: GateOpenDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.gateOpen(deviceId, dto.direction)
  }

  /** 闸机访问日志 */
  @Get('devices/:deviceId/gate/access-log')
  async gateAccessLog(
    @Param('deviceId') deviceId: string,
    @Query() query?: GateAccessLogQueryDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.gateGetAccessLog(deviceId, query?.limit)
  }

  // ── 扫描仪操作 ─────────────────────────────────────────────────────────────

  /** 扫描 */
  @Post('devices/:deviceId/scanner/scan')
  async scannerScan(@Param('deviceId') deviceId: string): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.scannerScan(deviceId)
  }

  /** 解析扫描数据 */
  @Post('scanner/parse')
  scannerParse(@Body() dto: ScannerParseDto) {
    return this.deviceAdapterService.scannerParse(dto.data)
  }

  // ── 打印机操作 ─────────────────────────────────────────────────────────────

  /** 打印 */
  @Post('devices/:deviceId/printer/print')
  async printerPrint(
    @Param('deviceId') deviceId: string,
    @Body() dto: PrinterPrintDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.printerPrint(deviceId, dto.content)
  }

  /** 打印二维码 */
  @Post('devices/:deviceId/printer/print-qr')
  async printerPrintQr(
    @Param('deviceId') deviceId: string,
    @Body() dto: PrinterPrintQrDto,
  ): Promise<DeviceResponse> {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.printerPrintQR(deviceId, dto.data)
  }

  // ── 命令历史 ───────────────────────────────────────────────────────────────

  /** 获取命令历史 */
  @Get('devices/:deviceId/commands')
  getCommandHistory(
    @Param('deviceId') deviceId: string,
    @Query() query?: CommandHistoryQueryDto,
  ): DeviceCommand[] {
    const device = this.deviceAdapterService.getDevice(deviceId)
    if (!device) {
      throw new HttpException('设备未找到', HttpStatus.NOT_FOUND)
    }
    return this.deviceAdapterService.getCommandHistory(deviceId, query?.limit)
  }
}
