# 跨租户数据泄露防御 (cross-tenant-data-leak)

> **核心问题**: 多租户系统 (multi-tenant SaaS) 中, 不同租户的数据必须严格隔离。 跨租户查询 / 共享时极易泄露 PII (个人身份信息)。
>
> **反模式 v4 防御**: 默认脱敏 + 配置驱动 + 审计追踪

---

## 8 大反模式

### 反模式 1: 直接返回其他租户的原始数据 (无脱敏)

```typescript
// ❌ 错误: 直接返回所有字段, 包括 PII
async findAcrossTenants(mobile: string) {
  return this.memberStore.find({ mobile })  // 返回完整 mobile / password / token
}

// ✅ 正确: 显式选择安全字段
async findAcrossTenants(mobile: string): Promise<CrossTenantMemberSummary[]> {
  const members = this.memberStore.find({ mobile })
  return members.map(m => ({
    memberId: m.memberId,
    tenantId: m.tenantContext.tenantId,
    nickname: m.nickname,
    level: m.level,
    tags: m.tags,
    createdAt: m.registeredAt,
    mobileMasked: this.maskMobile(m.mobile)  // 仅显示前3+后4
    // 故意排除: password / token / 完整 mobile
  }))
}
```

### 反模式 2: 日志中打印完整 PII (手机号/身份证)

```typescript
// ❌ 错误: 日志泄露完整 PII
this.logger.log(`Member ${m.memberId} mobile=${m.mobile} registered`)

// ✅ 正确: 日志脱敏
this.logger.log(`Member ${m.memberId} mobile=${this.maskMobile(m.mobile)} registered`)

// 反模式 v4 防御: 默认 logger 集成 PII filter
```

### 反模式 3: 跨租户查询未做权限校验

```typescript
// ❌ 错误: 任意角色可跨租户查询
@Get('cross-tenant/:mobile')
async find(@Param('mobile') mobile: string) {
  return this.service.findByMobileAcrossTenants(mobile)  // 无权限校验
}

// ✅ 正确: 配置驱动 + 角色校验
@Get('cross-tenant/:mobile')
@UseGuards(AdminGuard)  // 仅 admin
async find(@Param('mobile') mobile: string) {
  if (!this.configService.isCrossTenantEnabled()) {
    throw new ForbiddenException('cross-tenant disabled')
  }
  return this.service.findByMobileAcrossTenants(mobile)
}
```

### 反模式 4: 关联操作无审计追踪

```typescript
// ❌ 错误: 关联后无任何记录
async linkAcrossTenants(primary, secondary) {
  primary.linkedMemberIds.push(secondary.id)  // 无审计
}

// ✅ 正确: 完整审计 (反模式 v4 observability)
async linkAcrossTenants(input: { primaryMemberId, secondaryMemberId, reason, performedBy }) {
  const historyEntry: CrossTenantLinkHistoryEntry = {
    primaryMemberId: input.primaryMemberId,
    secondaryMemberId: input.secondaryMemberId,
    action: 'LINK',
    reason: input.reason,
    performedBy: input.performedBy,
    at: new Date().toISOString()
  }
  primary._linkHistory.push(historyEntry)
  // 反模式 v4 防御: ringbuffer LRU 100
}
```

### 反模式 5: 同租户关联与跨租户关联混用

```typescript
// ❌ 错误: 用同一方法处理同租户和跨租户
async link(memberId1, memberId2) {
  // 没有 tenant 校验, 可能跨租户关联也走同租户路径
}

// ✅ 正确: 强制分流
async linkAcrossTenants(input) {
  if (primary.tenantId === secondary.tenantId) {
    throw new BadRequestException('use member.service.updateProfile for same-tenant')
  }
  // 跨租户关联逻辑
}
```

### 反模式 6: self-link 无防御

```typescript
// ❌ 错误: 未检测 self-link, 可能造成数据循环
async linkAcrossTenants(primaryId, secondaryId) {
  // 直接 link, 不检查 primary === secondary
}

// ✅ 正确: self-link 检测
if (input.primaryMemberId === input.secondaryMemberId) {
  throw new BadRequestException('cannot link a member to itself')
}
```

### 反模式 7: 配置关闭时未抛错 (静默成功)

```typescript
// ❌ 错误: 配置关闭时返回空数组, 业务误以为没数据
async findByMobileAcrossTenants(mobile: string) {
  if (!this.config.isCrossTenantEnabled()) {
    return []  // 静默成功!
  }
  // ...
}

// ✅ 正确: 配置关闭时明确抛 403
async findByMobileAcrossTenants(mobile: string) {
  if (!this.config.isCrossTenantEnabled()) {
    throw new ForbiddenException('cross-tenant query disabled by config')
  }
  // ...
}
```

### 反模式 8: 错误信息泄露其他租户信息

```typescript
// ❌ 错误: 错误信息泄露其他租户存在性
throw new NotFoundException(`Member ${id} exists in tenant ${otherTenantId}`)

// ✅ 正确: 错误信息中立
throw new NotFoundException(`Member ${id} not found or cross-tenant access denied`)
```

---

## 防御检查清单 (8 项)

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 默认脱敏 | 仅返回必要字段 (memberId/nickname/level/tags) |
| 2 | PII 日志脱敏 | logger.log 不打印完整 mobile/email/身份证 |
| 3 | 配置驱动 | crossTenantEnabled=false → 抛 403 |
| 4 | 权限校验 | 跨租户查询需 admin/审计角色 |
| 5 | 审计追踪 | link/unlink 必填 performedBy + reason |
| 6 | 同租户分流 | linkAcrossTenants 检测 tenantId 相等 |
| 7 | self-link 防御 | primary === secondary 抛 400 |
| 8 | 错误中立 | 错误信息不泄露其他租户存在性 |

---

## 配置示例 (MemberConfig)

```typescript
{
  phoneUniqueScope: 'global' | 'tenant',  // D1
  crossTenantEnabled: true | false        // D5
}
```

- **D1 = global**: User.mobile @unique (DB 强制, 跨租户唯一)
- **D5 = true**: 启用跨租户查询 (GDPR / 隐私合规前置)
- **D5 = false**: 严格隔离 (适合金融/医疗强合规场景)

---

## GDPR 合规要点

1. **数据最小化**: 跨租户查询仅返回必要字段, 不返回完整 mobile
2. **目的限制**: 跨租户关联仅用于会员画像/合并, 不可用于营销推送
3. **可删除**: UNLINK 操作保留审计但删除关联 (right-to-erasure)
4. **可审计**: 所有 LINK/UNLINK 记录 performedBy + reason + timestamp

---

> 🛡️ **反模式 v4 防御**: 跨租户操作必须配置驱动 + 默认脱敏 + 完整审计。任何"为了方便"的捷径都是 PII 泄露的种子。