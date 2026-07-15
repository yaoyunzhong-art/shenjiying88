# 🔐 安全基线检查报告

> 扫描时间: 2026-07-16 07:41 CST
> 项目: shenjiying88 (V18)
> 基线版本: v1.5
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局 Guard 宽松模式持续)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 宽松模式 | ❌ 无 `@Roles`/`@Permissions`/`@TenantScope` 时默认放行 |
| 未显式 `@UseGuards` 的 Controller | ⚠️ 148 个 (渗透测试扫描) |
| 实际保护 | 全局 Guard 覆盖所有 148 个, 但依赖 Header 透传 |

```json
{
  "status": "basic_coverage_relaxed",
  "controllers_unlabeled": 148,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中等**

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (TokenBucket + 流量治理)**

| 维度 | 详情 |
|------|:----:|
| 算法 | TokenBucket (令牌桶) |
| 全局 Guard | `TrafficGovernanceGuard` |
| 装饰器 | `@RateLimit()` |
| 服务层 | `RequestGovernanceService` via `TrustGovernanceService` |
| Redis 适配 | `rate-limit.adapter.ts` |
| 测试覆盖 | `request-governance.service.test.ts` — evaluateRateLimit 委托 + 决策存储已验证 |

**风险标记: ✅ 低**

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (9 张表受 RLS 保护 · 45 张表未覆盖)**

| 维度 | 详情 |
|------|:----:|
| 迁移文件 | 4 个: 002 / 005 / 006 / 007 |
| **RLS 受保护表** | **9 张**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log |
| Prisma model 总数 | 53 个 |
| 未覆盖表 | 44 张 (含 member / staff / brand / store 等核心表) |
| RLS API | ✅ `rls.controller.ts` — 管理/查询/更新端点 |
| 数据分类标注 | ⚠️ 5 张 RLS 表仍无数据分类标注 (昨日至今未修复) |

```json
{
  "total_models": 53,
  "rls_protected_tables": 9,
  "unprotected_tables": 44,
  "risk": "high"
}
```

**风险标记: 🚨 高**

---

## 4️⃣ tenant_id 字段完整性

**状态: ✅ 完整 (53 个 Prisma model 均含 tenantId)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | 53 个 |
| 含 `tenantId` | ✅ **全部 53 个 model 均有 tenantId 字段** |

**风险标记: ✅ 低**

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (revokeToken 仅内存 Map, 无持久化)**

| 维度 | 结果 |
|------|:----:|
| 实现位置 | `APNsService.pushHistory` — `Map<string, PushRecord[]>` |
| revoke 方式 | 仅内存标记 `status: 'revoked'` |
| 持久化 | ❌ 无数据库/Redis 持久化 |
| 跨节点失效 | ❌ 多实例部署时 revoke 状态不会同步 |
| 重启丢失 | ❌ 服务重启后所有 revoke 状态丢失 |

```json
{
  "revocation_persistence": "memory_only",
  "cross_node": false,
  "restart_survive": false,
  "risk": "high"
}
```

**风险标记: 🚨 高**

---

## 6️⃣ Lua 沙箱

**状态: ✅ 不适用 (无 Lua 运行时)**

| 维度 | 结果 |
|------|:----:|
| Lua 运行时 | ❌ 不存在 |
| 代码内引用 | 无 `lua`/`luajit`/`lua.*sandbox` 关键字 |
| 沙箱模块 | `SandboxModule` 仅用于 ISV 应用商店 + 代码执行 (非 Lua) |

**风险标记: ✅ N/A**

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (GDPR/PII/加密/审计/WAF/幂等性六维全栈)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|:----:|
| GDPR 合规 | `gdpr.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 级联清理 |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 检测 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument |
| 审计日志 | `audit-log.service.ts` | ✅ 全量 actor/resource/action + `audit-query.service.ts` |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM |
| WAF | `waf.service.ts` | ✅ allow/block/challenge/log |
| 幂等性 | admin-web 管理页面 | ✅ 幂等 key 管理 |
| PiiPolicy | database | ✅ 28 条策略, 4 级分类 |

**风险标记: ✅ 良好**

---

## 8️⃣ 未成年保护

**状态: ⚠️ 仅前端声明, 无后端校验**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `apps/tob-web/app/sports-ants/privacy/page.tsx` — 包含"未成年人保护"章节 |
| 内容限制 | ✅ `apps/storefront-web/app/help/faq/page.tsx` — FAQ 提及区域限制 |
| 年龄验证 | ❌ 无后端年龄验证逻辑 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/未成年人限制注册机制 |
| 合规等级 | ⚠️ 仅完成隐私政策文案, 未实现技术管控 |

