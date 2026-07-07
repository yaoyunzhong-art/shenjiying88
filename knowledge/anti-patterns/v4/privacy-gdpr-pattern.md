# 隐私 / GDPR 合规模式 (privacy-gdpr-pattern)

> **核心问题**: GDPR / CCPA / 中国《个人信息保护法》(PIPL) 等隐私法规要求严格的数据处理规范。多租户 SaaS 系统必须从设计层面考虑隐私合规。
>
> **反模式 v4 防御**: 默认脱敏 + 数据最小化 + 可审计 + 可删除 + 用户知情

---

## 8 大隐私反模式

### 反模式 1: 收集超过必要的 PII

```typescript
// ❌ 错误: 注册时收集所有可能用到的字段
interface MemberRegistration {
  mobile: string
  email: string
  idCard: string          // 过度收集!
  homeAddress: string      // 过度收集!
  bankAccount: string      // 过度收集!
  emergencyContact: string // 过度收集!
}

// ✅ 正确: 仅收集当前业务必要字段
interface MemberRegistration {
  mobile: string          // 登录必需
  nickname: string        // 业务必需
  // 其余字段按需收集, 不强制
}
```

### 反模式 2: PII 明文存储

```typescript
// ❌ 错误: PII 明文存储
await db.member.create({
  mobile: '13800138000',       // 明文
  email: 'alice@example.com',  // 明文
  idCard: '110101199001011234' // 明文!
})

// ✅ 正确: 敏感字段加密/脱敏
import { hash, encrypt } from './crypto-utils'
await db.member.create({
  mobile: '13800138000',          // 用于登录, 可明文 (但应 hash 存储)
  mobileHash: hash('13800138000'), // 用于唯一性校验
  email: encrypt('alice@example.com'), // AES 加密
  idCardEncrypted: encrypt(idCard)     // 加密存储
})
```

### 反模式 3: 日志中打印 PII

```typescript
// ❌ 错误: 日志泄露 PII
this.logger.log(`User login: mobile=${mobile}`)
this.logger.debug(`Query result: ${JSON.stringify(member)}`)  // 包含完整 PII

// ✅ 正确: 日志脱敏 + 字段过滤
this.logger.log(`User login: mobile=${maskMobile(mobile)}`)
this.logger.debug(`Query result: ${JSON.stringify(summarize(member))}`)

// 反模式 v4 防御: NestJS Logger 默认集成 PII filter (maskMobile / maskEmail)
```

### 反模式 4: 错误信息泄露 PII

```typescript
// ❌ 错误: 错误信息包含其他用户 PII
throw new BadRequestException(`Email ${email} already registered by ${otherUser.name}`)

// ✅ 正确: 错误信息中立
throw new BadRequestException('Email already registered')  // 不泄露其他用户信息
```

### 反模式 5: 缺少用户同意记录

```typescript
// ❌ 错误: 直接收集 PII, 无同意记录
async register(input) {
  await db.member.create(input)  // 未记录 consent
}

// ✅ 正确: 记录用户同意
async register(input, consent: ConsentRecord) {
  if (!consent.privacyPolicyAccepted) {
    throw new BadRequestException('must accept privacy policy')
  }
  await db.member.create(input)
  await db.consentRecord.create({
    memberId: input.memberId,
    policyVersion: consent.policyVersion,
    acceptedAt: new Date().toISOString(),
    ipAddress: consent.ipAddress
  })
}
```

### 反模式 6: 缺少数据删除机制 (right-to-erasure)

```typescript
// ❌ 错误: 仅软删除, 数据永久残留
async deleteMember(memberId) {
  await db.member.update(memberId, { deletedAt: new Date() })
  // 数据仍可查询, GDPR 要求"不可恢复地删除"
}

// ✅ 正确: 硬删除 + 审计保留
async deleteMember(memberId, performedBy) {
  // 1. 删除 PII (硬删除)
  await db.member.delete(memberId)
  await db.memberProfile.delete({ memberId })

  // 2. 审计保留 (不包含 PII)
  await db.auditLog.create({
    action: 'MEMBER_DELETED',
    memberId,  // 仅 ID, 不含 PII
    performedBy,
    reason: 'GDPR right-to-erasure',
    at: new Date().toISOString()
  })
}
```

