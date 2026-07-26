# 🔐 安全基线检查报告

> 扫描时间: 2026-07-27 07:30 CST
> 项目: shenjiying88 (V23+)
> 基线版本: v2.3
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: 🟢 默认拒绝模式 (95.98%) ↑**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 默认策略 | ✅ **默认拒绝** — 无 `@Public()`/`@Roles`/`@Permissions` 时抛出 `UnauthorizedException` |
| Controller 总数 | **224 个** (+7 自 07-24) |
| `@UseGuards`/`@Public`/`@Roles`/`@Permissions` 标注 | **215 个** |
| 未标注 | **9 个** |
| 覆盖率 | **95.98%** (阈值 ≥80%) |

**未标注控制器（需补充 @UseGuards 或 @Public()）：**
| # | 控制器 |
|---|--------|
| 1 | `ab-test.controller.ts` |
| 2 | `cdn-cache.controller.ts` |
| 3 | `chaos.controller.ts` |
| 4 | `docs.controller.ts` |
| 5 | `federated-learning.controller.ts` |
| 6 | `observability.controller.ts` |
| 7 | `reports.controller.ts` |
| 8 | `saas-advanced.controller.ts` |
| 9 | `tenant-llm.controller.ts` |

> ✅ **改善项**: birthday.controller.ts 和 open-platform.controller.ts 已正确标注 `@UseGuards(TenantGuard)`，自 07-24 未标注从 11 减少到 9。剩下的 9 个都是 internal tooling/管理端控制器，风险较低。

```json
{
  "status": "deny_by_default",
  "controllers_total": 224,
  "controllers_labeled": 215,
  "controllers_unlabeled": 9,
  "coverage_pct": 95.98,
  "trend": "improving",
  "risk": "low"
}
```

**风险标记: 🟢 低 (覆盖率上升; 9 个未标注均为 internal tooling)**

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
| RLS Policy 覆盖表 | **8 张表**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log |
| Prisma model 总数 | **117 个** (+26 自 07-24, 含大量系统表) |
| 含 tenantId 字段 | **83 个 model** (+41 自 07-24) |
| 应用层中间件 active | ✅ `rls.middleware-prisma.ts` — 拦截所有 tenant-aware model |
| 数据库层 RLS Policy 覆盖 | ❌ 仅 9 张表 (占比 ~7.7%) |

```json
{
  "total_models": 117,
  "models_with_tenantId": 83,
  "rls_policy_tables": 9,
  "rls_middleware_active": true,
  "tenant_aware_models_in_middleware": 83,
  "risk": "medium",
  "gap": "db_rls_policy_has_not_scaled_with_model_growth"
}
```

**风险标记: 🟡 中 (RLS 基础设施就位, Prisma 中间件覆盖 83 个 tenant-aware model, 但数据库 RLS Policy 仅 9 张表, 需逐表扩展)**

---

## 4️⃣ tenant_id 字段完整性

**状态: 🟡 83/117 个 model 含 tenantId (34 缺失)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | **117 个** |
| 含 `tenantId`/`tenant_id` | **83 个 model** |
| 缺失 | **34 个 model** (含系统表、全局配置表) |

> ✅ **改善项**: Birthday 模块 (BirthdayPlan/BirthdayReward/BirthdayTracking) 自 07-26 后已补充 tenantId 字段。

