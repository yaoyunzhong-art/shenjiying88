import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * champion.service.test.ts
 *
 * ChampionService 单测
 * - 注册 Champion  正例 / 边界 / 查询
 * - 记录贡献       正例 / 查不到 champion / 各 kind 权重验证
 * - 排行榜         正例 / 严格降序 / 贡献计数
 * - 决策时间线     正例 / 按 championId 过滤 / 按 sinceDate 过滤
 * - Knowledge Map  正例 / 按 kind/role 聚合
 * - resetForTests  清空测试
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ChampionService, type ChampionRole } from './champion.service';
import { ContributionKind } from './champion.entity';

describe('ChampionService', () => {
  // ─── 辅助工厂 ───

  function makeService() {
    const svc = new ChampionService();
    svc.resetForTests();
    return svc;
  }

  function seedSimple(svc: ChampionService) {
    const a = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole });
    const b = svc.registerChampion({ name: 'Bob', role: 'APPROVER' as ChampionRole });
    const c = svc.registerChampion({ name: 'Carol', role: 'OBSERVER' as ChampionRole });
    return { a, b, c };
  }

  // ───────────────────────────────────────
  //  注册 Champion
  // ───────────────────────────────────────

  describe('registerChampion', () => {
    it('creates champion with auto-generated id and joinedAt', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole });
      assert.ok(c.id.startsWith('champion-'));
      assert.ok(c.joinedAt);
      assert.equal(c.name, 'Alice');
      assert.equal(c.role, 'CHAMPION');
      assert.equal(c.totalScore, 0);
      assert.deepEqual(c.contributions, []);
    });

    it('accepts explicit id and joinedAt', () => {
      const svc = makeService();
      const c = svc.registerChampion({
        id: 'champ-001',
        name: 'Bob',
        role: 'APPROVER' as ChampionRole,
        joinedAt: '2025-01-01T00:00:00.000Z',
      });
      assert.equal(c.id, 'champ-001');
      assert.equal(c.joinedAt, '2025-01-01T00:00:00.000Z');
    });
  });

  // ───────────────────────────────────────
  //  查询 Champion
  // ───────────────────────────────────────

  describe('getChampion', () => {
    it('returns undefined for unknown id', () => {
      const svc = makeService();
      assert.equal(svc.getChampion('nonexistent'), undefined);
    });

    it('returns champion by id after registration', () => {
      const svc = makeService();
      const created = svc.registerChampion({ name: 'Dave', role: 'CHAMPION' as ChampionRole });
      const found = svc.getChampion(created.id);
      assert.notEqual(found, undefined);
      assert.equal(found!.id, created.id);
    });
  });

  describe('listChampions', () => {
    it('returns all champions without role filter', () => {
      const svc = makeService();
      seedSimple(svc);
      assert.equal(svc.listChampions().length, 3);
    });

    it('filters by role', () => {
      const svc = makeService();
      seedSimple(svc);
      assert.equal(svc.listChampions('CHAMPION' as ChampionRole).length, 1);
      assert.equal(svc.listChampions('APPROVER' as ChampionRole).length, 1);
      assert.equal(svc.listChampions('OBSERVER' as ChampionRole).length, 1);
      assert.equal(svc.listChampions('APPROVER' as ChampionRole)[0]!.name, 'Bob');
    });

    it('returns empty array when no champions match role', () => {
      const svc = makeService();
      seedSimple(svc);
      assert.deepEqual(svc.listChampions('APPROVER' as ChampionRole).filter(c => c.role !== 'APPROVER'), []);
    });
  });

  // ───────────────────────────────────────
  //  记录贡献
  // ───────────────────────────────────────

  describe('recordContribution', () => {
    it('records a contribution and updates totalScore', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole });
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'abc123',
        description: 'fix login bug',
      });
      const updated = svc.getChampion(c.id);
      assert.equal(updated!.contributions.length, 1);
      assert.equal(updated!.totalScore, 2);
      assert.equal(updated!.contributions[0]!.weight, 2);
    });

    it('throws when championId does not exist', () => {
      const svc = makeService();
      assert.throws(
        () =>
          svc.recordContribution({
            championId: 'nonexistent',
            kind: ContributionKind.Commit,
            refId: 'x1',
          }),
        /not found/i,
      );
    });

    it('accumulates multiple contributions correctly', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr-001' });
      assert.equal(svc.getChampion(c.id)!.totalScore, 2 + 3 + 8);
    });

    it('each contribution kind has correct weight', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'KindTest', role: 'CHAMPION' as ChampionRole });
      const weights: [ContributionKind, number][] = [
        [ContributionKind.Commit, 2],
        [ContributionKind.Review, 3],
        [ContributionKind.Rfc, 8],
        [ContributionKind.PulseReview, 4],
        [ContributionKind.Retro, 6],
      ];
      for (const [kind, expected] of weights) {
        const c2 = svc.registerChampion({ name: `T-${kind}`, role: 'CHAMPION' as ChampionRole });
        svc.recordContribution({ championId: c2.id, kind, refId: `ref-${kind}` });
        assert.equal(svc.getChampion(c2.id)!.totalScore, expected, `weight for ${kind} should be ${expected}`);
      }
    });

    it('accepts optional occurredAt', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'TimeTest', role: 'CHAMPION' as ChampionRole });
      const occ = '2026-01-15T10:00:00.000Z';
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'r-time',
        occurredAt: occ,
      });
      assert.equal(svc.getChampion(c.id)!.contributions[0]!.occurredAt, occ);
    });
  });

  // ───────────────────────────────────────
  //  排行榜
  // ───────────────────────────────────────

  describe('getRanking', () => {
    it('returns empty array when no champions', () => {
      const svc = makeService();
      assert.deepEqual(svc.getRanking(), []);
    });

    it('returns entries sorted by totalScore descending with rank', () => {
      const svc = makeService();
      const low = svc.registerChampion({ name: 'Low', role: 'CHAMPION' as ChampionRole });
      const high = svc.registerChampion({ name: 'High', role: 'APPROVER' as ChampionRole });
      svc.recordContribution({ championId: low.id, kind: ContributionKind.Commit, refId: 'c1' });
      svc.recordContribution({ championId: high.id, kind: ContributionKind.Commit, refId: 'c1' });
      svc.recordContribution({ championId: high.id, kind: ContributionKind.Rfc, refId: 'dr-1' });
      const ranking = svc.getRanking();
      assert.equal(ranking.length, 2);
      assert.equal(ranking[0]!.name, 'High');
      assert.equal(ranking[0]!.rank, 1);
      assert.equal(ranking[1]!.name, 'Low');
      assert.equal(ranking[1]!.rank, 2);
    });

    it('counts contributions by kind correctly', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'Counter', role: 'CHAMPION' as ChampionRole });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c2' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr-1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.PulseReview, refId: 'p1' });
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Retro, refId: 'rt1' });
      const entry = svc.getRanking()[0]!;
      assert.equal(entry.commits, 2);
      assert.equal(entry.reviews, 1);
      assert.equal(entry.rfcs, 1);
      assert.equal(entry.pulseReviews, 1);
      assert.equal(entry.retros, 1);
      assert.equal(entry.totalScore, 2 * 2 + 3 + 8 + 4 + 6);
    });
  });

  // ───────────────────────────────────────
  //  决策时间线
  // ───────────────────────────────────────

  describe('getDecisionTimeline', () => {
    it('returns empty array when no contributions', () => {
      const svc = makeService();
      assert.deepEqual(svc.getDecisionTimeline(), []);
    });

    it('returns all timeline entries sorted by date desc', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'Timeline', role: 'CHAMPION' as ChampionRole });
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'c1',
        occurredAt: '2026-01-02T00:00:00.000Z',
      });
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'r1',
        occurredAt: '2026-01-03T00:00:00.000Z',
      });
      const tl = svc.getDecisionTimeline();
      assert.equal(tl.length, 2);
      assert.equal(tl[0]!.refId, 'r1');
      assert.equal(tl[1]!.refId, 'c1');
    });

    it('filters by championId', () => {
      const svc = makeService();
      const { a, b } = seedSimple(svc);
      svc.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'a1' });
      svc.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'b1' });
      const tl = svc.getDecisionTimeline({ championId: a.id });
      assert.equal(tl.length, 1);
      assert.equal(tl[0]!.refId, 'a1');
    });

    it('filters by sinceDate', () => {
      const svc = makeService();
      const c = svc.registerChampion({ name: 'SinceTest', role: 'CHAMPION' as ChampionRole });
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'old',
        occurredAt: '2025-12-01T00:00:00.000Z',
      });
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'new',
        occurredAt: '2026-01-15T00:00:00.000Z',
      });
      const tl = svc.getDecisionTimeline({ sinceDate: '2026-01-01T00:00:00.000Z' });
      assert.equal(tl.length, 1);
      assert.equal(tl[0]!.refId, 'new');
    });
  });

  // ───────────────────────────────────────
  //  Knowledge Map
  // ───────────────────────────────────────

  describe('getKnowledgeMap', () => {
    it('returns zeroes when no champions', () => {
      const svc = makeService();
      const km = svc.getKnowledgeMap();
      assert.equal(km.totalChampions, 0);
      assert.equal(km.totalContributions, 0);
      assert.equal(km.totalScore, 0);
    });

    it('aggregates byKind and byRole correctly', () => {
      const svc = makeService();
      const a = svc.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole });
      const b = svc.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole });
      svc.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c1' });
      svc.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c2' });
      svc.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'dr-1' });
      svc.recordContribution({ championId: b.id, kind: ContributionKind.Review, refId: 'r1' });
      const km = svc.getKnowledgeMap();
      assert.equal(km.totalChampions, 2);
      assert.equal(km.totalContributions, 4);
      assert.equal(km.totalScore, 2 + 2 + 8 + 3);
      assert.equal(km.byKind.COMMIT, 2);
      assert.equal(km.byKind.RFC, 1);
      assert.equal(km.byKind.REVIEW, 1);
      assert.equal(km.byRole.CHAMPION, 1);
      assert.equal(km.byRole.APPROVER, 1);
      assert.equal(km.byRole.OBSERVER, 0);
    });
  });

  // ───────────────────────────────────────
  //  resetForTests
  // ───────────────────────────────────────

  describe('resetForTests', () => {
    it('clears all champions', () => {
      const svc = makeService();
      seedSimple(svc);
      assert.equal(svc.listChampions().length, 3);
      svc.resetForTests();
      assert.equal(svc.listChampions().length, 0);
    });
  });

  // ───────────────────────────────────────
  //  角色权限边界测试
  // ───────────────────────────────────────

  describe('role boundary', () => {
    it('each role can have contributions recorded', () => {
      const svc = makeService();
      for (const role of ['CHAMPION', 'APPROVER', 'OBSERVER'] as ChampionRole[]) {
        const c = svc.registerChampion({ name: `Role-${role}`, role });
        svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: `ref-${role}` });
        assert.equal(svc.getChampion(c.id)!.totalScore, 2);
      }
    });

    it('hundreds of champions do not crash', () => {
      const svc = makeService();
      for (let i = 0; i < 200; i++) {
        const c = svc.registerChampion({ name: `User-${i}`, role: 'CHAMPION' as ChampionRole });
        svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: `c-${i}` });
      }
      const ranking = svc.getRanking();
      assert.equal(ranking.length, 200);
      assert.equal(ranking[0]!.rank, 1);
    });
  });
});
