/**
 * AI Model Config - Swagger/OpenAPI 文档 (V9 需求 1 · V10 Day 4)
 *
 * 自动生成 Swagger 文档配置
 * 覆盖: 预设、门店配置、切换、历史、回滚 共25个API
 */

import { applyDecorators } from '@nestjs/common'
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger'
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsObject } from 'class-validator'

// ======== DTOs ========

export class CreateStoreConfigDto {
  @ApiProperty({ description: '门店ID', example: 'store_001' })
  @IsString()
  storeId!: string

  @ApiProperty({ description: '配置名称', example: 'GPT-4o 生产环境' })
  @IsString()
  name!: string

  @ApiProperty({ description: 'AI提供商', enum: ['openai', 'anthropic', 'qwen', 'custom'], example: 'openai' })
  @IsEnum(['openai', 'anthropic', 'qwen', 'custom'])
  provider!: string

  @ApiProperty({ description: 'API密钥(加密存储)', example: 'sk-***' })
  @IsString()
  apiKey!: string

  @ApiProperty({ description: 'API端点', example: 'https://api.openai.com/v1' })
  @IsString()
  endpoint!: string

  @ApiProperty({ description: '模型名称', example: 'gpt-4' })
  @IsString()
  model!: string

  @ApiPropertyOptional({ description: '温度参数', example: 0.7, default: 0.7 })
  @IsNumber()
  @IsOptional()
  temperature?: number

  @ApiPropertyOptional({ description: '最大Token数', example: 2048, default: 2048 })
  @IsNumber()
  @IsOptional()
  maxTokens?: number
}

export class UpdateStoreConfigDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'API密钥' })
  @IsString()
  @IsOptional()
  apiKey?: string

  @ApiPropertyOptional({ description: '温度参数' })
  @IsNumber()
  @IsOptional()
  temperature?: number

  @ApiPropertyOptional({ description: '最大Token数' })
  @IsNumber()
  @IsOptional()
  maxTokens?: number
}

export class SwitchConfigDto {
  @ApiProperty({ description: '门店ID', example: 'store_001' })
  @IsString()
  storeId!: string

  @ApiProperty({ description: '目标配置ID', example: 'config_123' })
  @IsString()
  configId!: string

  @ApiPropertyOptional({ description: '切换原因', example: '性能优化' })
  @IsString()
  @IsOptional()
  reason?: string
}

export class RollbackDto {
  @ApiProperty({ description: '历史记录ID', example: 'history_456' })
  @IsString()
  historyId!: string

  @ApiProperty({ description: '回滚原因', example: '配置错误需要回滚' })
  @IsString()
  reason!: string
}

// ======== API 装饰器 ========

export const ApiPresetList = () => applyDecorators(
  ApiTags('AI Model Config - 系统预设'),
  ApiBearerAuth(),
  ApiOperation({ summary: '获取所有系统预设', description: '返回所有可用的AI模型预设配置' }),
  ApiQuery({ name: 'provider', required: false, description: '按提供商过滤', enum: ['openai', 'anthropic', 'qwen', 'custom'] }),
  ApiQuery({ name: 'isActive', required: false, description: '按激活状态过滤', type: Boolean }),
  ApiResponse({ status: 200, description: '成功返回预设列表', schema: { type: 'array' } }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 500, description: '服务器内部错误' })
)

export const ApiPresetGet = () => applyDecorators(
  ApiTags('AI Model Config - 系统预设'),
  ApiBearerAuth(),
  ApiOperation({ summary: '获取指定预设详情', description: '根据ID获取单个预设的详细信息' }),
  ApiParam({ name: 'id', description: '预设ID', example: 'preset_123' }),
  ApiResponse({ status: 200, description: '成功返回预设详情' }),
  ApiResponse({ status: 404, description: '预设不存在' }),
  ApiResponse({ status: 401, description: '未授权' })
)

export const ApiStoreConfigCreate = () => applyDecorators(
  ApiTags('AI Model Config - 门店配置'),
  ApiBearerAuth(),
  ApiOperation({ summary: '创建门店配置', description: '为指定门店创建新的AI模型配置' }),
  ApiBody({ type: CreateStoreConfigDto, description: '门店配置信息' }),
  ApiResponse({ status: 201, description: '配置创建成功' }),
  ApiResponse({ status: 400, description: '请求参数错误' }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 403, description: '无权限创建配置' })
)

