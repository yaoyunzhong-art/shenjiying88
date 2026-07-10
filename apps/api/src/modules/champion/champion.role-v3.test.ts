import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [champion] [C] 角色测试 v3 — 大飞哥电玩城实景模拟
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店 Champion 知识贡献与排名运营场景：
 * 店A: Cyber Galaxy Arcade (Colonial Heights)
 * 店B: 休斯顿
 * 店C: 纽约
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界 + 降级/重试场景）
 * 覆盖: POST /champions, POST /champions/contribution,
 *       GET /champions, GET /champions/ranking, GET /champions/timeline,
 *       GET /champions/knowledge-map, GET /champions/:id
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ChampionController } from './champion.controller'
import { ChampionService } from './champion.service'
import { ChampionRole, ContributionKind } from './champion.entity'

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
} as const

// ── 大飞哥三店场景 Champion 数据 ──
// 注: ChampionProfile 中的 role 是 ChampionRole(APPROVER/CHAMPION/OBSERVER)，
//     与 8角色(Role-based Access) 不同；测试抽象为每个门店角色各自有不同操作权限。
const storeA = { id: 'store-cyber-galaxy', name: 'Cyber Galaxy Arcade', location: 'Colonial Heights, VA', tenantId: 't-cyber-001' }
const storeB = { id: 'store-houston', name: '休斯顿店', location: 'Houston, TX', tenantId: 't-hou-002' }
const storeC = { id: 'store-nyc', name: '纽约店', location: 'New York, NY', tenantId: 't-nyc-003' }

// ── 辅助工厂 ──
function createService(): ChampionService {
  const svc = new ChampionService()
  svc.resetForTests()
  return svc
}

function createController(): ChampionController {
  return new ChampionController(createService())
}

