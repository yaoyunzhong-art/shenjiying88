# Day18 T2: DB 索引优化建议

**日期**: 2026-07-26  
**范围**: apps/api/prisma/schema.prisma  
**分析人**: 树哥 Trae

---

## 一、现状扫描

| 指标 | 数值 |
|------|------|
| 总 Model 数 | **114** |
| @@index 声明数 | **207** |
| @unique 声明数 | **38** |
| 有 @@index 的 Model | **98 / 114 (86%)** |
| 既无 @@index 也无 @unique 的 Model | **8 个** |

### 无任何索引的 Model（8 个）

| Model | 说明 |
|-------|------|
| `MemberProfile` | **高危** — 核心会员表，按 tenantId 查询高频 |
| `LytConnection` | 连接关系表 |
| `RegionalConfig` | 区域配置 |
| `RegionalConfigOverride` | 区域配置覆盖 |
| `PortalSite` | 门户站点 |
| `EmailChannelConfig` | 渠道配置 |
| `SocialChannelConfig` | 渠道配置 |
| `TaxPolicyConfig` | 税务配置 |

---

## 二、无分页 findMany 调用（高优先级）

统计 22 处 `findMany` 无 `take:` 限制，分布如下：

### 🔴 P0 — 必须修复（全表扫描风险）

| 文件 | Model | 问题 |
|------|-------|------|
| `configuration-governance.service.ts` | `configEntry` | **`findMany()` 无任何 where，全表拉取** |
| `configuration-governance.service.ts` | `configEntry` | `findMany({ where: { OR: [...] } })` 无 take |
| `reconciliation-db.service.ts` | `resolvedDiffModel` | **`findMany({ orderBy })` 无 where，全表排序** |
| `reconciliation-db.service.ts` | `financeLedger` | `findMany({ where: { tenantId, recordedAt } })` 无 take — 日结数据可随租户增长无限 |
| `reconciliation-db.service.ts` | `financeSettlement` | `findMany({ where: { tenantId } })` 无 take |
| `reconciliation-db.service.ts` | `reconciliationReportModel` | `findMany({ where: { date } })` 无 take（批量聚合查询） |
| `foundation.service.ts` | `auditLog` | `findMany({ where: { tenantId, resourceType, resourceId, action } })` 无 take — getAlertHistory 有 limit 参数但未传给 DB |
| `foundation.service.ts` | `foundationAlertAcknowledgement` | `findMany({ where: { tenantId, code } })` 无 take |
| `trust-governance.service.ts` | `rateLimitPolicy` | `findMany({ where: { filters } })` 无 take |
| `trust-governance.service.ts` | `quotaLedger` | `findMany({ where: { subjectKey, policyCode } })` 无 take |
| `configuration-governance.service.ts` | `secretAsset` | `findMany({ where: { key } })` 无 take |

### 🟡 P1 — 建议修复

| 文件 | Model | 问题 |
|------|-------|------|
| `configuration-governance.service.ts` | `featureFlag` | `findMany(args)` 调用方未传 take，依赖调用方 |
| `member.service.ts` | 动态 Model (task/receipt/snapshot/extension) | 通过 baseModel 统一包装 — 应由 baseModel 层强制 take |

---

## 三、高频查询缺少复合索引

### 审计日志（AuditLog）

**现有索引**：
```
@@index([tenantId, createdAt])
@@index([tenantId, action, createdAt])
```

**常见查询模式**：
```ts
// foundation.service.ts — 按资源类型+资源ID+动作查询
findMany({
  where: { tenantId, resourceType: 'foundation-alert', resourceId: code,
    action: { in: [...] } }
})
// ↑ 现有索引无法高效覆盖 resourceType + resourceId
```

**建议新增**：
```prisma
@@index([tenantId, resourceType, resourceId, createdAt])
```

### 会员档案（MemberProfile）

**现状：无任何索引！**

**高频查询**：
```ts
// member.service.ts — 按租户分页列表
findMany({
  where: { tenantId },
  orderBy: [{ createdAt: 'desc' }],
  take: 100
})
```

**建议新增**：
```prisma
@@index([tenantId, createdAt])
@@index([tenantId, userId])
```

### 领域事件（DomainEvent）

**现有索引**：
```
@@index([status, availableAt])
@@index([tenantId, aggregateType, aggregateId])
```

**常见查询**：
```ts
// runtime-governance — 按聚合类型查全部事件
findMany({
  where: { aggregateType: 'runtime-governance' },
  orderBy: [{ createdAt: 'asc' }],
  take: 500
})
// ↑ 没有 tenantId 时，第二个索引用不上
```

**建议新增**：
```prisma
@@index([aggregateType, createdAt])
```

