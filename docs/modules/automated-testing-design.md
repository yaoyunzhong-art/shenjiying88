# P-54 自动化测试详细设计文档

## 1. 概述

### 1.1 模块定位
自动化测试系统是 M5 Platform V17 的质量保障核心，负责：
- **单元测试**: 服务/组件级别的隔离测试
- **集成测试**: API 接口、数据库、缓存的联合测试
- **E2E 测试**: Playwright 7 端覆盖 (Chrome/Firefox/WebKit/Edge/iOS/Android/Desktop)
- **性能测试**: 压测引擎、负载测试、稳定性测试
- **安全测试**: 漏洞扫描、OWASP 检查

### 1.2 核心目标
| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 单元测试覆盖率 | > 80% | 核心模块 >= 90% |
| API 测试覆盖率 | 100% | 所有公开接口 |
| E2E 关键路径覆盖 | 100% | 用户核心旅程 |
| CI 流水线通过率 | > 95% | 月度统计 |
| 测试执行时间 | < 10min | 完整流水线 |
| Bug 逃逸率 | < 5% | 生产环境 Bug |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        自动化测试系统架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CI/CD Pipeline                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │  Lint    │→ │  Build   │→ │  Unit    │→ │  Integ   │→ │  E2E   │  │   │
│  │  │  (1m)    │  │  (2m)    │  │  (3m)    │  │  (2m)    │  │  (5m)  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐ │
│  │   Unit Testing  │ Integration Test│   E2E Testing   │ Performance Test│ │
│  ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤ │
│  │ • Jest + ts-jest│ • Supertest     │ • Playwright    │ • k6 / Artillery│ │
│  │ • @nestjs/testing│ • Prisma test  │ • 7 browsers    │ • Load/Stress   │ │
│  │ • Coverage 80%+ │ • Mock Server   │ • Visual Compare│ • Chaos Eng.    │ │
│  │ • Snapshot Test │ • Contract Test │ • Mobile/Tablet │ • Soak Test     │ │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Test Infrastructure                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ Test DB    │  │ Test Redis │  │ Test MQ    │  │ S3/MinIO       │  │   │
│  │  │ (Postgres) │  │ (Ephemeral)│  │ (RabbitMQ) │  │ (File Storage) │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Reporting & Analytics                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ Allure     │  │ Coverage   │  │ TestRail   │  │ Slack/Email    │  │   │
│  │  │ Reports    │  │ Reports    │  │ Integration│  │ Notifications  │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 测试策略

### 2.1 测试金字塔

```
                    ┌─────────┐
                    │  E2E    │  ← 关键用户旅程 (10%)
                    │ Tests   │     Playwright 7端
                    └────┬────┘
                   ┌─────┴─────┐
                   │ Integration│ ← API/DB集成 (20%)
                   │   Tests    │    Supertest + Prisma
                   └─────┬─────┘
              ┌───────────┴───────────┐
              │      Unit Tests       │ ← 业务逻辑 (70%)
              │   (Jest + ts-jest)    │    Services/Utils
              └───────────────────────┘
```

### 2.2 测试分层策略

| 层级 | 范围 | 工具 | 覆盖率目标 | 执行频率 |
|------|------|------|------------|----------|
| 单元测试 | Service/Util/Guard | Jest | 80%+ | 每次提交 |
| 集成测试 | API + DB + Cache | Supertest | 100% API | 每次提交 |
| E2E 测试 | 关键用户旅程 | Playwright | 100% 核心路径 | 每日/发布前 |
| 性能测试 | 负载/压力/稳定性 | k6/Artillery | 基准达标 | 每周 |
| 安全测试 | OWASP/漏洞扫描 | Snyk/OWASP ZAP | 高危清零 | 每月 |

---

## 3. 核心模块设计

### 3.1 单元测试框架

#### 3.1.1 Jest 配置

```typescript
// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // 预设
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 根目录
  roots: ['<rootDir>/src'],
  
  // 测试匹配模式
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // 转换器
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/main.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // 测试超时
  testTimeout: 10000,
  
  // 全局设置
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // 并行执行
  maxWorkers: '50%',
  
  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
};

export default config;
```

#### 3.1.2 测试工具类

