# 🔐 安全基线检查报告

> 扫描时间: 2026-07-24 07:30 CST
> 项目: shenjiying88 (V23+)
> 基线版本: v2.2
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: 🟢 默认拒绝模式 (94.93%)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 默认策略 | ✅ **默认拒绝** — 无 `@Public()`/`@Roles`/`@Permissions` 时抛出 `UnauthorizedException` |
| Controller 总数 | **217 个** |
| `@UseGuards`/`@Public`/`@Roles`/`@Permissions` 标注 | **206 个** |
| 未标注 | **11 个** |
| 覆盖率 | **94.93%** (阈值 ≥80%) |

**未标注控制器（需补充 @UseGuards 或 @Public()）：**
| # | 控制器 | 说明 |
|---|--------|------|
| 1 | `birthday.controller.ts` | 🆕 新模块，未加 Guard |
| 2 | `cdn-cache.controller.ts` | CDN 管理 |
| 3 | `chaos.controller.ts` | 混沌工程 |
| 4 | `docs.controller.ts` | 文档接口 |
| 5 | `federated-learning.controller.ts` | 联邦学习 |
| 6 | `observability.controller.ts` | 可观测性 |
| 7 | `open-platform.controller.ts` | 🆕 新模块，未加 Guard |
| 8 | `ab-test.controller.ts` | A/B 试验 |
| 9 | `reports.controller.ts` | 报表 |
| 10 | `saas-advanced.controller.ts` | SaaS 高级功能 |
| 11 | `tenant-llm.controller.ts` | 租户 LLM |

```json
{
  "status": "deny_by_default",
  "controllers_total": 217,
  "controllers_labeled": 206,
  "controllers_unlabeled": 11,
  "coverage_pct": 94.93,
  "unlabeled_nature": "birthday/open-platform 为新模块; 其余 9 个为 internal tooling",
  "trend": "stable",
  "risk": "low"
}
```

**风险标记: 🟢 低 (覆盖率达标; 2 个新模块需补充守卫; 与 07-23 持平)**

---

## 2️⃣ RateLimit 实现状态

**状态: 🟢 完善实现 (双层限流: TokenBucket + 滑动窗口)**

| 维度 | 详情 |
|------|:----:|
| 算法1 | TokenBucket (令牌桶) — `rate-limiter.ts` |
| 算法2 | 滑动窗口 (1min QPS + 日配额) — `openapi/rate-limiter.ts` |
| 全局 Guard | `TrafficGovernanceGuard` |
| 装饰器 | `@RequireRateLimit()` / `@RateLimit()` |
| 服务层 | `TokenBucket` + `openapi/RateLimiter` |
| Redis 适配 | `rate-limit.adapter.ts` (OpenAPI) |
| 管理 UI | admin-web `rate-limits/` — 策略/台账/详情 |
| Prisma Model | `RateLimitPolicy` — 持久化限流策略 |
| 测试覆盖 | `request-governance.service.test.ts` / `rate-limiter.test.ts` / `rate-limit.adapter.test.ts` |

```json
{
  "algorithms": ["TokenBucket", "sliding_window"],
  "global_guard": "TrafficGovernanceGuard",
  "persistent": true,
  "redis_backed": true,
  "risk": "low"
}
```

**风险标记: 🟢 低 (稳定, 双算法分层防护)**

---

## 3️⃣ RLS 多租户行级安全

**状态: 🟡 部分覆盖 (中间件就绪, 需全量启用)**

| 维度 | 详情 |
|------|:----:|
| RLS 中间件 | ✅ `rls.middleware-prisma.ts` — Prisma `$extends` 自动注入 tenant_id |
| RLS API | ✅ `rls.controller.ts` – 14 个管理端点 |
| RLS Module | ✅ `RlsModule` 已注册 |
| RLS 迁移文件 | 5 个: `002_rls_policies.sql` / `005_order_rls.sql` / `006_ai_model_config.sql` / `007_three_level_config.sql` |
| RLS Policy 覆盖表 | **8 张表**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log |
| Prisma model 总数 | **91 个** |
| 含 tenantId 字段 | **42 个 model** |
| 应用层中间件 active | ✅ `rls.middleware-prisma.ts` — 拦截所有 tenant-aware model |
| 数据库层 RLS Policy 覆盖 | ❌ 仅 9 张表 (占比 ~10%) |