### 对账相关（ReconciliationReportModel / FinanceLedger）

**FinanceLedger 现有索引**：
```
@@index([tenantId])
@@index([type])
@@index([tenantId, recordedAt])
@@index([storeId])
```

**对账服务查询**：
```ts
// 按 tenantId + recordedAt 范围 + 可选 storeId
findMany({
  where: { tenantId, recordedAt: { gte, lte }, ...(storeId ? { storeId } : {}) }
})
// ↑ 现有 @@index([tenantId, recordedAt]) 已覆盖
// 但若同时带 storeId，需 @@index([tenantId, storeId, recordedAt])
```

**建议新增**：
```prisma
@@index([tenantId, storeId, recordedAt])
```

### 基础配置（ConfigEntry / SecretAsset / FeatureFlag）

**FeatureFlag 现有索引**：
```
@@index([key, status])
@@index([scopeType, tenantId, brandId, storeId, marketProfileId])
```

_CONFIGURATION_QUERY_SCOPED 模式（按 scopeType + tenantId + brandId + storeId）已有复合索引覆盖 ✅

**ConfigEntry**: `@@index([namespace, key])` + `@@index([scopeType, tenantId, brandId, storeId, marketProfileId])` ✅

---

## 四、建议索引汇总

### 立即添加（安全，影响小）

```prisma
// MemberProfile — 核心会员表，当前零索引
model MemberProfile {
  // ... 现有字段 ...
  @@index([tenantId, createdAt])
  @@index([tenantId, userId])
}

// AuditLog — 审计查询优化
model AuditLog {
  // ... 现有索引 ...
  @@index([tenantId, resourceType, resourceId, createdAt])
  // 注意：此索引可能与前两个 @@index 有重叠，可评估后选择
}

// DomainEvent — 全聚合类型扫描
model DomainEvent {
  // ... 现有索引 ...
  @@index([aggregateType, createdAt])
}

// FinanceLedger — 对账查询带 storeId
model FinanceLedger {
  // ... 现有索引 ...
  @@index([tenantId, storeId, recordedAt])
}
```

### 建议评估后添加

```prisma
// FoundationAlertAcknowledgement — 告警确认查询
model FoundationAlertAcknowledgement {
  // ... 现有 @@index([tenantId, status, updatedAt]) ...
  @@index([tenantId, code])  // where: { tenantId, code: { in: [...] } }
}

// ReconciliationReportModel — 日期范围批量查询
model ReconciliationReportModel {
  // ... 现有 @@index([tenantId, date]) ...
  @@index([date])  // 当不带 tenantId 时使用
}

// ResolvedDiffModel — 全表拉取
model ResolvedDiffModel {
  // ... 建议添加 ...
  @@index([resolvedAt])  // orderBy resolvedAt desc
}
```

### 无分页查询 — 代码层修复（非索引层）

对于 P0 列出的 11 处无 `take:` 的 findMany，建议：

1. **`configEntry.findMany()`** → 加 `take: 1000` 或按 scopeType 过滤
2. **`resolvedDiffModel.findMany()`** → 加 `take: 500` + 按时间范围过滤
3. **`auditLog.findMany()`** → getAlertHistory 方法有 `limit` 参数但传给 RAM 层而非 DB，应改为 `take: limit`
4. **`financeLedger.findMany()`** → 加 `take: 10000` 或分页
5. **`rateLimitPolicy.findMany()`** → 加 `take: 100`
6. **`quotaLedger.findMany()`** → 加 `take: 1000`
7. 其他 → 统一加 `take: limit` 参数

---

## 五、总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 索引覆盖率 | ⭐⭐⭐⭐ | 86% model 有 @@index，207 个索引设计细致 |
| 无索引 model 风险 | ⚠️ | 8 个无索引 model 中 MemberProfile 是高频核心表 |
| 分页规范 | ⚠️ | 22 处 findMany 无 take，其中 3 处全表无 where |
| 复合索引质量 | ⭐⭐⭐⭐ | 多租户隔离 + scopeType + status 组合设计良好 |
| 整体评价 | **良好** | 索引基础设施扎实，需修补 8~10 个缺口 |

### 关键行动项

1. 🔴 `MemberProfile` 添加 `@@index([tenantId, createdAt])`
2. 🔴 `configEntry.findMany()` 全表查询加 take 限制
3. 🔴 `resolvedDiffModel.findMany()` 全表查询加 take 限制
4. 🟡 `AuditLog` 添加 `@@index([tenantId, resourceType, resourceId, createdAt])`
5. 🟡 `DomainEvent` 添加 `@@index([aggregateType, createdAt])`
6. 🟡 11 处无分页查询统一加 take
