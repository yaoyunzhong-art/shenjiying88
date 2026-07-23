# 认证模块 - 验收文档

> 模块负责人: 树哥C | 最后更新: 2026-07-24

---

## 业务场景与目标

认证模块是 ShenJiYing 平台的身份验证基础设施，为所有模块提供统一的认证生命周期管理。

**核心业务目标：**
1. 支持多方式登录（短信验证码、密码、微信、SSO），覆盖国内主流认证场景
2. 提供安全的 Token 签发/刷新/吊销机制，保障 API 无状态鉴权
3. 会话管理：控制并发会话数、支持单点/全部登出
4. 密码安全策略：强度校验、登录锁定、解锁管理
5. 多租户隔离：不同租户的认证体系相互独立

**使用方：** 所有需要用户身份验证的前端应用（Web/移动端/小程序）、内部微服务间的身份传递

---

## 验收条件（Given-When-Then 格式）

### AC-1: 短信验证码登录

```
Given  用户已注册且手机号正确，短信验证码缓存有效
  When 用户请求 POST /auth/login/sms 传入 { mobile, code }
  Then 返回成功状态码 200，响应中包含 accessToken、refreshToken、expiresIn、用户信息
```

```
Given  用户传入错误的短信验证码
  When 用户请求 POST /auth/login/sms
  Then 返回 401 Unauthorized，error.code = "AUTH_008"
```

### AC-2: 密码登录与账户锁定

```
Given  用户已设置密码且账户正常
  When 用户请求 POST /auth/login/password 传入正确的 { mobile, password, loginType }
  Then 返回 200，响应中包含有效 TokenPair 和用户信息
```

```
Given  用户连续 5 次输入错误密码
  When 用户第 6 次请求 POST /auth/login/password
  Then 返回 401，error.code = "AUTH_005"（账户锁定），锁定持续 30 分钟
```

### AC-3: Token 刷新与吊销

```
Given  用户持有有效的 refreshToken（未过期、未使用）
  When 用户请求 POST /auth/refresh 传入 { refreshToken }
  Then 返回新的 TokenPair，旧的 refreshToken 立即作废
```

```
Given  用户使用已消费过的 refreshToken
  When 用户再次请求 POST /auth/refresh
  Then 返回 401，error.code = "AUTH_004"（无效 Token），该用户所有 Token 被强制吊销
```

### AC-4: 登出与会话管理

```
Given  用户已登录且持有有效 accessToken
  When 用户请求 POST /auth/logout 传入 { sessionId }
  Then 该会话被标记 revoked，该会话的 accessToken 进入黑名单
```

```
Given  用户已登录，并发会话数达到 5 个上限
  When 用户在新的设备上再次登录
  Then 新会话创建成功，最早创建的旧会话被自动踢下线
```

### AC-5: 当前用户身份查询

```
Given  用户持有有效的 accessToken
  When 用户请求 GET /auth/me 并携带 Authorization: Bearer <token>
  Then 返回当前用户的详细信息：userId、tenantId、roles、permissions、mobile、avatar
```

```
Given  用户持有已过期或黑名单中的 accessToken
  When 用户请求 GET /auth/me
  Then 返回 401 Unauthorized
```

### AC-6: 密码锁定解锁（管理后台）

```
Given  SUPER_ADMIN/TENANT_ADMIN 角色用户持有效 Token
  When 管理员请求 POST /auth/locks/password/unlock 传入 { mobile, reason }
  Then 该手机号的密码登录锁定状态被解除，登录尝试计数器清零
```

### AC-7: 微信登录

```
Given  用户在前端完成微信 OAuth 授权，获得临时 code
  When 用户请求 POST /auth/login/wechat 传入 { code }
  Then 服务器通过 code 换取微信 openId，查找/创建用户，返回成功认证结果
```

```
Given  用户传入无效的微信授权码
  When 用户请求 POST /auth/login/wechat
  Then 返回 401，error.code = "AUTH_011"
```

---

## 核心流程

