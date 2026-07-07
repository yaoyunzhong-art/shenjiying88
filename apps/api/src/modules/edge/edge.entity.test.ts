import { describe, it, expect } from 'vitest'
import {
  EDGE_NODE_CAPABILITIES,
  DEFAULT_TIME_TOLERANCE_MS,
  MAX_SYNC_HISTORY,
  MODEL_CACHE_TTL_MS,
  EDGE_GUARD_KEY,
} from './edge.entity'

describe('Edge Entity', () => {
  describe('常量定义', () => {
    it('EDGE_NODE_CAPABILITIES 应包含所有能力', () => {
      expect(EDGE_NODE_CAPABILITIES).toContain('face')
      expect(EDGE_NODE_CAPABILITIES).toContain('voice')
      expect(EDGE_NODE_CAPABILITIES).toContain('qr')
      expect(EDGE_NODE_CAPABILITIES).toContain('ocr')
      expect(EDGE_NODE_CAPABILITIES).toContain('nlp')
    })

    it('DEFAULT_TIME_TOLERANCE_MS 应为 500', () => {
      expect(DEFAULT_TIME_TOLERANCE_MS).toBe(500)
    })

    it('MAX_SYNC_HISTORY 应为 10', () => {
      expect(MAX_SYNC_HISTORY).toBe(10)
    })

    it('MODEL_CACHE_TTL_MS 应为 24 小时', () => {
      expect(MODEL_CACHE_TTL_MS).toBe(86_400_000)
    })

    it('EDGE_GUARD_KEY 应为 edgeGuardMeta', () => {
      expect(EDGE_GUARD_KEY).toBe('edgeGuardMeta')
    })
  })
})
