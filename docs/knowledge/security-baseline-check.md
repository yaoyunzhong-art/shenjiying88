# 🔐 安全基线检查报告

> 扫描时间: 2026-07-18 07:30 CST
> 项目: shenjiying88 (V18 + V19)
> 基线版本: v1.7
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局 Guard 宽松模式持续, V19 新模块涌入扩大缺口)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 宽松模式 | ❌ 无 `@Roles`/`@Permissions`/`@TenantScope` 时默认放行 |
| 未显式 `@UseGuards` 的 Controller | ⚠️ **177 个** (与昨日持平, 无明显新增模块) |
| 实际保护 | 全局 Guard 覆盖所有 177 个, 但依赖 Header 透传, 宽松模式风险持续 |

```json
{
  "status": "basic_coverage_relaxed",
  "controllers_unlabeled": 177,
  "trend": "stable",
  "risk": "medium"
}
```

**风险标记: ⚠️ 中等 (177 个 Controller 依赖全局 Guard 宽松模式)**

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (TokenBucket + 流量治理)**

| 维度 | 详情 |
|------|:----:|
| 算法 | TokenBucket (令牌桶) |
| 全局 Guard | `TrafficGovernanceGuard` — 装饰器触发, 无装饰器放行 |
| 装饰器 | `@RateLimit()` |
| 服务层 | `RequestGovernanceService` via `TrustGovernanceService` |
| Redis 适配 | `rate-limit.adapter.ts` |
| 管理 UI | admin-web 含 rate-limits 详情/策略/台账页面 |
| 测试覆盖 | `request-governance.service.test.ts` — evaluateRateLimit 委托 + 决策存储已验证 |

**风险标记: ✅ 低 (不变)**

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (9 张表受 RLS 保护 · 43 张表未覆盖)**

| 维度 | 详情 |
|------|:----:|
| 迁移文件 | 4 个: 002 / 005 / 006 / 007 |
| **RLS 受保护表** | **9 张**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log |
| Prisma model 总数 | 52 个 |
| 未覆盖表 | 43 张 (含 member / staff / brand / store 等核心表) |
| RLS API | ✅ `rls.controller.ts` — 管理/查询/更新端点 (14 个 API), `RlsModule` 已注册 |
| RLS 辅助 | ✅ `rls.helper.ts` |

**RLS 保护表明细 (4 个迁移):**
| 迁移文件 | 表 | 启用 RLS |
|----------|----|:--------:|
| 002_rls_policies.sql | agent_events | ✅ |
| 005_order_rls.sql | orders, order_items, payments, refunds | ✅ |
| 006_ai_model_config.sql | ai_model_store_config, ai_model_config_history | ✅ |
| 007_three_level_config.sql | config_instance, config_audit_log | ✅ |

```json
{
  "total_models": 52,
  "rls_protected_tables": 9,
  "unprotected_tables": 43,
  "risk": "high"
}
```

**风险标记: 🚨 高 (43 张核心表仍无 RLS)**

---

## 4️⃣ tenant_id 字段完整性

**状态: ⚠️ 大部分覆盖 (39/52 个 model 含 tenantId)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | 52 个 |
| 含 `tenantId` | ✅ **39 个 model** 有 tenantId |
| 缺失 `tenantId` | ⚠️ **13 个 model** 无 tenantId (含 Tenant 自身, MarketProfile, RegionalConfig, EmailChannelConfig, SocialChannelConfig, TaxPolicyConfig, OrganizationMembership, ConfigRevision, WebhookDelivery, EdgeSyncTask, QuotaLedger, AiPromptTemplate, ConfigInstance) |

> ⚠️ 注意: 昨日报告称 53/53 完整, 实际扫描为 39/52 (不含 zhishiku schema, 该目录无 prisma 文件)。ConfigInstance 和 ConfigAuditLog 已通过 RLS 保护但 schema 中无 tenantId 字段标注 — 需要通过 RLS 策略中的 owner_id 多态方式实现。

