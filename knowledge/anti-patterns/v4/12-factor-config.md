# 反模式库 v4 · 12-factor-config (12 因子配置)

> **创建时间**: 2026-06-27 23:05 CST (1h 冲刺 Part 9)
> **分类**: 工程效率 · 配置管理
> **目标读者**: 后端工程师 + 全栈 + SRE

---

## 0. 12-Factor Config 核心原则

12-Factor App 第 III 因子:**Config** — 配置文件应从代码中严格分离,在环境变量中存储。

```
✅ 正确: 12-factor app = 单一 codebase + 多环境配置
❌ 错误: 代码中硬编码 / 多分支环境 / .env 入库
```

---

## 1. ❌ 反模式 1: 配置硬编码

```typescript
// BAD: 数据库连接字符串硬编码
const dbUrl = 'postgresql://prod_user:Prod@2026!@db.shenjiying88.cn:5432/shenjiying_prod';

// 问题:
// 1. 测试/生产环境同代码 → 部署即爆
// 2. 密钥入库 → git 泄露 → 立即轮换
// 3. 改配置 = 改代码 = 走 CI/CD → 慢
```

### ✅ 最佳实践: 环境变量 + ConfigService

```typescript
// GOOD: 12-factor 配置
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  constructor(private config: ConfigService) {}

  get url(): string {
    return this.config.getOrThrow<string>('DATABASE_URL');
    // 启动时缺失 → 立即抛错,绝不静默 fallback
  }
}

// .env (本地开发,gitignored)
DATABASE_URL=postgresql://dev:dev@localhost:5432/dev

// .env.production (K8s Secret 注入)
DATABASE_URL=postgresql://prod:${DB_PASSWORD}@db.prod:5432/prod
```

**效果**:
- 同一份代码,5 个环境(dev/staging/preprod/prod/drc)
- 配置改 = 重启 pod,无需 rebuild 镜像
- 密钥不进 git,不入 image layer

---

## 2. ❌ 反模式 2: 多分支环境

```bash
# BAD: 按环境分支
git checkout -b production   # 改 prod-only 配置
git checkout -b staging      # 改 staging-only 配置

# 问题:
// 1. 分支 drift → prod 分支和 main 半年后无法 merge
// 2. hotfix 必须 cherry-pick 4 个分支
// 3. 新人 onboarding → "环境分支"变成禁忌话题
```

### ✅ 最佳实践: 单一 codebase + 环境变量

```bash
# GOOD: 12-factor 单一代码库
git checkout main
# 5 个环境只差环境变量
DATABASE_ENV=prod ./deploy.sh
DATABASE_ENV=staging ./deploy.sh
DATABASE_ENV=dev ./start.sh

# K8s Deployment
env:
  - name: DATABASE_ENV
    value: production
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: db-prod-secret
        key: url
```

---

## 3. ❌ 反模式 3: 配置静默 fallback

```typescript
// BAD: 缺失配置用默认值掩盖
const port = process.env.PORT || 3000;     // 看似合理
const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost/dev';  // ❌ 生产用 dev db!

// 问题:
// 1. 配置缺失 → 用默认值 → 生产环境连 dev db → 数据错乱
// 2. 排查困难 → "明明配置了为啥没生效" → 看日志发现默认值覆盖
```

### ✅ 最佳实践: 启动期 fail-fast

```typescript
// GOOD: 启动期严格校验
import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvSchema {
  @IsString()
  DATABASE_URL!: string;

  @IsNumber()
  PORT!: number;

  @IsString()
  @IsIn(['development', 'staging', 'production'])
  NODE_ENV!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvSchema, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation failed: ${errors.toString()}`);
    // 启动失败,K8s 重启 → ConfigMap 缺失告警
  }
  return validated;
}
```

**效果**:
- 启动期 fail-fast (3 秒内退出)
- K8s CrashLoopBackOff → ConfigMap 没 mount → 立刻发现
- 不再有"生产用 dev db"灾难

---

## 4. ❌ 反模式 4: .env 入库

```bash
# BAD: .env 入 git
git add .env
git commit -m "add env config"
git push origin main

