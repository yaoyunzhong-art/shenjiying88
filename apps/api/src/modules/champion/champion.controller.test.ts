import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [champion] [D] controller spec 补全
 *
 * ChampionController 综合 spec：
 * - 正例：正常注册 / 贡献记录 / 排行榜 / 时间线 / 知识地图 / 查询
 * - 反例：不存在的 Champion / 无效角色 / 空数据
 * - 边界：极端权重累加 / 时间过滤 / 角色过滤 / 空集合
 *
 * 使用 vitest（与项目现有规范对齐）
 */

import { ChampionController } from './champion.controller';
import { ChampionService } from './champion.service';

/** 创建一个带全新 Service 的 Controller 实例 */
function makeController(): { ctrl: ChampionController; svc: ChampionService } {
  const svc = new ChampionService();
  svc.resetForTests();
  const ctrl = new ChampionController(svc);
  return { ctrl, svc };
}

// ── 测试数据工厂 ──────────────────────────────────────────────

/** 注册请求体 */
function registerBody(overrides: Record<string, unknown> = {}) {
  return { name: 'Alice', role: 'CHAMPION', ...overrides };
}

/** 贡献记录请求体 */
function contributionBody(championId: string, overrides: Record<string, unknown> = {}) {
  return { championId, kind: 'COMMIT', refId: `ref-${Date.now()}`, ...overrides };
}

// ── 测试套件 ──────────────────────────────────────────────────

