import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [champion] [D] controller 测试补全
 *
 * ChampionController 综合测试：
 * - 正例：正常注册、贡献记录、排行榜查询
 * - 反例：不存在的 Champion、参数缺失
 * - 边界：空数据、多种角色
 */

import { ChampionController } from './champion.controller';
import { ChampionService } from './champion.service';

function makeController(): { ctrl: ChampionController; svc: ChampionService } {
  const svc = new ChampionService();
  svc.resetForTests();
  const ctrl = new ChampionController(svc);
  return { ctrl, svc };
}

function sampleRegisterBody(overrides: Record<string, unknown> = {}) {
  return { name: 'Alice', role: 'CHAMPION', ...overrides } as any;
}

function sampleContributionBody(overrides: Record<string, unknown> = {}) {
  return { championId: 'test-champ-1', kind: 'COMMIT', refId: 'abc123', ...overrides } as any;
}

describe('ChampionController', () => {
  // ── POST /champions ──

  it('registerChampion — 正常流程', () => {
    const { ctrl } = makeController();
    const result = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));

    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Alice');
    expect(result.role).toBe('CHAMPION');
    expect(result).toHaveProperty('joinedAt');
    expect(result.contributions).toHaveLength(0);
    expect(result.totalScore).toBe(0);
  });

  it('registerChampion — 不同角色注册', () => {
    const { ctrl } = makeController();
    expect(ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'APPROVER' })).role).toBe('APPROVER');
    expect(ctrl.registerChampion(sampleRegisterBody({ name: 'Carol', role: 'OBSERVER' })).role).toBe('OBSERVER');
  });

  it('registerChampion — 携带 joinedAt', () => {
    const { ctrl } = makeController();
    const result = ctrl.registerChampion(
      sampleRegisterBody({ name: 'Dave', role: 'CHAMPION', joinedAt: '2026-01-15T00:00:00.000Z' }),
    );
    expect(result.joinedAt).toBeTruthy();
  });

  // ── POST /champions/contribution ──

  it('recordContribution — 正常记录', () => {
    const { ctrl, svc } = makeController();
    const champion = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));

    const result = ctrl.recordContribution({
      championId: champion.id, kind: 'COMMIT', refId: 'abc123', description: 'Initial setup',
    } as any);

    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0].kind).toBe('COMMIT');
    expect(result.contributions[0].weight).toBe(2);
    expect(result.totalScore).toBe(2);
  });

  it('recordContribution — 多种贡献类型累加', () => {
    const { ctrl } = makeController();
    const champion = ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'CHAMPION' }));

    ctrl.recordContribution({ championId: champion.id, kind: 'COMMIT', refId: 'c1' } as any);
    ctrl.recordContribution({ championId: champion.id, kind: 'REVIEW', refId: 'r1' } as any);
    ctrl.recordContribution({ championId: champion.id, kind: 'RFC', refId: 'DR-001' } as any);

    const refreshed = ctrl.getChampion(champion.id);
    expect(refreshed.contributions).toHaveLength(3);
    expect(refreshed.totalScore).toBe(2 + 3 + 8);
  });

  it('recordContribution — 不存在的 Champion 抛出错误', () => {
    const { ctrl } = makeController();
    expect(() => ctrl.recordContribution(sampleContributionBody({ championId: 'nonexistent' }))).toThrow(/Champion not found/);
  });

  // ── GET /champions ──

  it('listChampions — 列出所有 Champion', () => {
    const { ctrl } = makeController();
    ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'APPROVER' }));
    ctrl.registerChampion(sampleRegisterBody({ name: 'Carol', role: 'OBSERVER' }));

    expect(ctrl.listChampions(undefined)).toHaveLength(3);
  });

  it('listChampions — 按角色过滤', () => {
    const { ctrl } = makeController();
    ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'CHAMPION' }));
    ctrl.registerChampion(sampleRegisterBody({ name: 'Carol', role: 'APPROVER' }));

    expect(ctrl.listChampions('CHAMPION' as any)).toHaveLength(2);
    expect(ctrl.listChampions('APPROVER' as any)).toHaveLength(1);
  });

  it('listChampions — 空数据返回空数组', () => {
    const { ctrl } = makeController();
    expect(ctrl.listChampions(undefined)).toHaveLength(0);
  });

  // ── GET /champions/ranking ──

  it('getRanking — 排行榜按总分排序', () => {
    const { ctrl } = makeController();
    const alice = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    const bob = ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'CHAMPION' }));

    // Alice: RFC = 8pts, Bob: 3 COMMITs = 6pts
    ctrl.recordContribution({ championId: alice.id, kind: 'RFC', refId: 'DR-1' } as any);
    ctrl.recordContribution({ championId: bob.id, kind: 'COMMIT', refId: 'c1' } as any);
    ctrl.recordContribution({ championId: bob.id, kind: 'COMMIT', refId: 'c2' } as any);
    ctrl.recordContribution({ championId: bob.id, kind: 'COMMIT', refId: 'c3' } as any);

    const ranking = ctrl.getRanking({} as any);
    // Alice 有 RFC(8pts) > Bob 3 COMMITs(6pts)
    expect(ranking[0].name).toBe('Alice');
    expect(ranking[0].totalScore).toBe(8);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].name).toBe('Bob');
    expect(ranking[1].totalScore).toBe(6);
    expect(ranking[1].rank).toBe(2);
  });

  it('getRanking — 空数据', () => {
    const { ctrl } = makeController();
    expect(ctrl.getRanking({} as any)).toHaveLength(0);
  });

  // ── GET /champions/timeline ──

  it('getDecisionTimeline — 默认返回全部', () => {
    const { ctrl } = makeController();
    const alice = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'APPROVER' }));
    ctrl.recordContribution({ championId: alice.id, kind: 'COMMIT', refId: 'c1', occurredAt: '2026-06-10T00:00:00.000Z' } as any);

    const timeline = ctrl.getDecisionTimeline({} as any);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].refId).toBe('c1');
  });

  it('getDecisionTimeline — 按 sinceDate 过滤', () => {
    const { ctrl } = makeController();
    const alice = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    ctrl.recordContribution({ championId: alice.id, kind: 'COMMIT', refId: 'old', occurredAt: '2026-01-10T00:00:00.000Z' } as any);
    ctrl.recordContribution({ championId: alice.id, kind: 'RFC', refId: 'new', occurredAt: '2026-06-10T00:00:00.000Z' } as any);

    const filtered = ctrl.getDecisionTimeline({ sinceDate: '2026-02-01T00:00:00.000Z' } as any);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].refId).toBe('new');
  });

  // ── GET /champions/knowledge-map ──

  it('getKnowledgeMap — 聚合统计', () => {
    const { ctrl } = makeController();
    const a = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    const b = ctrl.registerChampion(sampleRegisterBody({ name: 'Bob', role: 'APPROVER' }));
    ctrl.recordContribution({ championId: a.id, kind: 'COMMIT', refId: 'c1' } as any);
    ctrl.recordContribution({ championId: a.id, kind: 'COMMIT', refId: 'c2' } as any);
    ctrl.recordContribution({ championId: a.id, kind: 'RFC', refId: 'DR-1' } as any);
    ctrl.recordContribution({ championId: b.id, kind: 'REVIEW', refId: 'r1' } as any);

    const map = ctrl.getKnowledgeMap();
    expect(map.totalChampions).toBe(2);
    expect(map.totalContributions).toBe(4);
    expect(map.totalScore).toBe(2 + 2 + 8 + 3);
    expect(map.byKind.COMMIT).toBe(2);
    expect(map.byRole.CHAMPION).toBe(1);
    expect(map.byRole.APPROVER).toBe(1);
  });

  // ── GET /champions/:id ──

  it('getChampion — 存在的 Champion 正常返回', () => {
    const { ctrl } = makeController();
    const created = ctrl.registerChampion(sampleRegisterBody({ name: 'Alice', role: 'CHAMPION' }));
    const found = ctrl.getChampion(created.id);
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Alice');
    expect(found.role).toBe('CHAMPION');
  });

  it('getChampion — 不存在的 Champion 抛出 404', () => {
    const { ctrl } = makeController();
    expect(() => ctrl.getChampion('nonexistent-id')).toThrow(/Champion not found/);
  });
});
