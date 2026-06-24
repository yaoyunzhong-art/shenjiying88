import { IsObject, IsOptional, IsString } from 'class-validator'
import { LytDeviceType, LytDeviceStatus } from './lyt.entity'

/**
 * LYT 设备查询参数 DTO
 */
export class LytDeviceQueryDto {
  /** 设备类型筛选 */
  deviceType?: LytDeviceType
  /** 设备状态筛选 */
  status?: LytDeviceStatus
  /** 门店 ID 筛选 */
  storeId?: string
  /** 搜索关键字（设备名称/ID） */
  keyword?: string
  /** 分页页码 */
  page?: number
  /** 每页条数 */
  pageSize?: number
}

/**
 * LYT 设备创建 DTO
 */
export class LytDeviceCreateDto {
  /** 设备类型 */
  deviceType!: LytDeviceType
  /** 设备名称 */
  name!: string
  /** 所属门店 ID */
  storeId!: string
  /** 固件版本（可选） */
  firmwareVersion?: string
}

/**
 * LYT 设备更新 DTO
 */
export class LytDeviceUpdateDto {
  /** 设备名称 */
  name?: string
  /** 设备状态 */
  status?: LytDeviceStatus
  /** 固件版本 */
  firmwareVersion?: string
}

/**
 * LYT 网关通行验证 DTO
 */
export class LytGateVerifyDto {
  /** 通行码 */
  passCode!: string
  /** 门店 ID */
  storeId!: string
}

/**
 * LYT Bootstrap 响应 DTO
 */
export class LytBootstrapResponseDto {
  tenantContext!: Record<string, unknown>
  capabilities!: string[]
  phase!: string
}

/**
 * LYT webhook 回调 DTO
 */
export class LytWebhookIngestDto {
  @IsOptional()
  @IsString()
  eventId?: string

  @IsOptional()
  @IsString()
  eventType?: string

  @IsString()
  signature!: string

  @IsString()
  timestamp!: string

  @IsOptional()
  @IsString()
  rawBody?: string

  @IsOptional()
  @IsString()
  fixtureKey?: string

  @IsOptional()
  @IsObject()
  rawHeaders?: Record<string, string>

  @IsOptional()
  @IsObject()
  rawQuery?: Record<string, string>

  @IsObject()
  payload!: Record<string, unknown>
}

export class LytWebhookDrillDto {
  @IsOptional()
  @IsString()
  eventId?: string

  @IsOptional()
  @IsString()
  eventType?: string

  @IsOptional()
  dryRun?: boolean

  @IsOptional()
  @IsString()
  fixtureKey?: string

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>
}

export class LytWebhookFixtureReplayDto {
  @IsString()
  fixtureKey!: string

  @IsOptional()
  @IsString()
  eventId?: string

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>

  @IsOptional()
  strictValidation?: boolean

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>

  @IsOptional()
  @IsObject()
  query?: Record<string, string>
}

export class LytFixtureCompareDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>

  @IsOptional()
  @IsObject()
  query?: Record<string, string>
}

export class LytFixtureImportPreviewDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>

  @IsOptional()
  @IsObject()
  query?: Record<string, string>
}

export class LytFixtureImportPlanDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>

  @IsOptional()
  @IsObject()
  query?: Record<string, string>
}