### 流程 1: 短信登录认证流程

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐
│  客户端   │ ──► │ AuthController│ ──► │ AuthService│ ──► │ SessionSvc  │ ──► │ TokenService │
└──────────┘     └──────────────┘     └───────────┘     └─────────────┘     └──────────────┘
 POST /auth/login/sms                      │                                    │
   {mobile, code}                          │                                    │
        │                                   │                                    │
        ▼                                   ▼                                    ▼
 校验 DTO 格式                      1. verifySmsCode()                2. createSession()
    (class-validator)                    (Redis查验证码)                  (deviceInfo)
                                         │                                    │
                                         ▼                                    ▼
                                   3. findUserByMobile()               3. generateTokenPair()
                                       或 createUser()                   (access+refresh)
                                         │                                    │
                                         ▼                                    ▼
                                   4. 组装 AuthResult ◄───────────────────────┘
                                         │
                                         ▼
                                 返回 { user, tokens }
```

### 流程 2: 密码登录 + 锁定机制

```
┌──────────────────────────────────────────────────────────────────────┐
│                         登录尝试                                      │
│  POST /auth/login/password                                           │
│  { loginType: mobile_password, mobile, password }                    │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────┐
                      │ resolvePasswordLogin     │
                      │ Principal(mobile/email)  │
                      └───────────┬─────────────┘
                                  │
                                  ▼
            ┌─────────────────────────────────────────┐
            │ getPasswordAttemptState(principal)       │
            │   ┌─ 首次? → 创建计数器 { attempts=0 }   │
            │   └─ 已有? → 返回当前计数器              │
            └───────────────────┬─────────────────────┘
                                │
                                ▼
              ┌──────────────────────────────────────┐
              │ isPasswordLoginLocked?                │
              │   attempts >= 5 && 未超过30分钟锁定期  │
              └──────────┬───────────────────────────┘
                   是     │      否
                   │     │
                   ▼     ▼
           AUTH_005   验证密码
          (ACCOUNT_    ┌──┬──┐
           _LOCKED)    │  │  │
                       │  │  │
                   正确/│  │  │错误
                       │  │  │
                       ▼  │  ▼
             生成TokenPair│ attempts++
                      │   │
                      ▼   ▼
                 返回成功   返回AUTH_001
```

### 流程 3: Token 刷新旋转

```
 持有 refreshToken
       │
       ▼
  ┌────────────────┐
  │ TokenService   │
  │ refreshTokens()│
  └───────┬────────┘
          │
          ▼
    ┌──────────┐
    │ 验证      │
    │ refresh   │
    │ Token     │─────────── 无效 → AUTH_004
    └─────┬────┘
          │ 有效
          ▼
    ┌──────────────┐
    │ 检查是否已    │
    │ 被使用/吊销   │─────────── 已用 → 强制吊销全部Token
    └──────┬───────┘           (防止 refresh 攻击)
           │ 未使用
           ▼
    ┌──────────────────────┐
    │ 生成新的 TokenPair   │
    │ 旧 refreshToken 失效 │
    │ 新会话续期            │
    └──────────────────────┘
```

### 流程 4: 登出与会话吊销

```
POST /auth/logout
  { sessionId? | allSessions: true }
       │
       ▼
  ┌────────────────┐
  │ AuthService    │
  │ logout()       │
  └───────┬────────┘
          │
     ┌────┴────┐
     │         │
  指定会话   全部会话
     │         │
     ▼         ▼
  吊销该     吊销该用户
  会话       所有会话
     │         │
     ▼         ▼
  Token 加入黑名单
  (Redis SET 记录 jti)
