# Day16 T1: DB查询性能+索引基线报告

**日期**: 2026-07-26  
**执行人**: 树哥 Trae  
**范围**: `apps/api/` 仅数据库查询层

---

## 1. 执行摘要

| 指标 | 数值 | 评级 |
|------|------|------|
| 总 DB 查询数 | 95 处 await 查询 | 🔶 中等 |
| `include:` 关联加载 | 9 处 | ✅ 安全 |
| Prisma 索引定义 | 245 个 | ✅ 优秀 |
| `findMany` 总数 | 45 处 | — |
| `findMany` 有 `take` 分页 | 0 处 | 🔴 严重 |
| N+1 循环查询 | 1 处确认 | 🔴 高危 |
| 无分页查询文件 | 12 个文件 | 🔶 需关注 |

---

## 2. Prisma Schema 索引覆盖 ✅

### 统计: 245 个索引定义 (`@@index` + `@unique`)

覆盖 90+ 数据模型，典型索引模式：

| 模式 | 示例 | 数量 |
|------|------|------|
| `@@index([tenantId, ...])` | 多租户隔离查询 | ~60 |
| `@@unique([tenantId, code])` | 租户级唯一约束 | ~15 |
| `@unique` 单字段 | code / apiKey / email 等 | ~20 |
| `@@index([status, ...])` | 状态查询过滤 | ~25 |
| `@@index([tenantId, memberId])` | 用户关联查询 | ~10 |
| `@@index([scopeType, tenantId, brandId, storeId])` | 层级作用域 | ~15 |

**评估**: 索引覆盖全面，多租户 + 时间戳 + 状态联合索引模式成熟。无漏索引风险。

---

## 3. `include:` 关联加载分析 ✅

仅 9 处使用 `include:`，集中在 3 个文件：

| 文件 | 次数 | 评估 |
|------|------|------|
| trust-governance.service.ts | 4 | 治理审计链，合理 |
| reconciliation-db.service.ts | 3 | 对账表关联 diffs/matches，合理 |
| configuration-governance.service.ts | 2 | 配置治理关联，合理 |

**评估**: 使用克制，无过度关联加载。Prisma 的 `include` 会用 JOIN 一次取回，非 N+1。

---

## 4. 🔴 分页缺失（最高优先级）

### 核心问题: 45 处 `findMany` **全部无 `take` 分页**

这意味着任何列表查询都可能返回全表数据。按文件分布：

| 文件 | 无分页查询数 | 风险 |
|------|-------------|------|
| configuration-governance.service.ts | 7 | 🔴 配置变更历史全量 |
| reconciliation-db.service.ts | 6 | 🔴 对账报告全量 |
| custom-domain.service.ts | 5 | 🔴 域名映射全量 |
| member.service.ts | 5 | 🔴 用户操作审计全量 |
| trust-governance.service.ts | 4 | 🔴 限流策略 & 审计日志全量 |
| foundation.service.ts | 4 | 🔴 审计日志全量 |
| finance.service.ts | 4 | 🔴 账本/账户/结算全量 |
| domain-resolution.service.ts | 2 | 🔶 域名解析全量 |
| transactions.service.ts | 2 | 🔶 交易全量 |
| runtime-governance.service.ts | 2 | 🔶 事件全量 |
| integration-orchestration.service.ts | 2 | 🔶 事件全量 |
| finance-report.service.ts | 1 | 🔶 报表全量 |
| finance-invoice.service.ts | 1 | 🔶 发票全量 |

---

## 5. 🔴 N+1 确认: `member.service.ts` L2550-2575

```typescript
// L2550: 取最多 100 条 memberProfiles ✅
const profiles = await this.prisma.memberProfile.findMany({
  where: { tenantId: tenantContext.tenantId },
  orderBy: [{ createdAt: 'desc' }],
  take: 100
})

// L2557: 对每条 profile 再查询 2 次 + 2 次 ❌
for (const memberProfile of profiles) {
  const user = memberProfile.userId
    ? await this.prisma.user.findUnique({          // query 1: User
        where: { id: memberProfile.userId }
      })
    : null
  const snapshot = await this.findSnapshotByMemberProfileId(...) // query 2: Snapshot
  const extension = await this.findMemberProfileExtension(...)    // query 3: Extension
  results.push(this.hydratePersistentProfile({...}))
}
```

**影响**: 100 条 profiles → `1 + (100 × 3) = 301` 次数据库查询  
**修复方案**: 用 Prisma `include: { user: true, lytMemberSnapshot: ..., memberProfileExtension: ... }` 一次 JOIN 取回

---

## 6. 修复优先级

| 优先级 | 问题 | 影响 | 修复工作量 |
|--------|------|------|-----------|
| P0 🔴 | member.service N+1 循环 | 单请求 301 查询 | 30min |
| P0 🔴 | 45 处 findMany 无分页 | 全表返回 | 2h（逐文件加 take + skip） |
| P1 🔶 | auditLog findMany 全量 | 审计日志暴增 | 与 P0 一并处理 |
| P2 🟡 | 无 `select` 字段裁剪 | 带宽浪费 | 后续优化 |

---

## 7. Git Commit

```
health: Day16-T1 性能基线
```

覆盖范围: 仅性能分析报告，无代码变更。

---

## 8. 总结

- **索引层**: 245 个索引，模式成熟，✅ 无需干预
- **关联加载**: 9 处 include，使用克制，✅ 安全
- **分页缺失**: 45/45 的 findMany 无分页，🔴 需要逐文件添加
- **N+1**: 1 处确认（member.service），🔴 需改为 Prisma include
- **整体**: 基础架构良好，但缺少防御性分页保护，需作为 V23 性能专项修复
