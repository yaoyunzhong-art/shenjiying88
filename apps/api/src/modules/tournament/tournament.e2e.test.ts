import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] E2E 基础测试
 *
 * E2E 链路: HTTP → TournamentController → TournamentService → Tournament/Match/Ranking
 *
 * 覆盖:
 *   - Tournament CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Draft → Open → Ongoing → Completed
 *   - 个人报名: 注册 / 重复报名 / 满员
 *   - 团队报名: 创建团队 / 审核通过 / 拒绝
 *   - Bracket 生成: 单淘汰 / 循环赛 / 至少 2 人
 *   - 比赛结果: 录入分数 / 自动完成 tournament
 *   - 排名计算
 *   - 跨租户隔离
 *   - 错误处理 (404)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Inject
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { TournamentService } from './tournament.service'
import { TournamentStatus, TournamentType, MatchStatus } from './tournament.entity'

// ========== 测试 Controller ==========

@Controller('tournament')
class TestTournamentController {
  constructor(@Inject(TournamentService) private readonly service: TournamentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Headers('x-tenant-id') tenantId: string, @Body() dto: any) {
    return this.service.createTournament({ ...dto, tenantId })
  }

  @Get()
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: any
  ) {
    return this.service.listTournaments(tenantId, {
      status: query.status,
      type: query.type,
      storeId: query.storeId,
      brandId: query.brandId
    })
  }

  @Get(':id')
  detail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    const t = this.service.getTournament(id, tenantId)
    if (!t) throw new NotFoundException(`Tournament ${id} not found`)
    return t
  }

  @Put(':id/status')
  updateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: TournamentStatus }
  ) {
    return this.service.updateTournamentStatus(id, body.status, tenantId)
  }

  @Post(':id/register')
  register(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { memberId: string }
  ) {
    return this.service.registerParticipant(id, body.memberId, tenantId)
  }

  @Post(':id/teams')
  registerTeam(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { teamName: string; captainId: string; memberIds: string[] }
  ) {
    return this.service.registerTeam(
      {
        tournamentId: id,
        teamName: body.teamName,
        captainId: body.captainId,
        memberIds: body.memberIds
      },
      tenantId
    )
  }

  @Put('teams/:teamRegId/approve')
  approveTeam(
    @Headers('x-tenant-id') tenantId: string,
    @Param('teamRegId') teamRegId: string
  ) {
    return this.service.approveTeam(teamRegId, tenantId)
  }

  @Put('teams/:teamRegId/reject')
  rejectTeam(
    @Headers('x-tenant-id') tenantId: string,
    @Param('teamRegId') teamRegId: string
  ) {
    return this.service.rejectTeam(teamRegId, tenantId)
  }

  @Post(':id/bracket')
  bracket(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.generateBracket(id, tenantId)
  }

  @Get(':id/matches')
  matches(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Query() query: any
  ) {
    return this.service.listMatches(id, tenantId, {
      round: query.round ? Number(query.round) : undefined,
      status: query.status
    })
  }

  @Get(':id/rankings')
  rankings(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.getRankings(id, tenantId)
  }

  @Put('matches/:matchId/result')
  recordResult(
    @Headers('x-tenant-id') tenantId: string,
    @Param('matchId') matchId: string,
    @Body() body: { score1: number; score2: number }
  ) {
    return this.service.recordMatchResult(matchId, body.score1, body.score2, tenantId)
  }

  @Put('matches/:matchId/dispute')
  dispute(
    @Headers('x-tenant-id') tenantId: string,
    @Param('matchId') matchId: string
  ) {
    return this.service.setDisputed(matchId, tenantId)
  }
}

// ========== 构建 app ==========