```typescript
// test/utils/test-factory.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheModule } from '@nestjs/cache-manager';

/**
 * 测试数据库配置 (使用 SQLite 内存模式)
 */
export const testDatabaseConfig = {
  type: 'sqlite' as const,
  database: ':memory:',
  dropSchema: true,
  synchronize: true,
  logging: false,
  entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
};

/**
 * 测试模块工厂
 */
export class TestModuleFactory {
  private moduleRef: TestingModule | null = null;

  async create(options: {
    imports?: any[];
    controllers?: any[];
    providers?: any[];
    entities?: any[];
    enableCache?: boolean;
  } = {}): Promise<TestingModule> {
    const imports = [
      // 数据库
      TypeOrmModule.forRoot({
        ...testDatabaseConfig,
        entities: options.entities || [__dirname + '/../../src/**/*.entity{.ts,.js}'],
      }),
      
      // 缓存 (可选)
      ...(options.enableCache ? [CacheModule.register({ ttl: 60, max: 100 })] : []),
      
      ...(options.imports || []),
    ];

    this.moduleRef = await Test.createTestingModule({
      imports,
      controllers: options.controllers || [],
      providers: options.providers || [],
    }).compile();

    return this.moduleRef;
  }

  async close(): Promise<void> {
    if (this.moduleRef) {
      const dataSource = this.moduleRef.get(DataSource);
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      await this.moduleRef.close();
      this.moduleRef = null;
    }
  }
}

/**
 * 测试数据构建器
 */
export class TestDataBuilder {
  private data: Record<string, any> = {};

  with<T extends object>(entity: string, overrides?: Partial<T>): this {
    const defaults = this.getDefaults(entity);
    this.data[entity] = { ...defaults, ...overrides };
    return this;
  }

  build<T = any>(): T {
    return this.data as T;
  }

  private getDefaults(entity: string): Record<string, any> {
    const defaults: Record<string, any> = {
      user: {
        id: `user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'user',
        isActive: true,
      },
      tenant: {
        id: `tenant-${Date.now()}`,
        name: 'Test Tenant',
        status: 'active',
        plan: 'professional',
      },
      coupon: {
        id: `coupon-${Date.now()}`,
        code: `TEST${Date.now()}`,
        type: 'percentage',
        value: 10,
        status: 'active',
      },
    };
    return defaults[entity] || {};
  }
}

// 全局测试工具导出
export const createTestModule = (options?: any) => new TestModuleFactory().create(options);
export const createTestData = () => new TestDataBuilder();
```

### 3.1.3 示例测试用例

```typescript
// src/modules/coupon/__tests__/coupon.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CouponService } from '../coupon.service';
import { CouponV2 } from '../coupon.entity';
import { CouponRedemptionLog } from '../coupon-redemption-log.entity';
import { TestModuleFactory, TestDataBuilder } from '../../../../test/utils/test-factory';

