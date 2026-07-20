# 🔐 安全基线检查报告

> 扫描时间: 2026-07-21 07:30 CST
> 项目: shenjiying88 (V22+)
> 基线版本: v2.0
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ✅ 已全面升级 (默认拒绝模式 + @Public() 显式声明)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 默认策略 | ✅ **默认拒绝** — 无 `@Public()`/`@Roles`/`@Permissions`/`@TenantScope` 时抛出 `UnauthorizedException` |
| 宽松模式 | ✅ **已修复** (V20 重构) — 不再像旧版无条件放行 |
| `@Public()` 使用 | ✅ `auth.controller.ts` (5处) + `health.controller.ts` (2处) |
| Controller 总数 | **211 个** |
| `@UseGuards` 标注 | **199 个** (含 TenantGuard/TenantScopeGuard) |
| 无标注 (re-export) | **12 个** (均为别名/委托导出到有标注的源 Controller) |

```json
{
  "status": "deny_by_default",
  "controllers_total": 211,
  "controllers_labeled": 199,
  "controllers_unlabeled": 12,
  "unlabeled_nature": "re-export_aliases_only",
  "trend": "fixed",
  "breakthrough": "relaxed_mode_removed",
  "risk": "low"
}
```

**风险标记: ✅ 低 (相比07-19 的 ⚠️ 中, 大幅改善 — 默认拒绝模式已落地)**

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (TokenBucket + 流量治理)**

| 维度 | 详情 |
|------|:----:|
| 算法 | TokenBucket (令牌桶) |
| 全局 Guard | `TrafficGovernanceGuard` — 装饰器触发, 无装饰器放行 |
| 装饰器 | `@RateLimit()` / `RequireRateLimit()` |
| 服务层 | `RequestGovernanceService` via `TrustGovernanceService` |
| Redis 适配 | `rate-limit.adapter.ts` |
| 管理 UI | admin-web 含 rate-limits 详情/策略/台账页面 |
| 测试覆盖 | `request-governance.service.test.ts` — evaluateRateLimit 委托 + 决策存储已验证 |
| Prisma Model | `RateLimitPolicy` 已注册 |

**风险标记: ✅ 低 (不变)**

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (11 张表受 RLS 保护 · 剩余未扩展)**

| 维度 | 详情 |
|------|:----:|
| 迁移文件 | 4 个: 002 / 005 / 006 / 007 |
| RLS 受保护表 | **11 张**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log, audit_log |
| Prisma model 总数 | **63 个** (较07-19的53有增加, 新增 EmpowerCard/InvoiceV2/FinanceLedger 等) |
| RLS 保护且有 tenantId | 9 张表中有 tenantId |
| RLS 中间件 | ✅ `rls.middleware-prisma.ts` — Prisma $extends 注入 tenant_id |
| RLS API | ✅ `rls.controller.ts` — 管理/查询/更新端点 (14 个 API), `RlsModule` 已注册 |
| RLS 辅助 | ✅ `rls.helper.ts` (含 e2e/unit/role 测试) |