```

---

## 测试场景矩阵

| 场景ID | 场景名称 | 前置条件 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|---------|
| TS-001 | 标准短信登录 | 用户手机号存在，验证码正确 | POST /auth/login/sms | 200 + TokenPair + UserInfo |
| TS-002 | 短信验证码错误 | 用户手机号存在，验证码错误 | POST /auth/login/sms | 401 AUTH_008 |
| TS-003 | 短信验证码过期 | 验证码老化 | POST /auth/login/sms | 401 AUTH_009 |
| TS-004 | 短信验证码限流 | 60秒内同一手机号请求多次 | POST /auth/login/sms | 429 AUTH_010 |
| TS-005 | 标准密码登录 | 用户存在，密码正确 | POST /auth/login/password | 200 + TokenPair |
| TS-006 | 密码错误<5次 | 密码错误输入 1-4次 | POST /auth/login/password | 401 AUTH_001 |
| TS-007 | 密码错误触发锁定 | 第5次错误，未超30分 | POST /auth/login/password | 401 AUTH_005 + retryAfter |
| TS-008 | 锁定期正确密码 | 锁定期内用正确密码 | POST /auth/login/password | 401 AUTH_005 |
| TS-009 | 锁定超时后解锁 | 第5次错误30分钟后 | POST /auth/login/password | 200 + TokenPair |
| TS-010 | 管理员解锁 | SUPER_ADMIN 身份 | POST /auth/locks/password/unlock | 200 success |
| TS-011 | Token 刷新成功 | refreshToken有效 | POST /auth/refresh | 200 + 新TokenPair |
| TS-012 | RefreshToken已用 | 使用已被消费的 refreshToken | POST /auth/refresh | 401 AUTH_004 + 全部Token吊销 |
| TS-013 | RefreshToken过期 | 超7天 | POST /auth/refresh | 401 AUTH_003 |
| TS-014 | 单会话登出 | 指定 sessionId | POST /auth/logout | 200 + 该会话失效 |
| TS-015 | 全部登出 | allSessions=true | POST /auth/logout | 该用户所有会话失效 |
| TS-016 | 并发上限 | 已有5个活跃会话 | 新设备登录 | 新会话OK，最早会话被踢 |
| TS-017 | 获取当前身份 | 有效 accessToken | GET /auth/me | 200 + 完整用户信息 |
| TS-018 | 过期的Token | accessToken超2h | GET /auth/me | 401 AUTH_002 |
| TS-019 | 微信登录成功 | 微信平台返回有效 code | POST /auth/login/wechat | 200 + TokenPair |
| TS-020 | 无效微信code | code被伪造或过期 | POST /auth/login/wechat | 401 AUTH_011 |
| TS-021 | 密码策略校验弱口令 | "123456" 不符合策略 | 注册过程中校验 | 返回密码策略错误 |
| TS-022 | 跨租户 Token 访问 | Token 租户 A 访问租户 B 资源 | 带 Token 请求其他租户 | 403 Forbidden |

---

## 边界情况

| 编号 | 边界条件 | 预期行为 |
|------|---------|---------|
| B-001 | 空手机号字段 | DTO 校验拒绝，返回 400 Bad Request |
| B-002 | 空密码字段 | DTO 校验拒绝，返回 400 Bad Request |
| B-003 | 并发登录同一账号不同设备 | 每个设备获取独立会话，不超过5个限制 |
| B-004 | 账号在登录过程中被管理员禁用 | 返回 AUTH_006 账户已禁用 |
| B-005 | 租户过期/被冻结 | Return AUTH_007 |
| B-006 | 短信验证码带有前导/后缀空格 | 服务端应 trim 后校验 |
| B-007 | Token 格式错误（非 Bearer 开头） | extractToken 返回 null → 401 |
| B-008 | 无 Authorization 头请求 /auth/me | 401 Unauthorized |
| B-009 | 登出时不传 sessionId 且 allSessions=false | 默认只吊销当前 Token 对应的会话 |
| B-010 | 同一手机号多设备的 session 限制 | 统计时按 sessionService 中该 userId 的活跃会话数 |
| B-011 | 密码解锁时传入不存在的手机号 | 应返回成功（不暴露是否存在该用户） |
| B-012 | 大量并发登录请求 | 每个请求独立验证，锁机制不影响并发 |
| B-013 | 登录成功后 Token 签发延迟 | 应控制在 100ms 以内 |

---

## 性能要求

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 登录接口 P99 延迟 | < 200ms | 从请求到 Token 签发返回 |
| Token 验证 P99 延迟 | < 50ms | JWT 解码 + 黑名单检查 |
| Token 刷新 P99 延迟 | < 150ms | 含旧 token 失效 + 新 token 签发 |
| 并发登录支撑 | > 1000 QPS | 单节点 |
| 并发 Token 验证 | > 5000 QPS | 纯 CPU 计算，无 IO 瓶颈 |
| 密码登录锁定检查 | < 20ms | Redis 读取尝试计数器 |
| 会话创建延迟 | < 50ms | Session 写入 Redis/Memory |
| 登出（单会话） | < 30ms | Token 黑名单写入 |
| 登出（全部） | < 100ms | 全部会话遍历 + 黑名单更新 |
| 可用性 SLA | 99.99% | 认证是入口，不可中断 |
| 数据一致性 | 最终一致 | Token 黑名单允许秒级延迟 |

> **说明：** 当前版本使用内存存储（mockUsers Map、passwordAttemptLedger），
> 生产环境中性能指标依赖 Redis + PostgreSQL 的部署规格。
> 建议在 Phase-46 迁移至 RS256 + Redis 集群后重新 benchmark。
