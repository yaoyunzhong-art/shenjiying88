/**
 * 跨模块 E2E 测试通用 helper
 *
 * 解决问题: #15-#20 共 6 个 e2e 文件, 每个都重复:
 *   1. attachTenantContext 中间件 (从 x-tenant-id / x-brand-id / x-store-id /
 *      x-market-code headers 提取并挂到 req.tenantContext)
 *   2. TestController 包装 4-5 个 service (按测试场景灵活)
 *   3. Test.createTestingModule({ controllers, providers }) 4-6 行
 *   4. app.use(attachTenantContext) + app.init()
 *
 * 每个文件约 30 行重复 boilerplate。沉淀后:
 *   - 新 e2e 文件 → ~10 行 setup
 *   - 租户字段名 / 默认值 / 解析规则 集中在一处
 *   - 未来加新 header (e.g. x-actor-id) → 改 helper,所有 e2e 自动跟随
 *
 * 设计选择:
 *   - 默认值 'tenant-A' / 'brand-A' / 'store-A' / 'cn-mainland' 沿用 #19 既有约定
 *   - helper 不修改任何 service 内部状态,只设置 request 上下文
 *   - 暴露 generic `buildCrossModuleTestApp({ controllers, providers })` 让
 *     调用方决定要哪些 service;不强制全量注入
 *
 * ⚠️ tsx/esbuild 注意: 本项目测试用 tsx 跑 (esbuild-based),
 *    它**不** emit `__metadata("design:paramtypes", ...)` 用于隐式构造器参数。
 *    NestJS 依赖此 metadata 做 constructor injection,所以测试 controller
 *    **必须**在每个构造器参数上加显式 `@Inject(XXX)` 装饰器,
 *    不能靠 TypeScript 的类型推断。详见 test-helpers.test.ts 头部注释。
 *
 * 用法 (新 e2e 文件):
 *   ```ts
 *   import { attachTenantContextFromHeaders, buildCrossModuleTestApp } from './test-helpers'
 *
 *   @Controller()
 *   class TestController { ... }
 *
 *   test('scenario', async () => {
 *     const { app } = await buildCrossModuleTestApp({
 *       controllers: [TestController],
 *       providers: [MemberService, InventoryService], // 只放 service, controller 不用再列
 *       // applyTenantContext: true (默认) — 自动挂中间件
 *     })
 *     try {
 *       const res = await request(app.getHttpServer())
 *         .post('/test/...')
 *         .set('x-tenant-id', 'tenant-B')
 *         .send(...)
 *       assert.equal(res.statusCode, ...)
 *     } finally {
 *       await app.close()
 *     }
 *   })
 *   ```
 */

