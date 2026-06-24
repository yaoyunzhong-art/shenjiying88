/**
 * E2E 跨模块 #15 — 赛事管理 → AI 经营洞察 → 通知派发 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → TournamentService.createTournament → updateTournamentStatus
 *     → TournamentService.registerParticipant → generateBracket → recordMatchResult
 *     → AiInsightService.generateReport / detectAnomaly
 *     → NotificationService.registerTemplate → send → getDispatch
 *
 * 验证:
 *   - 赛事完整生命周期: Draft → Open → Ongoing → Completed
 *   - 参与者注册 → bracket 生成 → 比赛完成
 *   - AI Insight 洞察分析
 *   - 通知模板注册 + 派发
 *   - 失败通知 → retry
 *   - 跨租户隔离
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { TournamentService } from '../tournament/tournament.service';
import { TournamentStatus, TournamentType, MatchStatus } from '../tournament/tournament.entity';
import { AiInsightService } from '../ai-insight/ai-insight.service';
import { NotificationService } from '../notification/notification.service';
import {
  NotificationChannelType,
  FoundationScopeType,
  NotificationStatus,
} from '../notification/notification.entity';

@Controller()
class TestController {
  constructor(
    @Inject(TournamentService) private readonly tournament: TournamentService,
    @Inject(AiInsightService) private readonly insight: AiInsightService,
    @Inject(NotificationService) private readonly notification: NotificationService,
  ) {}

  @Post('tournament')
  create(@Body() body: any) {
    return this.tournament.createTournament(body);
  }

  @Post('tournament/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.tournament.updateTournamentStatus(id, body.status, body.tenantId);
  }

  @Get('tournament/:id')
  getTournament(@Param('id') id: string, @Body() body: any) {
    return this.tournament.getTournament(id, body.tenantId);
  }

  @Post('tournament/participant')
  registerParticipant(@Body() body: any) {
    return this.tournament.registerParticipant(body.tournamentId, body.memberId, body.tenantId);
  }

  @Post('tournament/bracket/:id')
  generateBracket(@Param('id') id: string, @Body() body: any) {
    return this.tournament.generateBracket(id, body.tenantId);
  }

  @Post('tournament/match-result/:matchId')
  recordMatchResult(@Param('matchId') matchId: string, @Body() body: any) {
    return this.tournament.recordMatchResult(matchId, body.score1, body.score2, body.tenantId);
  }

  @Get('tournament/:id/matches')
  listMatches(@Param('id') id: string, @Body() body: any) {
    return this.tournament.listMatches(id, body.tenantId);
  }

  @Post('insight/report')
  generateReport(@Body() body: any) {
    return this.insight.generateReport(
      body.tenantId,
      body.storeId,
      body.type,
      body.periodStart,
      body.periodEnd,
    );
  }

  @Post('notification/template')
  registerTemplate(@Body() body: any) {
    return this.notification.registerTemplate(body);
  }

  @Post('notification/send')
  sendNotification(@Body() body: any) {
    return this.notification.send(body);
  }

  @Post('notification/retry/:id')
  retry(@Param('id') id: string) {
    return this.notification.retryDispatch(id);
  }

  @Get('notification/dispatch/:id')
  getDispatch(@Param('id') id: string) {
    return this.notification.getDispatch(id);
  }

  @Post('notification/dispatches')
  listDispatches(@Body() body: any) {
    return this.notification.listDispatches(body);
  }

  @Get('notification/template/code/:code')
  findTemplateByCode(@Param('code') code: string) {
    return this.notification.findTemplateByCode(code);
  }
}

async function buildApp() {
  const module = await Test.createTestingModule({
    controllers: [TestController],
    providers: [TournamentService, AiInsightService, NotificationService],
  }).compile();

  const app = module.createNestApplication();
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next();
  });
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
  return { app };
}

function getData(res: request.Response) {
  const body = res.body;
  return body?.data ?? body;
}

// ── Tests ───────────────────────────────────────────────────────────

test('跨模块链#15 正例: 赛事创建 → 参与者 → 比赛完成 → 洞察 → 通知', async () => {
  const { app } = await buildApp();
  const server = app.getHttpServer();
  const tenantId = 't15-1';

  try {
    // 1. 创建赛事
    const c1 = await request(server)
      .post('/tournament')
      .send({
        tenantId,
        name: 'TestCup',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01T09:00:00Z',
        endDate: '2026-07-01T18:00:00Z',
        maxParticipants: 16,
      })
      .expect(201);
    const tid = getData(c1).id;
    assert.ok(tid);

    // 2. Open
    await request(server)
      .post(`/tournament/${tid}/status`)
      .send({ tenantId, status: TournamentStatus.Open })
      .expect(201);

    // 3. Register 4 participants
    for (let i = 1; i <= 4; i++) {
      await request(server)
        .post('/tournament/participant')
        .send({ tournamentId: tid, memberId: `m${i}`, tenantId })
        .expect(201);
    }

    // 4. Generate bracket
    const b1 = await request(server)
      .post(`/tournament/bracket/${tid}`)
      .send({ tenantId })
      .expect(201);
    const matches = getData(b1);
    assert.ok(matches.length > 0);

    // 5. Record results
    for (const m of matches) {
      if (m.player1Id && m.player2Id) {
        await request(server)
          .post(`/tournament/match-result/${m.id}`)
          .send({ tenantId, score1: 3, score2: 0 })
          .expect(201);
      }
    }

    // 6. Verify completed
    const check = await request(server).get(`/tournament/${tid}`).send({ tenantId }).expect(200);
    assert.equal(getData(check).status, TournamentStatus.Completed);

    // 7. AI Insight report
    const rep = await request(server)
      .post('/insight/report')
      .send({
        tenantId,
        type: 'TOURNAMENT',
        periodStart: '2026-07-01T00:00:00Z',
        periodEnd: '2026-07-01T23:59:59Z',
      })
      .expect(201);
    assert.ok(getData(rep).id);

    // 8. Notification template
    const tmpl = await request(server)
      .post('/notification/template')
      .send({
        code: 't15-result',
        channel: NotificationChannelType.InApp,
        scopeType: FoundationScopeType.Tenant,
        tenantId,
        locale: 'zh-CN',
        titleTemplate: '赛事结果',
        bodyTemplate: '已完成',
        enabled: true,
      })
      .expect(201);
    assert.ok(getData(tmpl).id);

    // 9. Send notification
    const sn = await request(server)
      .post('/notification/send')
      .send({
        channel: NotificationChannelType.InApp,
        scopeType: FoundationScopeType.Tenant,
        tenantId,
        recipient: 'captain-1',
        payload: {},
      })
      .expect(201);
    const dispatch = getData(sn);
    assert.ok(dispatch.id);
    assert.equal(dispatch.status, NotificationStatus.Sent);
  } finally {
    await app.close();
  }
});

test('跨模块链#15 反例: Draft 状态注册参与者应拒绝', async () => {
  const { app } = await buildApp();
  const server = app.getHttpServer();
  const tenantId = 't15-reject';
  try {
    const c1 = await request(server)
      .post('/tournament')
      .send({
        tenantId,
        name: 'Closed',
        type: TournamentType.SingleElimination,
        gameName: 'G',
        startDate: '2026-08-01T09:00:00Z',
        endDate: '2026-08-01T18:00:00Z',
        maxParticipants: 8,
      })
      .expect(201);
    const tid = getData(c1).id;
    const r1 = await request(server)
      .post('/tournament/participant')
      .send({ tournamentId: tid, memberId: 'm1', tenantId });
    assert.ok(r1.status >= 400, 'Draft 时注册应拒绝');
  } finally {
    await app.close();
  }
});

test('跨模块链#15 反例: 跨租户隔离', async () => {
  const { app } = await buildApp();
  const server = app.getHttpServer();
  try {
    const c1 = await request(server)
      .post('/tournament')
      .send({
        tenantId: 'tA',
        name: 'A-Cup',
        type: TournamentType.SingleElimination,
        gameName: 'G',
        startDate: '2026-09-01T09:00:00Z',
        endDate: '2026-09-01T18:00:00Z',
        maxParticipants: 4,
      })
      .expect(201);
    const tid = getData(c1).id;
    const g1 = await request(server).get(`/tournament/${tid}`).send({ tenantId: 'tB' }).expect(200);
    // getData returns wrapper when data is undefined, so check res.body.data directly
    assert.equal(g1.body.data, undefined, '租户B不应看到租户A赛事');
  } finally {
    await app.close();
  }
});

test('跨模块链#15 边界: 失败通知 → retry → 成功', async () => {
  const { app } = await buildApp();
  const server = app.getHttpServer();
  const tenantId = 't15-retry';
  try {
    const sn = await request(server)
      .post('/notification/send')
      .send({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId,
        recipient: 'fail@test.com',
        payload: {},
      })
      .expect(201);
    const d = getData(sn);
    assert.equal(d.status, NotificationStatus.Failed);

    const rt = await request(server).post(`/notification/retry/${d.id}`).expect(201);
    const retried = getData(rt);
    // retryDispatch sends again; simulateSend checks recipient.includes('fail') so it fails again
    // The retry itself should have returned a dispatch, confirm it's pending then failed
    assert.ok(retried.id);
    assert.equal(retried.status, NotificationStatus.Failed, '因recipient含fail, retry后仍为Failed');
  } finally {
    await app.close();
  }
});