**风险标记: ⚠️ 中**

---

## 9️⃣ 渗透测试 (V18 持续)

**状态: ✅ 持续运行 (今日扫描已完成)**

| 维度 | 今日 (07-16) | 昨日 (07-15) | 趋势 |
|------|:-----------:|:-----------:|:----:|
| SQL注入 | ✅ 0 处 | ✅ 0 处 | → |
| XSS | ⚠️ 21 处 | ⚠️ 20 处 | ↑ +1 |
| 路径遍历 | ✅ 0 处 | ✅ 0 处 | → |
| 未授权API | ⚠️ 148 个 | ⚠️ 142 个 | ↑ +6 |
| **总风险** | **🔴 中危** | **🔴 中危** | → |

**风险标记: ⚠️ 关注 (XSS 21处 + 未授权API 148个增加)**

---

## 🔟 数据分类检查 (V18 持续)

**状态: ⚠️ 持续 (部分修复, 仍有缺口)**

| 维度 | 今日 (07-16) | 昨日 (07-15) | 趋势 |
|------|:-----------:|:-----------:|:----:|
| Prisma model 无分类标注 | ⚠️ 15 个 | ⚠️ 15 个 | → 未修复 |
| Rules 缺少权限标注 | ⚠️ 2 个 | ⚠️ 2 个 | → 未修复 |
| RLS 表无分类标注 | ⚠️ 5 张 | ⚠️ 5 张 | → 未修复 |
| PII 策略覆盖 | ✅ 28 条 | ✅ 28 条 | → |
| **总风险** | **🔴 中危** | **🔴 中危** | → 未改善 |

**风险标记: ⚠️ 关注 (15 个 model + 2 个文件 + 5 张表未修复)**

---

## 📊 汇总评分

| # | 基线项目 | 状态 | 风险等级 | 变动 |
|---|---------|:----:|:--------:|:----:|
| 1 | AuthGuard 覆盖率 | ⚠️ 基本覆盖 (宽松) | ⚠️ 中 | 148 个未显式 (↑+6) |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 低 | — |
| 3 | RLS 多租户隔离 | ⚠️ 9表 (+RLS API) | 🚨 高 | 新增4表 (006+007) 但44表未覆盖 |
| 4 | tenant_id 完整性 | ✅ 53 个 model 均有 | ✅ 低 | ↑+1 (新增 model) |
| 5 | deviceToken 安全 | ⚠️ 仅内存标记 | 🚨 高 | — |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ N/A | — |
| 7 | 合规检查 | ✅ 完整 | ✅ 良好 | — |
| 8 | **未成年保护** | ⚠️ 仅前端声明 | ⚠️ 中 | 🆕 **新增项** |
| 9 | 渗透测试 | ✅ 自动化运行 | ⚠️ 关注 | 21+XSS 148+未授权API |
| 10 | 数据分类 | ✅ 自动化运行 | ⚠️ 关注 | 15 models + 5 RLS 未标注 |

**有效基线: 9/9 (Lua N/A 不计入基数)**

| 指标 | 值 |
|------|:---:|
| 基线项目总数 | 10 项 (有效 9 项) |
| 已落地 (含N/A) | ✅ **10/10** |
| 高风险 | 2 项 (RLS + deviceToken) |
| 中等风险 | 2 项 (AuthGuard + 未成年保护) |

---

## ⚠️ 建议

### P1 — 本周内处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| P1 | deviceToken | `pushHistory` 改为 Redis 持久化方案, 支持跨节点 revoke 同步 | 🚨 |
| P1 | RLS | 扩展 RLS 覆盖 member / staff / brand / store 等核心表 (>30 张) | 🚨 |
| P1 | AuthGuard | IdentityAccessGuard 添加 `@Public()` 装饰器, 默认拒绝模式 | ⚠️ |
| P1 | 未成年保护 | 后端添加年龄验证中间件 + 监护人同意流程 | ⚠️ |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 渗透测试 | 处理 21 处 XSS (含安全模式 SEO 误报) |
| P2 | 数据分类 | 修复 15 个 Prisma model + 2 个 Rules 文件 + 5 张 RLS 表标注 |
| P2 | 未授权API | 148 个 Controller 显式 `@UseGuards` 逐步加固 |
| P2 | 渗透测试 | 添加命令注入 / SSTI / SSRF 检测项 |

---

*下次检查: 2026-07-17 (每日自动化)*