### 反模式 7: 跨系统传递 PII 无脱敏

```typescript
// ❌ 错误: 微服务间传递完整 PII
// service-a → service-b
await serviceB.processOrder({
  memberId,
  mobile: '13800138000',  // 不应跨服务传递!
  email: 'alice@example.com'
})

// ✅ 正确: 仅传递 memberId + 业务必需字段
await serviceB.processOrder({
  memberId,  // service-b 自己按需查询 (带 audit)
  // 其余 PII 按需查询, 不预先传递
})
```

### 反模式 8: 数据保留无期限 (data retention)

```typescript
// ❌ 错误: 永久保留所有数据, 无 TTL
const auditLogStore = new Map<string, AuditLog>()  // 永不清理

// ✅ 正确: 数据保留策略 (TTL)
// 反模式 v4 防御: 保留期限配置
const RETENTION_DAYS = {
  auditLog: 365,        // 审计日志保留 1 年
  sessionLog: 90,       // 会话日志保留 90 天
  piiData: 'until-deletion-request'  // PII 保留到用户请求删除
}
setInterval(() => cleanupExpiredData(RETENTION_DAYS), 86400_000)  // 每天清理
```

---

## 7 项 GDPR 合规检查清单

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 数据最小化 | 注册仅收集必要字段, 不强制收集所有 PII |
| 2 | 加密存储 | 敏感 PII 加密 (AES-256) / hash (用于唯一性) |
| 3 | 日志脱敏 | logger 不打印完整 PII, 默认 maskMobile/maskEmail |
| 4 | 用户同意 | 注册时记录 consent (policyVersion + IP + acceptedAt) |
| 5 | 可删除 | 提供 DELETE /api/member/:id 硬删除接口 + 审计保留 |
| 6 | 跨服务脱敏 | 微服务间不预先传递 PII, 按需查询 + audit |
| 7 | 数据保留期限 | auditLog TTL=365d / sessionLog TTL=90d, 自动清理 |

---

## PII 脱敏工具函数

```typescript
/**
 * 反模式 v4: 默认 PII 脱敏
 */
export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 7) return '***'
  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  const maskedLocal = local.length <= 2 ? '*' : `${local[0]}***${local[local.length - 1]}`
  return `${maskedLocal}@${domain}`
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return '***'
  return `${idCard.slice(0, 4)}**********${idCard.slice(-4)}`
}

export function maskName(name: string): string {
  if (!name || name.length === 0) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}*${name[name.length - 1]}`  // 张*三
}
```

---

## 用户同意记录 (ConsentRecord)

```typescript
export interface ConsentRecord {
  memberId: string
  policyVersion: string      // 'v1.0', 'v1.1', ...
  acceptedAt: string
  ipAddress: string
  userAgent: string
  consentTypes: ConsentType[]  // ['privacy', 'marketing', 'data-sharing']
}

export type ConsentType =
  | 'privacy'           // 隐私政策
  | 'marketing'         // 营销推送
  | 'data-sharing'      // 数据共享 (跨租户)
  | 'third-party'       // 第三方共享

// 反模式 v4 防御: 每次政策更新都生成新版本, 用户需重新同意
```

---

## 数据删除流程 (right-to-erasure)

```
1. 用户提交删除请求
   ↓
2. 验证身份 (双因子)
   ↓
3. 删除 PII 数据 (硬删除)
   - User 表
   - MemberProfile 表
   - MemberActivity 表
   - 跨租户关联 (unlinkAll)
   ↓
4. 保留审计记录 (不含 PII)
   - auditLog: memberId + 删除时间 + 操作人
   ↓
5. 通知用户 + 监管 (30 天内)
   ↓
6. 备份清理 (RPO 周期后自动)
```

---

> 🛡️ **反模式 v4 防御**: 隐私合规不是事后补救, 是设计前置。默认脱敏 + 数据最小化 + 用户同意 + 可删除 + 可审计, 缺一不可。