```json
{
  "total_models": 91,
  "models_with_tenantId": 42,
  "rls_policy_tables": 9,
  "rls_middleware_active": true,
  "tenant_aware_models_in_middleware": 41,
  "risk": "medium",
  "gap": "db_rls_policy_has_not_scaled_with_model_growth"
}
```

**风险标记: 🟡 中 (RLS 基础设施就位, Prisma 中间件覆盖 41 个 tenant-aware model, 但数据库 RLS Policy 仅 9 张表, 需逐表扩展)**

---

## 4️⃣ tenant_id 字段完整性

**状态: 🟡 42/91 个 model 含 tenantId (49 缺失)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | **91 个** |
| 含 `tenantId`/`tenant_id` | **42 个 model** |
| 缺失 | **49 个 model** (含系统表、全局配置、新模块表) |

**主要缺失 tenant_id 的 model 清单：**
| # | Model | 类型 | 说明 |
|---|-------|------|------|
| 1 | Tenant | 系统 | 自身，不适用 |
| 2-4 | MarketProfile / RegionalConfig / RegionalConfigOverride | 全局配置 | 区域/全局配置 |
| 5-7 | EmailChannelConfig / SocialChannelConfig / TaxPolicyConfig | 通道配置 | 全局配置类 |
| 8 | OrganizationMembership | 组织 | 组织成员 |
| 9-10 | ConfigInstance / ConfigRevision | 配置系统 | 配置实例/版本 |
| 11 | WebhookDelivery | 系统 | Webhook 投递日志 |
| 12 | EdgeSyncTask | 系统 | 边缘同步任务 |
| 13 | QuotaLedger | 配额 | 配额账本 |
| 14 | AiPromptTemplate | AI | AI 提示模板模板 |
| 15-16 | EmpowerCard / EmpowerCardQuoteLog | 🆕 V22 | 赋能卡 — 无 tenantId |
| 17-19 | ReconcileDiffModel / ReconcileMatchModel / ResolvedDiffModel | 🆕 V22 | 对账差异 — 无 tenantId |
| 20+ | BirthdayPlan/BirthdayReward/BirthdayTracking | 🆕 新模块 | 生日模块 — 无 tenantId |

```json
{
  "total_models": 91,
  "with_tenantId": 42,
  "without_tenantId": 49,
  "coverage_ratio": "46.2%",
  "systems_without": ["Tenant", "global_configs", "config_system", "webhook", "edge"],
  "new_modules_without": ["EmpowerCard", "EmpowerCardQuoteLog", "ReconcileDiff/Match/Resolved", "BirthdayPlan/Reward/Tracking"],
  "risk": "medium",
  "note": "覆盖率从 72.3% 降至 46.2% 主要因为 prisma model 从 65 扩至 91 个 (含大量系统/全局表), 新模块表均未加 tenantId"
}
```

**风险标记: 🟡 中 (新模块 Birthday / EmpowerCard / Reconcile 均缺 tenantId; 需启动新模块 tenant_id 准入检查)**

---

## 5️⃣ deviceToken 安全检查

**状态: 🟡 部分修复 (push.service ✅ · ai-push-task.service ❌)**

