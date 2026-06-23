import { IsObject, IsOptional, IsString } from 'class-validator'

export class PublishEventDto {
  @IsString()
  eventName!: string

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsString()
  aggregateId?: string

  @IsOptional()
  @IsString()
  idempotencyKey?: string

  @IsObject()
  payload!: Record<string, unknown>
}

export class WebhookIngestDto {
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

  @IsObject()
  payload!: Record<string, unknown>
}

export class EventListQueryDto {
  @IsOptional()
  @IsString()
  source?: string
}
