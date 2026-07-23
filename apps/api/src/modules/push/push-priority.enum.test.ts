/**
 * push-priority.enum.test.ts — 推送分级单元测试
 *
 * WP-13A: P0~P3 推送分级
 * BS-0168 ~ BS-0184
 */

import { describe, it, expect } from 'vitest'
import {
  PushBusinessPriority,
  isPushPriorityMandatory,
  toPushPriority,
  PUSH_MARKETING_SETTING_KEY,
} from './push-priority.enum'

describe('PushBusinessPriority', () => {
  describe('isPushPriorityMandatory', () => {
    it('P0 应标记为强制不可关闭', () => {
      expect(isPushPriorityMandatory(PushBusinessPriority.P0)).toBe(true)
    })

    it('P1 不应标记为强制', () => {
      expect(isPushPriorityMandatory(PushBusinessPriority.P1)).toBe(false)
    })

    it('P2 不应标记为强制', () => {
      expect(isPushPriorityMandatory(PushBusinessPriority.P2)).toBe(false)
    })

    it('P3 不应标记为强制', () => {
      expect(isPushPriorityMandatory(PushBusinessPriority.P3)).toBe(false)
    })
  })

  describe('toPushPriority', () => {
    it('P0 应映射为 high', () => {
      expect(toPushPriority(PushBusinessPriority.P0)).toBe('high')
    })

    it('P1 应映射为 high', () => {
      expect(toPushPriority(PushBusinessPriority.P1)).toBe('high')
    })

    it('P2 应映射为 normal', () => {
      expect(toPushPriority(PushBusinessPriority.P2)).toBe('normal')
    })

    it('P3 应映射为 low', () => {
      expect(toPushPriority(PushBusinessPriority.P3)).toBe('low')
    })
  })

  describe('PUSH_MARKETING_SETTING_KEY', () => {
    it('P3 营销关闭配置键应为 push_marketing_enabled', () => {
      expect(PUSH_MARKETING_SETTING_KEY).toBe('push_marketing_enabled')
    })
  })

  describe('枚举值', () => {
    it('应有 P0, P1, P2, P3 四个级别', () => {
      expect(Object.keys(PushBusinessPriority)).toHaveLength(4)
      expect(PushBusinessPriority.P0).toBe('P0')
      expect(PushBusinessPriority.P1).toBe('P1')
      expect(PushBusinessPriority.P2).toBe('P2')
      expect(PushBusinessPriority.P3).toBe('P3')
    })
  })
})