| 维度 | 结果 |
|------|:----:|
| **push.service.ts** | |
| 存储模式 | ✅ TypeORM 仓库优先 + 内存兜底 |
| `persistRecord()` | ✅ 写入 `PushRecordEntity` |
| `revokeToken()` | ✅ 数据库写入 |
| `getPushHistory()` | ✅ 数据库优先 |
| token 验证 | ✅ `@IsString()` DTO 验证, 长度 >= 64 检查 |
| **ai-push-task.service.ts** | |
| `tasks = Map<>` | ❌ 全内存, 无持久化 |
| `records = Map<>` | ❌ 全内存, 无持久化 |
| 跨节点 | ❌ 多实例不共享 |
| 重启丢失 | ❌ 重启后全部丢失 |
| **DTO 安全增强** | |
| 脱敏/加密 | ❌ deviceToken 无脱敏或加密存储 |

```json
{
  "push_service": "persistent",
  "ai_push_task": "memory_only",
  "token_encryption": "missing",
  "fix_progress": "partial",
  "risk": "medium"
}
```

**风险标记: 🟡 中 (ai-push-task 仍全内存, deviceToken 无加密; 与 07-23 持平)**

---

## 6️⃣ Lua 沙箱

**状态: 🟢 N/A (无 Lua 运行时)**

| 维度 | 结果 |
|------|:----:|
| Lua 运行时 | ❌ 不存在 |
| `blindbox-lua.service.ts` | ⚠️ 注释标记为"模拟实现(内存模拟 Redis eval)"，使用 TS Mock 而非实际 Redis Lua 脚本 |
| `.lua` 文件 | 无 |
| 沙箱服务 | ✅ `sandbox.service.ts` — 仅 ISV 环境生命周期管理 |
| 沙箱适配器 | ✅ `sandbox-lyt.adapter.ts` / `sandbox.adapter.ts` — 非 Lua 执行 |

```json
{
  "lua_runtime": false,
  "redis_eval_mock": true,
  "sandbox_service": "env_lifecycle_only",
  "risk": "low",
  "note": "blindbox 使用内存模拟, 生产应切换为 ioredis.eval()"
}
```

**风险标记: 🟢 低 (无 Lua 沙箱风险; blindbox 的 Redis Lua mock 需切换为实际 eval)**

---

## 7️⃣ 合规检查

**状态: 🟢 完整实现 (GDPR/PII/加密/审计/WAF 六维全栈)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|:----:|
| GDPR 合规 | `compliance-gate.service.ts`, `compliance.controller.ts` | ✅ Consent / DSR / 删除权 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 级联清理 (Right to be Forgotten) |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument, PII 过滤 |
| 审计日志 | `audit-log.service.ts` + `audit-query.service.ts` | ✅ actor/resource/action 全量 |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM |
| WAF | `waf.service.ts` | ✅ 4 种动作, 32 条规则 |
| 幂等性 | admin-web 管理页面 | ✅ 幂等 key 管理 |
| 数据分类 | `PiiPolicy` 28 条策略 | ✅ 4 级分类 |
| 合规 E2E | `compliance-security-e2e.test.ts` | ✅ GDPR 完整流程 + DSR + 安全扫描 |
| 渗透测试 | `security-scanner.service.ts` | ✅ 扫描退出码 0 |
| 合规合约 | `compliance.contract.ts` | ✅ 合约测试覆盖 |

```json
{
  "gdpr": true,
  "pii_detection": true,
  "pii_masking": true,
  "audit_log": true,
  "encryption": true,
  "waf": true,
  "idempotency": true,
  "data_classification": true,
  "test_coverage": true,
  "risk": "low"
}
```

**风险标记: 🟢 低 (稳定, 合规体系完整)**

---

## 8️⃣ 未成年保护

**状态: 🟡 仅前端声明, 无后端校验**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `privacy/page.tsx` — Section 八"未成年人保护" |
| 内容限制 | ✅ 区域限制 |
| 年龄验证 | ❌ 无后端年龄验证 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/限制注册 |
| 盲盒消费限制 | ❌ 未满 8 岁应禁止消费 / 8-16 岁限额 — 未实现 |
| P0 审计项 | 📋 `docs/compliance/blindbox-engine-p0-audit-checklist.md` — 已标识 |
| 运营需求 | 📋 `docs/operations/r13-business-app-requirements.md` B-20 — 已标识 P0 |

