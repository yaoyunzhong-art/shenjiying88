# 认证模块 (Auth)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块负责多租户统一认证服务，提供完整的身份认证生命周期管理:

- **多方式登录** — 手机号+验证码 / 密码登录 / 微信登录 / SSO
- **Token管理** — 签发、验证、刷新、吊销 (AccessToken + RefreshToken)
- **会话管理** — 创建、活跃续期、过期回收、并发限制
- **密码策略** — 密码强度校验、合规检查
- **当前身份** — `GET /auth/me` 获取当前用户信息

边界约束:
- ❌ 不处理用户注册流程（见 `user` / `member` 模块）
- ❌ 不处理角色/权限定义和分配（见 RBAC 策略模块）
- ❌ 不处理第三方 OAuth 授权码交换（仅处理登录签名）
- ✅ 聚焦 身份验证 → Token签发 → 会话维护 → 登出吊销 的完整闭环

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

| 功能 | 描述 | 状态 |
|------|------|------|
| 短信验证码登录 | `POST /auth/login/sms` — 手机号+短信码 | ✅ IMPLEMENTED |
| 密码登录 | `POST /auth/login/password` — 手机号/邮箱+密码 | ✅ IMPLEMENTED |
| 微信登录 | `POST /auth/login/wechat` — 微信授权码 | ✅ IMPLEMENTED |
| Token刷新 | `POST /auth/refresh` — RefreshToken 换取新 TokenPair | ✅ IMPLEMENTED |
| 登出 | `POST /auth/logout` — 单会话/全会话登出 | ✅ IMPLEMENTED |
| 当前身份 | `GET /auth/me` — 当前用户信息 | ✅ IMPLEMENTED |
| 密码强度校验 | `validatePasswordPolicy()` — 8位+大小写+数字+特殊字符 | ✅ IMPLEMENTED |
| 并发会话限制 | SessionService — 最多5个并发会话，超限踢旧 | ✅ IMPLEMENTED |
| Token黑名单 | Token黑名单 + RefreshToken 一次性使用 | ✅ IMPLEMENTED |
| SSO 占位 | SSO_CONFIG — 配置占位, 生产替换 | 🔲 PLANNED |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/auth/
├── auth.module.ts               — NestJS 模块定义, 导出 AuthService/SessionService/TokenService
├── auth.controller.ts           — 统一认证 REST 控制器 (6 端点)
├── auth.service.ts              — 认证服务: 微服务编排层
├── auth.types.ts                — 类型定义: LoginType/Token/AuthResult/ErrorCode
├── auth.dto.ts                  — class-validator DTO: 请求/响应校验
├── auth.entity.ts               — 用户实体定义 (待迁移 TypeORM)
├── auth.contract.ts             — 接口合约: 编译期类型对齐检查
├── auth-password.policy.ts     — 密码策略: 强度校验 + SSO 配置占位
├── session.service.ts           — 会话管理: 创建/续期/吊销/并发控制
├── token.service.ts             — JWT Token: 签发/验证/刷新/黑名单
│
├── auth.controller.spec.ts      — 控制器单元测试
├── auth.controller.test.ts      — 控制器测试
├── auth.service.spec.ts         — 服务层 spec
├── auth.service.test.ts         — 服务层测试
├── auth.service-extra.spec.ts   — 服务层扩展测试
├── auth.dto.test.ts             — DTO 校验测试
├── auth.entity.test.ts          — 实体测试
├── auth.contract.test.ts        — 合约测试
├── auth.module.test.ts          — 模块测试
├── auth.e2e.test.ts             — E2E 端到端测试
│
├── auth.role.test.ts            — 角色权限测试
├── auth.role-extended.test.ts   — 角色权限扩展测试
├── auth.role-collaboration.test.ts — 角色协作测试
├── auth-ringbeam.test.ts        — RingBeam 集成测试
│
├── session.service.test.ts      — 会话服务测试
├── token.service.test.ts        — Token 服务测试
└── README.md                    — 本文档
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| POST | `/auth/login/sms` | @Public | 手机号+短信码登录 |
| POST | `/auth/login/password` | @Public | 密码登录 |
| POST | `/auth/login/wechat` | @Public | 微信登录 |
| POST | `/auth/refresh` | @Public | 刷新 TokenPair |
| POST | `/auth/logout` | @Public | 登出 (allSessions 控制范围) |
| GET  | `/auth/me` | @UseGuards(TenantGuard) | 当前用户信息 |

