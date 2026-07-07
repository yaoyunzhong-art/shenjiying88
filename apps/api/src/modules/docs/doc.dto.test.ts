/**
 * doc.dto.test.ts - API文档模块 DTO 测试
 */

import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  DocGenerateRequestDto,
  RegisterEndpointRequestDto,
  RegisterSchemaRequestDto,
  DocConfigUpdateDto,
  AddTagRequestDto,
  DocExportFormatEnum,
} from './doc.dto'

describe('DocDto - DTO 校验测试', () => {
  describe('DocGenerateRequestDto', () => {
    it('正例: 有效完整请求', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = 'My API'
      dto.version = '1.0.0'
      dto.description = '文档描述'
      dto.format = DocExportFormatEnum.OPENAPI_JSON
      dto.servers = ['https://api.example.com']
      dto.tags = ['users']

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('正例: 最小必填字段', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = 'Minimal'
      dto.version = '0.0.1'
      dto.format = DocExportFormatEnum.REDOC_HTML

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('反例: 缺少必填 title', async () => {
      const dto = new DocGenerateRequestDto()
      dto.version = '1.0.0'
      dto.format = DocExportFormatEnum.OPENAPI_JSON

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors.some((e) => e.property === 'title')).toBe(true)
    })

    it('反例: 缺少必填 version', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = 'API'
      dto.format = DocExportFormatEnum.OPENAPI_JSON

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'version')).toBe(true)
    })

    it('反例: 缺少必填 format', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = 'API'
      dto.version = '1.0.0'

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'format')).toBe(true)
    })

    it('反例: 空 title', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = ''
      dto.version = '1.0.0'
      dto.format = DocExportFormatEnum.OPENAPI_JSON

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'title')).toBe(true)
    })

    it('反例: 无效的 format 枚举值', async () => {
      const dto = new DocGenerateRequestDto() as any
      dto.title = 'API'
      dto.version = '1.0.0'
      dto.format = 'invalid-format'

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'format')).toBe(true)
    })

    it('边界: title 超长', async () => {
      const dto = new DocGenerateRequestDto()
      dto.title = 'x'.repeat(201)
      dto.version = '1.0.0'
      dto.format = DocExportFormatEnum.OPENAPI_JSON

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'title')).toBe(true)
    })
  })

  describe('RegisterEndpointRequestDto', () => {
    it('正例: 有效端点注册', async () => {
      const dto = new RegisterEndpointRequestDto()
      dto.controllerName = 'UserController'
      dto.method = 'GET'
      dto.path = '/api/users'
      dto.summary = 'Get users'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('反例: 缺少必填字段', async () => {
      const dto = new RegisterEndpointRequestDto()
      dto.controllerName = 'Test'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('RegisterSchemaRequestDto', () => {
    it('正例: 有效 Schema 注册', async () => {
      const dto = new RegisterSchemaRequestDto()
      dto.name = 'User'
      dto.schema = { type: 'object', properties: { id: { type: 'string' } } }

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('反例: 缺少 name', async () => {
      const dto = new RegisterSchemaRequestDto()
      dto.schema = { type: 'object' }

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'name')).toBe(true)
    })
  })

  describe('DocConfigUpdateDto', () => {
    it('正例: 可选字段更新', async () => {
      const dto = new DocConfigUpdateDto()
      dto.title = 'New Title'
      dto.servers = ['https://api.new.com']

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('正例: 空更新对象', async () => {
      const dto = new DocConfigUpdateDto()

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('AddTagRequestDto', () => {
    it('正例: 有效 Tag', async () => {
      const dto = new AddTagRequestDto()
      dto.name = 'users'
      dto.description = '用户管理端点'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('反例: 缺少 description', async () => {
      const dto = new AddTagRequestDto()
      dto.name = 'users'

      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'description')).toBe(true)
    })
  })
})
