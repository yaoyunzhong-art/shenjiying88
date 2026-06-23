/**
 * E2E 跨模块 #16 — Observability 管道: Logger → Tracing → Metrics 联动
 *
 * 链路:
 *   LoggerService (info/child/redact/error)
 *   → TracingService (withSpan 正常/异常)
 *   → MetricsService (counter/gauge/histogram → render)
 *   → MetricsController.getMetrics (/metrics Prometheus 格式)
 *
 * 验证:
 *   - Logger 级别正确, child logger 继承 bindings, redact 敏感字段
 *   - Tracing span 正常 + 异常 (ERROR)
 *   - Metrics 多类型 + Prometheus 格式输出
 *   - 三门面不互相污染
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { LoggerService } from '../observability/logger/logger.service';
import { TracingService } from '../observability/tracing/tracing.service';
import { MetricsService } from '../observability/metrics.service';
import { MetricsController } from '../observability/metrics.controller';

const exporter = new InMemorySpanExporter();
trace.setGlobalTracerProvider(
  new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] }),
);

function findSpan(spans: ReadableSpan[], name: string): ReadableSpan | undefined {
  return spans.find((s) => s.name === name);
}

function buildCapturingStream() {
  const lines: string[] = [];
  return {
    lines,
    stream: {
      write: (s: string) => {
        for (const l of s.split('\n')) if (l.trim()) lines.push(l);
        return true;
      },
    },
  };
}

@Controller()
class TestController {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(TracingService) private readonly tracing: TracingService,
    @Inject(MetricsService) private readonly metrics: MetricsService,
  ) {
    this.metrics.registerCounter('test_requests', 'Test request counter');
    this.metrics.registerHistogram('test_duration_ms', 'Test duration histogram');
    this.metrics.registerGauge('test_connections', 'Test connections gauge');
  }

  @Post('log/info')
  logInfo(@Body() body: any) {
    this.logger.info({ action: body.action, userId: body.userId }, body.msg);
    return { ok: true };
  }

  @Post('log/child')
  logChild(@Body() body: any) {
    this.logger
      .child({ requestId: body.requestId, tenantId: body.tenantId })
      .info({ orderId: body.orderId }, 'child log with bindings');
    return { ok: true };
  }

  @Post('log/redact')
  logRedact() {
    this.logger.info({ password: 'secret123', token: 'tkn_abc' }, 'sensitive');
    return { ok: true };
  }

  @Post('trace/normal')
  async traceNormal(@Body() body: any) {
    return this.tracing.withSpan(body.spanName ?? 'test.normal', async (span) => {
      span.setAttribute('tenantId', body.tenantId);
      return { value: body.data ?? 1 };
    });
  }

  @Post('trace/error')
  async traceError(@Body() body: any) {
    try {
      await this.tracing.withSpan('test.error', async () => {
        throw new Error(body.msg ?? 'boom');
      });
    } catch {
      /* expected */
    }
    return { handled: true };
  }

  @Post('metrics/counter')
  incCounter(@Body() body: any) {
    this.metrics.incrementCounter('test_requests', {
      method: 'POST',
      path: '/test',
      status: '200',
    });
    return { ok: true };
  }

  @Post('metrics/histogram')
  obsHistogram(@Body() body: any) {
    this.metrics.observeHistogram('test_duration_ms', body.value ?? 50, { path: '/test' });
    return { ok: true };
  }

  @Post('metrics/gauge')
  setGaugeVal(@Body() body: any) {
    this.metrics.setGauge('test_connections', {}, body.value ?? 42);
    return { ok: true };
  }

  @Get('metrics/render')
  renderMetrics() {
    return { text: this.metrics.render() };
  }

  @Post('chain/obs-pipeline')
  async obsPipeline(@Body() body: any) {
    const reqLogger = this.logger.child({ requestId: body.requestId });
    this.metrics.incrementCounter('test_requests', {
      method: 'POST',
      path: '/chain/obs-pipeline',
      status: '200',
    });
    await this.tracing.withSpan('chain.obs', async (span) => {
      span.setAttribute('tenantId', body.tenantId);
      await this.tracing.withSpan('chain.obs.inner', async (innerSpan) => {
        innerSpan.setAttribute('count', body.count ?? 1);
        reqLogger.info({ action: 'inner-ok' }, 'inner log');
        this.metrics.observeHistogram('test_duration_ms', 50 + Math.random() * 100, {
          path: '/chain/obs-pipeline',
        });
      });
    });
    this.metrics.setGauge('test_connections', {}, 1);
    return { ok: true };
  }
}

