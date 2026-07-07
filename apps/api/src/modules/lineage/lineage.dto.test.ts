/**
 * lineage.dto.test.ts — 数据血缘 DTO 测试
 */

import { describe, it, expect } from 'vitest'
import {
  LineageQueryDto,
  RegisterFieldDto,
  RegisterEdgeDto,
  ImpactAnalysisDto,
  ClassifyFieldDto,
  UpdateClassificationDto,
  TrackDataFlowDto,
  RegisterTransferDto,
} from './lineage.dto'

describe('lineage DTOs', () => {
  describe('LineageQueryDto', () => {
    it('should accept valid query', () => {
      const dto: LineageQueryDto = { tableName: 'users', fieldName: 'email' }
      expect(dto.tableName).toBe('users')
      expect(dto.fieldName).toBe('email')
    })
  })

  describe('RegisterFieldDto', () => {
    it('should accept valid register payload', () => {
      const dto: RegisterFieldDto = { tableName: 'orders', fieldName: 'total_amount' }
      expect(dto.tableName).toBe('orders')
    })
  })

  describe('RegisterEdgeDto', () => {
    it('should accept DIRECT edge', () => {
      const dto: RegisterEdgeDto = {
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'profiles', fieldName: 'contact_email' },
      }
      expect(dto.type).toBe('DIRECT')
    })

    it('should accept TRANSFORM edge with transform', () => {
      const dto: RegisterEdgeDto = {
        type: 'TRANSFORM',
        from: { tableName: 'orders', fieldName: 'subtotal' },
        to: { tableName: 'invoices', fieldName: 'total' },
        transform: 'subtotal + tax',
      }
      expect(dto.transform).toBe('subtotal + tax')
    })
  })

  describe('ImpactAnalysisDto', () => {
    it('should accept valid impact analysis request', () => {
      const dto: ImpactAnalysisDto = {
        field: { tableName: 'users', fieldName: 'email' },
      }
      expect(dto.field.tableName).toBe('users')
    })
  })

  describe('ClassifyFieldDto', () => {
    it('should accept field classification', () => {
      const dto: ClassifyFieldDto = {
        tableName: 'users',
        fieldName: 'phone_number',
        sampleData: '+86-13800138000',
      }
      expect(dto.sampleData).toBeDefined()
    })

    it('should work without sampleData', () => {
      const dto: ClassifyFieldDto = { tableName: 'users', fieldName: 'name' }
      expect(dto.sampleData).toBeUndefined()
    })
  })

  describe('UpdateClassificationDto', () => {
    it('should accept level update', () => {
      const dto: UpdateClassificationDto = {
        tableName: 'users',
        fieldName: 'name',
        level: 'restricted',
      }
      expect(dto.level).toBe('restricted')
    })
  })

  describe('TrackDataFlowDto', () => {
    it('should accept data flow tracking', () => {
      const dto: TrackDataFlowDto = {
        fromTable: 'users',
        fromField: 'email',
        toTable: 'analytics',
        toField: 'user_email',
        via: 'etl_job',
      }
      expect(dto.via).toBe('etl_job')
    })
  })

  describe('RegisterTransferDto', () => {
    it('should accept transfer registration', () => {
      const dto: RegisterTransferDto = {
        sourceField: 'email',
        targetField: 'user_email',
        table: 'analytics',
        operation: 'insert',
      }
      expect(dto.operation).toBe('insert')
    })
  })
})
