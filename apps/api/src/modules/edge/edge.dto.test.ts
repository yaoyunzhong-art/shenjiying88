import { describe, it, expect } from 'vitest'
import {
  ListEdgeNodesQueryDto,
  ListTicketsQueryDto,
  RegisterEdgeNodeDto,
  IssueTicketDto,
  CallNextDto,
  SyncQueueDto,
  RunInferenceDto,
  LoadModelDto,
  SyncClockDto,
  CalibrateClockDto,
  EdgeNodeResponseDto,
  TicketResponseDto,
  QueuePositionResponseDto,
  CallNextResponseDto,
  SyncQueueResponseDto,
  TimeSyncResponseDto,
} from './edge.dto'

describe('Edge DTOs', () => {
  describe('查询参数 DTO', () => {
    it('ListEdgeNodesQueryDto 应正确创建', () => {
      const dto = new ListEdgeNodesQueryDto()
      dto.status = 'online'
      dto.platform = 'linux'
      dto.storeId = 'store-001'
      dto.limit = '20'
      expect(dto.status).toBe('online')
      expect(dto.platform).toBe('linux')
      expect(dto.storeId).toBe('store-001')
      expect(dto.limit).toBe('20')
    })

    it('ListTicketsQueryDto 应正确创建', () => {
      const dto = new ListTicketsQueryDto()
      dto.storeId = 'store-001'
      dto.status = 'WAITING'
      dto.limit = '50'
      expect(dto.storeId).toBe('store-001')
      expect(dto.status).toBe('WAITING')
      expect(dto.limit).toBe('50')
    })
  })

  describe('请求 DTO', () => {
    it('RegisterEdgeNodeDto 应正确创建', () => {
      const dto = new RegisterEdgeNodeDto()
      dto.name = 'Edge Node X'
      dto.platform = 'linux'
      dto.memoryMb = 4096
      dto.cpuCores = 4
      dto.storageMb = 16384
      dto.capabilities = ['face', 'voice']
      dto.storeId = 'store-001'
      expect(dto.name).toBe('Edge Node X')
      expect(dto.platform).toBe('linux')
      expect(dto.capabilities).toContain('face')
    })

    it('IssueTicketDto 应正确创建', () => {
      const dto = new IssueTicketDto()
      dto.storeId = 'store-001'
      dto.customerId = 'customer-001'
      dto.priority = 5
      expect(dto.storeId).toBe('store-001')
      expect(dto.customerId).toBe('customer-001')
      expect(dto.priority).toBe(5)
    })

    it('RunInferenceDto 应正确创建', () => {
      const dto = new RunInferenceDto()
      dto.modelId = 'face-detection-v1'
      dto.deviceId = 'edge-001'
      dto.inputData = { image: 'base64...' }
      expect(dto.modelId).toBe('face-detection-v1')
      expect(dto.deviceId).toBe('edge-001')
      expect(dto.inputData).toEqual({ image: 'base64...' })
    })

    it('SyncClockDto 应正确创建', () => {
      const dto = new SyncClockDto()
      dto.clientTime = 1234567890
      expect(dto.clientTime).toBe(1234567890)
    })

    it('CalibrateClockDto 应正确创建', () => {
      const dto = new CalibrateClockDto()
      dto.samples = [
        { clientTime: 1000, serverTime: 1050 },
        { clientTime: 2000, serverTime: 2050 },
      ]
      expect(dto.samples).toHaveLength(2)
      expect(dto.samples[0].serverTime).toBe(1050)
    })
  })

  describe('响应 DTO', () => {
    it('EdgeNodeResponseDto 应正确创建', () => {
      const dto = new EdgeNodeResponseDto()
      dto.id = 'node-001'
      dto.tenantId = 'tenant-A'
      dto.name = 'Edge Node'
      dto.platform = 'linux'
      dto.status = 'online'
      dto.memoryMb = 4096
      dto.cpuCores = 4
      dto.storageMb = 16384
      dto.capabilities = ['face']
      expect(dto.id).toBe('node-001')
      expect(dto.status).toBe('online')
    })

    it('TicketResponseDto 应正确创建', () => {
      const dto = new TicketResponseDto()
      dto.ticketId = 'TK-001'
      dto.storeId = 'store-001'
      dto.ticketNumber = 1
      dto.status = 'WAITING'
      dto.priority = 0
      dto.syncedToServer = false
      expect(dto.ticketNumber).toBe(1)
      expect(dto.status).toBe('WAITING')
      expect(dto.syncedToServer).toBe(false)
    })

    it('CallNextResponseDto 应正确创建', () => {
      const dto = new CallNextResponseDto()
      dto.calledTicket = new TicketResponseDto()
      dto.calledTicket.ticketId = 'TK-002'
      dto.queueAfterCall = 3
      dto.previousTicketId = 'TK-001'
      expect(dto.queueAfterCall).toBe(3)
      expect(dto.calledTicket?.ticketId).toBe('TK-002')
    })

    it('TimeSyncResponseDto 应正确创建', () => {
      const dto = new TimeSyncResponseDto()
      dto.serverTime = Date.now()
      dto.offset = 100
      dto.roundTripDelay = 50
      dto.synced = true
      expect(dto.synced).toBe(true)
      expect(dto.offset).toBe(100)
    })
  })
})
