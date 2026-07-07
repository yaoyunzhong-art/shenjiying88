/**
 * e2e-auto-gen.dto.ts - Phase-19 E2E Auto Gen DTO
 * 用途: E2E 自动生成模块的请求 / 响应 DTO
 * 关联: phase-19-intelligence/spec.md §Phase 2
 */
import {
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/**
 * 生成测试请求 DTO
 */
export class GenerateRequestDto {
  @IsString()
  @IsNotEmpty()
  spec!: string

  @IsOptional()
  @IsString()
  outputDir?: string

  @IsOptional()
  @IsEnum(['vitest', 'jest', 'playwright'])
  testFramework?: 'vitest' | 'jest' | 'playwright'

  @IsOptional()
  @IsBoolean()
  enableE2E?: boolean

  @IsOptional()
  @IsString()
  baseUrl?: string

  @IsOptional()
  @IsString()
  authToken?: string
}

/**
 * 执行测试请求 DTO
 */
export class ExecuteRequestDto {
  @IsString()
  @IsNotEmpty()
  configId!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileFilter?: string[]

  @IsOptional()
  @IsNumber()
  @Min(100)
  timeoutMs?: number
}

/**
 * 创建配置请求 DTO
 */
export class CreateConfigRequestDto {
  @IsString()
  @IsNotEmpty()
  projectName!: string

  @IsString()
  @IsNotEmpty()
  specSource!: string

  @IsOptional()
  @IsString()
  outputDir?: string

  @IsOptional()
  @IsEnum(['vitest', 'jest', 'playwright'])
  testFramework?: 'vitest' | 'jest' | 'playwright'

  @IsOptional()
  @IsBoolean()
  enableE2E?: boolean

  @IsOptional()
  @IsString()
  baseUrl?: string

  @IsOptional()
  @IsString()
  authToken?: string

  @IsOptional()
  extraHeaders?: Record<string, string>
}

/**
 * 更新配置请求 DTO
 */
export class UpdateConfigRequestDto {
  @IsOptional()
  @IsString()
  projectName?: string

  @IsOptional()
  @IsString()
  specSource?: string

  @IsOptional()
  @IsString()
  outputDir?: string

  @IsOptional()
  @IsEnum(['vitest', 'jest', 'playwright'])
  testFramework?: 'vitest' | 'jest' | 'playwright'

  @IsOptional()
  @IsBoolean()
  enableE2E?: boolean

  @IsOptional()
  @IsString()
  baseUrl?: string

  @IsOptional()
  @IsString()
  authToken?: string

  @IsOptional()
  extraHeaders?: Record<string, string>

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

/**
 * 生成响应 DTO
 */
export class GenerateResponseDto {
  @IsString()
  taskId!: string

  @IsString()
  status!: string

  @IsArray()
  @IsString({ each: true })
  files!: string[]

  stats!: {
    totalFiles: number
    totalTestCases: number
    totalLines: number
  }

  @IsString()
  createdAt!: string
}

/**
 * 执行响应 DTO
 */
export class ExecuteResponseDto {
  @IsString()
  reportId!: string

  @IsNumber()
  totalCases!: number

  @IsNumber()
  passed!: number

  @IsNumber()
  failed!: number

  @IsNumber()
  @Min(0)
  passRate!: number

  @IsString()
  createdAt!: string
}
