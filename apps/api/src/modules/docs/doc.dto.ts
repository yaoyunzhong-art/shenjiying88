/**
 * doc.dto.ts - API文档模块 DTO
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator'

/** 支持的文档导出格式 */
export enum DocExportFormatEnum {
  OPENAPI_JSON = 'openapi-json',
  OPENAPI_YAML = 'openapi-yaml',
  REDOC_HTML = 'redoc-html',
  POSTMAN_COLLECTION = 'postman-collection',
  INSOMNIA_EXPORT = 'insomnia-export',
}

/** 文档生成请求 DTO */
export class DocGenerateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version!: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @IsEnum(DocExportFormatEnum)
  format!: DocExportFormatEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servers?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/** 端点注册请求 DTO */
export class RegisterEndpointRequestDto {
  @IsString()
  @IsNotEmpty()
  controllerName!: string

  @IsString()
  @IsNotEmpty()
  method!: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  @IsString()
  @IsNotEmpty()
  path!: string

  @IsString()
  @IsNotEmpty()
  summary!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  deprecated?: boolean
}

/** Schema 注册请求 DTO */
export class RegisterSchemaRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsNotEmpty()
  schema!: Record<string, unknown>
}

/** 文档配置更新 DTO */
export class DocConfigUpdateDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  version?: string

  @IsOptional()
  @IsEnum(DocExportFormatEnum)
  defaultFormat?: DocExportFormatEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servers?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledTags?: string[]
}

/** Tag 注册 DTO */
export class AddTagRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  description!: string
}