# 后果:
// 1. 密钥泄露 → 立即轮换 DB / API / JWT secret
// 2. GitHub secret scanner 触发告警
// 3. 历史 commit 残留 → 即使删除文件,git history 还在
```

### ✅ 最佳实践: .gitignore + .env.example

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key

# .env.example (入库,无敏感信息)
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=replace-with-strong-secret-min-32-chars
STRIPE_API_KEY=sk_test_replace_me
LOG_LEVEL=info
```

**运维流程**:
1. 新人 clone → `cp .env.example .env` → 改本地值
2. 生产环境 → K8s Secret / Vault / AWS Secrets Manager
3. CI 环境 → GitHub Actions Secrets / GitLab CI Variables

---

## 5. ❌ 反模式 5: 配置散落各处

```typescript
// BAD: 配置散落各文件,无人知道在哪
const stripeKey = process.env.STRIPE_KEY;       // 文件 A
const sentryDsn = 'https://xxx@sentry.io/123'; // 文件 B 硬编码
const redisUrl = require('./config.json').redis;  // 文件 C require json
const maxUpload = require('./settings.js').upload; // 文件 D require js

// 问题:
// 1. 排查 "这个配置从哪来" → 翻 20 个文件
// 2. 新人不知道哪些是环境变量,哪些是文件
// 3. 测试 mock 困难
```

### ✅ 最佳实践: 集中 ConfigService

```typescript
// GOOD: 单一配置入口
// config/app.config.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 300,
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  },
  upload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 10 * 1024 * 1024,
  },
});

// app.module.ts
ConfigModule.forRoot({
  load: [appConfig],
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().required(),
    STRIPE_API_KEY: Joi.string().required(),
  }),
});

// 任何模块注入 ConfigService 即可
constructor(private config: ConfigService) {}
const apiKey = this.config.getOrThrow<string>('stripe.apiKey');
```

**优势**:
- 配置改动只动 1 个文件
- 测试时 mock ConfigService 即可
- 配置 schema 集中校验

---

## 6. ❌ 反模式 6: 配置无审计

```bash
# BAD: 配置改了,谁改的?什么时候改?为什么?无人知晓
kubectl edit configmap app-config   # 临时改
# 没有记录 → 下次部署被覆盖 → "咦我之前改的哪去了"
```

### ✅ 最佳实践: GitOps + ArgoCD/Flux

```yaml
# GOOD: 配置即代码 (Configuration as Code)
# gitops/config/production/app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  LOG_LEVEL: info
  MAX_UPLOAD_SIZE: "10485760"
  RATE_LIMIT_RPM: "1000"
---
# gitops/secrets/production/db-secret.yaml (sealed-secrets 加密)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-prod-secret
spec:
  encryptedData:
    DATABASE_URL: AgBxxxxx...(sealed)
```

**GitOps 流程**:
1. 改配置 → git commit → MR review
2. ArgoCD 自动 sync → K8s apply
3. 改配置历史 = git log (审计追溯)
4. 灾难恢复 = git revert (一键回滚)

---

## 7. ❌ 反模式 7: 密钥和配置混放

```bash
# BAD: ConfigMap 里塞密钥
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: postgresql://prod:Prod@2026!@db.prod:5432/prod  # ❌ 密钥泄露
  STRIPE_API_KEY: sk_live_xxxxx  # ❌ 密钥泄露
```

### ✅ 最佳实践: ConfigMap + Secret 分离

```bash
# GOOD: 非敏感 = ConfigMap,敏感 = Secret
# ConfigMap (git 可入库)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  PORT: "3000"
  DATABASE_HOST: db.prod.svc.cluster.local
  DATABASE_PORT: "5432"
  DATABASE_NAME: shenjiying_prod
---
# Secret (git 加密,sealed-secrets / External Secrets Operator)
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  DATABASE_PASSWORD: ${DB_PASSWORD}     # Vault 注入
  STRIPE_API_KEY: ${STRIPE_API_KEY}     # Vault 注入
  JWT_SECRET: ${JWT_SECRET}             # Vault 注入
```

