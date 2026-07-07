import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
  IsObject,
} from 'class-validator'
import { Type } from 'class-transformer'
import type {
  APIKeyEnvironment,
  APIKeyScope,
  WebhookEventType,
  SandboxStatus,
} from './openapi.entity'

// ── API Key ──

export class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsEnum(['LIVE', 'TEST', 'SANDBOX'])
  environment!: APIKeyEnvironment

  @IsString()
  @MinLength(1)
  name!: string

  @IsArray()
  @IsString({ each: true })
  scopes!: string[]

  @IsOptional()
  @IsString()
  expiresAt?: string

  @IsOptional()
  @IsString()
  createdBy?: string
}

export class ListApiKeyDto {
  @IsString()
  tenantId!: string

  @IsOptional()
  @IsEnum(['LIVE', 'TEST', 'SANDBOX'])
  environment?: APIKeyEnvironment
}

export class RevokeApiKeyDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  keyId!: string

  @IsString()
  @MinLength(1)
  reason!: string
}

// ── Webhook ──

export class SubscribeWebhookDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  url!: string

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  events!: WebhookEventType[]

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  createdBy?: string
}

export class DispatchWebhookDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  subscriptionId!: string

  @IsString()
  eventType!: string

  @IsObject()
  payload!: Record<string, any>
}

export class PauseResumeWebhookDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  subId!: string
}

// ── Sandbox ──

export class CreateSandboxDto {
  @IsString()
  @MinLength(1)
  parentTenantId!: string

  @IsString()
  @MinLength(1)
  name!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  ttlDays?: number

  @IsOptional()
  @IsBoolean()
  dataMaskingEnabled?: boolean
}

export class SetSandboxStatusDto {
  @IsString()
  @MinLength(1)
  sandboxTenantId!: string

  @IsEnum(['CREATED', 'ACTIVE', 'EXPIRED', 'PURGED'])
  status!: SandboxStatus
}

// ── Usage ──

export class CreateUsageBucketDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  endpoint!: string

  @IsNumber()
  @Min(1)
  qps!: number

  @IsNumber()
  @Min(1)
  dailyQuota!: number

  @IsOptional()
  @IsNumber()
  @Min(1000)
  windowMs?: number
}

export class CheckUsageDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  keyId!: string

  @IsString()
  @MinLength(1)
  endpoint!: string
}

// ── Signature ──

export class VerifySignatureDto {
  @IsString()
  @MinLength(1)
  secret!: string

  @IsObject()
  request!: Record<string, any>
}

// ── Response Types (non-validated interfaces) ──

export interface ApiKeyResponse {
  keyId: string
  name: string
  environment: APIKeyEnvironment
  scopes: APIKeyScope[]
  status: string
  createdAt: string
  expiresAt?: string
}

export interface ApiKeyListResponse {
  keys: ApiKeyResponse[]
}

export interface WebhookSubscriptionResponse {
  id: string
  tenantId: string
  url: string
  events: WebhookEventType[]
  status: string
  createdAt: string
}

export interface WebhookListResponse {
  subscriptions: WebhookSubscriptionResponse[]
}

export interface SandboxResponse {
  id: string
  tenantId: string
  parentTenantId: string
  name: string
  status: SandboxStatus
  ttlDays: number
  createdAt: string
  expiresAt: string
}

export interface SandboxListResponse {
  sandboxes: SandboxResponse[]
}

export interface UsageReportResponse {
  tenantId: string
  totalRequests: number
  keyMetrics: Array<{
    keyId: string
    total: number
    remaining: number
    overage: number
  }>
}

export interface BucketListResponse {
  buckets: Array<{
    id: string
    endpoint: string
    qps: number
    dailyQuota: number
    active: boolean
  }>
}

export interface DeliveryListResponse {
  deliveries: Array<{
    id: string
    subscriptionId: string
    eventType: string
    status: string
    attempts: number
    createdAt: string
  }>
}

export interface DeadLetterResponse {
  deadLetters: Array<{
    id: string
    subscriptionId: string
    eventType: string
    errorMessage: string
    createdAt: string
  }>
}