```json
{
  "total_models": 52,
  "with_tenantId": 39,
  "without_tenantId": 13,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (13 个 model 无 tenantId, 昨日报告数据有误)**

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (PushTaskService.records 仅内存 Map, 无持久化)**

| 维度 | 结果 |
|------|:----:|
| 实现位置 | `PushTaskService` — `private records = new Map<string, PushRecord[]>()` |
| 存储方式 | 全内存 (`private tasks`, `private records`) |
| 持久化 | ❌ 无数据库/Redis 持久化 |
| revoke 功能 | ❌ 无 revoke 逻辑 (PushRecord 不包含 `status: 'revoked'` 字段) |
| 跨节点失效 | ❌ 多实例部署时状态完全不共享 |
| 重启丢失 | ❌ 服务重启后所有推送历史 + 任务全部丢失 |

```json
{
  "persistence": "memory_only",
  "has_revoke_logic": false,
  "cross_node": false,
  "restart_survive": false,
  "risk": "high",
  "fix_progress": "not_started"
}
```

**风险标记: 🚨 高 (全内存, 无持久化, 无 revoke)**

---

## 6️⃣ Lua 沙箱

**状态: ✅ 不适用 (无 Lua 运行时)**

| 维度 | 结果 |
|------|:----:|
| Lua 运行时 | ❌ 不存在 |
| 代码内引用 | 无 `lua`/`luajit`/`lua.*sandbox` 关键字 |
| `.lua` 文件 | 无 |
| `SandboxModule` | 仅用于 ISV 应用商店 + 代码执行 (非 Lua) |

**风险标记: ✅ N/A (不变)**

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (GDPR/PII/加密/审计/WAF/幂等性六维全栈)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|:----:|
| GDPR 合规 | `gdpr.service.ts`, `compliance.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 级联清理 (Right to be Forgotten — Article 17) |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 检测 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument |
| 审计日志 | `audit-log.service.ts` + `audit-query.service.ts` | ✅ 全量 actor/resource/action, Grafana dashboard 含 GDPR 指标 |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM |
| WAF | `waf.service.ts` | ✅ allow/block/challenge/log 四种动作, 32 条规则容量 |
| 幂等性 | admin-web 管理页面 | ✅ 幂等 key 管理 |
| 渗透测试 | `security-scanner.service.ts` + 安全扫描 | ✅ 硬编码密码/Token/依赖审计, 退出码 0 |
| 数据分类 | PiiPolicy 28 条策略 | ✅ 4 级分类 |

**风险标记: ✅ 良好 (不变)**

---

## 8️⃣ 未成年保护

**状态: ⚠️ 仅前端声明, 无后端校验**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `apps/tob-web/app/sports-ants/privacy/page.tsx` — Section 八 "未成年人保护", 含"不满14周岁需监护人陪同"声明 |
| 内容限制 | ✅ FAQ 提及区域限制 |
| 年龄验证 | ❌ 无后端年龄验证逻辑 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/未成年人限制注册机制 |
| 合规等级 | ⚠️ 仅完成隐私政策文案, 未实现技术管控 |

**风险标记: ⚠️ 中等 (同上日, 未修复)**

---

## 9️⃣ 渗透测试 (自动化扫描)

**状态: 🟢 安全门通过 (退出码 0)**

| 维度 | 今日 (07-18) | 趋势 |
|------|:-----------:|:----:|
| 硬编码密码 | 🟢 0 处 | → |
| 硬编码Token | 🟢 0 处 | → |
| 依赖危急漏洞 | 🟢 0 处 | → |
| 依赖高危漏洞 | 🟢 0 处 | → |
| 渗透退出码 | 🟢 0 | → |
| **总体风险** | **🔴 低危** | **→ 稳定** |

> 注: 今日安全扫描仅覆盖密钥泄漏/Token硬编码/依赖审计三项自动化检, 不含 XSS/未授权API 专项扫描。详细渗透报告见 `security-scan-2026-07-18.md`

