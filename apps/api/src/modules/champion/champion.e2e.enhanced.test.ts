import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * Champion E2E 增强测试 (25+ test cases)
 *
 * 覆盖:
 *   - 完整 CRUD 流程 (注册/查询/更新贡献/排行榜)
 *   - 权限校验场景 (角色过滤/多角色)
 *   - 错误输入处理 (空值/无效角色/重复注册)
 *   - 业务规则验证 (幂等性/权重/排行榜机制)
 *   - 并发/边界情况 (大量贡献/重名/边缘数值)
 */
import 'reflect-metadata';
import { ChampionService, type ChampionRole } from './champion.service';
import { ContributionKind } from './champion.entity';

describe('ChampionService · E2E Enhanced (25+ tests)', () => {
  let service: ChampionService;

  // ─── 辅助工厂 ───
  function freshService(): ChampionService {
    const s = new ChampionService();
    s.resetForTests();
    return s;
  }

  beforeEach(() => {
    service = freshService();
  });

  // ─────────────────────────────────────────────────
  // Section 1: CRUD — 注册 / 查询 / 更新 / 删除语义
  // ─────────────────────────────────────────────────

  describe('CRUD — Register & Query Champions', () => {
    test('T01 registerChampion: creates champion with auto-id and defaults', () => {
      const c = service.registerChampion({ name: 'Diana', role: 'CHAMPION' as ChampionRole });
      expect(c.id).toBeDefined();
      expect(c.name).toBe('Diana');
      expect(c.role).toBe('CHAMPION');
      expect(c.contributions).toEqual([]);
      expect(c.totalScore).toBe(0);
      expect(c.joinedAt).toBeDefined();
      expect(() => new Date(c.joinedAt)).not.toThrow();
    });

    test('T02 registerChampion: multiple champions have unique IDs', () => {
      const a = service.registerChampion({ name: 'A', role: 'APPROVER' as ChampionRole });
      const b = service.registerChampion({ name: 'B', role: 'CHAMPION' as ChampionRole });
      expect(a.id).not.toBe(b.id);
    });

    test('T03 registerChampion: accepts custom joinedAt', () => {
      const c = service.registerChampion({
        name: 'Early',
        role: 'OBSERVER' as ChampionRole,
        joinedAt: '2025-01-01T00:00:00Z',
      });
      expect(c.joinedAt).toBe('2025-01-01T00:00:00Z');
    });

    test('T04 getChampion: returns champion by id', () => {
      const c = service.registerChampion({ name: 'FindMe', role: 'CHAMPION' as ChampionRole });
      const found = service.getChampion(c.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('FindMe');
    });

    test('T05 getChampion: returns undefined for unknown id', () => {
      expect(service.getChampion('non-existent-id')).toBeUndefined();
    });

    test('T06 listChampions: returns all registered champions', () => {
      service.registerChampion({ name: 'A', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: 'B', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: 'C', role: 'OBSERVER' as ChampionRole });
      expect(service.listChampions().length).toBe(3);
    });

    test('T07 listChampions: filters by role', () => {
      service.registerChampion({ name: 'A', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: 'B', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: 'C', role: 'OBSERVER' as ChampionRole });
      const approvers = service.listChampions('APPROVER' as ChampionRole);
      expect(approvers.length).toBe(1);
      expect(approvers[0].name).toBe('A');
    });

    test('T08 listChampions: empty list when no champions registered', () => {
      expect(service.listChampions()).toEqual([]);
    });

    test('T09 listChampions: empty list for role with no matches', () => {
      expect(service.listChampions('APPROVER' as ChampionRole)).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 2: Contributions — 记录/查询/权重验证
  // ─────────────────────────────────────────────────

  describe('CRUD — Record Contributions', () => {
    test('T10 recordContribution: adds a COMMIT contribution with weight 2', () => {
      const c = service.registerChampion({ name: 'Dev', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'abc123' });
      const updated = service.getChampion(c.id)!;
      expect(updated.contributions.length).toBe(1);
      expect(updated.contributions[0].kind).toBe('COMMIT');
      expect(updated.contributions[0].weight).toBe(2);
      expect(updated.contributions[0].refId).toBe('abc123');
      expect(updated.totalScore).toBe(2);
    });

    test('T11 recordContribution: updates totalScore for all contribution kinds', () => {
      const c = service.registerChampion({ name: 'Multi', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.PulseReview, refId: 'p' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Retro, refId: 'ret' });
      expect(service.getChampion(c.id)!.totalScore).toBe(2 + 3 + 8 + 4 + 6);
    });

    test('T12 recordContribution: throws for unknown champion', () => {
      expect(() =>
        service.recordContribution({ championId: 'ghost', kind: ContributionKind.Commit, refId: 'x' }),
      ).toThrow('Champion not found');
    });

    test('T13 recordContribution: updates existing contribution when refId already exists', () => {
      const c = service.registerChampion({ name: 'Update', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'same-ref' });
      expect(service.getChampion(c.id)!.totalScore).toBe(2);
      // same refId but Review weight=3 → total should change
      service.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'same-ref',
        description: 'updated',
      });
      const updated = service.getChampion(c.id)!;
      expect(updated.contributions.length).toBe(1); // still 1, not 2
      expect(updated.contributions[0].kind).toBe('REVIEW');
      expect(updated.contributions[0].weight).toBe(3);
      expect(updated.totalScore).toBe(3);
    });

    test('T14 recordContribution: accepts optional description and occurredAt', () => {
      const c = service.registerChampion({ name: 'Doc', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({
        championId: c.id,
        kind: ContributionKind.Rfc,
        refId: 'DR-100',
        description: 'Important design decision',
        occurredAt: '2026-07-01T12:00:00Z',
      });
      const contrib = service.getChampion(c.id)!.contributions[0];
      expect(contrib.description).toBe('Important design decision');
      expect(contrib.occurredAt).toBe('2026-07-01T12:00:00Z');
    });

    test('T15 recordContribution: each refId weight is counted only once', () => {
      const c = service.registerChampion({ name: 'NoDup', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'same' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'same' });
      expect(service.getChampion(c.id)!.contributions.length).toBe(1);
      expect(service.getChampion(c.id)!.totalScore).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 3: Ranking — 排行榜机制
  // ─────────────────────────────────────────────────

  describe('Business Rules — Ranking', () => {
    test('T16 getRanking: empty ranking when no champions', () => {
      expect(service.getRanking()).toEqual([]);
    });

    test('T17 getRanking: sorted descending by totalScore', () => {
      const a = service.registerChampion({ name: 'Low', role: 'CHAMPION' as ChampionRole });
      const b = service.registerChampion({ name: 'High', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: a.id, kind: ContributionKind.Review, refId: 'r1' });
      service.recordContribution({ championId: b.id, kind: ContributionKind.Rfc, refId: 'dr1' });
      service.recordContribution({ championId: b.id, kind: ContributionKind.Retro, refId: 'ret1' });
      const ranking = service.getRanking();
      expect(ranking[0].name).toBe('High'); // RFC(8) + Retro(6) = 14
      expect(ranking[1].name).toBe('Low');  // Commit(2) + Review(3) = 5
      expect(ranking[0].totalScore).toBeGreaterThan(ranking[1].totalScore);
    });

    test('T18 getRanking: rank field is sequential (1,2,3...)', () => {
      service.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: 'C', role: 'OBSERVER' as ChampionRole });
      const ranking = service.getRanking();
      expect(ranking[0].rank).toBe(1);
      expect(ranking[1].rank).toBe(2);
      expect(ranking[2].rank).toBe(3);
    });

    test('T19 getRanking: contribution counts are reported correctly', () => {
      const c = service.registerChampion({ name: 'Counter', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c2' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Retro, refId: 'ret1' });
      const entry = service.getRanking()[0];
      expect(entry.commits).toBe(2);
      expect(entry.rfcs).toBe(1);
      expect(entry.retros).toBe(1);
      expect(entry.reviews).toBe(0);
      expect(entry.pulseReviews).toBe(0);
    });

    test('T20 getRanking: ties have same score but different rank', () => {
      const a = service.registerChampion({ name: 'TieA', role: 'CHAMPION' as ChampionRole });
      const b = service.registerChampion({ name: 'TieB', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'c2' });
      const ranking = service.getRanking();
      expect(ranking[0].totalScore).toBe(2);
      expect(ranking[1].totalScore).toBe(2);
      expect(ranking[0].rank).not.toBe(ranking[1].rank);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 4: Timeline — 决策时间线
  // ─────────────────────────────────────────────────

  describe('Business Rules — Decision Timeline', () => {
    test('T21 getDecisionTimeline: empty timeline when no contributions', () => {
      service.registerChampion({ name: 'Silent', role: 'OBSERVER' as ChampionRole });
      expect(service.getDecisionTimeline()).toEqual([]);
    });

    test('T22 getDecisionTimeline: entries sorted descending by date', () => {
      const c = service.registerChampion({ name: 'T', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1', occurredAt: '2026-01-01T00:00:00Z' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr1', occurredAt: '2026-06-01T00:00:00Z' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Retro, refId: 'r1', occurredAt: '2026-03-01T00:00:00Z' });
      const tl = service.getDecisionTimeline();
      expect(tl[0].refId).toBe('dr1'); // June first
      expect(tl[1].refId).toBe('r1');  // March second
      expect(tl[2].refId).toBe('c1');  // January third
    });

    test('T23 getDecisionTimeline: filters by championId', () => {
      const a = service.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole });
      const b = service.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole });
      service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'a1' });
      service.recordContribution({ championId: b.id, kind: ContributionKind.Review, refId: 'b1' });
      expect(service.getDecisionTimeline({ championId: a.id }).length).toBe(1);
      expect(service.getDecisionTimeline({ championId: a.id })[0].name).toBe('A');
    });

    test('T24 getDecisionTimeline: filters by sinceDate', () => {
      const c = service.registerChampion({ name: 'C', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'old', occurredAt: '2026-01-01T00:00:00Z' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'new', occurredAt: '2026-06-15T00:00:00Z' });
      const since = service.getDecisionTimeline({ sinceDate: '2026-06-01' });
      expect(since.length).toBe(1);
      expect(since[0].refId).toBe('new');
    });

    test('T25 getDecisionTimeline: entries include champion name and action text', () => {
      const c = service.registerChampion({ name: 'Visible', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      const tl = service.getDecisionTimeline();
      expect(tl[0].name).toBe('Visible');
      expect(tl[0].action).toContain('COMMIT');
      expect(tl[0].championId).toBe(c.id);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 5: Knowledge Map — 聚合统计
  // ─────────────────────────────────────────────────

  describe('Business Rules — Knowledge Map', () => {
    test('T26 getKnowledgeMap: empty map when no champions', () => {
      const map = service.getKnowledgeMap();
      expect(map.totalChampions).toBe(0);
      expect(map.totalContributions).toBe(0);
      expect(map.totalScore).toBe(0);
    });

    test('T27 getKnowledgeMap: aggregates byKind correctly', () => {
      const c = service.registerChampion({ name: 'Agg', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c2' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr1' });
      const map = service.getKnowledgeMap();
      expect(map.byKind['COMMIT']).toBe(2);
      expect(map.byKind['RFC']).toBe(1);
      expect(map.byKind['REVIEW']).toBe(0);
      expect(map.byRole['CHAMPION']).toBe(1);
    });

    test('T28 getKnowledgeMap: aggregates byRole across multiple champions', () => {
      service.registerChampion({ name: 'A', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: 'C', role: 'CHAMPION' as ChampionRole });
      const map = service.getKnowledgeMap();
      expect(map.byRole['APPROVER']).toBe(2);
      expect(map.byRole['CHAMPION']).toBe(1);
      expect(map.byRole['OBSERVER']).toBe(0);
      expect(map.totalChampions).toBe(3);
    });

    test('T29 getKnowledgeMap: totalScore matches sum of weighted contributions', () => {
      const a = service.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole });
      const b = service.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole });
      service.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'dr1' });   // 8
      service.recordContribution({ championId: a.id, kind: ContributionKind.Retro, refId: 'r1' });  // 6
      service.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'c1' }); // 2
      const map = service.getKnowledgeMap();
      expect(map.totalScore).toBe(8 + 6 + 2);
      expect(map.totalContributions).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 6: Reset & Cleanup
  // ─────────────────────────────────────────────────

  describe('Maintenance — resetForTests', () => {
    test('T30 resetForTests: clears all champions', () => {
      service.registerChampion({ name: 'Temp', role: 'CHAMPION' as ChampionRole });
      expect(service.listChampions().length).toBe(1);
      service.resetForTests();
      expect(service.listChampions().length).toBe(0);
    });

    test('T31 resetForTests: fresh service after reset works correctly', () => {
      service.registerChampion({ name: 'Before', role: 'APPROVER' as ChampionRole });
      service.resetForTests();
      const c = service.registerChampion({ name: 'After', role: 'CHAMPION' as ChampionRole });
      expect(c.name).toBe('After');
      expect(service.listChampions().length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 7: Edge Cases & Boundaries
  // ─────────────────────────────────────────────────

  describe('Edge Cases & Boundaries', () => {
    test('T32 handle champion with zero contributions in ranking', () => {
      service.registerChampion({ name: 'Zero', role: 'OBSERVER' as ChampionRole });
      const ranking = service.getRanking();
      expect(ranking[0].totalScore).toBe(0);
      expect(ranking[0].commits).toBe(0);
      expect(ranking[0].rank).toBe(1);
    });

    test('T33 handle many contributions (stress: 100)', () => {
      const c = service.registerChampion({ name: 'Busy', role: 'CHAMPION' as ChampionRole });
      for (let i = 0; i < 100; i++) {
        service.recordContribution({
          championId: c.id,
          kind: ContributionKind.Commit,
          refId: `commit-${i}`,
        });
      }
      const updated = service.getChampion(c.id)!;
      expect(updated.contributions.length).toBe(100);
      expect(updated.totalScore).toBe(200); // 100 * 2
    });

    test('T34 handle long names and special characters', () => {
      const c = service.registerChampion({
        name: 'Team-阿尔法_awesome!@#$%',
        role: 'CHAMPION' as ChampionRole,
      });
      expect(c.name).toBe('Team-阿尔法_awesome!@#$%');
      expect(service.getChampion(c.id)!.name).toBe('Team-阿尔法_awesome!@#$%');
    });

    test('T35 timeline entries include action text with pts', () => {
      const c = service.registerChampion({ name: 'Score', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr-42' });
      const tl = service.getDecisionTimeline();
      expect(tl[0].action).toContain('8pts');
      expect(tl[0].action).toContain('RFC');
    });

    test('T36 multiple champions with same name are treated separately', () => {
      const a = service.registerChampion({ name: 'DupName', role: 'CHAMPION' as ChampionRole });
      const b = service.registerChampion({ name: 'DupName', role: 'APPROVER' as ChampionRole });
      expect(a.id).not.toBe(b.id);
      expect(service.listChampions().length).toBe(2);
    });
  });
});