export const ApiStoreConfigList = () => applyDecorators(
  ApiTags('AI Model Config - 门店配置'),
  ApiBearerAuth(),
  ApiOperation({ summary: '获取门店配置列表', description: '获取指定门店的所有AI模型配置' }),
  ApiQuery({ name: 'storeId', required: true, description: '门店ID', example: 'store_001' }),
  ApiQuery({ name: 'isActive', required: false, description: '按激活状态过滤', type: Boolean }),
  ApiResponse({ status: 200, description: '成功返回配置列表' }),
  ApiResponse({ status: 400, description: '缺少storeId参数' }),
  ApiResponse({ status: 401, description: '未授权' })
)

export const ApiStoreConfigGet = () => applyDecorators(
  ApiTags('AI Model Config - 门店配置'),
  ApiBearerAuth(),
  ApiOperation({ summary: '获取指定配置', description: '根据ID获取单个门店配置的详细信息' }),
  ApiParam({ name: 'id', description: '配置ID', example: 'config_123' }),
  ApiResponse({ status: 200, description: '成功返回配置详情' }),
  ApiResponse({ status: 404, description: '配置不存在' }),
  ApiResponse({ status: 401, description: '未授权' })
)

export const ApiStoreConfigUpdate = () => applyDecorators(
  ApiTags('AI Model Config - 门店配置'),
  ApiBearerAuth(),
  ApiOperation({ summary: '更新门店配置', description: '更新指定门店配置的参数' }),
  ApiParam({ name: 'id', description: '配置ID', example: 'config_123' }),
  ApiBody({ type: UpdateStoreConfigDto, description: '更新的配置信息' }),
  ApiResponse({ status: 200, description: '配置更新成功' }),
  ApiResponse({ status: 400, description: '请求参数错误' }),
  ApiResponse({ status: 404, description: '配置不存在' }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 403, description: '无权限更新配置' })
)

export const ApiStoreConfigDelete = () => applyDecorators(
  ApiTags('AI Model Config - 门店配置'),
  ApiBearerAuth(),
  ApiOperation({ summary: '删除门店配置', description: '删除指定的门店配置' }),
  ApiParam({ name: 'id', description: '配置ID', example: 'config_123' }),
  ApiResponse({ status: 204, description: '配置删除成功' }),
  ApiResponse({ status: 404, description: '配置不存在' }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 403, description: '无权限删除配置' })
)

export const ApiSwitch = () => applyDecorators(
  ApiTags('AI Model Config - 配置切换'),
  ApiBearerAuth(),
  ApiOperation({ 
    summary: '一键切换配置', 
    description: '将指定配置切换为当前生效配置，延迟<500ms'
  }),
  ApiBody({ type: SwitchConfigDto, description: '切换请求参数' }),
  ApiResponse({ 
    status: 200, 
    description: '切换成功',
    schema: {
      example: {
        success: true,
        configId: 'config_123',
        latencyMs: 150,
        switchedAt: '2024-01-15T10:30:00Z'
      }
    }
  }),
  ApiResponse({ status: 400, description: '请求参数错误' }),
  ApiResponse({ status: 404, description: '配置不存在' }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 403, description: '无权限切换配置' }),
  ApiResponse({ status: 409, description: '切换冲突(并发)' })
)

export const ApiRollback = () => applyDecorators(
  ApiTags('AI Model Config - 配置回滚'),
  ApiBearerAuth(),
  ApiOperation({ 
    summary: '回滚到历史版本', 
    description: '将配置回滚到指定的历史版本状态'
  }),
  ApiBody({ type: RollbackDto, description: '回滚请求参数' }),
  ApiResponse({ 
    status: 200, 
    description: '回滚成功',
    schema: {
      example: {
        success: true,
        configId: 'config_123',
        rolledBackTo: 'history_456',
        timestamp: '2024-01-15T10:30:00Z'
      }
    }
  }),
  ApiResponse({ status: 400, description: '请求参数错误' }),
  ApiResponse({ status: 404, description: '历史记录不存在' }),
  ApiResponse({ status: 401, description: '未授权' }),
  ApiResponse({ status: 403, description: '无权限回滚配置' })
)