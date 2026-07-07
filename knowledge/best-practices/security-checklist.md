# Best Practice · Security Checklist (安全清单)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🔴 P0
> 来源: OWASP Top 10 + Phase-15+ 安全实战

---

## 1. 🎯 目标

SaaS 安全 100% 覆盖:
- ✅ OWASP Top 10 (2021 / 2026)
- ✅ 多租户隔离
- ✅ 认证 / 授权
- ✅ 审计追溯
- ✅ 数据加密

---

## 2. 🔒 OWASP Top 10 自检

| 风险 | 自检 | 缓解 |
|---|---|---|
| **A01 Broken Access Control** | 跨租户访问测试 | tenantId 强制注入 |
| **A02 Cryptographic Failures** | 密码/卡号加密 | bcrypt / AES |
| **A03 Injection** | SQL/NoSQL 注入测试 | ORM 参数化 / 校验 |
| **A04 Insecure Design** | 威胁建模 | 安全设计 review |
| **A05 Security Misconfig** | 默认密码 / 调试模式 | 配置检查 |
| **A06 Vulnerable Components** | npm audit | 定期升级 |
| **A07 Auth Failures** | 暴力破解 / 弱密码 | 限流 + 强密码策略 |
| **A08 Data Integrity** | 反序列化漏洞 | 校验签名 |
| **A09 Logging Failures** | 审计缺失 | 结构化日志 |
| **A10 SSRF** | URL 校验 | 白名单 |

---

## 3. ✅ 输入校验 (Defense in Depth)

```typescript
// ✅ DTO 校验 (class-validator)
export class CreateMemberDto {
  @IsEmail() email: string
  @IsString() @Length(2, 50) @Matches(/^[\u4e00-\u9fa5a-zA-Z\s]+$/) name: string
  @IsOptional() @Matches(/^\+?\d{10,15}$/) phone?: string
}

// ✅ 业务校验 (Service 内)
if (password.length < 12) throw new ValidationError('weak password')
if (password === password.reverse()) throw new ValidationError('too simple')

// ✅ 数据库参数化 (TypeORM 自动)
await this.repo.findOne({ where: { email: dto.email } })  // ✅ 安全
await this.repo.query(`SELECT * FROM members WHERE email = '${dto.email}'`)  // ❌ 注入风险!
```

---

## 4. ✅ 密码安全

```typescript
import * as bcrypt from 'bcrypt'

// ✅ bcrypt 哈希
const hash = await bcrypt.hash(password, 12)  // cost = 12

// ✅ 验证
const match = await bcrypt.compare(password, hash)

// ❌ 反例
md5(password)        // ❌ 弱哈希
sha1(password)       // ❌ 弱哈希
password === stored  // ❌ 明文比较
```

---

## 5. ✅ JWT 安全

```typescript
// ✅ JWT 配置
const jwtConfig = {
  secret: process.env.JWT_SECRET!,  // ≥ 256-bit 随机
  expiresIn: '1h',                  // 短过期
  issuer: 'shenjiying',
  audience: 'shenjiying-api',
  algorithms: ['HS256'],            // 禁止 'none'
}

// ✅ 必须包含 tenantId
const token = jwt.sign(
  { sub: userId, tenantId, roles, exp, iat },
  jwtConfig.secret,
  { algorithm: 'HS256', expiresIn: '1h' }
)

// ✅ 验证 + 黑名单
async validate(payload) {
  if (await this.tokenBlacklist.has(payload.jti)) throw new UnauthorizedException()
  return { userId: payload.sub, tenantId: payload.tenantId, roles: payload.roles }
}
```

---

## 6. ✅ 速率限制 + 防爆破

```typescript
// 登录限流 (e.g. 5 次 / 15 分钟 / IP)
@UseGuards(LoginRateLimitGuard)  // 5/15min/IP
async login(@Body() dto) { ... }

// 密码错误后延时 (防时间攻击)
async login(dto) {
  const start = Date.now()
  const user = await this.userRepo.findOne(...)
  const valid = await bcrypt.compare(dto.password, user?.hash ?? '')
  const elapsed = Date.now() - start
  if (elapsed < 200) await new Promise(r => setTimeout(r, 200 - elapsed))  // 强制 200ms
  if (!valid) throw new UnauthorizedException('invalid credentials')  // 不区分用户不存在 / 密码错误
  return ...
}
```

---

## 7. ✅ 审计日志

```typescript
// ✅ 关键操作必须审计
await this.auditLog.record({
  action: 'member.delete',
  actor: { id: auth.userId, role: auth.role, ip: req.ip },
  target: { type: 'member', id: memberId },
  tenantId: auth.tenantId,
  requestId: req.id,
  timestamp: new Date().toISOString(),
  metadata: { reason: dto.reason },
})

// 审计保留 ≥ 1 年 (合规)
```

---

## 8. ✅ 数据加密

| 场景 | 算法 | 备注 |
|---|---|---|
| 密码 | bcrypt (cost 12) | 不可逆 |
| 卡号 | AES-256-GCM | 存储 token 化 (e.g. Stripe) |
| 身份证 | AES-256 + key 轮转 | 严格访问控制 |
| API Key | sha256 | 单向哈希 |
| 数据库连接 | TLS | 强制 |
| 传输 | HTTPS | 强制 HSTS |

---

## 9. ✅ 上线前 checklist

- [ ] OWASP Top 10 自检通过
- [ ] 多租户隔离测试通过 (跨租户访问返回 404)
- [ ] 密码 bcrypt (cost ≥ 12)
- [ ] JWT 含 tenantId + 短过期
- [ ] 限流配置 (登录 / 关键 API)
- [ ] 审计日志关键操作覆盖
- [ ] 依赖 npm audit 0 high
- [ ] HTTPS 强制 + HSTS
- [ ] 安全 headers (CSP / X-Frame-Options)
- [ ] 备份 + 灾难恢复演练

---

## 10. 🔗 关联

- [multi-tenant-isolation.md](./multi-tenant-isolation.md) · 租户隔离
- [throttling-pattern.md](../patterns/throttling-pattern.md) · 限流
- [logging-standards.md](./logging-standards.md) · 审计日志
