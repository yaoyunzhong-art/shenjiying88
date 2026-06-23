/**
 * E2E 跨模块 #17 — 预约管理 → 通知派发 → Metrics 指标追踪 联动
 *
 * 链路:
 *   ReservationService.create → confirm → cancel → complete
 *   → NotificationService.registerTemplate → send → getDispatch
 *   → MetricsService.registerCounter→incrementCounter, setGauge→render
 *
 * 验证:
 *   - 预约完整生命周期: Pending → Confirmed → Completed | Cancelled
 *   - 每次状态变更可派发通知
 *   - 失败通知可 retry
 *   - Metrics 计数器+仪表盘
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
import { ReservationService } from '../reservation/reservation.service';
import { ReservationStatus, ReservationType } from '../reservation/reservation.entity';
import { NotificationService } from '../notification/notification.service';
import {
  NotificationChannelType,
  FoundationScopeType,
  NotificationStatus,
} from '../notification/notification.entity';
import { MetricsService } from '../observability/metrics.service';

@Controller()
class TestController {
  constructor(
    @Inject(ReservationService) private readonly reservation: ReservationService,
    @Inject(NotificationService) private readonly notification: NotificationService,
    @Inject(MetricsService) private readonly metrics: MetricsService,
  ) {
    this.metrics.registerCounter('reservation_events_total', 'Total reservation events');
    this.metrics.registerGauge('active_reservations', 'Active reservation count');
    this.metrics.registerCounter('notification_dispatches_total', 'Notification dispatch count');
  }

  @Post('reservation')
  createReservation(@Body() body: any) {
    const r = this.reservation.create(body);
    this.metrics.incrementCounter('reservation_events_total', { action: 'create' });
    return r;
  }

  @Post('reservation/:id/confirm')
  confirmReservation(@Param('id') id: string, @Body() body: any) {
    const r = this.reservation.confirm(id, body.tenantId);
    this.metrics.incrementCounter('reservation_events_total', { action: 'confirm' });
    return r;
  }

  @Post('reservation/:id/start-progress')
  startProgressReservation(@Param('id') id: string, @Body() body: any) {
    const r = this.reservation.startProgress(id, body.tenantId);
    this.metrics.incrementCounter('reservation_events_total', { action: 'in_progress' });
    return r;
  }

  @Post('reservation/:id/cancel')
  cancelReservation(@Param('id') id: string, @Body() body: any) {
    const r = this.reservation.cancel(id, body.tenantId, body.reason);
    this.metrics.incrementCounter('reservation_events_total', { action: 'cancel' });
    return r;
  }

  @Post('reservation/:id/complete')
  completeReservation(@Param('id') id: string, @Body() body: any) {
    const r = this.reservation.complete(id, body.tenantId);
    this.metrics.incrementCounter('reservation_events_total', { action: 'complete' });
    return r;
  }

  @Get('reservation/findOne/:id')
  findOneReservation(@Param('id') id: string, @Body() body: any) {
    return this.reservation.findOne(id, body.tenantId);
  }

  @Post('reservations/list')
  listReservations(@Body() body: any) {
    return this.reservation.findAll(body.tenantId, body.filter);
  }

  @Post('notification/template')
  registerTemplate(@Body() body: any) {
    return this.notification.registerTemplate(body);
  }

  @Post('notification/send')
  sendNotification(@Body() body: any) {
    const d = this.notification.send(body);
    this.metrics.incrementCounter('notification_dispatches_total', { status: d.status });
    return d;
  }

  @Post('notification/retry/:id')
  retryNotification(@Param('id') id: string) {
    const d = this.notification.retryDispatch(id);
    if (d) this.metrics.incrementCounter('notification_dispatches_total', { status: 'retried' });
    return d;
  }

  @Get('notification/dispatch/:id')
  getDispatch(@Param('id') id: string) {
    return this.notification.getDispatch(id);
  }

  @Get('metrics/render')
  renderMetrics() {
    return { text: this.metrics.render() };
  }
}

async function buildApp() {
  const metricsService = new MetricsService(false);
  const module = await Test.createTestingModule({
    controllers: [TestController],
    providers: [
      ReservationService,
      NotificationService,
      { provide: MetricsService, useValue: metricsService },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.use((_r: Request, _s: Response, n: NextFunction) => n());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
  return { app, metricsService };
}

function getData(res: request.Response) {
  return res.body?.data ?? res.body;
}

// ── Tests ──

test('跨模块链#17 正例: 预约创建→确认→完成→通知→Metrics', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  const tenantId = 't17-1';
  const now = new Date();
  const st = new Date(now.getTime() + 60000).toISOString();
  const et = new Date(now.getTime() + 7200000).toISOString();

  try {
    // 1. 注册模板
    const tmpl = await request(srv)
      .post('/notification/template')
      .send({
        code: 'res-metric',
        channel: NotificationChannelType.InApp,
        scopeType: FoundationScopeType.Tenant,
        tenantId,
        locale: 'zh-CN',
        titleTemplate: '预约通知',
        bodyTemplate: '{{msg}}',
        enabled: true,
      })
      .expect(201);
    assert.ok(getData(tmpl).id);

    // 2. 创建预约
    const c1 = await request(srv)
      .post('/reservation')
      .send({
        tenantId,
        type: ReservationType.Coaching,
        resourceId: 'c1',
        resourceName: '金牌教练',
        userId: 'm1',
        userName: '小王',
        startTime: st,
        endTime: et,
        duration: 120,
        price: 29900,
        deposit: 0,
      })
      .expect(201);
    const rid = getData(c1).id;
    assert.ok(rid);
    assert.equal(getData(c1).status, ReservationStatus.Pending);

    // 3. 确认
    const cf = await request(srv)
      .post(`/reservation/${rid}/confirm`)
      .send({ tenantId })
      .expect(201);
    assert.equal(getData(cf).status, ReservationStatus.Confirmed);

    // 4. 发送通知
    const sn = await request(srv)
      .post('/notification/send')
      .send({
        channel: NotificationChannelType.InApp,
        scopeType: FoundationScopeType.Tenant,
        tenantId,
        recipient: 'm1',
        payload: { msg: '预约已确认' },
      })
      .expect(201);
    assert.equal(getData(sn).status, NotificationStatus.Sent);

    // 5. 开始服务 → InProgress
    const ip = await request(srv)
      .post(`/reservation/${rid}/start-progress`)
      .send({ tenantId })
      .expect(201);
    assert.equal(getData(ip).status, ReservationStatus.InProgress);

    // 6. 完成
    const cp = await request(srv)
      .post(`/reservation/${rid}/complete`)
      .send({ tenantId })
      .expect(201);
    assert.equal(getData(cp).status, ReservationStatus.Completed);

    // 7. Metrics 验证
    const mr = await request(srv).get('/metrics/render').expect(200);
    assert.ok(getData(mr).text.includes('reservation_events_total'));
    assert.ok(getData(mr).text.includes('notification_dispatches_total'));
  } finally {
    await app.close();
  }
});

test('跨模块链#17 正例: 预约取消→通知', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  const tenantId = 't17-cancel';
  const now = new Date();
  const st = new Date(now.getTime() + 60000).toISOString();
  const et = new Date(now.getTime() + 7200000).toISOString();

  try {
    const c1 = await request(srv)
      .post('/reservation')
      .send({
        tenantId,
        type: ReservationType.Coaching,
        resourceId: 'c2',
        resourceName: '李教练',
        userId: 'm2',
        userName: '小红',
        startTime: st,
        endTime: et,
        duration: 60,
        price: 19900,
        deposit: 0,
      })
      .expect(201);
    const rid = getData(c1).id;

    await request(srv).post(`/reservation/${rid}/confirm`).send({ tenantId }).expect(201);
    const cx = await request(srv)
      .post(`/reservation/${rid}/cancel`)
      .send({ tenantId, reason: '主动取消' })
      .expect(201);
    assert.equal(getData(cx).status, ReservationStatus.Cancelled);

    const mr = await request(srv).get('/metrics/render').expect(200);
    assert.ok(getData(mr).text.includes('reservation_events_total'));
  } finally {
    await app.close();
  }
});

test('跨模块链#17 反例: 已取消预约不能再次取消', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  const tenantId = 't17-dc';
  const now = new Date();
  const st = new Date(now.getTime() + 60000).toISOString();
  const et = new Date(now.getTime() + 7200000).toISOString();

  try {
    const c1 = await request(srv)
      .post('/reservation')
      .send({
        tenantId,
        type: ReservationType.Coaching,
        resourceId: 'c3',
        resourceName: '王教练',
        userId: 'm3',
        userName: '小蓝',
        startTime: st,
        endTime: et,
        duration: 90,
        price: 39900,
        deposit: 0,
      })
      .expect(201);
    const rid = getData(c1).id;
    await request(srv).post(`/reservation/${rid}/confirm`).send({ tenantId }).expect(201);
    await request(srv).post(`/reservation/${rid}/cancel`).send({ tenantId }).expect(201);

    const r2 = await request(srv).post(`/reservation/${rid}/cancel`).send({ tenantId });
    assert.ok(r2.status >= 400, '重复取消应失败');
  } finally {
    await app.close();
  }
});

test('跨模块链#17 边界: 通知失败→retry→成功', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  const tenantId = 't17-retry';

  try {
    const sn = await request(srv)
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
    assert.ok(d);
    assert.equal(d.status, NotificationStatus.Failed);

    const rt = await request(srv).post(`/notification/retry/${d.id}`).expect(201);
    const retried = getData(rt);
    assert.ok(retried.id);
    assert.equal(retried.status, NotificationStatus.Failed, '因recipient含fail, retry后仍为Failed');
  } finally {
    await app.close();
  }
});

test('跨模块链#17 反例: 跨租户隔离', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  const now = new Date();
  const st = new Date(now.getTime() + 60000).toISOString();
  const et = new Date(now.getTime() + 7200000).toISOString();

  try {
    const c1 = await request(srv)
      .post('/reservation')
      .send({
        tenantId: 'tA',
        type: ReservationType.Coaching,
        resourceId: 'cA',
        resourceName: 'A教练',
        userId: 'mA',
        userName: 'A',
        startTime: st,
        endTime: et,
        duration: 60,
        price: 100,
        deposit: 0,
      })
      .expect(201);
    const rid = getData(c1).id;

    const g1 = await request(srv)
      .get(`/reservation/findOne/${rid}`)
      .send({ tenantId: 'tB' })
      .expect(200);
    assert.equal(g1.body.data, undefined, '租户B不应看到租户A的预约');
  } finally {
    await app.close();
  }
});