### Token 结构

```typescript
interface TokenPair {
  accessToken: string    // JWT, 2h 过期
  refreshToken: string   // JWT, 7d 过期, 一次性
  expiresIn: number      // 秒
  tokenType: 'Bearer'
}

// AccessToken Payload
interface AccessTokenPayload {
  sub: string            // userId
  tid: string            // tenantId
  bid?: string           // brandId
  sid?: string           // storeId
  roles: string[]        // 角色列表
  permissions: string[]  // 权限列表
  loginType: LoginType   // 登录方式
  jti: string            // token唯一ID (黑名单用)
}
```

### 认证流程

```
Login Request
  ↓
AuthController.validate(DTO)
  ↓
AuthService.login*(参数)
  ├─ 验证身份 (SMS码/密码/微信code)
  ├─ SessionService.createSession()
  ├─ TokenService.generateTokenPair()
  └─ 返回 AuthResult { user, tokens }
```

### 错误码

| 编码 | 含义 |
|------|------|
| AUTH_001 | 无效凭证 (手机号/密码/邮箱不对) |
| AUTH_002 | AccessToken 过期 |
| AUTH_003 | RefreshToken 过期 |
| AUTH_004 | 无效 Token |
| AUTH_005 | 账号锁定 |
| AUTH_008 | 短信验证码错误 |
| AUTH_011 | 微信登录失败 |
| AUTH_013 | 会话已过期 |
| AUTH_015 | 并发会话超限 |

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 值 | 说明 |
|------|-----|------|
| TOKEN_CONFIG.accessTokenExpiry | 7200s (2h) | AccessToken 有效期 |
| TOKEN_CONFIG.refreshTokenExpiry | 604800s (7d) | RefreshToken 有效期 |
| TOKEN_CONFIG.algorithm | HS256 | 对称签名算法 (Phase-46 切 RS256) |
| TOKEN_CONFIG.issuer | shenjiying-auth | JWT 签发者 |
| SESSION_CONFIG.maxConcurrentSessions | 5 | 最大并发会话数 |
| SESSION_CONFIG.sessionTimeoutMinutes | 30 | 会话超时时间 (分钟) |
| SESSION_CONFIG.absoluteTimeoutDays | 30 | 会话绝对超时 (天) |
| PASSWORD_POLICY.minLength | 8 | 密码最小长度 |

> 当前使用模拟数据 (`mockUsers` Map), 生产环境应迁移至数据库。
> Token 使用简化对称算法, Phase-46 应迁移至 RS256。

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 多租户守卫, `GET /auth/me` 使用 |
| 上游依赖 | `foundation/identity-access/public.decorator` | @Public 路由装饰器 |
| 上游依赖 | `class-validator` | DTO 校验 (reflect-metadata) |
| 下游消费 | 其他模块 | 通过 `AuthService` 注入获取用户认证信息 |
| 内部依赖 | `TokenService` | JWT 签发/验证/吊销 |
| 内部依赖 | `SessionService` | 会话创建/管理/吊销 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### SMS 登录

```bash
curl -X POST http://localhost:3000/api/auth/login/sms \
  -H "Content-Type: application/json" \
  -d '{"mobile": "13800138000", "code": "123456"}'
```

### 密码登录

```bash
curl -X POST http://localhost:3000/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"mobile": "13800138000", "password": "password123", "loginType": "mobile_password"}'
```

### Token 刷新

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token_value>"}'
```

### 获取当前用户

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### 登出

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"allSessions": true}'
```

### 代码中注入

```typescript
@Injectable()
export class SomeService {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async verify(userId: string, tenantId: string) {
    // AuthService 暴露 validateToken 等认证方法
  }
}
```

### 运行测试

```bash
# 认证模块全量测试
npx jest apps/api/src/modules/auth/auth.controller.test.ts
npx jest apps/api/src/modules/auth/auth.service.test.ts
npx jest apps/api/src/modules/auth/auth.service.spec.ts
npx jest apps/api/src/modules/auth/auth.dto.test.ts
npx jest apps/api/src/modules/auth/auth.e2e.test.ts
npx jest apps/api/src/modules/auth/auth.role.test.ts
npx jest apps/api/src/modules/auth/auth.contract.test.ts
npx jest apps/api/src/modules/auth/auth.module.test.ts
```
