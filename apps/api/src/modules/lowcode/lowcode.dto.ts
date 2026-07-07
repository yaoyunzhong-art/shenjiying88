import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsEnum,
  IsNumber,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// ─── Template ───────────────────────────────

export class TemplateComponentDefDto {
  @ApiProperty({ description: '组件类型', example: 'navbar' })
  @IsString()
  type!: string

  @ApiPropertyOptional({ description: '默认属性', example: { title: '仪表盘' } })
  @IsObject()
  @IsOptional()
  defaultProps?: Record<string, unknown>
}

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称', example: '我的模板' })
  @IsString()
  @MaxLength(200)
  name!: string

  @ApiPropertyOptional({ description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ description: '组件定义列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDefDto)
  components!: TemplateComponentDefDto[]
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '模板名称' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '组件定义列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDefDto)
  @IsOptional()
  components?: TemplateComponentDefDto[]

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'archived', 'deprecated'] })
  @IsEnum(['active', 'archived', 'deprecated'])
  @IsOptional()
  status?: 'active' | 'archived' | 'deprecated'
}

// ─── Snapshot ───────────────────────────────

export class CreateSnapshotDto {
  @ApiProperty({ description: '页面ID' })
  @IsString()
  pageId!: string

  @ApiPropertyOptional({ description: '变更日志' })
  @IsString()
  @IsOptional()
  changelog?: string

  @ApiPropertyOptional({ description: '发布者' })
  @IsString()
  @IsOptional()
  publishedBy?: string
}

// ─── Component Library ──────────────────────

export class ComponentSchemaDto {
  @ApiPropertyOptional({ description: '属性类型' })
  @IsString()
  @IsOptional()
  type?: string

  @ApiPropertyOptional({ description: '属性描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '是否必填' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  required?: boolean
}

export class RegisterComponentDto {
  @ApiProperty({ description: '组件名称', example: 'custom-chart' })
  @IsString()
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: '组件类型', example: 'chart' })
  @IsString()
  @MaxLength(50)
  type!: string

  @ApiPropertyOptional({ description: '默认属性' })
  @IsObject()
  @IsOptional()
  defaultProps?: Record<string, unknown>

  @ApiPropertyOptional({ description: '组件模式定义' })
  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>
}

// ─── Page Export / Import ───────────────────

export class PageExportDto {
  @ApiProperty({ description: '页面ID' })
  id!: string

  @ApiProperty({ description: '模板ID' })
  templateId!: string

  @ApiProperty({ description: '页面名称' })
  name!: string

  @ApiProperty({ description: '组件列表' })
  components!: Record<string, unknown>[]

  @ApiProperty({ description: '状态' })
  status!: string

  @ApiProperty({ description: '版本号' })
  version!: number
}

export class PageImportDto {
  @ApiProperty({ description: '导出的页面 JSON（纯对象）' })
  @IsObject()
  data!: Record<string, unknown>

  @ApiPropertyOptional({ description: '导入后新名称（可选，不传则使用原始名称）' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string
}

// ─── Dashboard Stats ────────────────────────

export class DashboardStatsDto {
  @ApiProperty({ description: '总页面数' })
  totalPages!: number

  @ApiProperty({ description: '已发布页面数' })
  publishedPages!: number

  @ApiProperty({ description: '草稿页面数' })
  draftPages!: number

  @ApiProperty({ description: '模板总数' })
  totalTemplates!: number

  @ApiProperty({ description: '注册组件数' })
  totalComponents!: number

  @ApiProperty({ description: '快照总数' })
  totalSnapshots!: number
}
