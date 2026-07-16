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
export const createTestModule =