```json
{
  "total_models": 63,
  "rls_protected_tables": 11,
  "rls_middleware_active": true,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (11 张表受保护但远低于 63 个 model 总数, 需系统化扩展 RLS 到所有核心业务表)**

---

## 4️⃣ tenant_id 字段完整性

**状态: ⚠️ 48/63 个 model 含 tenantId (15 缺失)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | 63 个 (较07-19 的53有新增) |
| 含 `tenantId` | ✅ **48 个 model** 有 tenantId |
| 缺失 `tenantId` | ❌ **15 个 model** 无 tenantId |

**缺失 tenantId 的 model 清单:**
| # | Model | 备注 |
|---|-------|------|
| 1 | Tenant | 自身, 不适用 |
| 2 | MarketProfile | 基础配置 |
| 3 | RegionalConfig | 区域配置 |
| 4 | EmailChannelConfig | 邮件通道 |
| 5 | SocialChannelConfig | 社交通道 |
| 6 | TaxPolicyConfig | 税务策略 |
| 7 | OrganizationMembership | 组织成员 |
| 8 | ConfigRevision | 配置版本 |
| 9 | WebhookDelivery | Webhook 投递 |
| 10 | EdgeSyncTask | 边缘同步 |
| 11 | QuotaLedger | 配额账本 |
| 12 | AiPromptTemplate | AI 提示模板 |
| 13 | EmpowerCard | 赋能卡 (V22 新增) |
| 14 | EmpowerCardQuoteLog | 赋能卡报价日志 (V22 新增) |
| 15 | ReconcileDiffModel / ReconcileMatchModel / ResolvedDiffModel | 对账差异/匹配/解决 (V22 新增) |

```json
{
  "total_models": 63,
  "with_tenantId": 48,
  "without_tenantId": 15,
  "improvement_from_0719": "34/53 → 48/63 (+14 absolute, +19% ratio 64%→76%)",
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (覆盖率从 64% 提升至 76%, 15 个 model 仍缺失)**

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 部分修复 (push.service ✅ 已升级 · ai-push-task.service ❌ 仍全内存)**

| 维度 | result |
|------|:----:|
| **push.service.ts** | |
| 存储模式 | ✅ 已从全内存升级为 **TypeORM 仓库优先 + 内存兜底** |
| `persistRecord()` | ✅ 写入 `PushRecordEntity` (数据库持久化) |
| `revokeToken()` | ✅ 写入数据库 + 内存, 跨节点有效 |
| `getPushHistory()` | ✅ 数据库优先读取, 降级到内存 |
| **ai-push-task.service.ts** | |
| `tasks = Map<>` | ❌ 依然全内存, 无持久化 |
| `records = Map<>` | ❌ 依然全内存, 无持久化 |
| 跨节点失效 | ❌ 多实例部署时状态完全不共享 |
| 重启丢失 | ❌ 服务重启后所有推送历史 + 任务全部丢失 |

```json
{
  "sources": {
    "push.service.ts": "persistent",
    "ai-push-task.service.ts": "memory_only"
  },
  "fix_progress": "partial",
  "risk": "medium",
  "recommendation": "ai-push-task.service.ts 需要类似的 TypeORM 或 Redis 持久化迁移"
}
```

**风险标记: ⚠️ 中 (相比07-19 🚨 高已部分修复, push.service.ts 数据库持久化已落地, ai-push-task 仍需修复)**

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
| 渗透测试 | `security-scanner.service.ts` | ✅ 0719 扫描退出码 0; 0721 扫描退出码 0 (无硬编码密码/Token, 无依赖危急漏洞) |
| 数据分类 | PiiPolicy 28 条策略 | ✅ 4 级分类 |

**风险标记: ✅ 良好 (不变)**

---

## 8️⃣ 未成年保护

**状态: ⚠️ 仅前端声明, 无后端校验**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `apps/tob-web/app/sports-ants/privacy/page.tsx` — Section 八 "未成年人保护", 含"不满14周岁需监护人陪同"声明 |
| 内容限制 | ✅ FAQ 提及区域限制 (`storefront-web/app/help/faq/page.tsx`) |
| 年龄验证 | ❌ 无后端年龄验证逻辑 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/未成年人限制注册机制 |

**风险标记: ⚠️ 中 (同上日, 未修复)**

---

## 📊 汇总评分 — 7日趋势分析

| # | 基线项目 | 状态 | 风险等级 | 7日趋势 |
|---|---------|:----:|:--------:|:--------:|
| 1 | AuthGuard 覆盖率 | ✅ **默认拒绝** | ✅ **低** | 🚀 **大幅改善** (宽松→严格, 全模块覆盖) |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 低 | → |
| 3 | RLS 多租户隔离 | ⚠️ 11表 + RLS API | ⚠️ 中 | → |
| 4 | tenant_id 完整性 | ⚠️ 48/63 (15 缺失) | ⚠️ 中 | 📈 **改善** (34/53→48/63, 覆盖率64%→76%) |
| 5 | deviceToken 安全 | ⚠️ 部分修复 | ⚠️ **中** | 📈 **改善** (push.service DB 持久化, ai-push-task 待修) |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ N/A | → |
| 7 | 合规检查 | ✅ 完整 | ✅ 良好 | → |
| 8 | 未成年保护 | ⚠️ 仅前端声明 | ⚠️ 中 | → |

**关键改善项: 1项 (AuthGuard), 1项部分改善 (deviceToken), 1项统计改善 (tenant_id)**
**未改善: 3项 (RLS 扩展、未成年保护、ai-push-task 持久化)**

| 指标 | 值 | 对比07-19 |
|------|:---:|:----------:|
| 高风险项目 | **0 项** | 2→0 🔽 |
| 中等风险 | **4 项** | 3→4 🔺 (RLS 降级, deviceToken 降级) |
| 已改善 | **2 项** | AuthGuard + deviceToken(部分) |
| 未修复 | **3 项** | RLS 扩展 / 未成年保护 / ai-push-task |

---

## ⚠️ 今日建议 (07-21)

### P0 — 本周处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | RLS | 扩展 RLS 覆盖至所有含 tenantId 的核心业务表 (member, store, brand 等), 利用现有 RLS 中间件 + API 基础设施 | ⚠️ |
| P1 | deviceToken | `ai-push-task.service.ts` 仿照 `push.service.ts` 迁移至 TypeORM/Redis 持久化方案 | ⚠️ |
| P1 | tenant_id | 15 个缺失 model 补充 tenantId 字段 + 迁移脚本 (特别注意 EmpowerCard 等 V22 新表) | ⚠️ |
| P1 | 未成年保护 | 后端添加年龄验证中间件 + 监护人同意流程 | ⚠️ |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 渗透测试 | 恢复 XSS/未授权API 专项扫描 (上次 07-19) |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v2.0 | 2026-07-21 | 🚀 **AuthGuard 重大突破**: 默认拒绝模式完全落地; Controller 总数 211; `@UseGuards` 199 个; `@Public()` 7处; 12个无标注均为别名委托. push.service.ts → TypeORM 持久化. tenant_id: 48/63 (覆盖率 76%). 安全扫描 07-21 退出码 0. |
| v1.8 | 2026-07-19 | 修正 model 总数 53; tenant_id: 34/53; AuthGuard: 189 controllers / 7 标注 (宽松模式); deviceToken: 两处全内存 |

---

*下次检查: 2026-07-22 (每日自动化)*
