# 🔐 安全基线检查报告

> 扫描时间: 2026-07-19 07:30 CST
> 项目: shenjiying88 (V18 + V19)
> 基线版本: v1.8
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局 Guard 宽松模式持续, V19 新模块涌入扩大缺口)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 宽松模式 | ❌ 无 `@Roles`/`@Permissions`/`@TenantScope` 时默认放行 |
| Controller 总数 | **189 个** |
| 显式 `@UseGuards` 的 Controller | **7 个** (cashier, cashier-billing, llm-config, member-config, retrieval) |
| 全局 Guard 覆盖 | 全局 Guard 覆盖所有 189 个, 但依赖 Header 透传, 宽松模式风险持续 |

```json
{
  "status": "basic_coverage_relaxed",
  "controllers_total": 189,
  "controllers_labeled": 7,
  "controllers_unlabeled": 182,
  "trend": "slightly_worsened",
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (182 个 Controller 依赖全局 Guard 宽松模式, 较昨日 177↑)**

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

**状态: ⚠️ 部分覆盖 (11 张表受 RLS 保护 · 19 张 model 无 tenantId)**

| 维度 | 详情 |
|------|:----:|
| 迁移文件 | 4 个: 002 / 005 / 006 / 007 |
| **RLS 受保护表** | **11 张**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log, ✨ audit_log (002 含建表) |
| Prisma model 总数 | 53 个 (不含 String) |
| RLS 保护且有 tenantId | 9 张表中: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log 均有 tenantId |
| 无 tenantId model | **19 个 model** (见 baseline #4) |
| RLS API | ✅ `rls.controller.ts` — 管理/查询/更新端点 (14 个 API), `RlsModule` 已注册 |
| RLS 辅助 | ✅ `rls.helper.ts` (含 e2e/unit/role 测试) |

**RLS 保护表明细 (4 个迁移):**
| 迁移文件 | 表 | 启用 RLS |
|----------|----|:--------:|
| 002_rls_policies.sql | agent_events | ✅ |
| 005_order_rls.sql | orders, order_items, payments, refunds | ✅ |
| 006_ai_model_config.sql | ai_model_store_config, ai_model_config_history | ✅ |
| 007_three_level_config.sql | config_instance, config_audit_log | ✅ |

```json
{
  "total_models": 53,
  "rls_protected_tables": 11,
  "models_without_tenantId": 19,
  "risk": "high"
}
```

**风险标记: 🚨 高 (19 个 model 无 tenantId → 无法 RLS)**

---

## 4️⃣ tenant_id 字段完整性

**状态: ⚠️ 34/53 个 model 含 tenantId (19 缺失)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | 53 个 (不含 String) |
| 含 `tenantId` | ✅ **34 个 model** 有 tenantId |
| 缺失 `tenantId` | ❌ **19 个 model** 无 tenantId |

**缺失 tenantId 的 model 清单:**
| # | Model | 备注 |
|---|-------|------|
| 1 | Tenant | 自身, 不适用 |
| 2 | MarketProfile | 基础配置 |
| 3 | RegionalConfig | 区域配置 |
| 4 | RegionalConfigOverride | 区域覆盖 |
| 5 | EmailChannelConfig | 邮件通道 |
| 6 | SocialChannelConfig | 社交通道 |
| 7 | TaxPolicyConfig | 税务策略 |
| 8 | OrganizationMembership | 组织成员 |
| 9 | GovernanceApproval | 治理审批 |
| 10 | ConfigEntry | 配置条目 |
| 11 | ConfigRevision | 配置版本 |
| 12 | SecretAsset | 密钥资产 |
| 13 | DomainEvent | 领域事件 |
| 14 | WebhookDelivery | Webhook 投递 |
| 15 | EdgeSyncTask | 边缘同步 |
| 16 | QuotaLedger | 配额账本 |
| 17 | AiPromptTemplate | AI 提示模板 |
| 18 | ConfigInstance | 配置实例(但 RLS 已保护) |
| 19 | ConfigAuditLog | 配置审计(但 RLS 已保护) |

```json
{
  "total_models": 53,
  "with_tenantId": 34,
  "without_tenantId": 19,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中 (19 个 model 无 tenantId, ConfigInstance/ConfigAuditLog 通过 owner_id 多态 RLS 绕过)**

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (push.service.ts + ai-push-task.service.ts 均仅内存 Map, 无持久化)**

| 维度 | 结果 |
|------|:----:|
| push.service.ts | `PushRecord` 含 `status: 'revoked'` 字段 + `revokeToken()` 方法 ✅ |
| push.service.ts 存储 | `private pushHistory = new Map<string, PushRecord[]>()` — **全内存** ❌ |
| ai-push-task.service.ts | `private records = new Map<string, PushRecord[]>()` — **全内存** ❌ |
| ai-push-task.service.ts tasks | `private tasks = new Map<string, PushTask>()` — **全内存** ❌ |
| 持久化 | ❌ 两处均无数据库/Redis 持久化 |
| 跨节点失效 | ❌ 多实例部署时状态完全不共享 |
| 重启丢失 | ❌ 服务重启后所有推送历史 + 任务全部丢失 |
| revoke 有效性 | `revokeToken()` 仅写入内存 Map, 重启后 revoke 失效 |

```json
{
  "sources": ["push.service.ts", "ai-push-task.service.ts"],
  "persistence": "memory_only",
  "has_revoke_logic": true,
  "revoke_persistence": false,
  "cross_node": false,
  "restart_survive": false,
  "risk": "high",
  "fix_progress": "not_started"
}
```

**风险标记: 🚨 高 (两处推送服务全内存, 无持久化, revoke 无持久化)**

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

**风险标记: ⚠️ 中 (同上日, 未修复)**

---

## 📊 汇总评分 — 7日趋势分析

| # | 基线项目 | 状态 | 风险等级 | 7日趋势 |
|---|---------|:----:|:--------:|:--------:|
| 1 | AuthGuard 覆盖率 | ⚠️ 基本覆盖 (宽松) | ⚠️ 中 | ⬇️ **略恶化** (182 个无标注, 昨 177) |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 低 | → |
| 3 | RLS 多租户隔离 | ⚠️ 11表 + RLS API | 🚨 高 | → |
| 4 | tenant_id 完整性 | ⚠️ 34/53 (19 缺失) | ⚠️ 中 | ↔️ **修正** (昨报 39/52 有误, model 总数 53) |
| 5 | deviceToken 安全 | ⚠️ 两处全内存无持久化 | 🚨 高 | → |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ N/A | → |
| 7 | 合规检查 | ✅ 完整 | ✅ 良好 | → |
| 8 | 未成年保护 | ⚠️ 仅前端声明 | ⚠️ 中 | → |
| 9 | 渗透测试 (07-19) | 🟢 自动化门通过 | ✅ 低 | → |
| 10 | 数据分类 | ⚠️ 待完善 | ⚠️ 关注 | → |

**有效基线: 9/9 (Lua N/A 不计入基数)**

| 指标 | 值 |
|------|:---:|
| 基线项目总数 | 10 项 (有效 9 项) |
| 已落地 (含N/A) | ✅ **10/10** |
| 高风险 | 2 项 (RLS + deviceToken) |
| 中等风险 | 3 项 (AuthGuard + tenant_id 完整性 + 未成年保护) |
| 恶化项 | **1 项** (AuthGuard: 183→189 controllers, 无标注从 177→182) |
| 修复项 | **0 项** |
| **今日修正** | tenant_id 从 39/52 → 34/53 (model 总数修正为 53, 命名 model "String" 排除) |

---

## ⚠️ 今日建议 (07-19)

### P0 — 今日处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | RLS | 扩展 RLS 覆盖 member / staff / brand / store 等核心表, 利用现有 RLS API | 🚨 |
| P1 | deviceToken | `push.service.ts` + `ai-push-task.service.ts` 改为 Redis/DB 持久化方案, revoke 需跨节点同步 | 🚨 |
| P1 | AuthGuard | `IdentityAccessGuard` 添加 `@Public()` 装饰器, **默认拒绝模式** | ⚠️ |
| P1 | tenant_id | 19 个 model 补充 tenantId 字段 + 迁移脚本 | ⚠️ |
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
| v1.8 | 2026-07-19 | 修正 model 总数 53 (排除 schema 中命名为 "String" 的行); tenant_id: 34/53; AuthGuard: 189 controllers / 7 标注 / 182 无标注; deviceToken: 新增 push.service.ts Map 检查 (两处全内存); 渗透测试更新 (07-19 扫描退出码 0) |
| v1.7 | 2026-07-18 | 修正 tenant_id 数据 (52 models, 39 含 tenantId, 13 缺失); deviceToken 风险修正 (PushTaskService, 非 APNsService); 渗透测试更新 (自动化门通过) |
| v1.6 | 2026-07-17 | 渗透测试更新: XSS 22↑, 未授权API 177↑ (含 V19 29 个新) |
| v1.5 | 2026-07-16 | 新增 未成年保护 基线项 |
| v1.4 | 2026-07-15 | RLS 表从5→9 (006+007), 数据分类修复暂停 |
| v1.3 | 2026-07-14 | 新增 渗透测试 + 数据分类 基线项 |

---

*下次检查: 2026-07-20 (每日自动化)*
