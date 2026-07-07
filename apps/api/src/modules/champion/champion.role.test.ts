import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [champion] 角色测试增强 (8角色全覆盖)
 *
 * 8 角色视角的 champion 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/特殊场景）
 */

import { ChampionController } from './champion.controller';
import { ChampionService } from './champion.service';
import { ContributionKind } from './champion.entity';

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
};

function makeController(): { ctrl: ChampionController; svc: ChampionService } {
  const svc = new ChampionService();
  svc.resetForTests();
  const ctrl = new ChampionController(svc);
  return { ctrl, svc };
}

function createChampions(svc: ChampionService): string[] {
  const ids: string[] = [];
  const a = svc.registerChampion({ name: '店长小明', role: 'APPROVER' });
  ids.push(a.id);
  const b = svc.registerChampion({ name: '导玩员小李', role: 'CHAMPION' });
  ids.push(b.id);
  svc.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'c1' });
  svc.recordContribution({ championId: b.id, kind: ContributionKind.Rfc, refId: 'DR-001' });
  const c = svc.registerChampion({ name: '观察员小王', role: 'OBSERVER' });
  ids.push(c.id);
  svc.recordContribution({ championId: a.id, kind: ContributionKind.Review, refId: 'r1' });
  svc.recordContribution({ championId: a.id, kind: ContributionKind.Review, refId: 'r2' });
  svc.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'DR-005' });
  return ids;
}

// ══════════════════════════════════════════════
// 👔 店长
// ══════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} champion 角色测试`, () => {
  it('店长注册新的 Champion — 正常流程', () => {
    const { ctrl } = makeController();
    const result = ctrl.registerChampion({ name: '新晋 Champion', role: 'CHAMPION' } as any);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('新晋 Champion');
    expect(result.role).toBe('CHAMPION');
  });

  it('店长查看排行榜 — 包含所有贡献数据', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const ranking = ctrl.getRanking({} as any);
    expect(ranking.length).toBeGreaterThanOrEqual(3);
    const shopOwner = ranking.find((r: any) => r.name === '店长小明');
    expect(shopOwner).toBeDefined();
    expect(shopOwner!.reviews).toBe(2);
    expect(shopOwner!.rfcs).toBe(1);
  });

  it('店长查看单个 Champion 详情', () => {
    const { ctrl, svc } = makeController();
    const [id] = createChampions(svc);
    const champ = ctrl.getChampion(id);
    expect(champ.name).toBe('店长小明');
    expect(champ.role).toBe('APPROVER');
  });
});