**主要缺失 tenant_id 的 model 清单：**
| # | Model | 类型 | 说明 |
|---|-------|------|------|
| 1 | Tenant | 系统 | 自身，不适用 |
| 2-4 | MarketProfile / RegionalConfig / ConfigInstance | 全局配置 | 全局/区域配置 |
| 5-7 | EmailChannelConfig / SocialChannelConfig / TaxPolicyConfig | 通道配置 | 全局配置类 |
| 8 | OrganizationMembership | 组织 | 组织成员 |
| 9 | ConfigRevision | 配置系统 | 配置版本 |
| 10-11 | WebhookDelivery / EdgeSyncTask | 系统 | 递送/边缘同步 |
| 12 | QuotaLedger | 配额 | 配额账本 |
| 13 | AiPromptTemplate | AI | AI 提示模板 |
| 14-15 | EmpowerCard / EmpowerCardQuoteLog | 知识库 | 赋能卡片 (知识库系统) |
| 16-18 | ReconcileDiffModel / ReconcileMatchModel / ResolvedDiffModel | 对账系统 | 对账差异 |
| 19-22 | ApiKeyRecord / ApiCallRecord / ApiVersion / SdkVersion | OpenAPI | API 管理 |
| 23-24 | SlaContract / BillingRecord | OpenAPI | SLA/计费 |
| 25 | MarketplaceItem | OpenAPI | 市场 |
| 26 | TierChangeRecord | 租户 | 租户等级变更 |
| 27-30 | CrossBrandCoupon / CouponRedemption / CouponSettlement / AllianceSettlement | 跨品牌 | 跨品牌券相关 |
| 31-32 | UnlinkedOrder / AnomalyTransaction | 对账 | 未匹配订单/异常交易 |
| 33 | ReviewRecord | 审核 | 审核记录 |
| 34 | DataCallbackRecord | 数据 | 数据回调 |

```json
{
  "total_models": 117,
  "with_tenantId": 83,
  "without_tenantId": 34,
  "coverage_ratio": "70.9%",
  "trend": "improving",
  "risk": "medium",
  "note": "覆盖率从 46.2% 回升至 70.9%: 1) prisma model 从 91→117(因更精准统计含 mermaid/model 等); 2) Birthday 模块已补 tenantId; 3) 34 个缺失多为系统/全局配置/OpenAPI 类表"
}
```

