# 🔐 安全基线检查报告

> 扫描时间: 2026-07-23 07:30 CST
> 项目: shenjiying88 (V23+)
> 基线版本: v2.1
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ✅ 默认拒绝模式 (95.75%)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 默认策略 | ✅ **默认拒绝** — 无 `@Public()`/`@Roles`/`@Permissions`/`@TenantScope` 时抛出 `UnauthorizedException` |
| Controller 总数 | **212 个** |
| `@UseGuards` 标注 | **203 个** (含 TenantGuard/TenantScopeGuard) |
| 未标注 | **9 个** (cdn-cache/chaos/docs/federated-learning/observability/ab-test/reports/saas-advanced/tenant-llm) |
| 覆盖率 | **95.75%** (阈值 ≥80%) |

**未覆盖控制器清单：**
- `cdn-cache.controller.ts` — CDN 管理
- `chaos.controller.ts` — 混沌工程
- `docs.controller.ts` — 文档接口
- `federated-learning.controller.ts` — 联邦学习
- `observability.controller.ts` — 可观测性
- `ab-test.controller.ts` — A/B 试验
- `reports.controller.ts` — 报表
- `saas-advanced.controller.ts` — SaaS 高级功能
- `tenant-llm.controller.ts` — 租户 LLM

```json
{
  "status": "deny_by_default",
  "controllers_total": 212,
  "controllers_labeled": 203,
  "controllers_unlabeled": 9,
  "unlabeled_nature": "may_be_internal_tooling",
  "trend": "stable",
  "risk": "low"
}
```

**风险标记: ✅ 低 (与07-22持平, 9个未标注控制器需评估是否应加 @Public())**

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (双层限流: TokenBucket + 滑动窗口)**

| 维度 | 详情 |
|------|:----:|
| 算法1 | TokenBucket (令牌桶) — `rate-limiter.ts` |
| 算法2 | 滑动窗口 (1min QPS + 日配额) — `openapi/rate-limiter.ts` |
| 全局 Guard | `TrafficGovernanceGuard` |
| 装饰器 | `@RequireRateLimit()` / `@RateLimit()` |
| 服务层 | `TokenBucket` (P2-1.2) + `openapi/RateLimiter` (Phase-44 T174) |
| Redis 适配 | `rate-limit.adapter.ts` (OpenAPI) |
| Gateway 限流 | `gateway.controller.ts` — `RateLimiterService` 含 consumeToken/getQuotaStatus/setQuota |
| 管理 UI | admin-web `rate-limits/` — 策略/台账/详情页面 |
| Prisma Model | `RateLimitPolicy` — 持久化限流策略 |
| 测试覆盖 | `request-governance.service.test.ts` / `rate-limiter.test.ts` / `rate-limit.adapter.test.ts` |

**风险标记: ✅ 低 (稳定, 双算法分层防护)**

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (RLS 中间件就绪, 未全量启用)**

| 维度 | 详情 |
|------|:----:|
| RLS 中间件 | ✅ `rls.middleware-prisma.ts` — Prisma $extends 注入 tenant_id |
| RLS API | ✅ `rls.controller.ts` — 14 个管理/查询/更新端点 |
| RLS Module | ✅ `RlsModule` 已注册 |
| RLS 迁移 | 002/005/006/007 — 仅对早期表启用 |
| 受 RLS 保护的表 | **约 11 张** (agent_events, orders, order_items, payments, refunds 等) |
| Prisma model 总数 | **65 个** |
| 含 tenantId | **47 个** |

**RLS 基础设施已就绪但未全量启用。RSL 中间件有能力拦截所有 tenantId 查询，但需要逐表配置策略。**