// ══════════════════════════════════════════════
// 🛒 前台
// ══════════════════════════════════════════════
describe(`${ROLES.Reception} champion 角色测试`, () => {
  it('前台列出所有 Champion — 正常查看', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const list = ctrl.listChampions(undefined);
    expect(list).toHaveLength(3);
    expect(list.every((c: any) => c.name)).toBe(true);
  });

  it('前台按角色筛选 Champion — 只显示对应角色', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const champions = ctrl.listChampions('CHAMPION' as any);
    expect(champions).toHaveLength(1);
    expect(champions[0].name).toBe('导玩员小李');
  });

  it('前台查询不存在角色 — 返回空列表', () => {
    const { ctrl } = makeController();
    expect(ctrl.listChampions('CHAMPION' as any)).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════
// 👥 HR
// ══════════════════════════════════════════════
describe(`${ROLES.HR} champion 角色测试`, () => {
  it('HR 登记新员工为 Observer', () => {
    const { ctrl } = makeController();
    const result = ctrl.registerChampion({ name: '新员工-赵六', role: 'OBSERVER' } as any);
    expect(result.name).toBe('新员工-赵六');
    expect(result.role).toBe('OBSERVER');
  });

  it('HR 查看知识地图 — 了解团队贡献分布', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const map = ctrl.getKnowledgeMap();
    expect(map.totalChampions).toBe(3);
    expect(map.byRole.APPROVER).toBeGreaterThanOrEqual(1);
    expect(map.byRole.CHAMPION).toBeGreaterThanOrEqual(1);
  });

  it('HR 无法为不存在的人员记录贡献', () => {
    const { ctrl } = makeController();
    expect(() => ctrl.recordContribution({ championId: 'nonexistent', kind: 'COMMIT', refId: 'x' } as any)).toThrow();
  });
});

// ══════════════════════════════════════════════
// 🔧 安监
// ══════════════════════════════════════════════
describe(`${ROLES.Safety} champion 角色测试`, () => {
  it('安监查看决策时间线 — 所有贡献活动可追踪', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const timeline = ctrl.getDecisionTimeline({} as any);
    expect(timeline.length).toBeGreaterThanOrEqual(4);
    for (const entry of timeline) {
      expect(entry).toHaveProperty('championId');
      expect(entry).toHaveProperty('refId');
    }
  });

  it('安监按时间范围过滤 — 只看最近的贡献', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const filtered = ctrl.getDecisionTimeline({ sinceDate: '2099-01-01T00:00:00.000Z' } as any);
    expect(filtered).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════
// 🎮 导玩员
// ══════════════════════════════════════════════
describe(`${ROLES.Guide} champion 角色测试`, () => {
  it('导玩员查看排行榜 — 了解个人排名', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const ranking = ctrl.getRanking({} as any);
    expect(ranking.length).toBeGreaterThan(0);
    expect(ranking.every((r: any) => r.rank > 0)).toBe(true);
  });

  it('导玩员查看知识地图 — 团队贡献一目了然', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const map = ctrl.getKnowledgeMap();
    expect(map.totalScore).toBeGreaterThan(0);
    expect(Object.values(map.byKind).some((v: number) => v > 0)).toBe(true);
  });
});

// ══════════════════════════════════════════════
// 🎯 运行专员
// ══════════════════════════════════════════════
describe(`${ROLES.Ops} champion 角色测试`, () => {
  it('运行专员查看总贡献统计', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const map = ctrl.getKnowledgeMap();
    expect(map.totalContributions).toBeGreaterThanOrEqual(4);
    expect(map.totalScore).toBeGreaterThan(0);
  });

  it('运行专员查看所有 Champion 列表 — 团队概览', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const list = ctrl.listChampions(undefined);
    const roles = new Set(list.map((c: any) => c.role));
    expect(roles.has('APPROVER')).toBe(true);
    expect(roles.has('CHAMPION')).toBe(true);
    expect(roles.has('OBSERVER')).toBe(true);
  });

  it('运行专员查看空排名 — 无数据时的降级处理', () => {
    const { ctrl } = makeController();
    expect(ctrl.getRanking({} as any)).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════
// 🤝 团建
// ══════════════════════════════════════════════
describe(`${ROLES.Teambuilding} champion 角色测试`, () => {
  it('团建专员注册团队 Champion', () => {
    const { ctrl } = makeController();
    const result = ctrl.registerChampion({ name: '团建之星', role: 'CHAMPION' } as any);
    expect(result.name).toBe('团建之星');
  });

  it('团建专员查看排行榜 — 识别团队贡献者', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const ranking = ctrl.getRanking({} as any);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[0].totalScore).toBeGreaterThan(0);
  });

  it('团建专员记录贡献 — 记录团建知识沉淀', () => {
    const { ctrl } = makeController();
    const champ = ctrl.registerChampion({ name: '团建达人', role: 'CHAMPION' } as any);
    const result = ctrl.recordContribution({
      championId: champ.id, kind: 'RETRO', refId: 'team-building-q2', description: '季度团建总结',
    } as any);
    expect(result.totalScore).toBe(6);
    expect(result.contributions[0].description).toBe('季度团建总结');
  });
});

// ══════════════════════════════════════════════
// 📢 营销
// ══════════════════════════════════════════════
describe(`${ROLES.Marketing} champion 角色测试`, () => {
  it('营销专员查看排行榜 — 挖掘典型案例', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const ranking = ctrl.getRanking({} as any);
    expect(ranking.length).toBeGreaterThanOrEqual(3);
    for (const entry of ranking) {
      expect(entry).toHaveProperty('championId');
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('totalScore');
    }
  });

  it('营销专员查看知识地图 — 获取激励素材', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const map = ctrl.getKnowledgeMap();
    expect(map.byKind.REVIEW).toBeGreaterThan(0);
  });

  it('营销专员查看时间线 — 发掘近期活跃 Champion', () => {
    const { ctrl, svc } = makeController();
    createChampions(svc);
    const timeline = ctrl.getDecisionTimeline({} as any);
    expect(timeline.length).toBeGreaterThan(0);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1].date >= timeline[i].date).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════
// 🌐 通用边界测试
// ══════════════════════════════════════════════
describe('champion 通用边界测试', () => {
  it('注册多个同角色 Champion', () => {
    const { ctrl } = makeController();
    ctrl.registerChampion({ name: 'A', role: 'CHAMPION' } as any);
    ctrl.registerChampion({ name: 'B', role: 'CHAMPION' } as any);
    ctrl.registerChampion({ name: 'C', role: 'CHAMPION' } as any);
    expect(ctrl.listChampions('CHAMPION' as any)).toHaveLength(3);
    expect(ctrl.listChampions(undefined)).toHaveLength(3);
  });

  it('贡献类型覆盖全部种类 — 每种权值正确', () => {
    const { ctrl } = makeController();
    const champ = ctrl.registerChampion({ name: '全能选手', role: 'CHAMPION' } as any);

    ctrl.recordContribution({ championId: champ.id, kind: 'COMMIT', refId: 'c1' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'REVIEW', refId: 'r1' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'RFC', refId: 'DR-1' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'PULSE_REVIEW', refId: 'p1' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'RETRO', refId: 'retro-1' } as any);

    expect(champ.totalScore).toBe(2 + 3 + 8 + 4 + 6);
  });

  it('多次记录同一 refId 允许 — 无去重要求', () => {
    const { ctrl } = makeController();
    const champ = ctrl.registerChampion({ name: '重复提交', role: 'CHAMPION' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'COMMIT', refId: 'same-ref' } as any);
    ctrl.recordContribution({ championId: champ.id, kind: 'COMMIT', refId: 'same-ref' } as any);
    expect(champ.contributions).toHaveLength(2);
  });

  it('贡献总分为整数 — 无浮点精度问题', () => {
    const { ctrl } = makeController();
    const champ = ctrl.registerChampion({ name: '精度检查', role: 'CHAMPION' } as any);
    for (let i = 0; i < 100; i++) {
      ctrl.recordContribution({ championId: champ.id, kind: 'COMMIT', refId: `c${i}` } as any);
    }
    expect(champ.totalScore).toBe(200);
    expect(Number.isInteger(champ.totalScore)).toBe(true);
  });
});
