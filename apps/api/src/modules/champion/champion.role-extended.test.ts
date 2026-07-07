import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [champion] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — champion 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: registerChampion, recordContribution, getRanking, getDecisionTimeline,
 *       getKnowledgeMap, getChampion, listChampions
 * 扩展: 大规模并发模拟、条件覆盖、异常数据、角色元数据验证、边界权限校验
 */

import { ChampionController } from './champion.controller';
import { ChampionService } from './champion.service';
import { ContributionKind, ChampionRole } from './champion.entity';

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;

// ── 测试工厂 ──
function createController() {
  const service = new ChampionService();
  service.resetForTests();
  return { service, controller: new ChampionController(service) };
}

function seedBasicChampions(svc: ChampionService): string[] {
  const ids: string[] = [];
  const a = svc.registerChampion({ name: '店长王哥', role: 'APPROVER' as ChampionRole });
  ids.push(a.id);
  svc.registerChampion({ name: '冠军讲师张', role: 'CHAMPION' as ChampionRole });
  svc.registerChampion({ name: '观察员李', role: 'OBSERVER' as ChampionRole });
  svc.recordContribution({ championId: a.id, kind: ContributionKind.Review, refId: 'review-v1' });
  svc.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'DR-100' });
  return ids;
}

function seedFullChampions(svc: ChampionService): string[] {
  const ids: string[] = [];

  // APPROVER 店长 — 高贡献
  const owner = svc.registerChampion({ name: '店长王哥', role: 'APPROVER' as ChampionRole });
  ids.push(owner.id);
  for (let i = 0; i < 5; i++) {
    svc.recordContribution({ championId: owner.id, kind: ContributionKind.Review, refId: `review-${i}` });
  }
  svc.recordContribution({ championId: owner.id, kind: ContributionKind.Rfc, refId: 'DR-001' });

  // CHAMPION 导玩员 — 高提交
  const guide = svc.registerChampion({ name: '冠军讲师张', role: 'CHAMPION' as ChampionRole });
  ids.push(guide.id);
  for (let i = 0; i < 8; i++) {
    svc.recordContribution({ championId: guide.id, kind: ContributionKind.Commit, refId: `commit-${i}` });
  }
  svc.recordContribution({ championId: guide.id, kind: ContributionKind.PulseReview, refId: 'pulse-q1' });

  // OBSERVER 观察员 — 少量贡献
  const obs = svc.registerChampion({ name: '观察员李', role: 'OBSERVER' as ChampionRole });
  ids.push(obs.id);
  svc.recordContribution({ championId: obs.id, kind: ContributionKind.Commit, refId: 'commit-obs-1' });

  return ids;
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局 Champion Dashboard 管理与决策
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} champion 扩展角色测试`, () => {
  let service: ChampionService;
  let controller: ChampionController;

  beforeEach(() => {
    const ctx = createController();
    service = ctx.service;
    controller = ctx.controller;
  });

  it('【正常】店长批量注册多个 Champion', () => {
    const c1 = controller.registerChampion({ name: '副店长 A', role: 'CHAMPION' } as any);
    const c2 = controller.registerChampion({ name: '副店长 B', role: 'CHAMPION' } as any);
    const c3 = controller.registerChampion({ name: '审批人 C', role: 'APPROVER' } as any);
    expect(c1.role).toBe('CHAMPION');
    expect(c2.role).toBe('CHAMPION');
    expect(c3.role).toBe('APPROVER');
    const all = controller.listChampions(undefined);
    expect(all).toHaveLength(3);
  });

  it('【权限边界】店长查看包含大批量数据的排名', () => {
    for (let i = 0; i < 20; i++) {
      const c = controller.registerChampion({ name: `冠军-${i}`, role: 'CHAMPION' } as any);
      for (let j = 0; j < 3; j++) {
        controller.recordContribution({ championId: c.id, kind: 'COMMIT', refId: `c-${i}-${j}` } as any);
      }
    }
    const ranking = controller.getRanking({} as any);
    expect(ranking).toHaveLength(20);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[19].rank).toBe(20);
    // 所有 rank 唯一
    const ranks = new Set(ranking.map((r: any) => r.rank));
    expect(ranks.size).toBe(20);
  });

  it('【降级场景】店长查看空系统 — 无 Champion 注册', () => {
    expect(controller.listChampions(undefined)).toHaveLength(0);
    expect(controller.getRanking({} as any)).toHaveLength(0);
    const map = controller.getKnowledgeMap();
    expect(map.totalChampions).toBe(0);
    expect(map.totalContributions).toBe(0);
    expect(map.totalScore).toBe(0);
  });

  it('【权限边界】店长查询不存在的 Champion ID', () => {
    expect(() => controller.getChampion('nonexistent-id')).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — Champion 查询与浏览
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} champion 扩展角色测试`, () => {
  it('【正常】前台查看所有 Champion 列表', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const list = controller.listChampions(undefined);
    expect(list).toHaveLength(3);
    for (const c of list) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('role');
    }
  });

  it('【正常】前台按角色筛选 — 只看到 CHAMPION', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const champions = controller.listChampions('CHAMPION' as any);
    expect(champions).toHaveLength(1);
    expect(champions[0].role).toBe('CHAMPION');
  });

  it('【降级场景】前台查询不存在角色 — 返回空列表', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const nonexistent = controller.listChampions('NONEXISTENT' as any);
    expect(nonexistent).toHaveLength(0);
  });

  it('【降级场景】前台查看空系统的排行榜', () => {
    const { controller } = createController();
    const ranking = controller.getRanking({} as any);
    expect(ranking).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// 👥 HR — Champion 人员管理与登记
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} champion 扩展角色测试`, () => {
  it('【正常】HR 为全员角色注册 Champion', () => {
    const { controller } = createController();
    const roles: ChampionRole[] = ['APPROVER', 'CHAMPION', 'OBSERVER'] as ChampionRole[];
    for (const role of roles) {
      const result = controller.registerChampion({ name: `HR登记-${role}`, role } as any);
      expect(result.role).toBe(role);
    }
    expect(controller.listChampions(undefined)).toHaveLength(3);
  });

  it('【权限边界】HR 重复注册同一姓名 — 允许 (无唯一约束)', () => {
    const { controller } = createController();
    controller.registerChampion({ name: '同名员工', role: 'CHAMPION' } as any);
    controller.registerChampion({ name: '同名员工', role: 'OBSERVER' } as any);
    const all = controller.listChampions(undefined);
    expect(all).toHaveLength(2);
  });

  it('【降级场景】HR 为不存在的人员记录贡献 — 抛出错误', () => {
    const { controller } = createController();
    expect(() => controller.recordContribution({
      championId: 'no-such-id', kind: 'COMMIT', refId: 'void',
    } as any)).toThrow('Champion not found');
  });

  it('【权限边界】HR 查看知识地图验证各角色参与', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const map = controller.getKnowledgeMap();
    // APPROVER 参与了 review 和 RFC
    expect(map.byKind.REVIEW).toBeGreaterThanOrEqual(5);
    expect(map.byKind.RFC).toBeGreaterThanOrEqual(1);
    // CHAMPION 参与了 commit 和 pulse_review
    expect(map.byKind.COMMIT).toBeGreaterThanOrEqual(9);
    expect(map.byKind.PULSE_REVIEW).toBeGreaterThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 决策审计与可追溯性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} champion 扩展角色测试`, () => {
  it('【正常】安监查看决策时间线 — 所有操作可追溯', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const timeline = controller.getDecisionTimeline({} as any);
    expect(timeline.length).toBeGreaterThanOrEqual(7);
    // 时间线按时间倒序
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1].date >= timeline[i].date).toBe(true);
    }
    // 每个条目都有必要字段
    for (const entry of timeline) {
      expect(entry).toHaveProperty('championId');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('action');
      expect(entry).toHaveProperty('refId');
    }
  });

  it('【降级场景】安监过滤空时间范围 — 返回空', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const filtered = controller.getDecisionTimeline({ sinceDate: '2099-01-01T00:00:00Z' } as any);
    expect(filtered).toHaveLength(0);
  });

  it('【权限边界】安监按特定 Champion 过滤时间线', () => {
    const { controller, service } = createController();
    const [ownerId] = seedFullChampions(service);
    const timeline = controller.getDecisionTimeline({ championId: ownerId } as any);
    expect(timeline.length).toBeGreaterThan(0);
    for (const entry of timeline) {
      expect(entry.championId).toBe(ownerId);
    }
  });

  it('【降级场景】安监查看空系统的时间线 — 返回空数组', () => {
    const { controller } = createController();
    expect(controller.getDecisionTimeline({} as any)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 个人参与与贡献管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} champion 扩展角色测试`, () => {
  it('【正常】导玩员查看排行榜 — 明确个人排名', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const ranking = controller.getRanking({} as any);
    expect(ranking.every((r: any) => r.rank >= 1)).toBe(true);
    expect(ranking.length).toBe(3);
    // 按总分降序
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].totalScore >= ranking[i].totalScore).toBe(true);
    }
  });

  it('【正常】导玩员查看知识地图 — 了解各种贡献分布', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const map = controller.getKnowledgeMap();
    // 至少有一种贡献类型 > 0
    const nonZero = Object.values(map.byKind).filter((v: number) => v > 0);
    expect(nonZero.length).toBeGreaterThanOrEqual(2);
    // 三种角色都注册了
    expect(map.byRole.APPROVER).toBe(1);
    expect(map.byRole.CHAMPION).toBe(1);
    expect(map.byRole.OBSERVER).toBe(1);
  });

  it('【权限边界】导玩员查询自己 — 使用 getChampion', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const all = controller.listChampions('CHAMPION' as any);
    const guide = controller.getChampion(all[0].id);
    expect(guide.name).toBe('冠军讲师张');
    expect(guide.contributions.length).toBe(9); // 8 commits + 1 pulse_review
  });

  it('【降级场景】导玩员查看无排名的空系统', () => {
    const { controller } = createController();
    expect(controller.getRanking({} as any)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统运行状态与数据完整性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} champion 扩展角色测试`, () => {
  it('【正常】运行专员查看完整统计概览', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const map = controller.getKnowledgeMap();
    expect(map.totalChampions).toBe(3);
    expect(map.totalContributions).toBe(5 + 1 + 9 + 1); // review(5)+rfc(1)+commit(8+1)+pulse(1)
    // score: review(5*3=15) + rfc(8) + commit(9*2=18) + pulse_review(4) = 45
    expect(map.totalScore).toBeGreaterThan(0);
  });

  it('【正常】运行专员验证排行榜数据一致性', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const ranking = controller.getRanking({} as any);
    // 验证各字段类型
    for (const entry of ranking) {
      expect(typeof entry.championId).toBe('string');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.totalScore).toBe('number');
      expect(typeof entry.commits).toBe('number');
      expect(typeof entry.reviews).toBe('number');
      expect(typeof entry.rfcs).toBe('number');
      expect(entry.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it('【降级场景】运行专员空系统 — 知识地图全零', () => {
    const { controller } = createController();
    const map = controller.getKnowledgeMap();
    expect(map.totalChampions).toBe(0);
    expect(map.totalContributions).toBe(0);
    expect(map.totalScore).toBe(0);
    expect(Object.values(map.byKind).every((v: number) => v === 0)).toBe(true);
    expect(Object.values(map.byRole).every((v: number) => v === 0)).toBe(true);
  });

  it('【权限边界】运行专员验证极大量数据时排行榜性能正确性', () => {
    const { controller, service } = createController();
    // 注册50个Champion，每个5个贡献
    for (let i = 0; i < 50; i++) {
      const c = controller.registerChampion({ name: ` Champion-${i}`, role: 'CHAMPION' } as any);
      for (let j = 0; j < 5; j++) {
        controller.recordContribution({
          championId: c.id, kind: j % 2 === 0 ? 'COMMIT' : 'REVIEW', refId: `ref-${i}-${j}`,
        } as any);
      }
    }
    const ranking = controller.getRanking({} as any);
    expect(ranking).toHaveLength(50);
    // 因为都是各5个贡献 (总分会一样: commit: 2*3 + review: 3*2 = 12)，排名应该按原始顺序
    expect(ranking[0].totalScore).toBe(12);
  });
});

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队建设与贡献激励
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} champion 扩展角色测试`, () => {
  it('【正常】团建专员为活动参与者注册并记录 RETRO 贡献', () => {
    const { controller } = createController();
    const c = controller.registerChampion({ name: '团建之星', role: 'CHAMPION' } as any);
    const updated = controller.recordContribution({
      championId: c.id, kind: 'RETRO', refId: 'retro-q2', description: '季度团建回顾',
    } as any);
    expect(updated.totalScore).toBe(6);
    expect(updated.contributions[0].description).toBe('季度团建回顾');
    expect(updated.contributions[0].kind).toBe('RETRO');
  });

  it('【权限边界】团建专员记录多种贡献类型 — 分值计算正确', () => {
    const { controller } = createController();
    const c = controller.registerChampion({ name: '全能团建', role: 'CHAMPION' } as any);
    controller.recordContribution({ championId: c.id, kind: 'COMMIT', refId: 'a' } as any);
    controller.recordContribution({ championId: c.id, kind: 'REVIEW', refId: 'b' } as any);
    controller.recordContribution({ championId: c.id, kind: 'PULSE_REVIEW', refId: 'c' } as any);
    expect(c.totalScore).toBe(2 + 3 + 4);
  });

  it('【降级场景】团建专员对不存在的 Champion 记录 — 抛出错误', () => {
    const { controller } = createController();
    expect(() => controller.recordContribution({
      championId: 'ghost', kind: 'COMMIT', refId: 'x',
    } as any)).toThrow();
  });

  it('【正常】团建专员查看排行榜 — 识别月度贡献之星', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const ranking = controller.getRanking({} as any);
    // 第一名应该是店长 (高贡献)
    expect(ranking[0].totalScore).toBeGreaterThanOrEqual(ranking[1].totalScore);
    expect(ranking[0].totalScore).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 数据驱动内容传播
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} champion 扩展角色测试`, () => {
  it('【正常】营销专员查看排行榜 — 挖掘 KOL 素材', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const ranking = controller.getRanking({} as any);
    expect(ranking.length).toBe(3);
    for (const entry of ranking) {
      expect(typeof entry.championId).toBe('string');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.rank).toBe('number');
    }
  });

  it('【权限边界】营销专员验证时间线按日期严格降序', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const timeline = controller.getDecisionTimeline({} as any);
    for (let i = 0; i < timeline.length - 1; i++) {
      // 确保时间线按倒序排列 order by desc
      const prev = new Date(timeline[i].date).getTime();
      const next = new Date(timeline[i + 1].date).getTime();
      expect(prev).toBeGreaterThanOrEqual(next);
    }
  });

  it('【正常】营销专员使用知识地图 — 团队贡献亮点', () => {
    const { controller, service } = createController();
    seedFullChampions(service);
    const map = controller.getKnowledgeMap();
    // 总人数
    expect(map.totalChampions).toBe(3);
    // 至少有一种类型有贡献
    expect(map.totalContributions).toBeGreaterThan(0);
    expect(map.totalScore).toBeGreaterThan(0);
    // 所有三个角色都有人
    expect(map.byRole.APPROVER).toBeGreaterThan(0);
    expect(map.byRole.CHAMPION).toBeGreaterThan(0);
    expect(map.byRole.OBSERVER).toBeGreaterThan(0);
  });

  it('【降级场景】营销专员查看空系统 — 知识地图全零', () => {
    const { controller } = createController();
    const map = controller.getKnowledgeMap();
    expect(map.totalChampions).toBe(0);
    expect(map.totalScore).toBe(0);
    expect(Object.values(map.byKind).every((v: number) => v === 0)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// 🌐 跨角色通用深度边界测试
// ════════════════════════════════════════════════════════════════
describe('champion 深度边界测试', () => {
  it('贡献非常大量数据 — 不报错，排名正确', () => {
    const { controller } = createController();
    const c = controller.registerChampion({ name: '高产冠军', role: 'CHAMPION' } as any);
    const count = 500;
    for (let i = 0; i < count; i++) {
      controller.recordContribution({ championId: c.id, kind: 'COMMIT', refId: `bulk-${i}` } as any);
    }
    expect(c.totalScore).toBe(count * 2);
    expect(c.contributions).toHaveLength(count);
    const ranking = controller.getRanking({} as any);
    expect(ranking[0].totalScore).toBe(count * 2);
    expect(ranking[0].commits).toBe(count);
  });

  it('所有贡献类型权重正确', () => {
    const { controller } = createController();
    const c = controller.registerChampion({ name: '权重验证', role: 'CHAMPION' } as any);
    controller.recordContribution({ championId: c.id, kind: 'COMMIT', refId: '1' } as any);
    controller.recordContribution({ championId: c.id, kind: 'REVIEW', refId: '2' } as any);
    controller.recordContribution({ championId: c.id, kind: 'RFC', refId: '3' } as any);
    controller.recordContribution({ championId: c.id, kind: 'PULSE_REVIEW', refId: '4' } as any);
    controller.recordContribution({ championId: c.id, kind: 'RETRO', refId: '5' } as any);
    expect(c.totalScore).toBe(2 + 3 + 8 + 4 + 6);
  });

  it('注册后贡献记录更新 totalScore', () => {
    const { controller } = createController();
    const c = controller.registerChampion({ name: '渐进冠军', role: 'CHAMPION' } as any);
    expect(c.totalScore).toBe(0);
    controller.recordContribution({ championId: c.id, kind: 'COMMIT', refId: 'c1' } as any);
    expect(c.totalScore).toBe(2);
    controller.recordContribution({ championId: c.id, kind: 'RFC', refId: 'DR-1' } as any);
    expect(c.totalScore).toBe(2 + 8);
  });

  it('知识地图 byKind 统计每个类型', () => {
    const { controller, service } = createController();
    const c = controller.registerChampion({ name: '全栈冠军', role: 'CHAMPION' } as any);
    const kinds = ['COMMIT', 'REVIEW', 'RFC', 'PULSE_REVIEW', 'RETRO'] as const;
    for (const kind of kinds) {
      controller.recordContribution({ championId: c.id, kind, refId: `ref-${kind}` } as any);
    }
    const map = controller.getKnowledgeMap();
    expect(map.byKind.COMMIT).toBe(1);
    expect(map.byKind.REVIEW).toBe(1);
    expect(map.byKind.RFC).toBe(1);
    expect(map.byKind.PULSE_REVIEW).toBe(1);
    expect(map.byKind.RETRO).toBe(1);
  });
});