```json
{
  "total_models": 65,
  "rls_protected_tables": 11,
  "rls_middleware_active": true,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (RLS 基础设施就位但实际启用的表远少于含 tenantId 的表)**

---

## 4️⃣ tenant_id 字段完整性

**状态: ⚠️ 47/65 个 model 含 tenantId (18 缺失)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | **65 个** |
| 含 `tenantId` | ✅ **47 个 model** |
| 缺失 `tenantId` | ❌ **18 个 model** (含 Tenant 自身) |

**缺失 tenantId 的 model 清单：**
| # | Model | 说明 |
|---|-------|------|
| 1 | **Tenant** | 自身, 不适用 |
| 2 | MarketProfile | 市场配置 (全局/区域) |
| 3 | RegionalConfig | 区域配置 |
| 4 | EmailChannelConfig | 邮件通道 |
| 5 | SocialChannelConfig | 社交通道 |
| 6 | TaxPolicyConfig | 税务策略 |
| 7 | OrganizationMembership | 组织成员 |
| 8 | ConfigInstance | 配置实例 |
| 9 | ConfigRevision | 配置版本 |
| 10 | WebhookDelivery | Webhook 投递日志 |
| 11 | EdgeSyncTask | 边缘同步任务 |
| 12 | QuotaLedger | 配额账本 |
| 13 | AiPromptTemplate | AI 提示模板 |
| 14 | **EmpowerCard** | 赋能卡 (V22 新增) |
| 15 | **EmpowerCardQuoteLog** | 赋能卡报价日志 (V22 新增) |
| 16 | **ReconcileDiffModel** | 对账差异 (V22 新增) |
| 17 | **ReconcileMatchModel** | 对账匹配 (V22 新增) |
| 18 | **ResolvedDiffModel** | 对账已解决差异 (V22 新增) |

```json
{
  "total_models": 65,
  "with_tenantId": 47,
  "without_tenantId": 18,
  "coverage_ratio": "72.3%",
  "improvement_from_0721": "48/63→47/65 (model 总数从63增至65, 新增 EmpowerCard/QuoteLog/Reconcile 三表未加 tenantId)",
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (覆盖率从 76% 降至 72%, 新增 V22 表均未加 tenantId)**

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 部分修复 (push.service ✅ 持久化 · ai-push-task.service ❌ 仍全内存)**

| 维度 | 结果 |
|------|:----:|
| **push.service.ts** | |
| 存储模式 | ✅ TypeORM 仓库优先 + 内存兜底 |
| `persistRecord()` | ✅ 写入 `PushRecordEntity` |
| `revokeToken()` | ✅ 数据库写入, 跨节点有效 |
| `getPushHistory()` | ✅ 数据库优先, 降级到内存 |
| **ai-push-task.service.ts** | |
| `tasks = Map<>` | ❌ 全内存, 无持久化 |
| `records = Map<>` | ❌ 全内存, 无持久化 |
| 跨节点失效 | ❌ 多实例部署状态不共享 |
| 重启丢失 | ❌ 重启后推送历史 + 任务全部丢失 |
| **Push DTO** | ✅ `deviceToken` 字段使用 `@IsString()` 验证，但无额外安全检查（脱敏/过期标记） |

```json
{
  "sources": {
    "push.service.ts": "persistent",
    "ai-push-task.service.ts": "memory_only"
  },
  "fix_progress": "partial",
  "risk": "medium",
  "recommendation": "ai-push-task.service.ts 需要 TypeORM 或 Redis 持久化迁移; push.dto.ts 的 deviceToken 需增加脱敏/校验逻辑"
}
```

**风险标记: ⚠️ 中 (与07-22持平, ai-push-task 仍全内存)**

---

## 6️⃣ Lua 沙箱

**状态: ✅ 不适用 (无 Lua 运行时, 无需沙箱)**

| 维度 | 结果 |
|------|:----:|
| Lua 运行时 | ❌ 不存在 |
| 代码内引用 | 无 `lua`/`luajit`/`lua.*sandbox` 关键字 |
| `.lua` 文件 | 无 |
| `sandbox.adapter.ts` | ✅ 仅用于 OpenAPI ISV 沙箱环境生命周期管理 (非 Lua 执行沙箱) |

**风险标记: ✅ N/A (稳定)**

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (GDPR/PII/加密/审计/WAF 六维全栈)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|:----:|
| GDPR 合规 | `gdpr.service.ts`, `compliance.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 级联清理 (Right to be Forgotten) |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 检测 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument, event-collector PII 过滤 |
| 审计日志 | `audit-log.service.ts` + `audit-query.service.ts` | ✅ actor/resource/action 全量记录 |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM |
| WAF | `waf.service.ts` | ✅ 4种动作(allow/block/challenge/log), 32条规则 |
| 幂等性 | admin-web 管理页面 | ✅ 幂等 key 管理 |
| 数据分类 | PiiPolicy 28 条策略 | ✅ 4级分类 |
| 合规 E2E | `compliance-security-e2e.test.ts` | ✅ GDPR完整流程 + DSR + 安全扫描 |
| 渗透测试 | `security-scanner.service.ts` | ✅ 扫描退出码 0 |
| 合规合约 | `compliance.contract.ts` | ✅ contract.test / role.test / ringbeam.test 覆盖 |

**风险标记: ✅ 良好 (稳定, 合规体系完整)**

---

## 8️⃣ 未成年保护

**状态: ⚠️ 仅前端声明, 无后端校验**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `tob-web/app/sports-ants/privacy/page.tsx` — Section 八 "未成年人保护" |
| 内容限制 | ✅ FAQ 提及区域限制 (storefront-web) |
| 盲盒合规文档 | 📋 `docs/compliance/blindbox-engine-p0-audit-checklist.md` 明确标识未成年保护为 P0 |
| 运营需求文档 | 📋 `docs/operations/r13-business-app-requirements.md` B-20 "AI伦理引擎：用户隐私/资金安全/未成年人保护" — 标记 P0 |
| 年龄验证 | ❌ 无后端年龄验证逻辑 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/未成年人限制注册 |
| 盲盒消费限制 | ❌ 未满8岁应禁止消费 / 8-16岁限额 — 未实现 |

```json
{
  "privacy_statement": "present",
  "backend_age_verification": "missing",
  "parental_consent": "missing",
  "registration_filter": "missing",
  "blindbox_restriction": "missing",
  "risk": "medium",
  "improvement_plan": "docs/operations/r13 已标记 P0, docs/compliance/blindbox 已出 P0 审计项"
}
```

**风险标记: ⚠️ 中 (与07-22持平, 合规文档已准备但未实现)**

---

## 📊 汇总评分 — 7日趋势分析

| # | 基线项目 | 状态 | 风险等级 | 趋势 |
|---|---------|:----:|:--------:|:----:|
| 1 | AuthGuard 覆盖率 | ✅ 默认拒绝 (95.75%) | ✅ **低** | → 稳定 |
| 2 | RateLimit 实现 | ✅ 双层限流 | ✅ **低** | → 稳定 |
| 3 | RLS 多租户隔离 | ⚠️ 基础设施就绪, 未全量启用 | ⚠️ **中** | → 稳定 |
| 4 | tenant_id 完整性 | ⚠️ 47/65 (18 缺失) | ⚠️ **中** | 📉 **下降** (新增 V22 表未加 tenantId) |
| 5 | deviceToken 安全 | ⚠️ 部分修复 | ⚠️ **中** | → 稳定 |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ **N/A** | → 稳定 |
| 7 | 合规检查 | ✅ 完整实现 | ✅ **低** | → 稳定 |
| 8 | 未成年保护 | ⚠️ 仅前端声明 | ⚠️ **中** | → 稳定 |

| 指标 | 值 | 趋势 |
|------|:---:|:----:|
| 高风险项目 | **0 项** | → |
| 中等风险 | **4 项** | → |
| 已改善 | **0 项** | 今日无新修复 |
| 未修复 | **4 项** | RLS 全量启用 / tenant_id 新表 / ai-push-task / 未成年保护 |

---

## ⚠️ 今日建议 (2026-07-23)

### P0 — 本周处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | tenant_id | 3 个 V22 新表 (EmpowerCard, EmpowerCardQuoteLog, ReconcileDiffModel/MatchModel/ResolvedDiffModel) 补充 tenantId 字段 + 迁移脚本 | ⚠️ 中 |
| **P0** | RLS | 利用现有 RLS 中间件基础设施, 扩展至所有含 tenantId 的核心业务表 | ⚠️ 中 |
| P1 | deviceToken | `ai-push-task.service.ts` 持久化迁移 | ⚠️ 中 |
| P1 | 未成年保护 | 实现后端年龄验证 + 注册拦截中间件 + 盲盒消费限制 (已出 P0 审计项) | ⚠️ 中 |
| P1 | AuthGuard | 9 个未标注 controller 评估是否需要 @Public() 或加 Guard | ✅ 低 |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 渗透测试 | 恢复 XSS/未授权API 专项扫描 |
| P2 | 合规 | IntegrationOrchestration PII 合规校验补充 |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v2.1 | 2026-07-23 | Controller 总数 → 212; Prisma model 总数 → 65 (V22 新增 EmpowerCard/QuoteLog/Reconcile 表); tenantId 覆盖率 47/65 (72.3%); RLS 基础设施已就位但全量启用进展停滞; 合规检查确认: GDPR/PII/加密/审计/WAF 六维全栈完好 |
| v2.0 | 2026-07-21 | AuthGuard 默认拒绝模式完全落地; push.service → TypeORM 持久化; tenant_id 48/63 (76%) |
| v1.8 | 2026-07-19 | model 总数 53; tenant_id 34/53 |

---

*下次检查: 2026-07-24 (每日自动化)*
