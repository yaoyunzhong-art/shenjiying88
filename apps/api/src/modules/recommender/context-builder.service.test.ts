import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextBuilderService } from './context-builder.service'
import type { ChampionSummary } from './context-builder.service'

describe('ContextBuilderService', () => {
  let service: ContextBuilderService

  const makeChampion = (overrides: Partial<ChampionSummary> = {}): ChampionSummary => ({
    championId: 'champ-1',
    name: 'Alice',
    role: 'CHAMPION',
    totalScore: 950,
    topModules: ['member', 'payment'],
    recentContributions: [],
    ...overrides,
  })

  const makeContribution = (kind: 'COMMIT' | 'RFC' | 'REVIEW', refId: string, weight = 1) => ({
    kind,
    refId,
    occurredAt: new Date().toISOString(),
    weight,
  })

  const makeInput = (overrides: Record<string, unknown> = {}) => ({
    champion: makeChampion(),
    currentFiles: ['apps/api/src/modules/member/member.service.ts'],
    branch: 'feat/member-optimize',
    allChampions: [makeChampion({ championId: 'champ-2', name: 'Bob', topModules: ['member'] })],
    ...overrides,
  })

  beforeEach(() => {
    service = new ContextBuilderService()
  })

  // ── build() — 正常流程 ──
  describe('build()', () => {
    it('should build a RecommendationContext with correct module inference', () => {
      const result = service.build(makeInput())
      expect(result.currentTask.module).toBe('member')
      expect(result.currentTask.branch).toBe('feat/member-optimize')
      expect(result.champion.championId).toBe('champ-1')
    })

    it('should infer module from first matching file path', () => {
      const input = makeInput({
        currentFiles: [
          'apps/api/src/modules/payment/payment.service.ts',
          'apps/api/src/modules/member/member.service.ts',
        ],
      })
      const result = service.build(input)
      expect(result.currentTask.module).toBe('payment')
    })

    it('should return "unknown" when no files match the module pattern', () => {
      const input = makeInput({ currentFiles: ['packages/shared/utils.ts', 'lib/helper.ts'] })
      const result = service.build(input)
      expect(result.currentTask.module).toBe('unknown')
    })

    it('should handle empty currentFiles array', () => {
      const input = makeInput({ currentFiles: [] })
      const result = service.build(input)
      // inferModule returns 'unknown' when no files match
      expect(result.currentTask.module).toBe('unknown')
      expect(result.currentTask.files).toEqual([])
    })

    it('should handle undefined branch gracefully', () => {
      const input = makeInput({ branch: undefined })
      const result = service.build(input)
      expect(result.currentTask.branch).toBeUndefined()
    })

    it('should find related champions from the same module', () => {
      const related = [
        makeChampion({ championId: 'champ-3', name: 'Charlie', topModules: ['member'], totalScore: 800 }),
        makeChampion({ championId: 'champ-4', name: 'Dave', topModules: ['member'], totalScore: 700 }),
      ]
      const input = makeInput({
        allChampions: [
          ...related,
          makeChampion({ championId: 'champ-5', name: 'Eve', topModules: ['payment'], totalScore: 900 }),
        ],
      })
      const result = service.build(input)
      expect(result.relatedChampions).toHaveLength(2)
      expect(result.relatedChampions.map(c => c.name)).toEqual(['Charlie', 'Dave'])
    })

    it('should exclude self from related champions', () => {
      const input = makeInput({
        allChampions: [
          makeChampion({ championId: 'champ-1', name: 'Alice', topModules: ['member'] }),
          makeChampion({ championId: 'champ-2', name: 'Bob', topModules: ['member'] }),
        ],
      })
      const result = service.build(input)
      const relatedIds = result.relatedChampions.map(c => c.championId)
      expect(relatedIds).not.toContain('champ-1')
      expect(relatedIds).toContain('champ-2')
    })

    it('should sort related champions by totalScore descending and cap at 5', () => {
      const champs = Array.from({ length: 8 }, (_, i) =>
        makeChampion({
          championId: `champ-${i + 10}`,
          name: `Dev${i}`,
          topModules: ['member'],
          totalScore: 1000 - i * 50,
        }),
      )
      const input = makeInput({ allChampions: champs })
      const result = service.build(input)
      expect(result.relatedChampions).toHaveLength(5)
      for (let i = 1; i < result.relatedChampions.length; i++) {
        expect(result.relatedChampions[i - 1].totalScore)
          .toBeGreaterThanOrEqual(result.relatedChampions[i].totalScore)
      }
    })

    it('should return empty related champions when no one else shares the module', () => {
      const input = makeInput({
        allChampions: [
          makeChampion({ championId: 'champ-2', name: 'Bob', topModules: ['payment'] }),
        ],
      })
      const result = service.build(input)
      expect(result.relatedChampions).toHaveLength(0)
    })

    it('should compute recentSummary.totalContributions correctly', () => {
      const recentContributions = [
        makeContribution('COMMIT', 'ref-1'),
        makeContribution('COMMIT', 'ref-2'),
        makeContribution('RFC', 'ref-3'),
      ]
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.totalContributions).toBe(3)
    })

    it('should compute byKind aggregation', () => {
      const recentContributions = [
        makeContribution('COMMIT', 'ref-1'),
        makeContribution('COMMIT', 'ref-2'),
        makeContribution('RFC', 'ref-3'),
        makeContribution('COMMIT', 'ref-4'),
      ]
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.byKind).toEqual({ COMMIT: 3, RFC: 1 })
    })

    it('should cap recent contributions at 30', () => {
      const recentContributions = Array.from({ length: 50 }, (_, i) =>
        makeContribution('COMMIT', `ref-${i}`),
      )
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.totalContributions).toBe(30)
    })

    it('should compute topRefIds by frequency', () => {
      const recentContributions = [
        makeContribution('COMMIT', 'hot-ref'),
        makeContribution('COMMIT', 'hot-ref'),
        makeContribution('COMMIT', 'hot-ref'),
        makeContribution('COMMIT', 'rare-ref'),
        makeContribution('RFC', 'rare-ref'),
        makeContribution('REVIEW', 'single-ref'),
      ]
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.topRefIds[0]).toBe('hot-ref')
      expect(result.recentSummary.topRefIds[1]).toBe('rare-ref')
    })

    it('should limit topRefIds to at most 5 entries', () => {
      const recentContributions = Array.from({ length: 30 }, (_, i) =>
        makeContribution('COMMIT', `ref-${i % 10}`),
      )
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.topRefIds.length).toBeLessThanOrEqual(5)
    })

    it('should set builtAt to a valid ISO string timestamp', () => {
      const result = service.build(makeInput())
      const builtAt = new Date(result.builtAt)
      expect(builtAt.toISOString()).toBe(result.builtAt)
    })

    it('should handle empty allChampions array', () => {
      const input = makeInput({ allChampions: [] })
      const result = service.build(input)
      expect(result.relatedChampions).toEqual([])
    })

    it('should handle champion with no recent contributions', () => {
      const input = makeInput({
        champion: makeChampion({ recentContributions: [], totalScore: 0 }),
      })
      const result = service.build(input)
      expect(result.recentSummary.totalContributions).toBe(0)
      expect(result.recentSummary.byKind).toEqual({})
      expect(result.recentSummary.topRefIds).toEqual([])
    })

    it('should handle contributions with same kind zero count gracefully', () => {
      const recentContributions = [
        makeContribution('RFC', 'rfc-001'),
        makeContribution('REVIEW', 'rev-001'),
        makeContribution('REVIEW', 'rev-002'),
      ]
      const input = makeInput({
        champion: makeChampion({ recentContributions }),
      })
      const result = service.build(input)
      expect(result.recentSummary.byKind).toEqual({ RFC: 1, REVIEW: 2 })
      expect(result.recentSummary.byKind.COMMIT).toBeUndefined()
    })
  })
})
// P-38 Financial Sprint
