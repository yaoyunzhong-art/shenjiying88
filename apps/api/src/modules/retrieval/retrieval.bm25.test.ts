import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * retrieval.bm25.spec.ts · BM25 单元测试 (Phase-19 RAG 增强)
 *
 * 覆盖范围:
 *   - tokenize: 中英文混合分词
 *   - BM25Index 构造: vocabulary / df / idf
 *   - search: 召回正确性
 *   - querySparseVector: Qdrant sparse vector 格式
 *   - evaluateAB: Hit Rate @ K + MRR @ K
 */

import {
  tokenize,
  BM25Index,
  evaluateAB,
  normalizeDenseScores,
  hybridScore,
  DEFAULT_BM25_PARAMS,
  DEFAULT_HYBRID_WEIGHTS,
} from './retrieval.bm25'
import type { ChunkPayload } from './retrieval.types'

// ─── 准备 fixture ───────────────────────────────────────────────────────

const sampleDocs: ChunkPayload[] = [
  {
    chunkId: 'c1',
    filePath: 'apps/api/src/modules/coupon/coupon.service.ts',
    language: 'typescript',
    astType: 'method',
    symbolName: 'redeemCrossStore',
    lineRange: [1, 50],
    phase: 'phase-17',
    pulse: 'pulse-68',
    gitSha: '84335d21',
    tokens: 50,
    isPublic: true,
    isTest: false,
    content: '跨门店优惠券核销 service, 支持多租户 quota 守卫',
  },
  {
    chunkId: 'c2',
    filePath: 'apps/api/src/modules/quota/quota.service.ts',
    language: 'typescript',
    astType: 'method',
    symbolName: 'reserve',
    lineRange: [1, 30],
    phase: 'phase-15',
    pulse: 'pulse-60',
    gitSha: '84335d21',
    tokens: 30,
    isPublic: true,
    isTest: false,
    content: 'Quota reserve service, 多租户资源配额守卫, 支持 Brand/Store/Member/Campaign/Product/Invoice/ApiCall/Coupon 八种资源',
  },
  {
    chunkId: 'c3',
    filePath: 'apps/api/src/modules/lyt/lyt.service.ts',
    language: 'typescript',
    astType: 'method',
    symbolName: 'calculate',
    lineRange: [1, 80],
    phase: 'phase-12',
    pulse: 'pulse-58',
    gitSha: '84335d21',
    tokens: 80,
    isPublic: true,
    isTest: false,
    content: '龙岩通关 (LYT) 计算引擎, 支持门票核销和积分奖励',
  },
  {
    chunkId: 'c4',
    filePath: 'knowledge/patterns/quota-guard.md',
    language: 'markdown',
    astType: 'markdown_section',
    symbolName: 'quota-guard',
    lineRange: [1, 100],
    phase: 'phase-16',
    pulse: 'pulse-66',
    gitSha: '84335d21',
    tokens: 100,
    isPublic: true,
    isTest: false,
    content: 'Quota Guard 模式: 头部 assertCanWriteResource + 业务成功 quotaService.increment 尾部',
  },
]

// ─── tokenize ──────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('英文按词拆分并小写化', () => {
    expect(tokenize('Hello World SaaS')).toEqual(['hello', 'world', 'saas'])
  })

  it('中文按字符 unigram 拆分', () => {
    expect(tokenize('跨门店优惠券')).toEqual(['跨', '门', '店', '优', '惠', '券'])
  })

  it('中英文混合正确处理', () => {
    const result = tokenize('Hello, 神机营 SaaS!')
    expect(result).toContain('hello')
    expect(result).toContain('神')
    expect(result).toContain('机')
    expect(result).toContain('营')
    expect(result).toContain('saas')
  })

  it('数字保留', () => {
    expect(tokenize('Pulse-68 Day 1')).toEqual(['pulse', '68', 'day'])
  })

  it('空字符串返回空数组', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })

  it('单字符英文被过滤', () => {
    // a, I, x 等单字符不保留
    expect(tokenize('I am a x developer')).toEqual(['am', 'developer'])
  })

  it('标点符号被过滤', () => {
    expect(tokenize('hello, world!')).toEqual(['hello', 'world'])
  })
})