async function buildApp() {
  const { lines, stream } = buildCapturingStream();
  const logger = new LoggerService(
    { level: 'trace', pretty: false, redactPaths: ['password', 'token'], serviceName: 'e2e-test' },
    stream as any,
  );
  const tracing = new TracingService('e2e');
  const metrics = new MetricsService(false);

  exporter.reset();
  const module = await Test.createTestingModule({
    controllers: [TestController, MetricsController],
    providers: [
      { provide: LoggerService, useValue: logger },
      { provide: TracingService, useValue: tracing },
      { provide: MetricsService, useValue: metrics },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.use((_r: Request, _s: Response, n: NextFunction) => n());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
  return { app, lines, metrics };
}

function getData(res: request.Response) {
  return res.body?.data ?? res.body;
}

// ── Tests ──

test('跨模块链#16 正例: Logger info/child/redact', async () => {
  const { app, lines } = await buildApp();
  const srv = app.getHttpServer();
  try {
    const n = lines.length;
    await request(srv).post('/log/info').send({ action: 'login', msg: 'hello' }).expect(201);
    await request(srv)
      .post('/log/child')
      .send({ requestId: 'r1', tenantId: 't1', orderId: 'o1' })
      .expect(201);
    await request(srv).post('/log/redact').expect(201);
    assert.ok(lines.length >= n + 3);
  } finally {
    await app.close();
  }
});

test('跨模块链#16 正例: child logger 继承 bindings', async () => {
  const { app, lines } = await buildApp();
  const srv = app.getHttpServer();
  try {
    const n = lines.length;
    await request(srv)
      .post('/log/child')
      .send({ requestId: 'r2', tenantId: 't2', orderId: 'o2' })
      .expect(201);
    const l = lines.slice(n).find((x) => x.includes('child log with bindings'));
    assert.ok(l);
    const p = JSON.parse(l!);
    assert.equal(p.requestId, 'r2');
    assert.equal(p.tenantId, 't2');
    assert.equal(p.orderId, 'o2');
  } finally {
    await app.close();
  }
});

test('跨模块链#16 正例: redact 生效', async () => {
  const { app, lines } = await buildApp();
  const srv = app.getHttpServer();
  try {
    const n = lines.length;
    await request(srv).post('/log/redact').expect(201);
    const l = lines.slice(n).find((x) => x.includes('sensitive'));
    assert.ok(l);
    const p = JSON.parse(l!);
    assert.match(String(p.password), /REDACTED/i, 'password 应被 redact');
    assert.match(String(p.token), /REDACTED/i, 'token 应被 redact');
  } finally {
    await app.close();
  }
});

test('跨模块链#16 正例: TracingService.withSpan 正常/异常', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  try {
    exporter.reset();
    await request(srv)
      .post('/trace/normal')
      .send({ spanName: 'my.op', tenantId: 't1', data: 42 })
      .expect(201);
    await request(srv).post('/trace/error').send({ msg: 'fail' }).expect(201);

    const spans = exporter.getFinishedSpans();
    const n = findSpan(spans, 'my.op');
    assert.ok(n, `应有 my.op: ${spans.map((s) => s.name)}`);
    assert.equal(n!.status.code, 1);

    const e = findSpan(spans, 'test.error');
    assert.ok(e, `应有 test.error: ${spans.map((s) => s.name)}`);
    assert.equal(e!.status.code, 2);
  } finally {
    await app.close();
  }
});

test('跨模块链#16 正例: Metrics counter/histogram/gauge', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  try {
    for (let i = 0; i < 3; i++) await request(srv).post('/metrics/counter').expect(201);
    await request(srv).post('/metrics/histogram').send({ value: 50 }).expect(201);
    await request(srv).post('/metrics/gauge').send({ value: 42 }).expect(201);

    const r = await request(srv).get('/metrics/render').expect(200);
    const text = getData(r).text;
    assert.ok(text.includes('test_requests'), `缺少 test_requests: ${text}`);
    assert.ok(text.includes('test_duration_ms'), `缺少 test_duration_ms`);
    assert.ok(text.includes('test_connections'));
  } finally {
    await app.close();
  }
});

test('跨模块链#16 正例: GET /metrics Prometheus 格式', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  try {
    const r = await request(srv).get('/metrics').expect(200);
    assert.ok(r.text.includes('HELP'));
    assert.ok(r.text.includes('TYPE'));
    assert.ok(r.text.includes('http_requests_total'));
  } finally {
    await app.close();
  }
});

test('跨模块链#16 复合: Logger+Tracing+Metrics 同时工作', async () => {
  const { app } = await buildApp();
  const srv = app.getHttpServer();
  try {
    exporter.reset();
    await request(srv)
      .post('/chain/obs-pipeline')
      .send({ requestId: 'r-obs', tenantId: 't-obs', count: 5 })
      .expect(201);
    const spans = exporter.getFinishedSpans();
    assert.ok(findSpan(spans, 'chain.obs'));
    assert.ok(findSpan(spans, 'chain.obs.inner'));
    const r = await request(srv).get('/metrics/render').expect(200);
    assert.ok(getData(r).text.includes('test_requests'));
  } finally {
    await app.close();
  }
});
