import { describe, it, expect } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import {
  CreatePushTaskDto,
  SegmentPushDto,
  CreateExperimentDto,
  RecordConversionDto,
  PushHistoryQueryDto,
  PushStatsDto,
} from './ai-push.dto'

describe('ai-push.dto', () => {
  describe('CreatePushTaskDto', () => {
    it('有效数据应通过校验', () => {
      const dto = plainToInstance(CreatePushTaskDto, {
        title: '限时优惠',
        content: '今日限时优惠已开启',
        channel: 'push',
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少标题应报错', () => {
      const dto = plainToInstance(CreatePushTaskDto, {
        content: 'test',
        channel: 'push',
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('无效渠道应报错', () => {
      const dto = plainToInstance(CreatePushTaskDto, {
        title: 'test',
        content: 'test content',
        channel: 'invalid-channel',
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('空标题应报错', () => {
      const dto = plainToInstance(CreatePushTaskDto, {
        title: '',
        content: 'test',
        channel: 'push',
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('SegmentPushDto', () => {
    it('有效分群推送应通过校验', () => {
      const dto = plainToInstance(SegmentPushDto, {
        title: '活跃会员专属',
        content: '专属优惠来啦',
        channel: 'push',
        segmentType: 'behavior',
        segmentId: 'active',
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })

    it('无效分群类型应报错', () => {
      const dto = plainToInstance(SegmentPushDto, {
        title: 'test',
        content: 'test',
        channel: 'push',
        segmentType: 'invalid',
        segmentId: 'active',
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('CreateExperimentDto', () => {
    it('有效实验配置应通过校验', () => {
      const dto = plainToInstance(CreateExperimentDto, {
        name: 'A/B测试',
        variants: [
          { name: 'A', weight: 0.5, config: { color: 'red' } },
          { name: 'B', weight: 0.5, config: { color: 'blue' } },
        ],
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 name 应报错', () => {
      const dto = plainToInstance(CreateExperimentDto, {
        variants: [
          { name: 'A', weight: 0.5, config: {} },
        ],
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('RecordConversionDto', () => {
    it('有效转化记录应通过校验', () => {
      const dto = plainToInstance(RecordConversionDto, {
        memberId: 'm1',
        experimentId: 'exp-001',
        variantName: 'A',
        event: 'conversion',
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少必填字段应报错', () => {
      const dto = plainToInstance(RecordConversionDto, {
        memberId: 'm1',
      })
      const errors = validateSync(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('PushHistoryQueryDto', () => {
    it('空查询应通过校验（所有字段可选）', () => {
      const dto = plainToInstance(PushHistoryQueryDto, {})
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })

    it('分页参数应正确', () => {
      const dto = plainToInstance(PushHistoryQueryDto, {
        page: 0,
        pageSize: 20,
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PushStatsDto', () => {
    it('带时间范围的统计查询应通过校验', () => {
      const dto = plainToInstance(PushStatsDto, {
        startTime: 1700000000000,
        endTime: 1700086400000,
      })
      const errors = validateSync(dto)
      expect(errors).toHaveLength(0)
    })
  })
})