describe('ChampionController', () => {
  // ===== POST /champions =====

  describe('POST /champions — 注册 Champion', () => {
    it('正常注册返回完整档案', () => {
      const { ctrl } = makeController();
      const result = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Alice');
      expect(result.role).toBe('CHAMPION');
      expect(result.joinedAt).toBeTruthy();
      expect(result.contributions).toHaveLength(0);
      expect(result.totalScore).toBe(0);
    });

    it('支持所有角色注册', () => {
      const { ctrl } = makeController();
      const roles = ['CHAMPION', 'APPROVER', 'OBSERVER'] as const;
      for (const role of roles) {
        const r = ctrl.registerChampion(registerBody({ name: `User-${role}`, role }) as any);
        expect(r.role).toBe(role);
      }
    });

    it('携带 joinedAt 参数', () => {
      const { ctrl } = makeController();
      const joinedAt = '2026-03-15T08:00:00.000Z';
      const r = ctrl.registerChampion(registerBody({ name: 'Bob', role: 'CHAMPION', joinedAt }) as any);
      expect(new Date(r.joinedAt).toISOString()).toBe(joinedAt);
    });

    it('未传 joinedAt 自动生成', () => {
      const { ctrl } = makeController();
      const r = ctrl.registerChampion(registerBody({ name: 'Carol', role: 'OBSERVER' }) as any);
      expect(r.joinedAt).toBeTruthy();
      expect(() => new Date(r.joinedAt)).not.toThrow();
    });

    it('注册后 id 唯一不重复', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'A', role: 'CHAMPION' }) as any);
      const b = ctrl.registerChampion(registerBody({ name: 'B', role: 'CHAMPION' }) as any);
      expect(a.id).not.toBe(b.id);
    });
  });

  // ===== POST /champions/contribution =====

  describe('POST /champions/contribution — 记录贡献', () => {
    it('记录贡献后分数正确累加', () => {
      const { ctrl } = makeController();
      const champ = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);

      ctrl.recordContribution(contributionBody(champ.id, { kind: 'COMMIT', refId: 'c1' }) as any);
      const result = ctrl.recordContribution(contributionBody(champ.id, { kind: 'RFC', refId: 'DR-001' }) as any);

      expect(result.contributions).toHaveLength(2);
      expect(result.totalScore).toBe(2 + 8); // COMMIT=2, RFC=8
    });

    it('所有贡献类型的权重正确', () => {
      const { ctrl } = makeController();
      const champ = ctrl.registerChampion(registerBody({ name: 'Bob', role: 'CHAMPION' }) as any);

      const weights: Record<string, number> = {
        COMMIT: 2, REVIEW: 3, RFC: 8,
        PULSE_REVIEW: 4, RETRO: 6,
      };

      let total = 0;
      for (const [kind, weight] of Object.entries(weights)) {
        ctrl.recordContribution(contributionBody(champ.id, { kind, refId: `ref-${kind}` }) as any);
        total += weight;
      }

      const refreshed = ctrl.getChampion(champ.id);
      expect(refreshed.totalScore).toBe(total);
    });

    it('不存在的 championId 抛出错误', () => {
      const { ctrl } = makeController();
      expect(() =>
        ctrl.recordContribution(contributionBody('nonexistent') as any),
      ).toThrow(/Champion not found/i);
    });

    it('传入 description 正确保留', () => {
      const { ctrl } = makeController();
      const champ = ctrl.registerChampion(registerBody({ name: 'Carol', role: 'CHAMPION' }) as any);

      const result = ctrl.recordContribution({
        championId: champ.id, kind: 'REVIEW', refId: 'r1',
        description: 'Reviewed PR #42',
      } as any);

      expect(result.contributions[0].description).toBe('Reviewed PR #42');
    });

    it('未传 occurredAt 自动填充', () => {
      const { ctrl } = makeController();
      const champ = ctrl.registerChampion(registerBody({ name: 'Dave', role: 'CHAMPION' }) as any);

      const result = ctrl.recordContribution(contributionBody(champ.id) as any);
      expect(result.contributions[0].occurredAt).toBeTruthy();
    });
  });

  // ===== GET /champions =====

  describe('GET /champions — 列表查询', () => {
    it('列出所有 Champion', () => {
      const { ctrl } = makeController();
      ctrl.registerChampion(registerBody({ name: 'A', role: 'CHAMPION' }) as any);
      ctrl.registerChampion(registerBody({ name: 'B', role: 'APPROVER' }) as any);

      expect(ctrl.listChampions(undefined)).toHaveLength(2);
    });

    it('按角色过滤', () => {
      const { ctrl } = makeController();
      ctrl.registerChampion(registerBody({ name: 'A', role: 'CHAMPION' }) as any);
      ctrl.registerChampion(registerBody({ name: 'B', role: 'CHAMPION' }) as any);
      ctrl.registerChampion(registerBody({ name: 'C', role: 'APPROVER' }) as any);
      ctrl.registerChampion(registerBody({ name: 'D', role: 'OBSERVER' }) as any);

      expect(ctrl.listChampions('CHAMPION' as any)).toHaveLength(2);
      expect(ctrl.listChampions('APPROVER' as any)).toHaveLength(1);
      expect(ctrl.listChampions('OBSERVER' as any)).toHaveLength(1);
    });

    it('角色过滤无匹配返回空数组', () => {
      const { ctrl } = makeController();
      expect(ctrl.listChampions('APPROVER' as any)).toHaveLength(0);
    });

    it('未注册时返回空数组', () => {
      const { ctrl } = makeController();
      expect(ctrl.listChampions(undefined)).toHaveLength(0);
    });
  });

  // ===== GET /champions/ranking =====

  describe('GET /champions/ranking — 排行榜', () => {
    it('排行榜按总分降序排列', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      const b = ctrl.registerChampion(registerBody({ name: 'Bob', role: 'CHAMPION' }) as any);

      // Alice: 1 RFC = 8pts, Bob: 2 REVIEW + 1 COMMIT = 3+3+2 = 8pts
      ctrl.recordContribution(contributionBody(a.id, { kind: 'RFC', refId: 'dr1' }) as any);
      ctrl.recordContribution(contributionBody(b.id, { kind: 'REVIEW', refId: 'r1' }) as any);
      ctrl.recordContribution(contributionBody(b.id, { kind: 'REVIEW', refId: 'r2' }) as any);
      ctrl.recordContribution(contributionBody(b.id, { kind: 'COMMIT', refId: 'c1' }) as any);

      const ranking = ctrl.getRanking({} as any);
      expect(ranking).toHaveLength(2);
      // 平局时 preserve 注册顺序；Alice rank=1
      expect(ranking[0].name).toBe('Alice');
      expect(ranking[0].rank).toBe(1);
      expect(ranking[1].name).toBe('Bob');
      expect(ranking[1].rank).toBe(2);
    });

    it('排行榜各贡献类型计数正确', () => {
      const { ctrl } = makeController();
      const champ = ctrl.registerChampion(registerBody({ name: 'Multi', role: 'CHAMPION' }) as any);

      ctrl.recordContribution(contributionBody(champ.id, { kind: 'COMMIT', refId: 'c1' }) as any);
      ctrl.recordContribution(contributionBody(champ.id, { kind: 'COMMIT', refId: 'c2' }) as any);
      ctrl.recordContribution(contributionBody(champ.id, { kind: 'REVIEW', refId: 'r1' }) as any);
      ctrl.recordContribution(contributionBody(champ.id, { kind: 'RFC', refId: 'dr1' }) as any);
      ctrl.recordContribution(contributionBody(champ.id, { kind: 'PULSE_REVIEW', refId: 'pr1' }) as any);
      ctrl.recordContribution(contributionBody(champ.id, { kind: 'RETRO', refId: 'rt1' }) as any);

      const ranking = ctrl.getRanking({} as any);
      expect(ranking[0].commits).toBe(2);
      expect(ranking[0].reviews).toBe(1);
      expect(ranking[0].rfcs).toBe(1);
      expect(ranking[0].pulseReviews).toBe(1);
      expect(ranking[0].retros).toBe(1);
      expect(ranking[0].totalScore).toBe(2 + 2 + 3 + 8 + 4 + 6); // = 25
    });

    it('空数据排行榜', () => {
      const { ctrl } = makeController();
      expect(ctrl.getRanking({} as any)).toHaveLength(0);
    });
  });

  // ===== GET /champions/timeline =====

  describe('GET /champions/timeline — 决策时间线', () => {
    it('默认返回全部时间线', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'APPROVER' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'RFC', refId: 'dr1', occurredAt: '2026-06-10T00:00:00.000Z' }) as any);

      const timeline = ctrl.getDecisionTimeline({} as any);
      expect(timeline).toHaveLength(1);
      expect(timeline[0].refId).toBe('dr1');
      expect(timeline[0].action).toBe('RFC (8pts)');
      expect(timeline[0].name).toBe('Alice');
    });

    it('按 sinceDate 过滤', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'COMMIT', refId: 'old', occurredAt: '2026-01-10T00:00:00.000Z' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'RFC', refId: 'new', occurredAt: '2026-06-10T00:00:00.000Z' }) as any);

      const filtered = ctrl.getDecisionTimeline({ sinceDate: '2026-02-01T00:00:00.000Z' } as any);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].refId).toBe('new');
    });

    it('按 championId 过滤', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      const b = ctrl.registerChampion(registerBody({ name: 'Bob', role: 'CHAMPION' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'COMMIT', refId: 'c1' }) as any);
      ctrl.recordContribution(contributionBody(b.id, { kind: 'RFC', refId: 'dr1' }) as any);

      const filtered = ctrl.getDecisionTimeline({ championId: a.id } as any);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].refId).toBe('c1');
    });

    it('同时按 championId + sinceDate 过滤', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'COMMIT', refId: 'c1', occurredAt: '2026-01-10T00:00:00.000Z' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'RFC', refId: 'dr1', occurredAt: '2026-06-10T00:00:00.000Z' }) as any);

      const filtered = ctrl.getDecisionTimeline({ championId: a.id, sinceDate: '2026-02-01T00:00:00.000Z' } as any);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].refId).toBe('dr1');
    });

    it('空数据时间线', () => {
      const { ctrl } = makeController();
      expect(ctrl.getDecisionTimeline({} as any)).toHaveLength(0);
    });
  });

  // ===== GET /champions/knowledge-map =====

  describe('GET /champions/knowledge-map — 知识地图', () => {
    it('聚合统计所有 Champion 和贡献', () => {
      const { ctrl } = makeController();
      const a = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      const b = ctrl.registerChampion(registerBody({ name: 'Bob', role: 'APPROVER' }) as any);

      ctrl.recordContribution(contributionBody(a.id, { kind: 'COMMIT', refId: 'c1' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'COMMIT', refId: 'c2' }) as any);
      ctrl.recordContribution(contributionBody(a.id, { kind: 'RFC', refId: 'dr1' }) as any);
      ctrl.recordContribution(contributionBody(b.id, { kind: 'REVIEW', refId: 'r1' }) as any);

      const map = ctrl.getKnowledgeMap();
      expect(map.totalChampions).toBe(2);
      expect(map.totalContributions).toBe(4);
      expect(map.totalScore).toBe(2 + 2 + 8 + 3);
      expect(map.byKind.COMMIT).toBe(2);
      expect(map.byKind.RFC).toBe(1);
      expect(map.byKind.REVIEW).toBe(1);
      expect(map.byRole.CHAMPION).toBe(1);
      expect(map.byRole.APPROVER).toBe(1);
    });

    it('空数据知识地图全零', () => {
      const { ctrl } = makeController();
      const map = ctrl.getKnowledgeMap();
      expect(map.totalChampions).toBe(0);
      expect(map.totalContributions).toBe(0);
      expect(map.totalScore).toBe(0);
      expect(Object.values(map.byKind).every((v) => v === 0)).toBe(true);
      expect(Object.values(map.byRole).every((v) => v === 0)).toBe(true);
    });
  });

  // ===== GET /champions/:id =====

  describe('GET /champions/:id — 按 ID 查询', () => {
    it('存在的 ID 返回完整档案', () => {
      const { ctrl } = makeController();
      const created = ctrl.registerChampion(registerBody({ name: 'Alice', role: 'CHAMPION' }) as any);
      const found = ctrl.getChampion(created.id);

      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Alice');
      expect(found.role).toBe('CHAMPION');
      expect(found).toHaveProperty('joinedAt');
      expect(found).toHaveProperty('contributions');
      expect(found).toHaveProperty('totalScore');
    });

    it('不存在的 ID 抛出 404', () => {
      const { ctrl } = makeController();
      expect(() => ctrl.getChampion('nonexistent-id')).toThrow(/Champion not found/i);
    });

    it('空字符串 ID', () => {
      const { ctrl } = makeController();
      expect(() => ctrl.getChampion('')).toThrow(/Champion not found/i);
    });
  });
});