async function buildApp() {
  const service = new TournamentService()
  service.resetTournamentStoresForTests()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestTournamentController],
    providers: [{ provide: TournamentService, useValue: service }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

const TENANT_HEADERS = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

const TENANT_B_HEADERS = {
  'x-tenant-id': 'tenant-002',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

// ========== helpers ==========

async function createTournament(app: any, headers: any = TENANT_HEADERS, overrides: any = {}) {
  const res = await request(app.getHttpServer())
    .post('/tournament')
    .set(headers)
    .send({
      name: 'Test Tournament',
      type: TournamentType.SingleElimination,
      gameName: '台球',
      startDate: '2026-07-01',
      endDate: '2026-07-07',
      maxParticipants: 8,
      ...overrides
    })
  return res
}

async function openTournament(app: any, id: string, headers: any = TENANT_HEADERS) {
  return request(app.getHttpServer())
    .put(`/tournament/${id}/status`)
    .set(headers)
    .send({ status: TournamentStatus.Open })
}

// ========== E2E: Tournament CRUD ==========

describe('E2E: Tournament CRUD', () => {
  it('POST → GET :id → GET 列表 完整生命周期', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await createTournament(app)
      assert.equal(createRes.statusCode, 201)
      const tournamentId = createRes.body.data.id
      assert.ok(tournamentId.startsWith('tournament-'))
      assert.equal(createRes.body.data.status, TournamentStatus.Draft)

      const detailRes = await request(app.getHttpServer())
        .get(`/tournament/${tournamentId}`)
        .set(TENANT_HEADERS)
      assert.equal(detailRes.statusCode, 200)
      assert.equal(detailRes.body.data.id, tournamentId)

      const listRes = await request(app.getHttpServer())
        .get('/tournament')
        .set(TENANT_HEADERS)
      assert.equal(listRes.statusCode, 200)
      assert.ok(listRes.body.data.length >= 1)
    } finally {
      await app.close()
    }
  })

  it('GET /tournament/:id 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/tournament/non-existent-id')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  it('GET /tournament?status=Draft 状态过滤', async () => {
    const { app } = await buildApp()
    try {
      await createTournament(app)
      const res = await request(app.getHttpServer())
        .get(`/tournament?status=${TournamentStatus.Draft}`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      for (const t of res.body.data) assert.equal(t.status, TournamentStatus.Draft)
    } finally {
      await app.close()
    }
  })

  it('GET /tournament?type=ROUND_ROBIN 类型过滤', async () => {
    const { app } = await buildApp()
    try {
      await createTournament(app, TENANT_HEADERS, { type: TournamentType.RoundRobin })
      await createTournament(app, TENANT_HEADERS, { name: 'T2', type: TournamentType.SingleElimination })
      const res = await request(app.getHttpServer())
        .get(`/tournament?type=${TournamentType.RoundRobin}`)
        .set(TENANT_HEADERS)
      for (const t of res.body.data) assert.equal(t.type, TournamentType.RoundRobin)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 状态机 ==========

describe('E2E: 状态机转换', () => {
  it('Draft → Open 合法转换', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      const res = await openTournament(app, id)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.status, TournamentStatus.Open)
    } finally {
      await app.close()
    }
  })

  it('Open → Ongoing (生成 bracket) 合法转换', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)

      // 注册 2 名选手
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm2' })

      const bracketRes = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)
      assert.equal(bracketRes.statusCode, 201)
      assert.ok(bracketRes.body.data.length >= 1)

      // tournament 状态应转 Ongoing
      const detail = await request(app.getHttpServer())
        .get(`/tournament/${id}`)
        .set(TENANT_HEADERS)
      assert.equal(detail.body.data.status, TournamentStatus.Ongoing)
    } finally {
      await app.close()
    }
  })

  it('Draft 不可直接进 Ongoing', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      const res = await request(app.getHttpServer())
        .put(`/tournament/${id}/status`)
        .set(TENANT_HEADERS)
        .send({ status: TournamentStatus.Ongoing })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('Completed 不可再转换', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      // Draft → Cancelled (合法,但 Completed 不能进)
      await request(app.getHttpServer())
        .put(`/tournament/${id}/status`)
        .set(TENANT_HEADERS)
        .send({ status: TournamentStatus.Cancelled })
      // 试图转 Completed 应失败
      const res = await request(app.getHttpServer())
        .put(`/tournament/${id}/status`)
        .set(TENANT_HEADERS)
        .send({ status: TournamentStatus.Completed })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 报名 ==========

describe('E2E: 报名流程', () => {
  it('个人报名 + 重复报名报错', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)

      const reg1 = await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      assert.equal(reg1.statusCode, 201)
      assert.equal(reg1.body.data.currentParticipants, 1)

      const reg2 = await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      assert.equal(reg2.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('满员后禁止报名', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app, TENANT_HEADERS, { maxParticipants: 1 })
      const id = create.body.data.id
      await openTournament(app, id)

      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })

      const res = await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm2' })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('Draft 状态禁止报名', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      // tournament 还是 Draft
      const res = await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('团队报名 → 审核通过 / 拒绝', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)

      const teamRes = await request(app.getHttpServer())
        .post(`/tournament/${id}/teams`)
        .set(TENANT_HEADERS)
        .send({ teamName: 'Team Alpha', captainId: 'c1', memberIds: ['c1', 'c2', 'c3'] })
      assert.equal(teamRes.statusCode, 201)
      assert.equal(teamRes.body.data.status, 'PENDING')

      const teamRegId = teamRes.body.data.id
      const approveRes = await request(app.getHttpServer())
        .put(`/tournament/teams/${teamRegId}/approve`)
        .set(TENANT_HEADERS)
      assert.equal(approveRes.statusCode, 200)
      assert.equal(approveRes.body.data.status, 'APPROVED')

      // 再注册一个团队,这次拒绝
      const team2 = await request(app.getHttpServer())
        .post(`/tournament/${id}/teams`)
        .set(TENANT_HEADERS)
        .send({ teamName: 'Team Beta', captainId: 'c4', memberIds: ['c4', 'c5'] })
      const rejectRes = await request(app.getHttpServer())
        .put(`/tournament/teams/${team2.body.data.id}/reject`)
        .set(TENANT_HEADERS)
      assert.equal(rejectRes.statusCode, 200)
      assert.equal(rejectRes.body.data.status, 'REJECTED')
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: Bracket ==========

describe('E2E: Bracket 生成', () => {
  it('单淘汰: 4 人 → 2 首轮比赛 + 1 决赛占位', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)

      for (const m of ['m1', 'm2', 'm3', 'm4']) {
        await request(app.getHttpServer())
          .post(`/tournament/${id}/register`)
          .set(TENANT_HEADERS)
          .send({ memberId: m })
      }

      const bracket = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)
      assert.equal(bracket.statusCode, 201)
      assert.equal(bracket.body.data.length, 3) // 2 首轮 + 1 决赛占位
      const round1 = bracket.body.data.filter((m: any) => m.round === 1)
      assert.equal(round1.length, 2)
    } finally {
      await app.close()
    }
  })

  it('循环赛: 3 人 → 3 场比赛 (每两两一对)', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app, TENANT_HEADERS, {
        type: TournamentType.RoundRobin
      })
      const id = create.body.data.id
      await openTournament(app, id)

      for (const m of ['m1', 'm2', 'm3']) {
        await request(app.getHttpServer())
          .post(`/tournament/${id}/register`)
          .set(TENANT_HEADERS)
          .send({ memberId: m })
      }

      const bracket = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)
      assert.equal(bracket.statusCode, 201)
      // C(3,2) = 3
      assert.equal(bracket.body.data.length, 3)
      // 所有比赛都是 round 1
      for (const m of bracket.body.data) assert.equal(m.round, 1)
    } finally {
      await app.close()
    }
  })

  it('少于 2 人 → Bracket 报错', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })

      const res = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 比赛结果 & 排名 ==========

