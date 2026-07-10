import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * cross-module/test-helpers 单元测试
 *
 * 覆盖:
 *  - attachTenantContextFromHeaders: 从 headers 提取 / 默认值 / 透传
 *  - buildCrossModuleTestApp: 工厂模式启动 + 中间件链
 *  - TestController 装饰器: 仅 metadata, 不影响类本身
 *
 * ⚠️ tsx/esbuild 注意: 本项目用 tsx 跑测试 (esbuild-based),
 *    它**不** emit `__metadata("design:paramtypes", ...)` 用于隐式构造器参数。
 *    NestJS 依赖此 metadata 做 constructor injection,所以测试 controller
 *    **必须**在每个构造器参数上加显式 `@Inject(XXX)` 装饰器,
 *    不能靠 TypeScript 的类型推断。详见 #19 等 e2e 写法。
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Inject,
  Injectable,
  NestInterceptor,
  PipeTransform,
  Query,
} from '@nestjs/common';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import {
  attachTenantContextFromHeaders,
  buildCrossModuleTestApp,
  DEFAULT_TENANT_CONTEXT,
  TestController,
} from './test-helpers';
import type { TenantAwareRequest } from '../tenant/tenant.types';

describe('attachTenantContextFromHeaders', () => {
  function makeReq(headers: Record<string, string | undefined>): Request {
    return {
      header: (name: string) => {
        const lower = name.toLowerCase();
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase() === lower) return v;
        }
        return undefined;
      },
    } as unknown as Request;
  }

  it('从 headers 提取 tenant / brand / store / market', () => {
    const req = makeReq({
      'x-tenant-id': 'tenant-X',
      'x-brand-id': 'brand-X',
      'x-store-id': 'store-X',
      'x-market-code': 'us-west',
    }) as unknown as TenantAwareRequest;
    let nextCalled = false;
    attachTenantContextFromHeaders(req, {} as Response, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.deepEqual(req.tenantContext, {
      tenantId: 'tenant-X',
      brandId: 'brand-X',
      storeId: 'store-X',
      marketCode: 'us-west',
    });
  });

  it('headers 缺失 → 用默认值', () => {
    const req = makeReq({}) as unknown as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.deepEqual(req.tenantContext, DEFAULT_TENANT_CONTEXT);
  });

  it('headers 存在但值为空字符串 → 用默认值(不传空字符串到下游)', () => {
    const req = makeReq({
      'x-tenant-id': '',
      'x-brand-id': '',
    }) as unknown as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.equal(req.tenantContext?.tenantId, 'tenant-A');
    assert.equal(req.tenantContext?.brandId, 'brand-A');
  });

  it('部分 headers 提供 → 已提供字段取 header,未提供字段用默认', () => {
    const req = makeReq({
      'x-tenant-id': 'tenant-mix',
    }) as unknown as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.equal(req.tenantContext?.tenantId, 'tenant-mix');
    assert.equal(req.tenantContext?.brandId, 'brand-A'); // 默认
    assert.equal(req.tenantContext?.storeId, 'store-A'); // 默认
  });

  it('DEFAULT_TENANT_CONTEXT 是稳定快照', () => {
    assert.deepEqual(DEFAULT_TENANT_CONTEXT, {
      tenantId: 'tenant-A',
      brandId: 'brand-A',
      storeId: 'store-A',
      marketCode: 'cn-mainland',
    });
  });
});