import { INestApplication, NestInterceptor, PipeTransform, SetMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { attachRequestContext } from '../observability/logger/request-context.middleware';
import type { NextFunction, Request, Response } from 'express';
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types';

// ─── 租户上下文中间件 (从 headers) ──────────────────────────────────────

const DEFAULT_TENANT_ID = 'tenant-A';
const DEFAULT_BRAND_ID = 'brand-A';
const DEFAULT_STORE_ID = 'store-A';
const DEFAULT_MARKET_CODE = 'cn-mainland';

const TENANT_HEADERS = {
  tenantId: 'x-tenant-id',
  brandId: 'x-brand-id',
  storeId: 'x-store-id',
  marketCode: 'x-market-code',
} as const;

function pickHeader(req: Request, header: string, fallback: string): string {
  const value = req.header(header);
  return (value && value.length > 0 ? value : fallback) as string;
}

/**
 * Express middleware: 从 x-tenant-id / x-brand-id / x-store-id / x-market-code
 * headers 提取并挂到 req.tenantContext。未提供时用默认值。
 */
export function attachTenantContextFromHeaders(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const ctx = req as TenantAwareRequest;
  ctx.tenantContext = {
    tenantId: pickHeader(req, TENANT_HEADERS.tenantId, DEFAULT_TENANT_ID),
    brandId: pickHeader(req, TENANT_HEADERS.brandId, DEFAULT_BRAND_ID),
    storeId: pickHeader(req, TENANT_HEADERS.storeId, DEFAULT_STORE_ID),
    marketCode: pickHeader(req, TENANT_HEADERS.marketCode, DEFAULT_MARKET_CODE),
  } satisfies RequestTenantContext;
  next();
}

/** 默认值 (供测试断言) */
export const DEFAULT_TENANT_CONTEXT: RequestTenantContext = {
  tenantId: DEFAULT_TENANT_ID,
  brandId: DEFAULT_BRAND_ID,
  storeId: DEFAULT_STORE_ID,
  marketCode: DEFAULT_MARKET_CODE,
};

// ─── App 工厂 ─────────────────────────────────────────────────────────

export interface BuildCrossModuleTestAppOptions {
  /** 控制器列表 (e.g. [TestController]) */
  controllers: Type<unknown>[];
  /** providers 列表,通常与 controllers 一致以让 @Inject() 解析;也可单独注入 */
  providers: unknown[];
  /** 是否自动挂载租户上下文中间件,默认 true */
  applyTenantContext?: boolean;
  /** 是否应用 ResponseInterceptor (统一 { code, data, meta } 格式),默认 true */
  applyResponseInterceptor?: boolean;
  /** 是否挂载 request-context 中间件 (x-request-id),默认 true */
  applyRequestContext?: boolean;
  /**
   * 自定义中间件列表 (在租户上下文之后挂载)。
   * 用法: 加业务特有的中间件 (e.g. 模拟 actor)
   */
  extraMiddlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  /**
   * 额外全局 Interceptor (在 ResponseInterceptor 之后追加)。
   * 用法: 测试可观测性 (e.g. MetricsInterceptor)、审计、链路等场景。
   */
  extraGlobalInterceptors?: NestInterceptor[];
  /**
   * 额外全局 Pipe (在 init 之前注册)。默认不挂任何 pipe。
   * 用法: 需要 ValidationPipe 时传 [new ValidationPipe({ ... })]
   */
  extraGlobalPipes?: PipeTransform[];
}

export interface BuiltCrossModuleTestApp {
  app: INestApplication;
  moduleRef: TestingModule;
}

/**
 * 一站式创建跨模块 E2E 测试 app:
 *   1. Test.createTestingModule({ controllers, providers })
 *   2. createNestApplication() + globalInterceptors
 *   3. 中间件链: request-context → tenant-context → extra
 *   4. app.init()
 *
 * 调用方负责 app.close() (推荐 try/finally)。
 *
 * 注意: 故意不挂 GlobalExceptionFilter — 现有跨模块 e2e (#15-#20) 依赖
 * NestJS 默认 500 行为,异常透传不被 catch。ExceptionFilter 留待调用方按需
 * 显式添加(避免改变现有断言)。
 */
export async function buildCrossModuleTestApp(
  options: BuildCrossModuleTestAppOptions,
): Promise<BuiltCrossModuleTestApp> {
  const {
    controllers,
    providers,
    applyTenantContext = true,
    applyResponseInterceptor = true,
    applyRequestContext = true,
    extraMiddlewares = [],
    extraGlobalInterceptors = [],
    extraGlobalPipes = [],
  } = options;

  const moduleRef = await Test.createTestingModule({
    controllers,
    providers: providers as never,
  }).compile();
  const app = moduleRef.createNestApplication();

  if (applyResponseInterceptor) {
    app.useGlobalInterceptors(new ResponseInterceptor());
  }
  for (const interceptor of extraGlobalInterceptors) {
    app.useGlobalInterceptors(interceptor);
  }
  for (const pipe of extraGlobalPipes) {
    app.useGlobalPipes(pipe);
  }
  if (applyRequestContext) {
    app.use(attachRequestContext);
  }
  if (applyTenantContext) {
    app.use(attachTenantContextFromHeaders);
  }
  for (const mw of extraMiddlewares) {
    app.use(mw);
  }

  await app.init();
  return { app, moduleRef };
}

/**
 * 装饰器组合:在 e2e 测试 controller 上挂常用元数据。
 * 用法: `@TestController() class MyController { ... }`
 * 实际效果仅为打 metadata(便于 grep "is_test_controller"),不强加 @Controller()
 * (让调用方显式声明路径更清晰)。
 */
export function TestController(): ClassDecorator {
  return (target) => {
    SetMetadata('is_test_controller', true)(target);
  };
}