describe('E2E: 比赛结果与排名', () => {
  it('录入比赛结果 → 自动更新 ranking + 比赛 completed', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm2' })

      const bracket = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)
      const match = bracket.body.data[0]
      const matchId = match.id

      // shuffleArray 随机配对,player1/player2 不固定。
      // 让 score1=player1 赢 → winner = player1
      const result = await request(app.getHttpServer())
        .put(`/tournament/matches/${matchId}/result`)
        .set(TENANT_HEADERS)
        .send({ score1: 21, score2: 15 })
      assert.equal(result.statusCode, 200)
      assert.equal(result.body.data.status, MatchStatus.Completed)
      assert.equal(result.body.data.winnerId, match.player1Id, 'score1>score2 应让 player1 获胜')

      const rankings = await request(app.getHttpServer())
        .get(`/tournament/${id}/rankings`)
        .set(TENANT_HEADERS)
      assert.equal(rankings.statusCode, 200)
      // 胜利者排第 1
      const winnerRanking = rankings.body.data.find(
        (r: any) => r.memberId === match.player1Id
      )
      assert.equal(winnerRanking.rank, 1)
      assert.equal(winnerRanking.wins, 1)
      assert.equal(winnerRanking.points, 3)
    } finally {
      await app.close()
    }
  })

  it('比赛争议: PUT /dispute 转 disputed', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm2' })
      const bracket = await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .put(`/tournament/matches/${bracket.body.data[0].id}/dispute`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.status, MatchStatus.Disputed)
    } finally {
      await app.close()
    }
  })

  it('GET /tournament/:id/matches?status=Pending 过滤', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app)
      const id = create.body.data.id
      await openTournament(app, id)
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm1' })
      await request(app.getHttpServer())
        .post(`/tournament/${id}/register`)
        .set(TENANT_HEADERS)
        .send({ memberId: 'm2' })
      await request(app.getHttpServer())
        .post(`/tournament/${id}/bracket`)
        .set(TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .get(`/tournament/${id}/matches?status=${MatchStatus.Pending}`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      for (const m of res.body.data) assert.equal(m.status, MatchStatus.Pending)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 跨租户隔离 ==========

describe('E2E: 跨租户隔离', () => {
  it('tenant-B 看不到 tenant-A 的 tournament', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app, TENANT_HEADERS)
      const id = create.body.data.id

      const res = await request(app.getHttpServer())
        .get(`/tournament/${id}`)
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  it('tenant-B 列表只返回自己的', async () => {
    const { app } = await buildApp()
    try {
      await createTournament(app, TENANT_HEADERS, { name: 'A-1' })
      await createTournament(app, TENANT_B_HEADERS, { name: 'B-1' })

      const a = await request(app.getHttpServer())
        .get('/tournament')
        .set(TENANT_HEADERS)
      const b = await request(app.getHttpServer())
        .get('/tournament')
        .set(TENANT_B_HEADERS)
      assert.ok(a.body.data.every((t: any) => t.tenantId === 'tenant-001'))
      assert.ok(b.body.data.every((t: any) => t.tenantId === 'tenant-002'))
    } finally {
      await app.close()
    }
  })

  it('tenant-B 无法修改 tenant-A 的 tournament 状态', async () => {
    const { app } = await buildApp()
    try {
      const create = await createTournament(app, TENANT_HEADERS)
      const id = create.body.data.id

      const res = await request(app.getHttpServer())
        .put(`/tournament/${id}/status`)
        .set(TENANT_B_HEADERS)
        .send({ status: TournamentStatus.Open })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})
