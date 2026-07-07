import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

// ── Enums ───────────────────────────────────────────────────────────────────

export enum DeviceTypeEnum {
  POS = 'pos',
  GATE = 'gate',
  SCANNER = 'scanner',
  PRINTER = 'printer',
  SCALE = 'scale',
  KIOSK = 'kiosk',
}

export enum DeviceBrandEnum {
  HUAWEI = 'huawei',
  HONEYWELL = 'honeywell',
  ZEBRA = 'zebra',
  EPSON = 'epson',
  DELI = 'deli',
  GENERIC = 'generic',
}

export enum DeviceStatusEnum {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum ConnectionTypeEnum {
  USB = 'usb',
  SERIAL = 'serial',
  BLUETOOTH = 'bluetooth',
  WIFI = 'wifi',
  ETHERNET = 'ethernet',
}

// ── DTOs ────────────────────────────────────────────────────────────────────

/** 注册设备请求 */
export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  deviceId!: string

  @IsEnum(DeviceTypeEnum)
  deviceType!: DeviceTypeEnum

  @IsEnum(DeviceBrandEnum)
  brand!: DeviceBrandEnum

  @IsOptional()
  @IsString()
  @MaxLength(128)
  model?: string

  @IsEnum(ConnectionTypeEnum)
  connection!: ConnectionTypeEnum

  @IsNumber()
  @Min(100)
  @Max(60000)
  timeout!: number

  @IsNumber()
  @Min(0)
  @Max(10)
  retries!: number
}

/** 设备查询过滤 */
export class DeviceFilterDto {
  @IsOptional()
  @IsEnum(DeviceTypeEnum)
  type?: DeviceTypeEnum

  @IsOptional()
  @IsEnum(DeviceBrandEnum)
  brand?: DeviceBrandEnum

  @IsOptional()
  @IsEnum(DeviceStatusEnum)
  status?: DeviceStatusEnum
}

/** POS 交易请求 */
export class PosTransactionDto {
  @IsNumber()
  @Min(0.01)
  @Max(9999999.99)
  amount!: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string
}

/** POS 退款请求 */
export class PosRefundDto {
  @IsString()
  @IsNotEmpty()
  originalTransactionId!: string

  @IsNumber()
  @Min(0.01)
  @Max(9999999.99)
  amount!: number
}

/** 打印机打印请求 */
export class PrinterPrintDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4096)
  content!: string
}

/** 打印机打印二维码请求 */
export class PrinterPrintQrDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2048)
  data!: string
}

/** 闸机开门方向 */
export enum GateDirectionEnum {
  IN = 'in',
  OUT = 'out',
  BOTH = 'both',
}

/** 闸机开门请求 */
export class GateOpenDto {
  @IsEnum(GateDirectionEnum)
  direction!: GateDirectionEnum
}

/** 闸机访问日志查询 */
export class GateAccessLogQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number
}

/** 扫描仪解析请求 */
export class ScannerParseDto {
  @IsString()
  @IsNotEmpty()
  data!: string
}

/** 命令历史查询 */
export class CommandHistoryQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number
}

/** 批量连接请求 */
export class ConnectAllDto {
  @IsEnum(DeviceTypeEnum)
  deviceType!: DeviceTypeEnum
}

// ── Response DTOs ───────────────────────────────────────────────────────────

/** 设备响应 */
export class DeviceResponseDto {
  commandId!: string
  deviceId?: string
  success!: boolean
  data?: unknown
  error?: string
  receivedAt!: string
}

/** 设备列表响应 */
export class DeviceListResponseDto {
  total!: number
  devices!: Array<{
    deviceId: string
    deviceType: string
    brand: string
    model?: string
    connection: string
    timeout: number
    retries: number
  }>
}

/** 设备状态响应 */
export class DeviceStatusResponseDto {
  deviceId!: string
  status!: DeviceStatusEnum
  lastHeartbeat?: string
}

/** 连接结果响应 */
export class ConnectionResultDto {
  deviceId!: string
  success!: boolean
  status!: DeviceStatusEnum
  message?: string
}

/** 扫描解析响应 */
export class ScannedDataResponseDto {
  format!: string
  value!: string
  metadata?: Record<string, unknown>
}