```json
{
  "privacy_statement": true,
  "age_verification": false,
  "parental_consent": false,
  "registration_filter": false,
  "blindbox_restriction": false,
  "compliance_docs_ready": true,
  "risk": "medium"
}
```

**风险标记: 🟡 中 (合规文档已准备但实现为零; 与 07-23 持平)**

---

## 📊 汇总评分 — 7 日趋势

| # | 基线项目 | 状态 | 风险 | 趋势 |
|---|---------|:----:|:----:|:----:|
| 1 | AuthGuard 覆盖率 | 🟢 94.93% (206/217) | **低** | → 稳定 (新增 2 模块未加 Guard) |
| 2 | RateLimit 实现 | 🟢 双层限流 + 持久化 | **低** | → 稳定 |
| 3 | RLS 多租户隔离 | 🟡 中间件就绪, 策略仅 9 表 | **中** | → 稳定 |
| 4 | tenant_id 完整性 | 🟡 42/91 (46.2%, 新模型扩增拉低) | **中** | 📉 **下降** (model 从 65→91, 新表均缺 tenantId) |
| 5 | deviceToken 安全 | 🟡 ai-push-task 仍全内存 | **中** | → 稳定 |
| 6 | Lua 沙箱 | 🟢 无运行时 | **低** | → 稳定 |
| 7 | 合规检查 | 🟢 六维全栈完整 | **低** | → 稳定 |
| 8 | 未成年保护 | 🟡 仅前端声明 | **中** | → 稳定 |

| 指标 | 值 | 趋势 |
|------|:---:|:----:|
| 高风险项目 | **0 项** | → |
| 中等风险 | **4 项** | → |
| 新改善 | **0 项** | — |
| 新退化 | **1 项** (tenant_id 覆盖率下降) | 📉 |

---

## ⚠️ 今日建议 (2026-07-24)

### P0 — 本周处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | tenant_id | Birthday 模块 (BirthdayPlan/Reward/Tracking) 补充 tenantId 字段 + 迁移脚本 | 🟡 中 |
| **P0** | tenant_id | EmpowerCard/QuoteLog/Reconcile* 模块补充 tenantId | 🟡 中 |
| **P0** | RLS | 利用现有 RLS 中间件, 扩展 RLS Policy 至所有含 tenant_id 的核心表 | 🟡 中 |
| P1 | AuthGuard | birthday / open-platform 新模块 controller 补充 @UseGuards | 🟢 低 |
| P1 | deviceToken | ai-push-task.service.ts 持久化迁移至 Redis/TypeORM | 🟡 中 |
| P1 | deviceToken | DTO 层 deviceToken 增加加密/脱敏逻辑 | 🟡 中 |
| P1 | 未成年保护 | 实现后端年龄验证 + 注册拦截 + 盲盒消费限制 | 🟡 中 |
| P1 | Lua | blindbox-lua.service.ts 切换从内存 mock 到 ioredis.eval() | 🟢 低 |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | tenant_id | 建立新模块 tenant_id 准入检查 (code review checklist) |
| P2 | AuthGuard | 9 个 internal tooling 控制器评估是否需要 @Public() |
| P2 | RLS | 建立 RLS policy CI 验证 — 新表必须包含 RLS 迁移 |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v2.2 | 2026-07-24 | Controller 217 (新增 birthday + open-platform 模块); Prisma model 91 (新增 26 个系统/全局 model); tenantId 42/91 (46.2%); 新增 Birthday/EmpowerCard/Reconcile 等模块均缺 tenantId |
| v2.1 | 2026-07-23 | Controller 212; Prisma model 65; tenantId 47/65 (72.3%) |
| v2.0 | 2026-07-21 | AuthGuard 默认拒绝落地; push.service → TypeORM; tenant_id 48/63 |

---

*下次检查: 2026-07-25 (每日自动化)*
