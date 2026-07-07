/**
 * multi-region.dto.ts
 * 用途: 多区域模块 DTO
 */

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { ALL_REGIONS, Region } from './multi-region.entity'

export class RegisterEndpointDto {
  @IsString()
  @IsIn(ALL_REGIONS)
  region!: Region;

  @IsString()
  baseUrl!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  latencyMs?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateEndpointDto {
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  latencyMs?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class RouteQueryDto {
  @IsString()
  clientIp!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class CheckHealthDto {
  @IsString()
  @IsIn(ALL_REGIONS)
  region!: Region;
}

export class SetHealthDto {
  @IsString()
  @IsIn(ALL_REGIONS)
  region!: Region;

  @IsString()
  @IsIn(['healthy', 'degraded', 'down'])
  status!: 'healthy' | 'degraded' | 'down';
}

export class PinTenantDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @IsIn(ALL_REGIONS)
  region!: Region;
}

export class FailoverCheckDto {
  @IsString()
  @IsIn(ALL_REGIONS)
  @IsOptional()
  region?: Region;

  @IsBoolean()
  @IsOptional()
  forceOk?: boolean;
}

export class ConfigureFailoverDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  failureThreshold?: number;

  @IsNumber()
  @Min(100)
  @IsOptional()
  checkIntervalMs?: number;
}

export class BatchCheckHealthDto {
  @IsObject()
  @IsOptional()
  forceOkMap?: Record<string, boolean>;
}

export class CanMigrateDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @IsIn(ALL_REGIONS)
  targetRegion!: Region;
}