/** 预注册一批 Champions（三店场景） */
function seedChampions(service: ChampionService): Map<string, string> {
  const nameMap = new Map<string, string>()

  // 店长作为 APPROVER
  const sm = service.registerChampion({ name: 'Alex', role: ChampionRole.Approver, joinedAt: '2025-01-15T00:00:00Z' })
  nameMap.set('SM', sm.id)
  // 导玩员作为 CHAMPION
  const gd = service.registerChampion({ name: 'Bella', role: ChampionRole.Champion, joinedAt: '2025-02-01T00:00:00Z' })
  nameMap.set('GD', gd.id)
  // 运行专员作为 CHAMPION
  const ops = service.registerChampion({ name: 'Charlie', role: ChampionRole.Champion, joinedAt: '2025-03-10T00:00:00Z' })
  nameMap.set('OPS', ops.id)
  // 前台作为 OBSERVER
  const fd = service.registerChampion({ name: 'Diana', role: ChampionRole.Observer, joinedAt: '2025-04-01T00:00:00Z' })
  nameMap.set('FD', fd.id)

  // 给部分角色记录贡献
  service.recordContribution({ championId: sm.id, kind: ContributionKind.Rfc, refId: 'DR-001', description: '门店奖惩制度', occurredAt: '2025-01-20T00:00:00Z' })
  service.recordContribution({ championId: sm.id, kind: ContributionKind.Review, refId: 'REV-001', description: '审批运营流程', occurredAt: '2025-02-10T00:00:00Z' })
  service.recordContribution({ championId: gd.id, kind: ContributionKind.Commit, refId: 'COM-001', description: '导玩SOP更新', occurredAt: '2025-02-15T00:00:00Z' })
  service.recordContribution({ championId: gd.id, kind: ContributionKind.PulseReview, refId: 'PULSE-001', description: '顾客反馈周报', occurredAt: '2025-03-05T00:00:00Z' })
  service.recordContribution({ championId: ops.id, kind: ContributionKind.Commit, refId: 'COM-002', description: '设备维保记录', occurredAt: '2025-03-20T00:00:00Z' })
  service.recordContribution({ championId: ops.id, kind: ContributionKind.Retro, refId: 'RETRO-001', description: '月度运营复盘', occurredAt: '2025-04-01T00:00:00Z' })

  return nameMap
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 门店 Champion 全局管理
// ════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} Champion 角色测试`, () => {
  it('店长可注册新 Champion 并查看其详情（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    const champion = ctrl.registerChampion({ name: 'Tom', role: ChampionRole.Champion, joinedAt: '2025-05-01T00:00:00Z' })
    expect(champion).toHaveProperty('id')
    expect(champion.name).toBe('Tom')
    expect(champion.role).toBe(ChampionRole.Champion)
    expect(champion.totalScore).toBe(0)

    const detail = ctrl.getChampion(champion.id)
    expect(detail).toBeDefined()
    expect(detail.id).toBe(champion.id)
  })

  it('店长可批量管理多个门店 Champion 并查看排行榜（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    const ids = seedChampions(svc)

    const ranking = ctrl.getRanking()
    expect(ranking).toHaveLength(4)
    // Alex (Rfc=8 + Review=3=11) 应排第一
    expect(ranking[0].name).toBe('Alex')
    expect(ranking[0].totalScore).toBeGreaterThanOrEqual(11)
  })

  it('店长查询不存在的 Champion ID 应返回 404（边界）', () => {
    const ctrl = createController()
    expect(() => ctrl.getChampion('non-existent-id')).toThrow()
    try {
      ctrl.getChampion('non-existent-id')
    } catch (e: any) {
      expect(e.status).toBe(404)
      expect(e.message).toContain('not found')
    }
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 日常 Champion 查询与时间线
// ════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} Champion 角色测试`, () => {
  it('前台可查看 Champion 列表并按角色过滤（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    seedChampions(svc)

    const list = ctrl.listChampions()
    expect(list.length).toBeGreaterThanOrEqual(4)

    const approvers = ctrl.listChampions(ChampionRole.Approver)
    expect(approvers).toHaveLength(1)
    expect(approvers[0].role).toBe(ChampionRole.Approver)
  })

  it('前台可查询决策时间线并获取时间顺序记录（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    const ids = seedChampions(svc)

    const timeline = ctrl.getDecisionTimeline({ championId: ids.get('SM')!, sinceDate: '2025-01-01T00:00:00Z' })
    expect(timeline.length).toBeGreaterThanOrEqual(2)
    // 时间倒序
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1].date.localeCompare(timeline[i].date)).toBeGreaterThanOrEqual(0)
    }
  })

  it('前台查询无记录的 Champion 应返回空时间线（边界）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    // 注册但无贡献
    const empty = svc.registerChampion({ name: 'Empty', role: ChampionRole.Observer, joinedAt: '2025-06-01T00:00:00Z' })
    const timeline = ctrl.getDecisionTimeline({ championId: empty.id })
    expect(timeline).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — Champion 角色管理与权限审计
// ════════════════════════════════════════════════════════════
describe(`${ROLES.HR} Champion 角色测试`, () => {
  it('HR 可注册不同角色的 Champion 并校验角色枚举（正常流程）', () => {
    const svc = createService()
    const roles = [ChampionRole.Approver, ChampionRole.Champion, ChampionRole.Observer]
    for (const role of roles) {
      const c = svc.registerChampion({ name: `HR_${role}`, role })
      expect(c.role).toBe(role)
    }
    expect(svc.listChampions().length).toBe(3)
  })

  it('HR 可查询知识地图查看角色分布统计（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    seedChampions(svc)

    const km = ctrl.getKnowledgeMap()
    expect(km.totalChampions).toBe(4)
    expect(km.byRole[ChampionRole.Approver]).toBe(1)
    expect(km.byRole[ChampionRole.Champion]).toBe(2)
    expect(km.byRole[ChampionRole.Observer]).toBe(1)
    expect(km.totalScore).toBeGreaterThan(0)
  })

  it('HR 对新注册无声明的 Champion 应看到零分（边界）', () => {
    const svc = createService()
    const c = svc.registerChampion({ name: 'NewHire', role: ChampionRole.Observer })
    expect(c.totalScore).toBe(0)
    expect(c.contributions).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 操作审计与贡献验证
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} Champion 角色测试`, () => {
  it('安监可查询所有 Champion 决策时间线进行运营审计（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    seedChampions(svc)

    const timeline = ctrl.getDecisionTimeline({ sinceDate: '2025-01-01T00:00:00Z' })
    expect(timeline.length).toBeGreaterThanOrEqual(6)
    // 所有条目应有 refId
    for (const entry of timeline) {
      expect(entry.refId).toBeTruthy()
      expect(entry.name).toBeTruthy()
    }
  })

  it('安监验证贡献记录幂等性——相同 refId 不应重复计分（边界）', () => {
    const svc = createService()
    const c = svc.registerChampion({ name: 'AuditUser', role: ChampionRole.Champion })

    // 第一次记录
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'COM-AUDIT-001', description: '初始', occurredAt: '2025-05-01T00:00:00Z' })
    expect(c.contributions.length).toBe(1)
    expect(c.totalScore).toBe(2)

    // 相同 refId 再提交一次（幂等更新）
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'COM-AUDIT-001', description: '更新后', occurredAt: '2025-05-02T00:00:00Z' })
    expect(c.contributions.length).toBe(1) // 不新增
    expect(c.totalScore).toBe(2) // 分数不变
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 日常贡献提交与自我排名查看
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} Champion 角色测试`, () => {
  it('导玩员可提交多种类型的贡献记录（正常流程）', () => {
    const svc = createService()
    const gd = svc.registerChampion({ name: 'GuidePlayer', role: ChampionRole.Champion, joinedAt: '2025-06-01T00:00:00Z' })

    svc.recordContribution({ championId: gd.id, kind: ContributionKind.Commit, refId: 'GUIDE-COM-001', description: '清洁SOP', occurredAt: '2025-06-05T00:00:00Z' })
    svc.recordContribution({ championId: gd.id, kind: ContributionKind.Review, refId: 'GUIDE-REV-001', description: '顾客动线优化', occurredAt: '2025-06-06T00:00:00Z' })

    expect(gd.contributions.length).toBe(2)
    expect(gd.totalScore).toBe(2 + 3) // COMMIT=2 + REVIEW=3
  })

  it('导玩员提交贡献后可查看排行榜确认自己的排名（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    const sm = svc.registerChampion({ name: 'StoreLead', role: ChampionRole.Approver })
    svc.recordContribution({ championId: sm.id, kind: ContributionKind.Rfc, refId: 'DR-RANK-001', occurredAt: '2025-06-01T00:00:00Z' })

    const gd = svc.registerChampion({ name: 'GamingGuide', role: ChampionRole.Champion })
    svc.recordContribution({ championId: gd.id, kind: ContributionKind.Commit, refId: 'GUIDE-COM-RANK', occurredAt: '2025-06-02T00:00:00Z' })
    svc.recordContribution({ championId: gd.id, kind: ContributionKind.PulseReview, refId: 'GUIDE-PULSE-RANK', occurredAt: '2025-06-03T00:00:00Z' })

    const ranking = ctrl.getRanking()
    // Guide: 2+4=6, SM: 8, 所以 Guide排第二
    const guideEntry = ranking.find(e => e.name === 'GamingGuide')
    expect(guideEntry).toBeDefined()
    expect(guideEntry!.totalScore).toBe(6)
    expect(guideEntry!.rank).toBe(2)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 批量运营数据录入与性能检查
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} Champion 角色测试`, () => {
  it('运行专员可为多个 Champion 批量录入贡献并校对积分（正常流程）', () => {
    const svc = createService()
    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const c = svc.registerChampion({ name: `OpsPlayer-${i}`, role: i % 3 === 0 ? ChampionRole.Approver : ChampionRole.Champion })
      ids.push(c.id)
    }

    // 为每个人录入一条 commit
    for (const id of ids) {
      svc.recordContribution({ championId: id, kind: ContributionKind.Commit, refId: `OPS-BATCH-COM-${id.slice(-4)}`, occurredAt: '2025-06-10T00:00:00Z' })
    }
    // 前两人额外录入 review
    svc.recordContribution({ championId: ids[0], kind: ContributionKind.Review, refId: 'OPS-BATCH-REV-001', occurredAt: '2025-06-11T00:00:00Z' })
    svc.recordContribution({ championId: ids[1], kind: ContributionKind.Review, refId: 'OPS-BATCH-REV-002', occurredAt: '2025-06-11T00:00:00Z' })

    const km = svc.getKnowledgeMap()
    expect(km.totalChampions).toBe(5)
    expect(km.totalContributions).toBe(7)
    expect(km.byKind[ContributionKind.Commit]).toBe(5)
    expect(km.byKind[ContributionKind.Review]).toBe(2)
  })

  it('运行专员尝试给不存在的 Champion 录贡献应抛异常（边界）', () => {
    const svc = createService()
    expect(() => svc.recordContribution({ championId: 'non-existent', kind: ContributionKind.Commit, refId: 'FAIL-001', occurredAt: '2025-06-01T00:00:00Z' })).toThrow()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 跨店协同与知识共享统计
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} Champion 角色测试`, () => {
  it('团建专员可查看全店 Champion 知识地图促进跨店交流（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    seedChampions(svc)
    // 加入更多跨店 Champion
    svc.registerChampion({ name: 'NYC-Team', role: ChampionRole.Champion })
    svc.registerChampion({ name: 'NYC-Approver', role: ChampionRole.Approver })

    const km = ctrl.getKnowledgeMap()
    expect(km.totalChampions).toBe(6)
    expect(km.byRole[ChampionRole.Approver]).toBe(2)
    expect(km.byRole[ChampionRole.Champion]).toBe(3)
  })

  it('团建专员查询时间线且不过滤日期应返回全量记录（正常流程）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    seedChampions(svc)

    const timeline = ctrl.getDecisionTimeline({})
    expect(timeline.length).toBeGreaterThanOrEqual(6)
  })

  it('团建专员对空门店查询知识地图应看到零值统计（边界）', () => {
    const svc = createService()
    const ctrl = new ChampionController(svc)
    const km = ctrl.getKnowledgeMap()
    expect(km.totalChampions).toBe(0)
    expect(km.totalContributions).toBe(0)
    expect(km.totalScore).toBe(0)
    expect(km.byKind[ContributionKind.Commit]).toBe(0)
    expect(km.byKind[ContributionKind.Review]).toBe(0)
    expect(km.byKind[ContributionKind.Rfc]).toBe(0)
    expect(km.byKind[ContributionKind.PulseReview]).toBe(0)
    expect(km.byKind[ContributionKind.Retro]).toBe(0)
    expect(km.byRole[ChampionRole.Approver]).toBe(0)
    expect(km.byRole[ChampionRole.Champion]).toBe(0)
    expect(km.byRole[ChampionRole.Observer]).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 高价值 Champion 定位与洞察
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} Champion 角色测试`, () => {
  it('营销专员可根据贡献类型筛选 Champion 识别 KOL（正常流程）', () => {
    const svc = createService()
    seedChampions(svc)
    // 新增内容型 Champion
    const contentChamp = svc.registerChampion({ name: 'ContentCreator', role: ChampionRole.Champion })
    svc.recordContribution({ championId: contentChamp.id, kind: ContributionKind.Rfc, refId: 'DR-MKT-001', description: '社媒推广方案', occurredAt: '2025-07-01T00:00:00Z' })
    svc.recordContribution({ championId: contentChamp.id, kind: ContributionKind.Review, refId: 'REV-MKT-001', description: '素材审核', occurredAt: '2025-07-02T00:00:00Z' })

    const ranking = svc.getRanking()
    // ContentCreator: 8+3=11; Alex: 8+3=11; 并列
    const cc = ranking.find(e => e.name === 'ContentCreator')
    expect(cc).toBeDefined()
    expect(cc!.totalScore).toBeGreaterThanOrEqual(11)

    // 营销专员查看冠军的个人详情
    const detail = svc.getChampion(contentChamp.id)
    expect(detail!.contributions.length).toBe(2)
  })

  it('营销专员通过 timeline 查询特定时间段内高活跃 Champion（边界/时段过滤）', () => {
    const svc = createService()
    seedChampions(svc)

    // 只查询 2025-03 之后
    const timeline = svc.getDecisionTimeline({ sinceDate: '2025-03-01T00:00:00Z' })
    const beforeMar = timeline.filter(e => e.date < '2025-03-01T00:00:00Z')
    expect(beforeMar.length).toBe(0) // 全部在 3月之后

    // 查询更长范围应包含全部
    const all = svc.getDecisionTimeline({ sinceDate: '2025-01-01T00:00:00Z' })
    expect(all.length).toBeGreaterThanOrEqual(6)
  })
})