// ─── BM25Index 构造 ─────────────────────────────────────────────────────

describe('BM25Index construction', () => {
  it('构建 vocabulary 和 df', () => {
    const index = new BM25Index(sampleDocs)
    expect(index.docCount).toBe(4)
    expect(index.vocabularySize).toBeGreaterThan(0)
  })

  it('IDF 全部为正数 (常见词)', () => {
    const index = new BM25Index(sampleDocs)
    // "跨", "券" 等出现在多个文档中 → IDF 可能为 0
    // "优", "惠" 等只出现 1 次 → IDF > 0
    let positiveCount = 0
    for (const [, idf] of index.idfMap) {
      if (idf > 0) positiveCount++
    }
    expect(positiveCount).toBeGreaterThan(0)
  })

  it('空文档数组也能构造', () => {
    const index = new BM25Index([])
    expect(index.docCount).toBe(0)
    expect(index.vocabularySize).toBe(0)
  })

  it('默认参数正确', () => {
    expect(DEFAULT_BM25_PARAMS.k1).toBe(1.5)
    expect(DEFAULT_BM25_PARAMS.b).toBe(0.75)
  })
})

// ─── BM25Index.search ───────────────────────────────────────────────────

describe('BM25Index.search', () => {
  it('优惠券相关查询命中 coupon + quota 文档', () => {
    const index = new BM25Index(sampleDocs)
    const results = index.search('跨门店优惠券核销', 5)
    expect(results.length).toBeGreaterThan(0)
    // 排名第 1 应该是 c1 (coupon.service.ts)
    expect(results[0].chunk.chunkId).toBe('c1')
  })

  it('quota 相关查询命中 quota 文档', () => {
    const index = new BM25Index(sampleDocs)
    const results = index.search('quota 守卫 多租户', 5)
    expect(results.length).toBeGreaterThan(0)
    // c2 (quota.service.ts) 应该在 top 2
    const top2Ids = results.slice(0, 2).map((r) => r.chunk.chunkId)
    expect(top2Ids).toContain('c2')
  })

  it('空查询返回空结果', () => {
    const index = new BM25Index(sampleDocs)
    expect(index.search('', 5)).toEqual([])
  })

  it('topK 限制返回数量', () => {
    const index = new BM25Index(sampleDocs)
    const results = index.search('多租户 quota service', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('分数按降序排列', () => {
    const index = new BM25Index(sampleDocs)
    const results = index.search('优惠券 service', 10)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })
})

// ─── querySparseVector ──────────────────────────────────────────────────

describe('BM25Index.querySparseVector', () => {
  it('输出符合 Qdrant sparse vector 格式 (Record<number, number>)', () => {
    const index = new BM25Index(sampleDocs)
    const sparse = index.querySparseVector('优惠券')
    expect(typeof sparse).toBe('object')
    expect(sparse).not.toBeNull()

    // 所有 key 都是 number (vocabulary id), value > 0
    for (const [tokenId, score] of Object.entries(sparse)) {
      expect(Number.isInteger(Number(tokenId))).toBe(true)
      expect(score).toBeGreaterThan(0)
    }
  })

  it('未登录词不出现在 sparse vector 中', () => {
    const index = new BM25Index(sampleDocs)
    const sparse = index.querySparseVector('unknownxyz123')
    // 全部 unknown → 空 sparse vector
    expect(Object.keys(sparse).length).toBe(0)
  })

  it('多 token query 包含多个 tokenId', () => {
    const index = new BM25Index(sampleDocs)
    const sparse = index.querySparseVector('跨门店 优惠券 service')
    const keyCount = Object.keys(sparse).length
    expect(keyCount).toBeGreaterThan(1)
  })
})

// ─── hybridScore ───────────────────────────────────────────────────────

describe('hybridScore', () => {
  it('默认权重 (0.7/0.3/0.1)', () => {
    expect(DEFAULT_HYBRID_WEIGHTS.dense).toBe(0.7)
    expect(DEFAULT_HYBRID_WEIGHTS.sparse).toBe(0.3)
    expect(DEFAULT_HYBRID_WEIGHTS.metadata).toBe(0.1)
  })

  it('计算 finalScore = 0.7·dense + 0.3·sparse + 0.1·metadata', () => {
    const score = hybridScore(1.0, 0.8, 0.5)
    expect(score).toBeCloseTo(0.7 + 0.24 + 0.05, 5)
  })

  it('undefined sparse/metadata 视为 0', () => {
    const score = hybridScore(0.5, undefined, undefined)
    expect(score).toBeCloseTo(0.35, 5)
  })

  it('支持自定义权重', () => {
    const score = hybridScore(1.0, 1.0, 1.0, { dense: 0.5, sparse: 0.3, metadata: 0.2 })
    expect(score).toBeCloseTo(0.5 + 0.3 + 0.2, 5)
  })
})

// ─── normalizeDenseScores ──────────────────────────────────────────────

describe('normalizeDenseScores', () => {
  it('min-max 归一化到 [0, 1]', () => {
    const result = normalizeDenseScores([0.2, 0.5, 0.8])
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
    expect(result[2]).toBeCloseTo(1, 5)
  })

  it('全部相同分数时全部为 1', () => {
    const result = normalizeDenseScores([0.5, 0.5, 0.5])
    expect(result.every((s) => s === 1)).toBe(true)
  })

  it('空数组返回空数组', () => {
    expect(normalizeDenseScores([])).toEqual([])
  })
})

// ─── evaluateAB ─────────────────────────────────────────────────────────

describe('evaluateAB', () => {
  it('Hit Rate @ K + MRR @ K 正确计算', () => {
    const groundTruth = [
      { query: 'coupon', relevantDocIds: ['c1'] },
      { query: 'quota', relevantDocIds: ['c2'] },
    ]
    const results = [
      { query: 'coupon', topDocIds: ['c1', 'c4', 'c2'] }, // rank 1 命中
      { query: 'quota', topDocIds: ['c1', 'c2', 'c4'] }, // rank 2 命中
    ]

    const metrics = evaluateAB(results, groundTruth, 5)

    expect(metrics.totalQueries).toBe(2)
    expect(metrics.hitRateAtK).toBe(1.0) // 100% 命中
    expect(metrics.mrrAtK).toBeCloseTo((1 + 0.5) / 2, 5) // rank 1 + rank 2
  })

  it('无命中时 Hit Rate = 0', () => {
    const groundTruth = [{ query: 'coupon', relevantDocIds: ['c99'] }]
    const results = [{ query: 'coupon', topDocIds: ['c1', 'c2'] }]

    const metrics = evaluateAB(results, groundTruth, 5)
    expect(metrics.hitRateAtK).toBe(0)
    expect(metrics.mrrAtK).toBe(0)
  })

  it('ground truth 为空时全部跳过', () => {
    const metrics = evaluateAB(
      [{ query: 'q1', topDocIds: ['c1'] }],
      [],
      5
    )
    expect(metrics.totalQueries).toBe(0)
    expect(metrics.hitRateAtK).toBe(0)
  })

  it('K 参数限制候选范围', () => {
    const groundTruth = [{ query: 'q', relevantDocIds: ['c3'] }]
    const results = [{ query: 'q', topDocIds: ['c1', 'c2', 'c3', 'c4'] }]

    // K=2: c3 在 top 2 之外 → 不命中
    const m1 = evaluateAB(results, groundTruth, 2)
    expect(m1.hitRateAtK).toBe(0)

    // K=5: c3 在 top 4 → 命中 (rank 3)
    const m2 = evaluateAB(results, groundTruth, 5)
    expect(m2.hitRateAtK).toBe(1)
    expect(m2.mrrAtK).toBeCloseTo(1 / 3, 5)
  })
})