describe('CouponService', () => {
  let service: CouponService;
  let couponRepo: Repository<CouponV2>;
  let redemptionRepo: Repository<CouponRedemptionLog>;
  let dataSource: DataSource;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    const factory = new TestModuleFactory();
    moduleRef = await factory.create({
      providers: [CouponService],
      entities: [CouponV2, CouponRedemptionLog],
    });

    service = moduleRef.get<CouponService>(CouponService);
    couponRepo = moduleRef.get<Repository<CouponV2>>(getRepositoryToken(CouponV2));
    redemptionRepo = moduleRef.get<Repository<CouponRedemptionLog>>(getRepositoryToken(CouponRedemptionLog));
    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await redemptionRepo.clear();
    await couponRepo.clear();
  });

  describe('create', () => {
    it('should create a new coupon successfully', async () => {
      // Arrange
      const couponData = {
        code: 'TEST10',
        tenantId: 'tenant-1',
        scope: { type: 'all' as const },
        redemptionRules: {
          minOrderAmount: 100,
          maxRedemptions: 100,
        },
        value: 10,
        valueType: 'percentage' as const,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      // Act
      const result = await service.create(couponData);

      // Assert
      expect(result).toBeDefined();
      expect(result.code).toBe(couponData.code);
      expect(result.tenantId).toBe(couponData.tenantId);
      expect(result.status).toBe('active');

      // Verify in database
      const savedCoupon = await couponRepo.findOne({ where: { id: result.id } });
      expect(savedCoupon).toBeDefined();
      expect(savedCoupon?.code).toBe(couponData.code);
    });

    it('should throw error when creating coupon with duplicate code', async () => {
      // Arrange
      const couponData = {
        code: 'DUPLICATE',
        tenantId: 'tenant-1',
        scope: { type: 'all' as const },
        redemptionRules: { minOrderAmount: 100 },
        value: 10,
        valueType: 'percentage' as const,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      // Create first coupon
      await service.create(couponData);

      // Act & Assert
      await expect(service.create(couponData)).rejects.toThrow();
    });
  });

  describe('redeemCrossStore', () => {
    it('should successfully redeem a valid coupon', async () => {
      // Arrange
      const coupon = await couponRepo.save({
        code: 'REDEEM10',
        tenantId: 'tenant-1',
        scope: { type: 'all' },
        redemptionRules: { minOrderAmount: 100 },
        value: 10,
        valueType: 'percentage',
        expiresAt: new Date(Date.now() + 86400000),
        status: 'active',
        maxRedemptions: 100,
        redemptionCount: 0,
      });

      const redemptionRequest = {
        couponId: coupon.id,
        orderId: 'order-123',
        storeId: 'store-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        orderAmount: 200,
      };

      // Act
      const result = await service.redeemCrossStore(redemptionRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.discountAmount).toBe(20); // 10% of 200

      // Verify coupon was updated
      const updatedCoupon = await couponRepo.findOne({ where: { id: coupon.id } });
      expect(updatedCoupon?.redemptionCount).toBe(1);

      // Verify redemption log was created
      const redemptionLog = await redemptionRepo.findOne({ 
        where: { couponId: coupon.id, orderId: 'order-123' } 
      });
      expect(redemptionLog).toBeDefined();
    });

    it('should fail when coupon is expired', async () => {
      // Arrange
      const coupon = await couponRepo.save({
        code: 'EXPIRED',
        tenantId: 'tenant-1',
        scope: { type: 'all' },
        redemptionRules: { minOrderAmount: 100 },
        value: 10,
        valueType: 'percentage',
        expiresAt: new Date(Date.now() - 86400000), // 已过期
        status: 'active',
        maxRedemptions: 100,
        redemptionCount: 0,
      });

      const redemptionRequest = {
        couponId: coupon.id,
        orderId: 'order-123',
        storeId: 'store-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        orderAmount: 200,
      };

      // Act
      const result = await service.redeemCrossStore(redemptionRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('COUPON_EXPIRED');
    });
  });
});
```

### 3.2.2 API 集成测试

```typescript
// test/integration/coupon-api.spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Coupon API Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = moduleRef.get(DataSource);

    // 获取认证 Token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });
    
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await dataSource.query('TRUNCATE TABLE coupon_redemption_logs CASCADE');
    await dataSource.query('TRUNCATE TABLE coupons CASCADE');
  });

  describe('POST /api/v1/coupons', () => {
    it('should create a new coupon', async () => {
      const couponData = {
        code: 'TEST20',
        scope: { type: 'all' },
        redemptionRules: { minOrderAmount: 100 },
        value: 20,
        valueType: 'percentage',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'tenant-1')
        .send(couponData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(couponData.code);
      expect(response.body.status).toBe('active');
    });

    it('should return 400 for invalid coupon data', async () => {
      const invalidData = {
        code: '', // 空 code
        value: -10, // 负值
      };

      await request(app.getHttpServer())
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'tenant-1')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('POST /api/v1/coupons/redeem', () => {
    beforeEach(async () => {
      // 创建测试优惠券
      await dataSource.query(`
        INSERT INTO coupons (id, code, tenant_id, scope, redemption_rules, value, value_type, expires_at, status, max_redemptions, redemption_count)
        VALUES ('coupon-1', 'REDEEM10', 'tenant-1', '{"type": "all"}', '{"minOrderAmount": 100}', 10, 'percentage', '${new Date(Date.now() + 86400000).toISOString()}', 'active', 100, 0)
      `);
    });

    it('should redeem a valid coupon', async () => {
      const redeemData = {
        couponId: 'coupon-1',
        orderId: 'order-123',
        storeId: 'store-1',
        userId: 'user-1',
        orderAmount: 200,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/coupons/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', 'tenant-1')
        .send(redeemData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.discountAmount).toBe(20); // 10% of 200
    });
  });
});
```

### 3.2.3 E2E 测试 (Playwright)

```typescript
// e2e/specs/coupon-journey.spec.ts
import { test, expect } from '@playwright/test';
import { CouponPage } from '../pages/coupon.page';
import { LoginPage } from '../pages/login.page';

test.describe('Coupon Redemption Journey', () => {
  let couponPage: CouponPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    couponPage = new CouponPage(page);
    loginPage = new LoginPage(page);

    // 登录
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword');
    
    // 验证登录成功
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('user can view available coupons', async ({ page }) => {
    // 导航到优惠券页面
    await couponPage.goto();

    // 验证页面标题
    await expect(page.getByRole('heading', { name: /优惠券/i })).toBeVisible();

    // 验证优惠券列表
    const couponCards = await page.locator('[data-testid="coupon-card"]').count();
    expect(couponCards).toBeGreaterThan(0);
  });

  test('user can claim a coupon', async ({ page }) => {
    await couponPage.goto();

    // 找到未领取的优惠券
    const unclaimedCoupon = page.locator('[data-testid="coupon-card"]:has([data-testid="claim-button"])').first();
    await expect(unclaimedCoupon).toBeVisible();

    // 点击领取按钮
    await unclaimedCoupon.locator('[data-testid="claim-button"]').click();

    // 验证领取成功提示
    await expect(page.getByText(/领取成功/i)).toBeVisible();

    // 验证按钮状态变为"已领取"
    await expect(unclaimedCoupon.locator('[data-testid="claimed-badge"]')).toBeVisible();
  });

  test('user can redeem a coupon during checkout', async ({ page }) => {
    // 添加商品到购物车
    await page.goto('/products');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    // 进入结算页面
    await page.goto('/checkout');

    // 验证优惠券输入框
    await expect(page.locator('[data-testid="coupon-input"]')).toBeVisible();

    // 输入优惠券码
    await page.locator('[data-testid="coupon-input"]').fill('SAVE10');
    await page.locator('[data-testid="apply-coupon"]').click();

    // 验证优惠券应用成功
    await expect(page.getByText(/优惠券已应用/i)).toBeVisible();

    // 验证折扣金额显示
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText('¥');
  });

  test('shows error for invalid coupon code', async ({ page }) => {
    await page.goto('/checkout');

    // 输入无效优惠券码
    await page.locator('[data-testid="coupon-input"]').fill('INVALID');
    await page.locator('[data-testid="apply-coupon"]').click();

    // 验证错误提示
    await expect(page.getByText(/优惠券无效或已过期/i)).toBeVisible();
  });

  test('shows error for already used coupon', async ({ page }) => {
    await page.goto('/checkout');

    // 输入已使用的优惠券
    await page.locator('[data-testid="coupon-input"]').fill('USED123');
    await page.locator('[data-testid="apply-coupon"]').click();

    // 验证错误提示
    await expect(page.getByText(/优惠券已被使用/i)).toBeVisible();
  });
});

// Page Object Model
// e2e/pages/coupon.page.ts
import { Page } from '@playwright/test';

export class CouponPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/coupons');
    await this.page.waitForLoadState('networkidle');
  }

  async getAvailableCoupons() {
    return this.page.locator('[data-testid="coupon-card"]').count();
  }

  async claimCoupon(index: number = 0) {
    const coupon = this.page.locator('[data-testid="coupon-card"]').nth(index);
    await coupon.locator('[data-testid="claim-button"]').click();
  }

  async searchCoupon(code: string) {
    await this.page.locator('[data-testid="coupon-search"]').fill(code);
    await this.page.keyboard.press('Enter');
  }
}
```

### 3.2.4 性能测试 (k6)

```typescript
// performance/coupon-load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const redeemSuccessRate = new Rate('redeem_success_rate');
const apiResponseTime = new Trend('api_response_time');

// 测试配置
export const options = {
  scenarios: {
    // 冒烟测试: 少量并发验证基本功能
    smoke: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 10,
      maxDuration: '1m',
      exec: 'smokeTest',
    },
    
    // 负载测试: 模拟正常业务负载
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // 2分钟 ramp up 到 50 VU
        { duration: '5m', target: 50 },   // 5分钟保持 50 VU
        { duration: '2m', target: 100 },  // 2分钟 ramp up 到 100 VU
        { duration: '5m', target: 100 },  // 5分钟保持 100 VU
        { duration: '2m', target: 0 },    // 2分钟 ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'loadTest',
    },
    
    // 压力测试: 找到系统瓶颈
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '5m', target: 0 },
      ],
      exec: 'stressTest',
    },
    
    // 峰值测试: 模拟突发流量
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '10s', target: 500 },  // 突然激增到 500 VU
        { duration: '3m', target: 500 },
        { duration: '10s', target: 10 },  // 快速回落
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'spikeTest',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    redeem_success_rate: ['rate>0.99'],
  },
};

