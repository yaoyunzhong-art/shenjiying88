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
import test, { describe } from 'node:test';
import { Controller, Get, Inject, Injectable } from '@nestjs/common';
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

  test('从 headers 提取 tenant / brand / store / market', () => {
    const req = makeReq({
      'x-tenant-id': 'tenant-X',
      'x-brand-id': 'brand-X',
      'x-store-id': 'store-X',
      'x-market-code': 'us-west',
    }) as TenantAwareRequest;
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

  test('headers 缺失 → 用默认值', () => {
    const req = makeReq({}) as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.deepEqual(req.tenantContext, DEFAULT_TENANT_CONTEXT);
  });

  test('headers 存在但值为空字符串 → 用默认值(不传空字符串到下游)', () => {
    const req = makeReq({
      'x-tenant-id': '',
      'x-brand-id': '',
    }) as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.equal(req.tenantContext?.tenantId, 'tenant-A');
    assert.equal(req.tenantContext?.brandId, 'brand-A');
  });

  test('部分 headers 提供 → 已提供字段取 header,未提供字段用默认', () => {
    const req = makeReq({
      'x-tenant-id': 'tenant-mix',
    }) as TenantAwareRequest;
    attachTenantContextFromHeaders(req, {} as Response, () => {});
    assert.equal(req.tenantContext?.tenantId, 'tenant-mix');
    assert.equal(req.tenantContext?.brandId, 'brand-A'); // 默认
    assert.equal(req.tenantContext?.storeId, 'store-A'); // 默认
  });

  test('DEFAULT_TENANT_CONTEXT 是稳定快照', () => {
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

  test('最小配置: controllers + providers 启动并响应', async () => {
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

  test('applyTenantContext=false → 不挂租户中间件 (自定义场景)', async () => {
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

  test('extraMiddlewares 顺序正确 (在 tenant 上下文之后)', async () => {
    let order: string[] = [];
    const trackingMw: (req: Request, _res: Response, next: NextFunction) => void = (
      req,
      _res,
      next,
    ) => {
      order.push('extra-after-tenant');
      // 校验 tenant context 已经被 attachTenantContextFromHeaders 挂上
      const ctx = (req as TenantAwareRequest).tenantContext;
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

  test('applyResponseInterceptor=false → 响应是裸数据', async () => {
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
});

describe('TestController 装饰器', () => {
  test('打 is_test_controller metadata (便于 grep)', () => {
    @TestController()
    class DummyController {}

    const flags = Reflect.getMetadata('is_test_controller', DummyController);
    assert.equal(flags, true, 'should set is_test_controller=true metadata');
  });

  test('不影响 @Controller 装饰器共存', () => {
    @TestController()
    @Controller('coexist')
    class CoexistController {}

    const flags = Reflect.getMetadata('is_test_controller', CoexistController);
    const path = Reflect.getMetadata('path', CoexistController);
    assert.equal(flags, true);
    assert.equal(path, 'coexist');
  });
});