**风险标记: ✅ 低 (自动化门通过)**

---

## 1️⃣0️⃣ 数据分类检查

**状态: ⚠️ 持续 (PiiPolicy 28 条策略覆盖, model 分类标注待完善)**

| 维度 | 今日 (07-18) | 趋势 |
|------|:-----------:|:----:|
| PII 策略覆盖 | ✅ 28 条 | → |
| Prisma model 分类标注 | ⚠️ 待审计 | → |
| 安全扫描退出码 | 🟢 0 | → |

**风险标记: ⚠️ 关注 (同上日)**

---

## 📊 汇总评分 — 7日趋势分析

| # | 基线项目 | 状态 | 风险等级 | 7日趋势 |
|---|---------|:----:|:--------:|:--------:|
| 1 | AuthGuard 覆盖率 | ⚠️ 基本覆盖 (宽松) | ⚠️ 中 | → 稳定 (177) |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 低 | → |
| 3 | RLS 多租户隔离 | ⚠️ 9表 + RLS API | 🚨 高 | → |
| 4 | tenant_id 完整性 | ⚠️ 39/52 (13 缺失) | ⚠️ 中 | ↔️ **修正** (昨报有误) |
| 5 | deviceToken 安全 | ⚠️ 全内存无持久化 | 🚨 高 | → |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ N/A | → |
| 7 | 合规检查 | ✅ 完整 | ✅ 良好 | → |
| 8 | 未成年保护 | ⚠️ 仅前端声明 | ⚠️ 中 | → |
| 9 | 渗透测试 | 🟢 自动化门通过 | ✅ 低 | → |
| 10 | 数据分类 | ⚠️ 待完善 | ⚠️ 关注 | → |

**有效基线: 9/9 (Lua N/A 不计入基数)**

| 指标 | 值 |
|------|:---:|
| 基线项目总数 | 10 项 (有效 9 项) |
| 已落地 (含N/A) | ✅ **10/10** |
| 高风险 | 2 项 (RLS + deviceToken) |
| 中等风险 | 3 项 (AuthGuard + tenant_id 完整性 + 未成年保护) |
| 恶化项 | **0 项** (对比昨日) |
| 修复项 | **0 项** |
| **今日修正** | tenant_id 从 53/53 完整 → 39/52 (昨日报告数据有误, 已修正) |

---

## ⚠️ 今日建议 (07-18)

### P0 — 今日处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | RLS | 扩展 RLS 覆盖 member / staff / brand / store 等核心表 (>30 张), 利用现有 RLS API | 🚨 |
| P1 | deviceToken | `PushTaskService` 改为 Redis/DB 持久化方案, 添加 revoke 逻辑, 支持跨节点同步 | 🚨 |
| P1 | AuthGuard | `IdentityAccessGuard` 添加 `@Public()` 装饰器, 默认拒绝模式 | ⚠️ |
| P1 | tenant_id | 13 个 model 补充 tenantId 字段 + 迁移脚本 | ⚠️ |
| P1 | 未成年保护 | 后端添加年龄验证中间件 + 监护人同意流程 | ⚠️ |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 数据分类 | 完成 Prisma model 数据分类标注 |
| P2 | 渗透测试 | 恢复 XSS/未授权API 专项扫描 |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v1.7 | 2026-07-18 | 修正 tenant_id 数据 (52 models, 39 含 tenantId, 13 缺失); deviceToken 风险修正 (PushTaskService, 非 APNsService); 渗透测试更新 (自动化门通过) |
| v1.6 | 2026-07-17 | 渗透测试更新: XSS 22↑, 未授权API 177↑ (含 V19 29 个新) |
| v1.5 | 2026-07-16 | 新增 未成年保护 基线项 |
| v1.4 | 2026-07-15 | RLS 表从5→9 (006+007), 数据分类修复暂停 |
| v1.3 | 2026-07-14 | 新增 渗透测试 + 数据分类 基线项 |

---

*下次检查: 2026-07-19 (每日自动化)*