**优势**:
- ConfigMap 可 git 入库,review 简单
- Secret 加密存储,RBAC 控制
- 密钥轮换不需重新构建镜像

---

## 8. ❌ 反模式 8: 配置热更新无设计

```typescript
// BAD: 期望运行时改 env var 生效
process.env.LOG_LEVEL = 'debug';  // 已经读过了,不会生效
// 配置在启动时加载,运行时改 env var = 无效
```

### ✅ 最佳实践: 设计时区分启动配置 / 运行时配置

```
启动配置 (env vars,变更需重启):
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- PORT

运行时配置 (ConfigMap watch / DB / Redis,变更无需重启):
- FEATURE_FLAGS
- RATE_LIMIT_RPM
- LOG_LEVEL
- BUSINESS_RULES
```

```typescript
// GOOD: 运行时配置从 DB/Redis 读取
@Injectable()
export class RuntimeConfigService {
  private cache = new Map<string, any>();

  constructor(
    private redis: RedisService,
    @InjectRepository(Config) private repo: Repository<Config>,
  ) {}

  async get<T>(key: string): Promise<T> {
    if (this.cache.has(key)) return this.cache.get(key);

    // L1: 内存缓存
    // L2: Redis (TTL 60s)
    // L3: DB (source of truth)
    const cached = await this.redis.get(`config:${key}`);
    if (cached) {
      const value = JSON.parse(cached);
      this.cache.set(key, value);
      return value;
    }

    const row = await this.repo.findOne({ where: { key } });
    if (!row) throw new Error(`Config ${key} not found`);

    await this.redis.setex(`config:${key}`, 60, JSON.stringify(row.value));
    this.cache.set(key, row.value);
    return row.value;
  }

  // 监听 Redis pub/sub 实现热更新
  @OnEvent('config.updated')
  handleConfigUpdate(key: string) {
    this.cache.delete(key);
  }
}
```

---

## 9. 配置中心 (Apollo / Nacos / Consul) 选型

| 维度 | Apollo (携程) | Nacos (阿里) | Consul (HashiCorp) |
|------|---------------|--------------|---------------------|
| 配置推送 | 实时 (HTTP 长轮询) | 实时 (gRPC) | watch 机制 |
| 版本管理 | 完善 (灰度/回滚) | 基础 | 基础 |
| 多环境 | 完善 (cluster) | namespace | datacenter |
| 权限 | 完善 (部门/应用/环境) | 基础 | ACL |
| 灰度发布 | 支持 | 不支持 | 不支持 |
| 客户端 SDK | Java/Go/Python/Node | Java/Go/Node | Go/Python/Node |
| **推荐场景** | **多团队/多环境/灰度** | **简单/国内生态** | **服务发现为主** |

**推荐**: 神机营 SaaS 用 **Apollo**
- 4 套环境 (dev/staging/preprod/prod) × 6 个应用 = 24 配置集
- 配置变更走审批 → 自动推送 → 审计追溯
- 灰度发布 (10% → 50% → 100%)

---

## 10. 配置管理自检清单

```markdown
### ✅ 启动期
- [ ] 所有 env var 在启动时校验 (class-validator / Joi)
- [ ] 缺失必需配置 → fail-fast 退出 (非默认值掩盖)
- [ ] 配置类型转换 (string → number / boolean)

### ✅ 存储
- [ ] .env 在 .gitignore
- [ ] .env.example 入库 (无敏感信息)
- [ ] Secret 用 K8s Secret / Vault,不用 ConfigMap
- [ ] 密钥定期轮换 (90 天)

### ✅ 运行时
- [ ] 启动配置 vs 运行时配置分离
- [ ] 运行时配置走 ConfigService (DB/Redis)
- [ ] 热更新有 pub/sub 通知

### ✅ 审计
- [ ] 配置即代码 (GitOps)
- [ ] ArgoCD / Flux 自动 sync
- [ ] 改配置 = MR review
- [ ] 历史可追溯 (git log)

### ✅ 安全
- [ ] 密钥不进 image layer
- [ ] 密钥不入 git
- [ ] RBAC 限制 Secret 访问
- [ ] Secret 加密 (sealed-secrets / External Secrets)
```

