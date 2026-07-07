import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * champion.simulator.test.ts - Champion 模块模拟器测试
 *
 * 模拟真实 Champion 工作流场景：
 * - 多角色 Champion 注册 + 贡献录入 + 排行榜
 * - 决策时间线构建
 * - Knowledge Map 聚合
 * - 边界场景：空数据、大数量、重复贡献
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ChampionService } from './champion.service';
import { ContributionKind, type ChampionRole } from './champion.entity';

describe('Champion - Simulator', () => {
  let service: ChampionService;

  beforeEach(() => {
    service = new ChampionService();
    service.resetForTests();
  });

  // ─── 模拟器清单 ───

  describe('模拟数据集市', () => {
    it('应注册至少 3 个不同角色 Champion', () => {
      service.registerChampion({ name: '店主甲', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: '审批人乙', role: 'APPROVER' as ChampionRole });
      service.registerChampion({ name: '观察员丙', role: 'OBSERVER' as ChampionRole });
      const all = service.listChampions();
      assert.equal(all.length, 3);
      const roles = all.map(c => c.role).sort();
      assert.deepEqual(roles, ['APPROVER', 'CHAMPION', 'OBSERVER']);
    });

    it('应按角色过滤 Champion', () => {
      service.registerChampion({ name: '王五', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: '赵六', role: 'CHAMPION' as ChampionRole });
      service.registerChampion({ name: '钱七', role: 'APPROVER' as ChampionRole });
      assert.equal(service.listChampions('CHAMPION' as ChampionRole).length, 2);
      assert.equal(service.listChampions('APPROVER' as ChampionRole).length, 1);
      assert.equal(service.listChampions('OBSERVER' as ChampionRole).length, 0);
    });

    it('getChampion 应返回 undefined（不存在时）', () => {
      assert.equal(service.getChampion('non-existent'), undefined);
    });
  });

  // ─── 模拟贡献录入 ───

  describe('模拟贡献录入', () => {
    const kinds: ContributionKind[] = [ContributionKind.Commit, ContributionKind.Review, ContributionKind.Rfc, ContributionKind.PulseReview, ContributionKind.Retro];

    it('应支持所有贡献类型', () => {
      const c = service.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole });
      for (const kind of kinds) {
        service.recordContribution({ championId: c.id, kind, refId: `ref-${kind}` });
      }
      const profile = service.getChampion(c.id)!;
      assert.equal(profile.contributions.length, 5);
      const expectedWeights = { COMMIT: 2, REVIEW: 3, RFC: 8, PULSE_REVIEW: 4, RETRO: 6 };
      assert.equal(profile.totalScore, Object.values(expectedWeights).reduce((a, b) => a + b, 0));
    });

    it('连续录入同一 champion 累加总分', () => {
      const c = service.registerChampion({ name: 'Bob', role: 'CHAMPION' as ChampionRole });
      for (let i = 0; i < 5; i++) {
        service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: `commit-${i}` });
      }
      const profile = service.getChampion(c.id)!;
      assert.equal(profile.totalScore, 5 * 2); // each COMMIT = 2 pts
      assert.equal(profile.contributions.length, 5);
    });

    it('不存在的 championId 应抛错', () => {
      assert.throws(() => {
        service.recordContribution({ championId: 'ghost', kind: ContributionKind.Commit, refId: 'r1' });
      }, /Champion not found/);
    });
  });

  // ─── 模拟排行榜 ───

  describe('模拟排行榜', () => {
    it('多个 champion 按总分严格降序', () => {
      const c1 = service.registerChampion({ name: '高分甲', role: 'CHAMPION' as ChampionRole });
      const c2 = service.registerChampion({ name: '中分乙', role: 'APPROVER' as ChampionRole });
      const c3 = service.registerChampion({ name: '低分丙', role: 'OBSERVER' as ChampionRole });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Rfc, refId: 'rfc-1' }); // 8
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Retro, refId: 'retro-1' }); // +6 = 14
      service.recordContribution({ championId: c2.id, kind: ContributionKind.Review, refId: 'review-1' }); // 3
      service.recordContribution({ championId: c2.id, kind: ContributionKind.Commit, refId: 'commit-1' }); // +2 = 5
      service.recordContribution({ championId: c3.id, kind: ContributionKind.Commit, refId: 'commit-2' }); // 2

      const ranking = service.getRanking();
      assert.equal(ranking.length, 3);
      assert.equal(ranking[0].championId, c1.id);
      assert.equal(ranking[0].totalScore, 14);
      assert.equal(ranking[1].championId, c2.id);
      assert.equal(ranking[1].totalScore, 5);
      assert.equal(ranking[2].championId, c3.id);
      assert.equal(ranking[2].totalScore, 2);
    });

    it('排行榜 rank 字段从 1 开始连续', () => {
      const c1 = service.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole });
      const c2 = service.registerChampion({ name: 'B', role: 'CHAMPION' as ChampionRole });
      const c3 = service.registerChampion({ name: 'C', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Rfc, refId: 'r1' });
      service.recordContribution({ championId: c2.id, kind: ContributionKind.Review, refId: 'r2' });
      const ranking = service.getRanking();
      assert.equal(ranking[0].rank, 1);
      assert.equal(ranking[1].rank, 2);
      assert.equal(ranking[2].rank, 3);
    });

    it('排行榜贡献计数正确', () => {
      const c = service.registerChampion({ name: '计数甲', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c2' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'rf1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.PulseReview, refId: 'p1' });
      service.recordContribution({ championId: c.id, kind: ContributionKind.Retro, refId: 'rt1' });

      const ranking = service.getRanking();
      const entry = ranking.find(e => e.championId === c.id)!;
      assert.equal(entry.commits, 2);
      assert.equal(entry.reviews, 1);
      assert.equal(entry.rfcs, 1);
      assert.equal(entry.pulseReviews, 1);
      assert.equal(entry.retros, 1);
      assert.equal(entry.totalScore, 2 + 2 + 3 + 8 + 4 + 6); // 25
    });
  });

  // ─── 模拟决策时间线 ───

  describe('模拟决策时间线', () => {
    it('空数据返回空数组', () => {
      assert.deepEqual(service.getDecisionTimeline(), []);
    });

    it('应按 occurredAt 倒序排列', () => {
      const c = service.registerChampion({ name: 'Timeline', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({
        championId: c.id, kind: ContributionKind.Commit, refId: 'oldest',
        occurredAt: '2026-01-01T00:00:00Z',
      });
      service.recordContribution({
        championId: c.id, kind: ContributionKind.Rfc, refId: 'newest',
        occurredAt: '2026-06-01T00:00:00Z',
      });
      service.recordContribution({
        championId: c.id, kind: ContributionKind.Review, refId: 'middle',
        occurredAt: '2026-03-01T00:00:00Z',
      });

      const tl = service.getDecisionTimeline();
      assert.equal(tl.length, 3);
      assert.equal(tl[0].refId, 'newest');
      assert.equal(tl[1].refId, 'middle');
      assert.equal(tl[2].refId, 'oldest');
    });

    it('可按 championId 过滤', () => {
      const c1 = service.registerChampion({ name: 'X', role: 'CHAMPION' as ChampionRole });
      const c2 = service.registerChampion({ name: 'Y', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Commit, refId: 'x1' });
      service.recordContribution({ championId: c2.id, kind: ContributionKind.Rfc, refId: 'y1' });
      const tl = service.getDecisionTimeline({ championId: c1.id });
      assert.equal(tl.length, 1);
      assert.equal(tl[0].championId, c1.id);
    });

    it('可按 sinceDate 过滤', () => {
      const c = service.registerChampion({ name: 'DateFilter', role: 'CHAMPION' as ChampionRole });
      service.recordContribution({
        championId: c.id, kind: ContributionKind.Commit, refId: 'old',
        occurredAt: '2026-01-01T00:00:00Z',
      });
      service.recordContribution({
        championId: c.id, kind: ContributionKind.Rfc, refId: 'new',
        occurredAt: '2026-06-01T00:00:00Z',
      });
      const tl = service.getDecisionTimeline({ sinceDate: '2026-05-01T00:00:00Z' });
      assert.equal(tl.length, 1);
      assert.equal(tl[0].refId, 'new');
    });
  });

  // ─── 模拟 Knowledge Map ───

  describe('模拟 Knowledge Map', () => {
    it('空数据各项归零', () => {
      const km = service.getKnowledgeMap();
      assert.equal(km.totalChampions, 0);
      assert.equal(km.totalContributions, 0);
      assert.equal(km.totalScore, 0);
      assert.equal(km.byKind.COMMIT, 0);
      assert.equal(km.byRole.CHAMPION, 0);
    });

    it('聚合多个 Champion 的各类型贡献', () => {
      const c1 = service.registerChampion({ name: 'Alpha', role: 'CHAMPION' as ChampionRole });
      const c2 = service.registerChampion({ name: 'Beta', role: 'APPROVER' as ChampionRole });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Commit, refId: 'c1' });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Commit, refId: 'c2' });
      service.recordContribution({ championId: c1.id, kind: ContributionKind.Rfc, refId: 'rfc' });
      service.recordContribution({ championId: c2.id, kind: ContributionKind.Review, refId: 'r1' });
      service.recordContribution({ championId: c2.id, kind: ContributionKind.PulseReview, refId: 'p1' });

      const km = service.getKnowledgeMap();
      assert.equal(km.totalChampions, 2);
      assert.equal(km.totalContributions, 5);
      assert.equal(km.byKind.COMMIT, 2);
      assert.equal(km.byKind.RFC, 1);
      assert.equal(km.byKind.REVIEW, 1);
      assert.equal(km.byKind.PULSE_REVIEW, 1);
      assert.equal(km.byKind.RETRO, 0);
      assert.equal(km.byRole.CHAMPION, 1);
      assert.equal(km.byRole.APPROVER, 1);
      assert.equal(km.byRole.OBSERVER, 0);
      // Weighted: 2*COMMIT(2) + 1*RFC(8) + 1*REVIEW(3) + 1*PULSE_REVIEW(4) = 4+8+3+4=19
      assert.equal(km.totalScore, 19);
    });

    it('大量贡献不影响聚合正确性', () => {
      const c = service.registerChampion({ name: 'BigData', role: 'CHAMPION' as ChampionRole });
      for (let i = 0; i < 50; i++) {
        service.recordContribution({
          championId: c.id,
          kind: i % 2 === 0 ? ContributionKind.Commit : ContributionKind.Review,
          refId: `ref-${i}`,
        });
      }
      const km = service.getKnowledgeMap();
      assert.equal(km.totalContributions, 50);
      assert.equal(km.totalChampions, 1);
      // 25 COMMIT (25*2=50) + 25 REVIEW (25*3=75) = 125
      assert.equal(km.totalScore, 50 + 75);
      assert.equal(km.byKind.COMMIT, 25);
      assert.equal(km.byKind.REVIEW, 25);
    });
  });

  // ─── 模拟全流程场景 ───

  describe('模拟全流程场景', () => {
    it('2 周冲刺评审全流程', () => {
      // Step 1: 注册团队
      const leader = service.registerChampion({ name: '技术主管', role: 'APPROVER' as ChampionRole });
      const dev1 = service.registerChampion({ name: '开发甲', role: 'CHAMPION' as ChampionRole });
      const dev2 = service.registerChampion({ name: '开发乙', role: 'CHAMPION' as ChampionRole });
      const observer = service.registerChampion({ name: '实习生', role: 'OBSERVER' as ChampionRole });

      // Step 2: 贡献录入（模拟 2 周冲刺）
      for (let i = 0; i < 8; i++) {
        service.recordContribution({ championId: dev1.id, kind: ContributionKind.Commit, refId: `dev1-commit-${i}` });
      }
      for (let i = 0; i < 5; i++) {
        service.recordContribution({ championId: dev2.id, kind: ContributionKind.Commit, refId: `dev2-commit-${i}` });
      }
      service.recordContribution({ championId: dev2.id, kind: ContributionKind.Rfc, refId: 'arch-decision-001' });
      service.recordContribution({ championId: leader.id, kind: ContributionKind.Review, refId: 'pr-review-01' });
      service.recordContribution({ championId: leader.id, kind: ContributionKind.Review, refId: 'pr-review-02' });
      service.recordContribution({ championId: observer.id, kind: ContributionKind.PulseReview, refId: 'pulse-obs-01' });

      // Step 3: 验证排行榜
      const ranking = service.getRanking();
      // dev1: 8*2=16 | dev2: 5*2+8=18 | leader: 2*3=6 | observer: 1*4=4
      assert.equal(ranking[0].championId, dev2.id);
      assert.equal(ranking[0].totalScore, 18);
      assert.equal(ranking[1].championId, dev1.id);
      assert.equal(ranking[1].totalScore, 16);
      assert.equal(ranking[3].championId, observer.id);
      assert.equal(ranking[3].totalScore, 4);

      // Step 4: 验证 Knowledge Map
      const km = service.getKnowledgeMap();
      assert.equal(km.totalChampions, 4);
      assert.equal(km.totalContributions, 8 + 5 + 1 + 2 + 1);
      assert.equal(km.byKind.COMMIT, 13);
      assert.equal(km.byKind.REVIEW, 2);
      assert.equal(km.byKind.RFC, 1);
      assert.equal(km.byKind.PULSE_REVIEW, 1);
      assert.equal(km.byRole.CHAMPION, 2);
      assert.equal(km.byRole.APPROVER, 1);
      assert.equal(km.byRole.OBSERVER, 1);
    });
  });
});
