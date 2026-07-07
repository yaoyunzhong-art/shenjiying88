import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Logger Service Unit Tests
 *
 * 验证:
 *   - info/warn/error/debug 输出 JSON (生产模式)
 *   - child() 自动带上 bindings (requestId/tenantId)
 *   - redact 字段被替换为 [REDACTED]
 *   - 级别配置生效
 *   - x-request-id middleware 注入并回传
 */

import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { LoggerService, LOGGER_CONFIG, LOGGER_DESTINATION } from './logger.service';
import { attachRequestContext } from './request-context.middleware';

/** 构造一个捕获到内存的 logger */
function makeCapturingLogger(configOverrides: Record<string, any> = {}) {
  const lines: string[] = [];
  const stream = {
    write: (s: string) => {
      for (const line of s.split('\n')) {
        if (line.trim()) lines.push(line);
      }
      return true;
    },
  };
  const svc = new LoggerService(
    { level: 'info', pretty: false, redactPaths: [], serviceName: 'm5-test', ...configOverrides },
    stream as any,
  );
  return { svc, lines, stream };
}

describe('LoggerService — 基本输出', () => {
  it('info 输出 JSON 包含 msg + bindings', () => {
    const { svc, lines } = makeCapturingLogger();
    svc.info({ userId: 'u-1', action: 'login' }, 'user logged in');
    assert.equal(lines.length, 1);
    const obj = JSON.parse(lines[0]);
    assert.equal(obj.msg, 'user logged in');
    assert.equal(obj.userId, 'u-1');
    assert.equal(obj.action, 'login');
    assert.equal(obj.service, 'm5-test');
  });

  it('warn / error / debug 输出正确级别', () => {
    const { svc, lines } = makeCapturingLogger({ level: 'trace' });
    svc.debug({ k: 1 }, 'd-msg');
    svc.info({ k: 2 }, 'i-msg');
    svc.warn({ k: 3 }, 'w-msg');
    svc.error({ k: 4 }, 'e-msg');
    assert.equal(lines.length, 4);
    assert.equal(JSON.parse(lines[0]).level, 20); // debug
    assert.equal(JSON.parse(lines[1]).level, 30); // info
    assert.equal(JSON.parse(lines[2]).level, 40); // warn
    assert.equal(JSON.parse(lines[3]).level, 50); // error
  });
});

describe('LoggerService — child bindings', () => {
  it('child logger 自动带上 requestId/tenantId', () => {
    const { svc, lines } = makeCapturingLogger();
    const child = svc.child({ requestId: 'req-1', tenantId: 't-A' });
    child.info({ orderId: 'o-1' }, 'order created');
    const obj = JSON.parse(lines[0]);
    assert.equal(obj.requestId, 'req-1');
    assert.equal(obj.tenantId, 't-A');
    assert.equal(obj.orderId, 'o-1');
  });

  it('child of child 累加 bindings', () => {
    const { svc, lines } = makeCapturingLogger();
    const child = svc.child({ requestId: 'req-1' });
    const grand = child.child({ tenantId: 't-A' });
    grand.info({ orderId: 'o-1' }, 'order');
    const obj = JSON.parse(lines[0]);
    assert.equal(obj.requestId, 'req-1');
    assert.equal(obj.tenantId, 't-A');
  });
});

describe('LoggerService — redact', () => {
  it('敏感字段被替换为 [REDACTED] (嵌套)', () => {
    const { svc, lines } = makeCapturingLogger({
      redactPaths: ['*.password'],
    });
    svc.info({ user: { id: 'u-1', password: 'secret-pwd' } }, 'login attempt');
    const obj = JSON.parse(lines[0]);
    assert.equal(obj.user.password, '[REDACTED]');
    assert.equal(obj.user.id, 'u-1');
  });

  it('顶层 token 也可 redact', () => {
    const { svc, lines } = makeCapturingLogger({
      redactPaths: ['token'],
    });
    svc.info({ token: 'jwt-xyz', userId: 'u-1' }, 'login');
    const obj = JSON.parse(lines[0]);
    assert.equal(obj.token, '[REDACTED]');
    assert.equal(obj.userId, 'u-1');
  });
});

describe('LoggerService — 级别过滤', () => {
  it('level=warn 时 debug/info 不输出', () => {
    const { svc, lines } = makeCapturingLogger({ level: 'warn' });
    svc.debug({ k: 1 }, 'd');
    svc.info({ k: 2 }, 'i');
    svc.warn({ k: 3 }, 'w');
    svc.error({ k: 4 }, 'e');
    assert.equal(lines.length, 2, '仅 warn+error 输出');
    assert.equal(JSON.parse(lines[0]).level, 40);
    assert.equal(JSON.parse(lines[1]).level, 50);
  });
});

describe('attachRequestContext — middleware', () => {
  function mockReq(headers: Record<string, string> = {}): Request {
    return {
      header: (k: string) => headers[k.toLowerCase()],
    } as unknown as Request;
  }

  function mockRes(): { res: Response; headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k.toLowerCase()] = v;
      },
    } as unknown as Response;
    return { res, headers };
  }

  it('无入站 header 时生成 nanoid', () => {
    const req = mockReq();
    const { res, headers } = mockRes();
    let nextCalled = false;
    attachRequestContext(req, res, () => {
      nextCalled = true;
    });
    assert.ok(nextCalled);
    const ctx = req as Request & { requestId?: string };
    assert.ok(ctx.requestId, '应注入 requestId');
    assert.ok(ctx.requestId!.length >= 12, 'nanoid 默认 21 字符');
    assert.equal(headers['x-request-id'], ctx.requestId, '响应 header 同步');
  });

  it('入站 x-request-id 合法时被透传', () => {
    const req = mockReq({ 'x-request-id': 'inbound-1234567890' });
    const { res, headers } = mockRes();
    attachRequestContext(req, res, () => {});
    const ctx = req as Request & { requestId?: string };
    assert.equal(ctx.requestId, 'inbound-1234567890');
    assert.equal(headers['x-request-id'], 'inbound-1234567890');
  });

  it('入站 x-request-id 非法时生成新的', () => {
    const req = mockReq({ 'x-request-id': '<script>' });
    const { res } = mockRes();
    attachRequestContext(req, res, () => {});
    const ctx = req as Request & { requestId?: string };
    assert.notEqual(ctx.requestId, '<script>');
    assert.ok(ctx.requestId!.length >= 12);
  });

  it('W3C traceparent header 被解析', () => {
    const req = mockReq({ traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01' });
    const { res } = mockRes();
    attachRequestContext(req, res, () => {});
    const ctx = req as Request & { traceId?: string };
    assert.equal(ctx.traceId, '0af7651916cd43dd8448eb211c80319c');
  });

  it('非法 traceparent 被忽略', () => {
    const req = mockReq({ traceparent: 'garbage' });
    const { res } = mockRes();
    attachRequestContext(req, res, () => {});
    const ctx = req as Request & { traceId?: string };
    assert.equal(ctx.traceId, undefined);
  });
});
