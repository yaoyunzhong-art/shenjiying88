import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  IsObject,
  IsBoolean,
  IsDateString,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// ── 枚举 ─────────────────────────────────────────────────────────────────────

export enum DeviceTypeEnum {
  ESP32_S3 = 'ESP32_S3',
  ESP32_C3 = 'ESP32_C3',
  ESP32 = 'ESP32',
  ESP8266 = 'ESP8266',
}

export enum DeviceStatusEnum {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
}

export enum OTAStatusEnum {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  UPGRADING = 'upgrading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriorityEnum {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum NetworkStatusEnum {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WEAK = 'weak',
}

// ── 设备管理 DTO ─────────────────────────────────────────────────────────────

/** 注册设备请求 */
export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  deviceId!: string

  @IsEnum(DeviceTypeEnum)
  type!: DeviceTypeEnum
}

/** 设备状态更新请求 */
export class UpdateDeviceStatusDto {
  @IsEnum(DeviceStatusEnum)
  status!: DeviceStatusEnum
}

/** 设备过滤查询 */
export class DeviceFilterDto {
  @IsOptional()
  @IsEnum(DeviceTypeEnum)
  type?: DeviceTypeEnum

  @IsOptional()
  @IsEnum(DeviceStatusEnum)
  status?: DeviceStatusEnum
}

// ── MQTT DTO ─────────────────────────────────────────────────────────────────

/** MQTT 发布消息请求 */
export class MQTTPublishDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  topic!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(65536)
  payload!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  qos?: 0 | 1 | 2
}

/** MQTT 批量消息单项 */
export class MQTTBatchMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  topic!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(65536)
  payload!: string
}

/** MQTT 批量发布请求 */
export class MQTTBatchPublishDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MQTTBatchMessage)
  messages!: MQTTBatchMessage[]
}

// ── 心跳 DTO ─────────────────────────────────────────────────────────────────

/** 心跳上报请求 */
export class HeartbeatReportDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string

  @IsNumber()
  @Min(0)
  @Max(60000)
  latency!: number
}

// ── OTA 升级 DTO ─────────────────────────────────────────────────────────────

/** 上传固件请求 */
export class UploadFirmwareDto {
  @IsString()
  @IsNotEmpty()
  deviceType!: string

  @IsString()
  @IsNotEmpty()
  version!: string

  @IsOptional()
  @IsString()
  uploadedBy?: string
}

/** 批量 OTA 升级请求 */
export class ScheduleOTADto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsNotEmpty({ each: true })
  deviceIds!: string[]

  @IsString()
  @IsNotEmpty()
  firmwareVersion!: string
}

/** 设备上线请求 */
export class DeviceOnlineDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string

  @IsEnum(DeviceTypeEnum)
  type!: DeviceTypeEnum
}

/** 设备下线请求 */
export class DeviceOfflineDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string
}

// ── 工单 DTO ─────────────────────────────────────────────────────────────────

/** 创建工单请求 */
export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  issue!: string

  @IsOptional()
  @IsEnum(WorkOrderPriorityEnum)
  priority?: WorkOrderPriorityEnum
}

/** 自动指派工单请求 */
export class AutoAssignWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string

  @IsString()
  @IsNotEmpty()
  deviceType!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  description!: string

  @IsEnum(WorkOrderPriorityEnum)
  priority!: WorkOrderPriorityEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[]
}

/** 设备健康查询 */
export class DeviceHealthQueryDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string
}

/** 设备健康报告响应 DTO */
export class DeviceHealthReportDto {
  deviceId!: string
  score!: number
  battery!: { level: number; health: string }
  network!: { status: string }
  sensors!: { workingCount: number; totalCount: number }
  firmware!: { version: string; upToDate: boolean }
  overall!: string
}

// ── 响应 DTO ─────────────────────────────────────────────────────────────────

/** 通用操作响应 */
export class OperationResultDto {
  success!: boolean
  message?: string
}

/** 设备列表响应 */
export class DeviceListResponseDto {
  total!: number
  devices!: Array<{
    deviceId: string
    type: string
    name: string
    status: string
    lastHeartbeat: number | null
    createdAt: string
    updatedAt: string
  }>
}

/** OTA 任务响应 */
export class OTATaskResponseDto {
  id!: string
  deviceId!: string
  status!: OTAStatusEnum
  progress!: number
  startedAt?: string
  completedAt?: string
  error?: string
}

/** 心跳状态响应 */
export class HeartbeatStatusResponseDto {
  deviceId!: string
  currentInterval!: number
  optimalInterval!: number
  avgLatency!: number
  lastHeartbeat!: number | null
  consecutiveTimeouts!: number
  isTimeout!: boolean
}

/** 固件记录响应 */
export class FirmwareRecordResponseDto {
  id!: string
  deviceType!: string
  version!: string
  size!: number
  checksum!: string
  uploadedAt!: string
  uploadedBy!: string
}

/** MQTT 连接状态响应 */
export class MQTTStatusResponseDto {
  connected!: boolean
  brokerUrl!: string | null
  messageCount!: number
}