describe('buildCrossModuleTestApp', () => {
  @Injectable()
  class StubService {
    echo(input: string) {
      return `echo:${input}`;
    }
  }

  @Controller('stub')
  class StubController {
    constructor(@Inject(StubService) public readonly service: StubService) {}

    @Get('echo')
    echo() {
      return this.service.echo('hello');
    }
  }

  it('最小配置: controllers + providers 启动并响应', async () => {
    const { app } = await buildCrossModuleTestApp({
      controllers: [StubController],
      providers: [StubService],
    });
    try {
      const res = await request(app.getHttpServer()).get('/stub/echo');
      assert.equal(res.statusCode, 200);
      assert.equal((res.body as { data: string }).data, 'echo:hello');
    } finally {
      await app.close();
    }
  });

  it('applyTenantContext=false → 不挂租户中间件 (自定义场景)', async () => {
    @Controller('no-tenant')
    class NoTenantController {
      constructor(@Inject(StubService) public readonly service: StubService) {}

      @Get('echo')
      echo() {
        return this.service.echo('no-tenant');
      }
    }

    const { app } = await buildCrossModuleTestApp({
      controllers: [NoTenantController],
      providers: [StubService],
      applyTenantContext: false,
    });
    try {
      const res = await request(app.getHttpServer()).get('/no-tenant/echo');
      assert.equal(res.statusCode, 200);
    } finally {
      await app.close();
    }
  });

  it('extraMiddlewares 顺序正确 (在 tenant 上下文之后)', async () => {
    const order: string[] = [];
    const trackingMw: (req: Request, _res: Response, next: NextFunction) => void = (
      req,
      _res,
      next,
    ) => {
      order.push('extra-after-tenant');
      // 校验 tenant context 已经被 attachTenantContextFromHeaders 挂上
      const ctx = (req as unknown as TenantAwareRequest).tenantContext;
      if (ctx?.tenantId === 'tenant-from-headers') {
        order.push('tenant-already-set');
      }
      next();
    };

    const tenantProbeMw: (req: Request, _res: Response, next: NextFunction) => void = (
      _req,
      _res,
      next,
    ) => {
      order.push('tenant-middleware');
      next();
    };

    @Controller('order-test')
    class OrderController {
      @Get('ping')
      ping() {
        return 'pong';
      }
    }

    const { app } = await buildCrossModuleTestApp({
      controllers: [OrderController],
      providers: [],
      extraMiddlewares: [tenantProbeMw, trackingMw],
    });
    try {
      const res = await request(app.getHttpServer())
        .get('/order-test/ping')
        .set('x-tenant-id', 'tenant-from-headers');
      assert.equal(res.statusCode, 200);
      // 中间件顺序: tenant-middleware (extra) → trackingMw
      // 但 attachTenantContextFromHeaders 在 extraMiddlewares 之前挂载
      assert.deepEqual(order, ['tenant-middleware', 'extra-after-tenant', 'tenant-already-set']);
    } finally {
      await app.close();
    }
  });

  it('applyResponseInterceptor=false → 响应是裸数据', async () => {
    @Controller('raw')
    class RawController {
      @Get('hello')
      hello() {
        return { value: 42 };
      }
    }

    const { app } = await buildCrossModuleTestApp({
      controllers: [RawController],
      providers: [],
      applyResponseInterceptor: false,
    });
    try {
      const res = await request(app.getHttpServer()).get('/raw/hello');
      assert.equal(res.statusCode, 200);
      // 没有 interceptor 包 { code, data, meta } 包装
      assert.equal((res.body as { value: number }).value, 42);
    } finally {
      await app.close();
    }
  });

  it('extraGlobalInterceptors → 业务 interceptor 被调用 (counter)', async () => {
    let counter = 0;

    @Injectable()
    class CountingInterceptor implements NestInterceptor {
      intercept(_ctx: ExecutionContext, next: CallHandler) {
        counter += 1;
        return next.handle();
      }
    }

    @Controller('counter')
    class CounterController {
      @Get('hit')
      hit() {
        return { ok: true };
      }
    }

    const { app } = await buildCrossModuleTestApp({
      controllers: [CounterController],
      providers: [],
      extraGlobalInterceptors: [new CountingInterceptor()],
    });
    try {
      await request(app.getHttpServer()).get('/counter/hit').expect(200);
      assert.equal(counter, 1, 'CountingInterceptor 应被调用 1 次');
    } finally {
      await app.close();
    }
  });

  it('extraGlobalPipes → pipe 在 controller 之前处理参数', async () => {
    class UppercasePipe implements PipeTransform<string, string> {
      transform(value: string): string {
        return value.toUpperCase();
      }
    }

    @Controller('echo')
    class EchoController {
      @Get('say')
      say(@Query('q') q: string) {
        return { echo: q };
      }
    }

    const { app } = await buildCrossModuleTestApp({
      controllers: [EchoController],
      providers: [],
      extraGlobalPipes: [new UppercasePipe()],
    });
    try {
      const res = await request(app.getHttpServer()).get('/echo/say?q=hello').expect(200);
      // 验证 pipe 把 q 改成大写
      const data = (res.body as { data?: { echo: string } }).data;
      if (data) {
        assert.equal(data.echo, 'HELLO');
      } else {
        assert.equal((res.body as { echo: string }).echo, 'HELLO');
      }
    } finally {
      await app.close();
    }
  });
});

describe('TestController 装饰器', () => {
  it('打 is_test_controller metadata (便于 grep)', () => {
    @TestController()
    class DummyController {}

    const flags = Reflect.getMetadata('is_test_controller', DummyController);
    assert.equal(flags, true, 'should set is_test_controller=true metadata');
  });

  it('不影响 @Controller 装饰器共存', () => {
    @TestController()
    @Controller('coexist')
    class CoexistController {}

    const flags = Reflect.getMetadata('is_test_controller', CoexistController);
    const path = Reflect.getMetadata('path', CoexistController);
    assert.equal(flags, true);
    assert.equal(path, 'coexist');
  });
});