// 基础 URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// 测试数据
const TEST_COUPONS = [
  { code: 'SAVE10', value: 10, type: 'percentage' },
  { code: 'SAVE20', value: 20, type: 'percentage' },
  { code: 'FLAT50', value: 50, type: 'fixed' },
];

// 辅助函数: 随机选择
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 辅助函数: 生成随机 ID
function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// 烟雾测试
export function smokeTest() {
  group('Smoke Test - Health Check', () => {
    const response = http.get(`${BASE_URL}/api/v1/health/ping`);
    
    check(response, {
      'health check returns 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
  });

  group('Smoke Test - Coupon List', () => {
    const response = http.get(`${BASE_URL}/api/v1/coupons`, {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': 'tenant-1',
      },
    });

    check(response, {
      'coupon list returns 200': (r) => r.status === 200,
      'response has items array': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      },
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(1);
}

// 负载测试
export function loadTest() {
  const userId = generateId('user');
  const tenantId = 'tenant-1';

  group('Load Test - Create Coupon', () => {
    const couponData = {
      code: `LOAD${Date.now()}`,
      scope: { type: 'all' },
      redemptionRules: { minOrderAmount: 100 },
      value: 10,
      valueType: 'percentage',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const response = http.post(`${BASE_URL}/api/v1/coupons`, JSON.stringify(couponData), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    check(response, {
      'create coupon returns 201': (r) => r.status === 201,
      'create coupon response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(response.timings.duration);
  });

  group('Load Test - Redeem Coupon', () => {
    // 获取可用优惠券
    const listResponse = http.get(`${BASE_URL}/api/v1/coupons?status=active&limit=1`, {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    if (listResponse.status === 200) {
      const body = JSON.parse(listResponse.body);
      const coupon = body.items?.[0];

      if (coupon) {
        const redeemData = {
          couponId: coupon.id,
          orderId: generateId('order'),
          storeId: 'store-1',
          userId: userId,
          tenantId: tenantId,
          orderAmount: 200,
        };

        const response = http.post(`${BASE_URL}/api/v1/coupons/redeem`, JSON.stringify(redeemData), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
            'x-tenant-id': tenantId,
          },
        });

        check(response, {
          'redeem returns 200': (r) => r.status === 200,
          'redeem success': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true;
          },
        });

        const body = JSON.parse(response.body);
        redeemSuccessRate.add(body.success ? 1 : 0);
        apiResponseTime.add(response.timings.duration);
      }
    }
  });

  group('Load Test - Query Coupons', () => {
    const response = http.get(`${BASE_URL}/api/v1/coupons?page=1&pageSize=20`, {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    check(response, {
      'query returns 200': (r) => r.status === 200,
      'query returns items': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      },
      'query response time < 200ms': (r) => r.timings.duration < 200,
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(Math.random() * 2 + 1); // 1-3s 随机间隔
}

// 压力测试
export function stressTest() {
  const tenantId = 'tenant-1';

  group('Stress Test - High Concurrency Coupon Creation', () => {
    const couponData = {
      code: `STRESS${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      scope: { type: 'all' },
      redemptionRules: { minOrderAmount: 100 },
      value: 10,
      valueType: 'percentage',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const response = http.post(`${BASE_URL}/api/v1/coupons`, JSON.stringify(couponData), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    check(response, {
      'stress test - create returns 201': (r) => r.status === 201,
      'stress test - response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    apiResponseTime.add(response.timings.duration);
  });

  group('Stress Test - Mass Redemption', () => {
    // 并发核销请求
    const redeemData = {
      couponId: 'stress-coupon-1',
      orderId: `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      storeId: 'store-1',
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenantId,
      orderAmount: 200 + Math.floor(Math.random() * 800),
    };

    const response = http.post(`${BASE_URL}/api/v1/coupons/redeem`, JSON.stringify(redeemData), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    check(response, {
      'stress test - redeem returns 200': (r) => r.status === 200,
    });

    const body = JSON.parse(response.body);
    redeemSuccessRate.add(body.success ? 1 : 0);
    apiResponseTime.add(response.timings.duration);
  });

  sleep(0.1); // 最小间隔，最大化并发
}

// 峰值测试
export function spikeTest() {
  const tenantId = 'tenant-1';

  group('Spike Test - Sudden Traffic Surge', () => {
    // 高优先级 API - 查询可用优惠券
    const response = http.get(`${BASE_URL}/api/v1/coupons?status=active&limit=50`, {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}`,
        'x-tenant-id': tenantId,
      },
    });

    check(response, {
      'spike test - query returns 200': (r) => r.status === 200,
      'spike test - response time < 300ms': (r) => r.timings.duration < 300,
    });

    apiResponseTime.add(response.timings.duration);
  });

  // 无间隔，模拟突发流量
}
```

---

## 4. CI/CD 流水线

### 4.1 GitHub Actions 配置

```yaml
# .github/workflows/test-pipeline.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  POSTGRES_VERSION: '16'
  REDIS_VERSION: '7'

jobs:
  # 阶段 1: 代码质量检查
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run Type Check
        run: pnpm typecheck

      - name: Check code formatting
        run: pnpm format:check

  # 阶段 2: 单元测试
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Unit Tests
        run: pnpm test:unit --coverage --coverageReporters=lcov --coverageReporters=text-summary

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-unit

  # 阶段 3: 集成测试
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:${{ env.REDIS_VERSION }}-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Integration Tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  # 阶段 4: E2E 测试
  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    timeout-minutes: 30

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps ${{ matrix.browser }}

      - name: Start application
        run: |
          pnpm build
          pnpm start:prod &
          npx wait-on http://localhost:3000/health --timeout 60000

      - name: Run E2E tests
        run: pnpm test:e2e -- --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
          retention-days: 30

      - name: Upload to Allure
        if: always()
        run: |
          pnpm allure generate ./allure-results --clean -o ./allure-report

  # 阶段 5: 性能测试
  performance-tests:
    name: Performance Tests (k6)
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    if: github.ref == 'refs/heads/main' || contains(github.event.head_commit.message, '[perf-test]')
    timeout-minutes: 60

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C780D0B1B82AA61A
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start application
        run: |
          pnpm install
          pnpm build
          pnpm start:prod &
          npx wait-on http://localhost:3000/health --timeout 60000

      - name: Run Smoke Test
        run: k6 run --out json=smoke-results.json performance/coupon-load-test.js
        env:
          BASE_URL: http://localhost:3000
          TEST_TOKEN: test-token

      - name: Run Load Test
        run: k6 run --out json=load-results.json --env SCENARIO=load performance/coupon-load-test.js
        env:
          BASE_URL: http://localhost:3000
          TEST_TOKEN: test-token

      - name: Generate Performance Report
        run: |
          node scripts/generate-perf-report.js

      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: performance-test-results
          path: |
            smoke-results.json
            load-results.json
            performance-report.html
          retention-days: 30

  # 阶段 6: 安全扫描
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit
        run: |
          npm audit --audit-level=high --json > npm-audit-results.json || true
          cat npm-audit-results.json

      - name: Run SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # 汇总报告
  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, performance-tests]
    if: always()
    
    steps:
      - name: Generate Summary
        run: |
          echo "## Test Pipeline Summary" >> $GITHUB_STEP_SUMMARY
          echo "- Unit Tests: ${{ needs.unit-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- Integration Tests: ${{ needs.integration-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- E2E Tests: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- Performance Tests: ${{ needs.performance-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

---

## 5. 测试数据管理

### 5.1 测试数据工厂

```typescript
// test/factories/coupon.factory.ts
import { DataSource } from 'typeorm';
import { CouponV2, CouponStatus, CouponScope, CouponValueType } from '../../src/modules/coupon/coupon.entity';

export interface CouponFactoryData {
  code?: string;
  tenantId?: string;
  scope?: CouponScope;
  redemptionRules?: Record<string, any>;
  value?: number;
  valueType?: CouponValueType;
  expiresAt?: Date;
  status?: CouponStatus;
  maxRedemptions?: number;
  redemptionCount?: number;
}

export class CouponFactory {
  constructor(private dataSource: DataSource) {}

  async create(data: CouponFactoryData = {}): Promise<CouponV2> {
    const repository = this.dataSource.getRepository(CouponV2);

    const coupon = repository.create({
      code: data.code || `TEST${Date.now()}`,
      tenantId: data.tenantId || 'tenant-default',
      scope: data.scope || { type: 'all' },
      redemptionRules: data.redemptionRules || { minOrderAmount: 100 },
      value: data.value ?? 10,
      valueType: data.valueType || 'percentage',
      expiresAt: data.expiresAt || new Date(Date.now() + 86400000),
      status: data.status || 'active',
      maxRedemptions: data.maxRedemptions ?? 100,
      redemptionCount: data.redemptionCount ?? 0,
    });

    return repository.save(coupon);
  }

  async createMany(count: number, data: CouponFactoryData = {}): Promise<CouponV2[]> {
    const coupons: CouponV2[] = [];
    for (let i = 0; i < count; i++) {
      coupons.push(await this.create({
        ...data,
        code: `${data.code || 'BATCH'}${i}`,
      }));
    }
    return coupons;
  }

  async cleanup(): Promise<void> {
    const repository = this.dataSource.getRepository(CouponV2);
    await repository.clear();
  }
}
```

### 5.2 测试数据种子

```typescript
// test/seeds/test-data.seed.ts
import { DataSource } from 'typeorm';
import { CouponFactory } from '../factories/coupon.factory';
import { UserFactory } from '../factories/user.factory';
import { TenantFactory } from '../factories/tenant.factory';

export interface SeedConfig {
  tenants?: number;
  usersPerTenant?: number;
  couponsPerTenant?: number;
}

export class TestDataSeeder {
  private couponFactory: CouponFactory;
  private userFactory: UserFactory;
  private tenantFactory: TenantFactory;

  constructor(private dataSource: DataSource) {
    this.couponFactory = new CouponFactory(dataSource);
    this.userFactory = new UserFactory(dataSource);
    this.tenantFactory = new TenantFactory(dataSource);
  }

  async seed(config: SeedConfig = {}): Promise<void> {
    const {
      tenants = 2,
      usersPerTenant = 5,
      couponsPerTenant = 10,
    } = config;

    console.log('🌱 Seeding test data...');

    // 创建租户
    for (let t = 0; t < tenants; t++) {
      const tenant = await this.tenantFactory.create({
        name: `Test Tenant ${t + 1}`,
      });

      console.log(`  ✓ Created tenant: ${tenant.name}`);

      // 创建用户
      for (let u = 0; u < usersPerTenant; u++) {
        await this.userFactory.create({
          tenantId: tenant.id,
          email: `user${u + 1}@tenant${t + 1}.com`,
        });
      }

      // 创建优惠券
      for (let c = 0; c < couponsPerTenant; c++) {
        const couponTypes = ['percentage', 'fixed'] as const;
        const type = couponTypes[c % 2];
        
        await this.couponFactory.create({
          tenantId: tenant.id,
          code: `${type.toUpperCase()}${c + 1}`,
          valueType: type,
          value: type === 'percentage' ? 10 + c * 5 : 50 + c * 10,
        });
      }
    }

    console.log('✅ Test data seeding complete!');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    await this.couponFactory.cleanup();
    await this.userFactory.cleanup();
    await this.tenantFactory.cleanup();
    
    console.log('✅ Cleanup complete!');
  }
}
```

---

## 6. 测试报告与分析

### 6.1 Allure 报告集成

```typescript
// test/reporters/allure-reporter.ts
import { AllureRuntime, AllureConfig } from 'allure-js-commons';

const allureConfig: AllureConfig = {
  resultsDir: './allure-results',
  reportDir: './allure-report',
};

export const allureRuntime = new AllureRuntime(allureConfig);

// Jest 集成
// jest.config.ts
export default {
  // ...其他配置
  reporters: [
    'default',
    ['jest-allure', {
      resultsDir: './allure-results',
    }],
  ],
};
```

### 6.2 覆盖率报告

```yaml
# .codecov.yml
codecov:
  require_ci_to_pass: yes

coverage:
  precision: 2
  round: down
  range: "70...100"

  status:
    project:
      default:
        target: 80%
        threshold: 2%
        if_ci_failed: error
        only_pulls: false
    patch:
      default:
        target: 80%
        threshold: 2%

parsers:
  gcov:
    branch_detection:
      conditional: yes
      loop: yes
      method: no
      macro: no

comment:
  layout: "reach,diff,flags,tree,files,footer"
  behavior: default
  require_changes: no
  require_head: no
  require_base: no
```

---

## 7. 监控与告警

### 7.1 测试指标

```yaml
# 测试监控指标
test_metrics:
  - name: test_execution_time
    description: 测试执行时间
    labels: [test_suite, test_case]
    
  - name: test_pass_rate
    description: 测试通过率
    labels: [test_suite, branch]
    
  - name: test_coverage_lines
    description: 行覆盖率
    labels: [module]
    
  - name: test_coverage_branches
    description: 分支覆盖率
    labels: [module]
    
  - name: ci_pipeline_duration
    description: CI 流水线执行时间
    labels: [pipeline_type, branch]
    
  - name: ci_pipeline_success_rate
    description: CI 流水线成功率
    labels: [pipeline_type]

# 告警规则
test_alerts:
  - name: LowTestPassRate
    condition: test_pass_rate < 0.9
    severity: critical
    
  - name: LowCoverage
    condition: test_coverage_lines < 0.7
    severity: warning
    
  - name: LongPipelineDuration
    condition: ci_pipeline_duration > 600
    severity: warning
    
  - name: CIFailureSpike
    condition: increase(ci_pipeline_failures[1h]) > 5
    severity: critical
```

---

## 8. 附录

### 8.1 测试命令速查表

```bash
# 单元测试
pnpm test:unit                    # 运行所有单元测试
pnpm test:unit -- --watch        # 监视模式
pnpm test:unit -- --coverage     # 生成覆盖率报告
pnpm test:unit -- --testNamePattern="redeem"  # 按名称过滤

# 集成测试
pnpm test:integration            # 运行集成测试

# E2E 测试
pnpm test:e2e                     # 运行所有 E2E 测试
pnpm test:e2e -- --project=chromium  # 仅 Chrome
pnpm test:e2e -- --headed         # 有界面模式
pnpm test:e2e -- --debug          # 调试模式

# 性能测试
pnpm test:perf                    # 运行性能测试
pnpm test:perf:smoke              # 冒烟测试
pnpm test:perf:load               # 负载测试
pnpm test:perf:stress             # 压力测试

# 全部测试
pnpm test:all                     # 运行所有测试

# 报告生成
pnpm test:report                  # 生成测试报告
pnpm test:report:allure           # 生成 Allure 报告
pnpm test:report:coverage         # 生成覆盖率报告
```

### 8.2 相关文档索引

| 文档 | 路径 | 描述 |
|------|------|------|
| SEO/GEO 设计 | [seo-geo-system-design.md](./seo-geo-system-design.md) | P-49 SEO 模块 |
| 性能优化设计 | [performance-optimization-design.md](./performance-optimization-design.md) | P-55 性能模块 |
| 运维手册 | [../operations/README.md](../operations/README.md) | 部署运维指南 |

---

**文档版本**: v1.0.0  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