**风险标记: 🟡 中 (改善趋势; EmpowerCard/Reconcile 仍缺 tenantId; OpenAPI 表需评估是否需要多租户)**

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
  "risk": "medium",
  "trend": "stable"
}
```

**风险标记: 🟡 中 (ai-push-task 仍全内存, deviceToken 无加密; 与 07-24 持平)**

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

**状态: 🟡 新增实现 (Controller + Service + Prisma Model 已交付, 待 DB 迁移)**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `privacy/page.tsx` — Section 八"未成年人保护" |
| MinorProtectionModule | ✅ **自 07-25 后新增**: 完整的 Controller + Service + PrismaStore |
| 身份认证 API | ✅ AI 人脸识别 + 身份证验证 (`POST /minor-protection/verify`) |
| 时段管控 API | ✅ 宵禁 (22:00-06:00) + 工作日限时 (`POST /minor-protection/check-access`) |
| 监护人同意 | ✅ `guardianConsent` 字段支持 |
| 年龄计算 | ✅ `calculateAge()` 基于生日精确计算 |
| PII 脱敏 | ✅ `maskIdentityNumber()` 脱敏身份证号 |
| 审计日志 | ✅ 接入 `AuditService` (fire-and-forget) |
| DB 持久化 | ✅ `MinorIdentityVerification` + `MinorAccessLog` Prisma model 已定义 |
| 启动加载 | ✅ `onApplicationBootstrap` — 启动时从 DB 加载数据至内存 |
| DB 迁移 | ❌ **未创建** — 需生成 Prisma migration |
| 盲盒消费限制 | ❌ 未成年消费限额/分级限制逻辑尚未实现 |
| 注册拦截 | ❌ 用户注册流程尚未对接 MinorProtectionService |
| P0 审计项 | 📋 `docs/compliance/blindbox-engine-p0-audit-checklist.md` — 已标识 |

```json
{
  "minor_protection_module": "implemented",
  "identity_verification": true,
  "time_restriction": true,
  "guardian_consent": true,
  "prisma_models_defined": true,
  "db_migration_created": false,
  "register_integration": false,
  "blindbox_restriction": false,
  "compliance_docs_ready": true,
  "risk": "medium",
  "trend": "improving"
}
```

**风险标记: 🟡 中 (大幅改善 — 后端实现已交付, 需完成 DB 迁移 + 对接注册流程 + 盲盒消费限制)**

---

## 📊 汇总评分 — 7 日趋势

| # | 基线项目 | 状态 | 风险 | 趋势 |
|---|---------|:----:|:----:|:----:|
| 1 | AuthGuard 覆盖率 | 🟢 95.98% (215/224) | **低** | 📈 **改善** (2 个新模块已加 Guard, 覆盖率 ↑) |
| 2 | RateLimit 实现 | 🟢 双层限流 + 持久化 | **低** | → 稳定 |
| 3 | RLS 多租户隔离 | 🟡 中间件就绪, 策略仅 9 表 | **中** | → 稳定 |
| 4 | tenant_id 完整性 | 🟡 83/117 (70.9%, Birthday 模块已修复) | **中** | 📈 **改善** (覆盖率 ↑ 从 46.2% 到 70.9%) |
| 5 | deviceToken 安全 | 🟡 ai-push-task 仍全内存 | **中** | → 稳定 |
| 6 | Lua 沙箱 | 🟢 无运行时 | **低** | → 稳定 |
| 7 | 合规检查 | 🟢 六维全栈完整 | **低** | → 稳定 |
| 8 | 未成年保护 | 🟡 后端已交付, 待 DB 迁移+接入 | **中** | 📈 **大幅改善** (新增完整 MinorProtectionModule) |

| 指标 | 值 | 趋势 |
|------|:---:|:----:|
| 高风险项目 | **0 项** | → |
| 中等风险 | **4 项** | → (持续改善) |
| 新改善 | **3 项** (AuthGuard ↑ / tenant_id ↑ / 未成年保护 ↑) | 📈 |
| 新退化 | **0 项** | → |

---

## ⚠️ 今日建议 (2026-07-27)

### P0 — 本周处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | 未成年保护 | 生成 DB migration (`prisma migrate dev --name minor-protection`) 并部署 | 🟡 中 |
| **P0** | 未成年保护 | 用户注册流程对接 `MinorProtectionService.verifyIdentity()` | 🟡 中 |
| **P0** | 未成年保护 | 盲盒消费需调用 `MinorProtectionService.checkAccess()` 做年龄分级限制 | 🟡 中 |
| **P0** | tenant_id | EmpowerCard/QuoteLog/Reconcile* 模块补充 tenantId 字段 + 迁移脚本 | 🟡 中 |
| **P0** | RLS | 利用现有 RLS 中间件, 扩展 RLS Policy 至所有含 tenant_id 的核心表 | 🟡 中 |
| P1 | AuthGuard | 9 个 internal tooling 控制器评估是否需要 @Public() 或补充 Guard | 🟢 低 |
| P1 | deviceToken | ai-push-task.service.ts 持久化迁移至 Redis/TypeORM | 🟡 中 |
| P1 | deviceToken | DTO 层 deviceToken 增加加密/脱敏逻辑 | 🟡 中 |
| P1 | Lua | blindbox-lua.service.ts 切换从内存 mock 到 ioredis.eval() | 🟢 低 |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | tenant_id | 建立新模块 tenant_id 准入检查 (code review checklist) |
| P2 | RLS | 建立 RLS policy CI 验证 — 新表必须包含 RLS 迁移 |
| P2 | 未成年保护 | 增加 E2E 测试覆盖未成年保护全流程 |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v2.3 | 2026-07-27 | Controller 224 (+7); AuthGuard 95.98% ↑ (birthday/open-platform 已补 Guard); Prisma model 117; tenantId 83/117 (70.9%) ↑; **新增 MinorProtectionModule** (身份认证+时段管控+监护人同意, 待 DB 迁移); 9 个未标注 controller; Birthday 模块已补 tenantId ✅ |
| v2.2 | 2026-07-24 | Controller 217; Prisma model 91; tenantId 42/91 (46.2%); 11 个未标注 controller |
| v2.1 | 2026-07-23 | Controller 212; Prisma model 65; tenantId 47/65 (72.3%) |
| v2.0 | 2026-07-21 | AuthGuard 默认拒绝落地; push.service → TypeORM; tenant_id 48/63 |

---

*下次检查: 2026-07-28 (每日自动化)*
