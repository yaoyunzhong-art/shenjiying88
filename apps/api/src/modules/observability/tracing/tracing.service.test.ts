import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * TracingService Unit Tests
 *
 * 验证:
 *   - withSpan 包裹异步函数,正常返回 + 异常抛出
 *   - withSpanSync 同步版本
 *   - 异常时 span 自动 recordException + setStatus ERROR
 *   - 正常时 setStatus OK
 *   - currentSpan API
 *   - TRACING_CONFIG + initTracing() 行为
 */

import assert from 'node:assert/strict';
import { trace } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { TracingService } from './tracing.service';

// 模块顶层:设置全局 tracer provider 为我们的内存 provider
const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
trace.setGlobalTracerProvider(provider);

function findSpan(spans: ReadableSpan[], name: string): ReadableSpan | undefined {
  return spans.find((s) => s.name === name);
}

describe('TracingService — withSpan 异步', () => {
  it('正常返回: span 记录 OK 状态', async () => {
    const svc = new TracingService('test-svc');
    const result = await svc.withSpan('test.op', async (span) => {
      span.setAttribute('tenantId', 't-A');
      return 42;
    });
    assert.equal(result, 42);
    const spans = exporter.getFinishedSpans();
    const testSpan = findSpan(spans, 'test.op');
    assert.ok(testSpan, `应记录 test.op span, 实际 spans: ${spans.map((s) => s.name).join(',')}`);
    assert.equal(testSpan.status.code, 1); // OK
    assert.equal(testSpan.attributes.tenantId, 't-A');
  });

  it('抛错: span 记录 ERROR + exception + 重新抛', async () => {
    const svc = new TracingService('test-svc');
    await assert.rejects(
      svc.withSpan('test.err', async () => {
        throw new Error('boom');
      }),
      /boom/,
    );
    const spans = exporter.getFinishedSpans();
    const errSpan = findSpan(spans, 'test.err');
    assert.ok(errSpan, `应记录 test.err span, 实际 spans: ${spans.map((s) => s.name).join(',')}`);
    assert.equal(errSpan.status.code, 2); // ERROR
    assert.equal(errSpan.status.message, 'boom');
    assert.ok(errSpan.events.some((e) => e.name === 'exception'));
  });

  it('业务正常完成: span attributes + events 透传', async () => {
    const svc = new TracingService('test-svc');
    await svc.withSpan('cashier.createOrder', async (span) => {
      span.setAttribute('orderId', 'o-1');
      span.setAttribute('amount', 1000);
      span.addEvent('order_created', { sku: 'sku-A' });
    });
    const spans = exporter.getFinishedSpans();
    const orderSpan = findSpan(spans, 'cashier.createOrder');
    assert.ok(
      orderSpan,
      `应记录 cashier.createOrder, 实际 spans: ${spans.map((s) => s.name).join(',')}`,
    );
    assert.equal(orderSpan.attributes.orderId, 'o-1');
    assert.equal(orderSpan.attributes.amount, 1000);
    assert.ok(orderSpan.events.some((e) => e.name === 'order_created'));
  });
});

describe('TracingService — withSpanSync 同步', () => {
  it('正常返回', () => {
    const svc = new TracingService('test-svc');
    const result = svc.withSpanSync('sync.op', () => 'done');
    assert.equal(result, 'done');
    const spans = exporter.getFinishedSpans();
    assert.ok(
      findSpan(spans, 'sync.op'),
      `应记录 sync.op, 实际: ${spans.map((s) => s.name).join(',')}`,
    );
  });

  it('抛错捕获并重新抛', () => {
    const svc = new TracingService('test-svc');
    assert.throws(
      () =>
        svc.withSpanSync('sync.err', () => {
          throw new Error('sync-boom');
        }),
      /sync-boom/,
    );
    const spans = exporter.getFinishedSpans();
    const errSpan = findSpan(spans, 'sync.err');
    assert.ok(errSpan, `应记录 sync.err, 实际: ${spans.map((s) => s.name).join(',')}`);
    assert.equal(errSpan.status.code, 2);
  });
});

describe('TracingService — currentSpan API', () => {
  it('无 active span 时返回 noop span (不抛错)', () => {
    const svc = new TracingService('test-svc');
    const span = svc.currentSpan();
    assert.ok(span, 'currentSpan 应返回非空 Span (即使 noop)');
  });

  it('active span 内 currentSpan 返回真实 span context', async () => {
    const svc = new TracingService('test-svc');
    let capturedHasContext = false;
    await svc.withSpan('outer.span', async () => {
      const inner = svc.currentSpan();
      capturedHasContext = inner.spanContext().traceId.length === 32;
    });
    assert.equal(capturedHasContext, true, 'active span 应有 32 字符 traceId');
  });
});

describe('TRACING_CONFIG', () => {
  it('应包含 service/version/env/exporter 字段', async () => {
    const mod = await import('./tracing');
    const cfg = mod.TRACING_CONFIG;
    assert.equal(typeof cfg.serviceName, 'string');
    assert.equal(typeof cfg.serviceVersion, 'string');
    assert.equal(typeof cfg.deploymentEnv, 'string');
    assert.equal(typeof cfg.exporter, 'string');
    assert.equal(typeof cfg.otlpEndpoint, 'string');
  });

  it('ENABLE_TRACING=false 时应禁用 exporter', async () => {
    const previousEnableTracing = process.env.ENABLE_TRACING;
    const previousExporter = process.env.OTEL_TRACES_EXPORTER;
    vi.resetModules();
    process.env.ENABLE_TRACING = 'false';
    delete process.env.OTEL_TRACES_EXPORTER;

    const mod = await import('./tracing');
    assert.equal(mod.TRACING_CONFIG.exporter, 'none');

    if (previousEnableTracing === undefined) {
      delete process.env.ENABLE_TRACING;
    } else {
      process.env.ENABLE_TRACING = previousEnableTracing;
    }

    if (previousExporter === undefined) {
      delete process.env.OTEL_TRACES_EXPORTER;
    } else {
      process.env.OTEL_TRACES_EXPORTER = previousExporter;
    }
    vi.resetModules();
  });

  it('initTracing 幂等且不抛错', async () => {
    const mod = await import('./tracing');
    mod.initTracing();
    mod.initTracing();
    // 不抛错即为通过
  });

  it('shutdownTracing 安全调用 (无 SDK)', async () => {
    const mod = await import('./tracing');
    await mod.shutdownTracing();
    assert.ok(true, 'shutdownTracing 在无 SDK 时应直接返回');
  });
});

// 引用 NodeSDK 以确保导入路径有效 (避免 unused-import lint)
void NodeSDK;
