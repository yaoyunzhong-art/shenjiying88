# 安全防护反模式 v4

## 元信息
- **编号**: AP-W15 (Anti-Pattern Watch #15)
- **分类**: 安全 / OWASP
- **发现**: 2026-06-27 Phase-35~50 全栈设计
- **影响**: 数据泄漏 / 越权 / 注入
- **修复耗时**: 持续加固

---

## 现象描述

SaaS 平台常见安全问题:

1. **SQL/NoSQL 注入**: 用户输入直接拼接
2. **XSS**: 用户内容未转义
3. **CSRF**: 跨站请求伪造
4. **越权访问**: 跨租户/跨用户数据访问
5. **敏感信息泄漏**: 日志/响应/错误含敏感数据

---

## 根因分析

### 1. SQL 注入

```typescript
// ❌ 反例: 字符串拼接
const query = `SELECT * FROM users WHERE name = '${userName}'`
// 攻击: userName = "' OR '1'='1"

// ✅ 修复: 参数化查询 (Prisma 默认)
const user = await prisma.user.findUnique({
  where: { name: userName }  // Prisma 自动转义
})
```

### 2. XSS

```typescript
// ❌ 反例: 直接渲染
const html = `<div>${userInput}</div>`
// 攻击: userInput = "<script>alert(1)</script>"

// ✅ 修复: 转义
import { escape } from 'html-escaper'
const html = `<div>${escape(userInput)}</div>`

// 或 React JSX 自动转义
return <div>{userInput}</div>  // 自动转义
```

### 3. CSRF

```typescript
// ❌ 反例: 无 CSRF token
app.post('/api/transfer', (req, res) => {
  // 任何网站都能伪造请求
  bank.transfer(req.body.from, req.body.to)
})

// ✅ 修复: CSRF token + SameSite cookie
app.use(csrf())
app.post('/api/transfer', csrfProtection, (req, res) => {
  bank.transfer(req.body.from, req.body.to)
})
```

### 4. 越权

```typescript
// ❌ 反例: 仅按 ID 查询
@Get(':id')
async getOrder(@Param('id') id: string) {
  return this.orderService.findById(id)  // 任何人能看任何订单!
}

// ✅ 修复: 强制 tenantId
@Get(':id')
async getOrder(@Param('id') id: string, @CurrentUser() user: User) {
  return this.orderService.findById(id, user.tenantId)  // 跨租户返回 null
}
```

### 5. 敏感信息泄漏

```typescript
// ❌ 反例: 错误信息暴露
throw new Error(`Database error: ${err.message}, SQL: ${err.sql}`)

// ✅ 修复: 抽象错误
throw new InternalServerErrorException('Internal server error')
logger.error({ err, requestId }, 'DB error')  // 服务端记录详情
```

---

## OWASP Top 10 (2021) 对照

| OWASP | 反模式 | 修复 |
|-------|--------|------|
| A01 Broken Access Control | 越权 | tenantId 强制校验 |
| A02 Cryptographic Failures | 明文密码 | bcrypt + salt |
| A03 Injection | SQL/NoSQL 注入 | Prisma 参数化 |
| A04 Insecure Design | 设计漏洞 | Threat Modeling |
| A05 Security Misconfig | CORS/默认密码 | 配置 review |
| A06 Vulnerable Components | 旧依赖 | npm audit + Renovate |
| A07 Identification & Auth | 弱密码 | 强密码策略 + 2FA |
| A08 Software & Data Integrity | 不可信反序列化 | 白名单 |
| A09 Logging & Monitoring | 缺日志 | ELK/Sentry |
| A10 SSRF | 服务器请求伪造 | URL 白名单 |

---

## 修复方案 (Phase-31~35 实战)

### 1. 多租户隔离 (Phase-31)

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const token = req.headers.authorization?.replace('Bearer ', '')
    const payload = jwt.verify(token)
    req.tenantId = payload.tenantId  // 从 JWT 提取
    
    // 强制 tenantId 在每个 service 方法
    return true
  }
}
```

### 2. 乐观锁防越权修改 (DR-36)

```typescript
async updateOrder(id: string, tenantId: string, version: number, patch: Partial<Order>) {
  const order = await this.getById(id)
  if (order.tenantId !== tenantId) throw new ForbiddenException()
  if (order.version !== version) throw new ConflictException()
  return this.prisma.order.update({
    where: { id, version },
    data: { ...patch, version: version + 1 }
  })
}
```

### 3. 密码 bcrypt

```typescript
import * as bcrypt from 'bcrypt'

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)  // salt rounds 12
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### 4. JWT + Refresh Token

```typescript
interface JWTPayload {
  userId: string
  tenantId: string
  scopes: string[]
  iat: number
  exp: number
}

function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' })
}

function generateRefresh(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' })
}
```

### 5. 限流 (Rate Limit)

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 分钟
  max: 100,              // 100 次
  keyGenerator: req => `${req.tenantId}:${req.ip}`,
  message: { error: 'rate_limited' }
})

app.use('/api/', limiter)
```

### 6. 输入校验 (class-validator)

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string
}
```

---

## 预防机制 (R-07 V2)

### 1. 安全审计清单

```markdown
## 每次 PR 必查

- [ ] 无 SQL 拼接
- [ ] 无敏感信息日志
- [ ] 跨租户强制隔离
- [ ] 错误信息抽象化
- [ ] 密码 bcrypt
- [ ] 输入 DTO 校验
- [ ] 限流配置
- [ ] 依赖 npm audit
```

### 2. 自动化扫描

```bash
# 依赖漏洞
npm audit --production
snyk test

# 代码扫描
eslint --plugin security
semgrep --config=auto

# 密钥扫描
gitleaks detect
trufflehog filesystem .
```

### 3. 渗透测试

每季度外部 pentest。

---

## 经验教训

> 🦞 **"安全是底线,不是 feature"**

1. **默认拒绝**: 不是允许列表的接口都拒绝
2. **最小权限**: 每个角色只给必要权限
3. **纵深防御**: 多层防护 (网络/应用/数据)
4. **可观测性**: 安全事件全日志 + 告警
5. **持续审计**: 季度安全 review

---

## 相关反模式

- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 越权并发
- [api-design.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/api-design.md): API 安全

---

> 🦞 **"安全疏忽 = 业务崩盘"**