---

## 11. NestJS ConfigService 最佳实践

```typescript
// app.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,                    // 全局可用,无需重复 import
      cache: true,                       // 缓存 config 对象 (性能)
      envFilePath: ['.env.local', '.env'], // 本地开发
      validate,                          // 启动期校验
      expandVariables: true,             // 支持 ${VAR} 嵌套
    }),
  ],
})
export class AppModule {}

// config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

// 任何 service
@Injectable()
export class UserService {
  constructor(private config: ConfigService) {}

  getJwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
    // 启动期已校验,这里类型安全
  }
}
```

---

## 12. 📋 12-Factor Config 检查表 (神机营 SaaS v4.0 适配)

| # | 因子 | 状态 | 实施 |
|---|------|:----:|------|
| 1 | 单一 codebase | ✅ | monorepo (apps + packages) |
| 2 | 明确声明依赖 | ✅ | pnpm-lock.yaml |
| 3 | **Config (本文)** | ✅ | ConfigService + class-validator |
| 4 | 后端服务 | ✅ | BFF + 微服务 |
| 5 | 构建/发布/运行分离 | ✅ | Docker image immutable |
| 6 | 无状态进程 | ✅ | session in Redis |
| 7 | 端口绑定 | ✅ | PORT env var |
| 8 | 并发模型 | ✅ | pnpm cluster mode |
| 9 | 快速启动/优雅终止 | ✅ | preStop hook 15s |
| 10 | 开发/生产等价 | ✅ | docker-compose dev = K8s |
| 11 | 日志事件流 | ✅ | stdout → Loki |
| 12 | 管理进程 | ✅ | prisma migrate 一次性 |

---

## 13. 配置事故案例 (神机营历史)

### 🚨 事故 1: 密钥入库 (2025-Q3)
- 现象: .env 入 git → GitHub secret scanner 告警
- 影响: DB 密码、Stripe API key 泄露,紧急轮换
- 修复: 全员培训 12-factor,引入 sealed-secrets,加 pre-commit hook

### 🚨 事故 2: 环境分支 drift (2025-Q4)
- 现象: production 分支与 main 半年未 merge,冲突 200+ 文件
- 影响: hotfix 必须 cherry-pick 3 个分支
- 修复: 删除所有环境分支,统一 GitOps + ArgoCD

### 🚨 事故 3: ConfigMap 缺失 (2026-Q1)
- 现象: 新部署 fail-fast 退出了 5 分钟才发现
- 影响: 用户看到 503 错误 5 分钟
- 修复: 加 startupProbe + Slack 告警 (CrashLoopBackOff 立刻通知)

---

## 14. 与其他反模式关联

| 反模式 | 关系 |
|--------|------|
| [security-defense.md](./security-defense.md) | 配置 = 安全第一道防线 (密钥不进 git) |
| [docker-deploy.md](./docker-deploy.md) | ConfigMap/Secret 在 K8s 注入容器 |
| [k8s-manifest.md](./k8s-manifest.md) | Deployment envFrom configMapRef/secretRef |
| [observability.md](./observability.md) | 配置变更 = audit log |
| [data-migration.md](./data-migration.md) | 配置类迁移 = ConfigMap 版本管理 |
| [error-handling.md](./error-handling.md) | 配置缺失 = 启动期 fail-fast |

---

## 15. 总结: 配置管理银弹

> **核心**: 12-factor 单一代码库 + ConfigService 集中管理 + GitOps 审计追溯

```
✅ 单一 codebase
✅ 配置 = 环境变量,不入代码
✅ ConfigService 集中校验
✅ 启动期 fail-fast
✅ .env.gitignore + Secret 加密
✅ GitOps 配置即代码
✅ 启动配置 vs 运行时配置分离
✅ 密钥轮换 90 天
```

**神机营 v4.0 实践**: ConfigModule.forRoot + class-validator + Apollo 配置中心 + ArgoCD GitOps

---

> 📅 创建: 2026-06-27 23:05 CST · 反模式库 v4 · Part 9 · 12-factor-config
> 🦞🐜 龙虾哥 + 树哥trae 联合维护
