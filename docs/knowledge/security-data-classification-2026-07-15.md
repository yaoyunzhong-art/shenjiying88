# 🐜 数据分类检查报告

> 扫描时间: 2026-07-15 18:47:25 CST
> 项目: shenjiying88 (V18)
> 模块: 安全基线 — 数据分类检查 (security-baseline ✅ 8/8)
> 脚本: scripts/security-data-classification.sh

---

## 📊 汇总

| 检查项 | 结果 | 详情 |
|--------|:----:|:----:|
| Prisma Schema 数据分类 | 🔴 | ⚠️ 15 个model缺失 |
| Rules 权限标注 | 🔴 | ⚠️ 2 个文件缺失 |
| RLS 数据分类 | 🔴 | ⚠️ 5 张表缺失 |
| PII 策略覆盖 | 🟢 | 28 条 PiiPolicy 已配置 |
| **总体** | **🔴 中危** | **退出码: 1** |

---

## 1️⃣ Prisma Schema 数据分类

> 数据分类级别: PUBLIC(公开) | INTERNAL(内部) | SENSITIVE(敏感) | RESTRICTED(受限)
> 扫描: apps/api/prisma/schema.prisma — 检查每个 model 的 PiiLevel 标注

**⚠️ 15 个 model 含敏感字段但无 PiiLevel 标注:**

| Model | 问题 |
|-------|------|
| `MemberProfileExtension (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `LytConnection (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `MarketProfile (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `RegionalConfig (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `RegionalConfigOverride (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `IdentityAccount (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `OrganizationMembership (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `ConfigEntry (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `SecretAsset (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `CertificateAsset (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `WebhookSubscription (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `FeatureFlag (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `ConfigInstance (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `ConfigAuditLog (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |
| `MarketingPushDecisionLog (含敏感字段但无PiiLevel标注)` | 含敏感字段但未标注数据分类 |

### 数据分类定级参考

| 级别 | 含义 | 示例 | 要求 |
|------|------|------|------|
| `PUBLIC` | 公开数据 | 商品名称、门店地址 | 无限制 |
| `INTERNAL` | 内部数据 | 规则配置、报表数据 | 内部访问 |
| `SENSITIVE` | 敏感数据 | 手机、邮箱、地址 | 脱敏 + PiiPolicy |
| `RESTRICTED` | 受限数据 | 密码、密钥、证书 | 加密 + 审批 + PiiPolicy |

---

## 2️⃣ Rules 权限标注

> 扫描: apps/admin-web/app/rules/ — 检查每个 `page.tsx`/`page.ts` 的权限/角色标注

**⚠️ 2 个文件缺少权限/角色标注:**

| 文件 | 缺少 |
|------|------|
| `apps/admin-web/app/rules/executions/[id]/page.tsx` | @roles / @permission 注解 |
| `apps/admin-web/app/rules/executions/page.tsx` | @roles / @permission 注解 |

---

## 3️⃣ RLS 数据分类

> 扫描: apps/api/src/database/migrations/\*rls\*.sql — 检查每张 RLS 表的数据分类标注

**⚠️ 5 张 RLS 表缺少数据分类标注:**

| 文件 | 表名 |
|------|------|
| `apps/api/src/database/migrations/002_rls_policies.sql:agent_events` | 无数据分类 SQL 注释 |
| `apps/api/src/database/migrations/005_order_rls.sql:orders` | 无数据分类 SQL 注释 |
| `apps/api/src/database/migrations/005_order_rls.sql:order_items` | 无数据分类 SQL 注释 |
| `apps/api/src/database/migrations/005_order_rls.sql:payments` | 无数据分类 SQL 注释 |
| `apps/api/src/database/migrations/005_order_rls.sql:refunds` | 无数据分类 SQL 注释 |

---

## 4️⃣ PII 策略覆盖

> 检查: PiiPolicy model + schema 敏感字段 + 脱敏策略

✅ PiiPolicy 已配置 28 条策略

**Schema 中检测到 3 类敏感字段:**

- `secret`
- `email`
- `address`

---

## 🚦 闸门判定

| 条件 | 状态 | 说明 |
|------|:----:|------|
| Prisma model 分类缺失 > 0 | 🔴 | ⚠️ 建议补充 PiiLevel 标注 |
| Rules 权限标注缺失 > 0 | 🔴 | ⚠️ 建议补充角色/权限标注 |
| RLS 数据分类缺失 > 0 | 🔴 | ⚠️ 建议补充 SQL 注释 |
| PII 策略覆盖 | 🟢 | 已配置 |
| **出口** | **🔴 中危 (退出码 1)** | |

> 🐜 [V18: security-baseline] · 安全基线修复 (G2退回)

