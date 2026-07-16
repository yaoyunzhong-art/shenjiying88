# 🔐 安全基线检查报告

> 扫描时间: 2026-07-17 07:35 CST
> 项目: shenjiying88 (V18 + V19)
> 基线版本: v1.6
> 检查模式: 每日自动化

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局 Guard 宽松模式持续, V19 新模块涌入扩大缺口)**

| 维度 | 结果 |
|------|:----:|
| 全局 Guard | ✅ `IdentityAccessGuard` (APP_GUARD) + `TrafficGovernanceGuard` |
| 宽松模式 | ❌ 无 `@Roles`/`@Permissions`/`@TenantScope` 时默认放行 |
| 未显式 `@UseGuards` 的 Controller | ⚠️ **177 个** (较昨日 148 ↑ +29, V19 新模块) |
| 实际保护 | 全局 Guard 覆盖所有 177 个, 但依赖 Header 透传 |

```json
{
  "status": "basic_coverage_relaxed",
  "controllers_unlabeled": 177,
  "trend": "worsening (V19 new modules increased gap)",
  "new_v19_controllers": 29,
  "risk": "medium"
}
```

**风险标记: ⚠️ 中等 (缺口扩大趋势)**

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

**风险标记: ✅ 低 (不变)**

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (9 张表受 RLS 保护 · 44 张表未覆盖)**

| 维度 | 详情 |
|------|:----:|
| 迁移文件 | 4 个: 002 / 005 / 006 / 007 |
| **RLS 受保护表** | **9 张**: agent_events, orders, order_items, payments, refunds, ai_model_store_config, ai_model_config_history, config_instance, config_audit_log |
| Prisma model 总数 | 53 个 |
| 未覆盖表 | 44 张 (含 member / staff / brand / store 等核心表) |
| RLS API | ✅ `rls.controller.ts` — 管理/查询/更新端点 |
| 数据分类标注 | ⚠️ 5 张 RLS 表仍无数据分类标注 (持续未修复) |

**RLS 保护表明细 (4 个迁移):**
| 迁移文件 | 表 | 启用 RLS |
|----------|----|:--------:|
| 002_rls_policies.sql | agent_events | ✅ |
| 005_order_rls.sql | orders, order_items, payments, refunds | ✅ |
| 006_ai_model_rls.sql | ai_model_store_config, ai_model_config_history | ✅ |
| 007_three_level_config.sql | config_instance, config_audit_log | ✅ |

```json
{
  "total_models": 53,
  "rls_protected_tables": 9,
  "unprotected_tables": 44,
  "risk": "high"
}
```

**风险标记: 🚨 高 (44 张核心表仍无 RLS)**

---

## 4️⃣ tenant_id 字段完整性

**状态: ✅ 完整 (53 个 Prisma model 均含 tenantId)**

| 维度 | 结果 |
|------|:----:|
| Prisma model 总数 | 53 个 |
| 含 `tenantId` | ✅ **全部 53 个 model 均有 tenantId 字段** |

**风险标记: ✅ 低 (不变)**

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
| 修复状态 | **↔️ 未修复** (仍为 07-16 基线同样问题) |

```json
{
  "revocation_persistence": "memory_only",
  "cross_node": false,
  "restart_survive": false,
  "risk": "high",
  "fix_progress": "not_started"
}
```

**风险标记: 🚨 高 (未修复)**

---

## 6️⃣ Lua 沙箱

**状态: ✅ 不适用 (无 Lua 运行时)**

| 维度 | 结果 |
|------|:----:|
| Lua 运行时 | ❌ 不存在 |
| 代码内引用 | 无 `lua`/`luajit`/`lua.*sandbox` 关键字 |
| 沙箱模块 | `SandboxModule` 仅用于 ISV 应用商店 + 代码执行 (非 Lua) |

**风险标记: ✅ N/A (不变)**

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

**风险标记: ✅ 良好 (不变)**

---

## 8️⃣ 未成年保护

**状态: ⚠️ 仅前端声明, 无后端校验 (同上日, 未修复)**

| 维度 | 结果 |
|------|:----:|
| 隐私政策声明 | ✅ `apps/tob-web/app/sports-ants/privacy/page.tsx` — 包含"未成年人保护"章节 (Section 八) |
| 内容限制 | ✅ `apps/storefront-web/app/help/faq/page.tsx` — FAQ 提及区域限制 |
| 年龄验证 | ❌ 无后端年龄验证逻辑 |
| 监护人同意 | ❌ 无监护人同意收集流程 |
| 注册拦截 | ❌ 无年龄过滤/未成年人限制注册机制 |
| 合规等级 | ⚠️ 仅完成隐私政策文案, 未实现技术管控 |

**风险标记: ⚠️ 中等 (同上日, 未修复)**

---

## 9️⃣ 渗透测试 (V18+V19 持续)

**状态: 🔴 中危 (XSS 22处 ↑ +1, 未授权API 177 ↑ +29)**

| 维度 | 今日 (07-17) | 昨日 (07-16) | 趋势 |
|------|:-----------:|:-----------:|:----:|
| SQL注入 | ✅ 0 处 | ✅ 0 处 | → |
| XSS | ⚠️ **22** 处 | ⚠️ 21 处 | **↑ +1** (新增 `[...storeScope]/page.tsx`) |
| 路径遍历 | ✅ 0 处 | ✅ 0 处 | → |
| 未授权API | ⚠️ **177** 个 | ⚠️ 148 个 | **↑ +29** (V19 新模块导致的缺口) |
| **总风险** | **🔴 中危** | **🔴 中危** | **↑ 上升** |

**风险标记: 🚨 关注 (XSS +1, 未授权API +29 — V19 质量门退)**

**V19 新增未授权 Controller 明细 (29 个新):**
campaign-performance, competitor-track, contract-manager, customer-satisfaction, delivery-tracking, device-usage-report, employee-performance-review, equipment-fault-report, finance-health-dashboard, finance-settlement, inventory-alert, leave-request, maintenance-plan, member-predict, member-spending-analysis, modules, performance-review, platform, price-monitor, procurement-order, quality-inspection, return-request, shift-scheduler, store-rank, store-revenue-report, supplier-manager, task-scheduler, warehouse-bin, ai/feedback

---

## 🔟 数据分类检查

**状态: ⚠️ 持续 (15 models + 5 RLS 表 + 2 Rules 文件未修复)**

| 维度 | 今日 (07-17) | 昨日 (07-16) | 趋势 |
|------|:-----------:|:-----------:|:----:|
| Prisma model 无分类标注 | ⚠️ 15 个 | ⚠️ 15 个 | → 未修复 |
| Rules 缺少权限标注 | ⚠️ 2 个 | ⚠️ 2 个 | → 未修复 |
| RLS 表无分类标注 | ⚠️ 5 张 | ⚠️ 5 张 | → 未修复 |
| PII 策略覆盖 | ✅ 28 条 | ✅ 28 条 | → |

**风险标记: ⚠️ 关注 (同上日)**

---

## 📊 汇总评分 — 7日趋势分析

| # | 基线项目 | 状态 | 风险等级 | 7日趋势 |
|---|---------|:----:|:--------:|:--------:|
| 1 | AuthGuard 覆盖率 | ⚠️ 基本覆盖 (宽松) | ⚠️ 中 | **⬆️ 恶化** (148→177, V19 缺口) |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 低 | → |
| 3 | RLS 多租户隔离 | ⚠️ 9表 (+RLS API) | 🚨 高 | → |
| 4 | tenant_id 完整性 | ✅ 53 个 model 均有 | ✅ 低 | → |
| 5 | deviceToken 安全 | ⚠️ 仅内存标记 | 🚨 高 | → |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ N/A | → |
| 7 | 合规检查 | ✅ 完整 | ✅ 良好 | → |
| 8 | **未成年保护** | ⚠️ 仅前端声明 | ⚠️ 中 | → |
| 9 | 渗透测试 | 🔴 中危 | 🚨 关注 | **⬆️ 恶化** (21→22 XSS, 148→177 API) |
| 10 | 数据分类 | ⚠️ 暂停 | ⚠️ 关注 | → |

**有效基线: 9/9 (Lua N/A 不计入基数)**

| 指标 | 值 |
|------|:---:|
| 基线项目总数 | 10 项 (有效 9 项) |
| 已落地 (含N/A) | ✅ **10/10** |
| 高风险 | 2 项 (RLS + deviceToken) |
| 中等风险 | 2 项 (AuthGuard + 未成年保护) |
| **恶化项** | **2 项** (渗透测试 AuthGuard) |
| 修复项 | **0 项** (无 P1 修复完成) |

---

## ⚠️ 今日建议 (07-17)

### 🚨 新增预警 — V19 质量检查退回

```
❗ V19 新增 29 个 Controller 全部无显式 @UseGuards
❗ XSS 新增 1 处 (storefront [...storeScope]/page.tsx)
❗ 渗透测试退出码 1 — 质量门硬阻断
```

### P0 — 今日处理

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| **P0** | V19 AuthGuard | 29 个新 Controller 添加 `@UseGuards` + `@Roles`/`@Permissions` 标记。**V19 质量门退** | 🚨 |
| P1 | XSS | `[...storeScope]/page.tsx:139` 新增 `dangerouslySetInnerHTML` 排查 + 其他 21 处 | 🚨 |
| P1 | deviceToken | `pushHistory` 改为 Redis 持久化方案, 支持跨节点 revoke 同步 | 🚨 |
| P1 | RLS | 扩展 RLS 覆盖 member / staff / brand / store 等核心表 (>30 张) | 🚨 |
| P1 | AuthGuard | IdentityAccessGuard 添加 `@Public()` 装饰器, 默认拒绝模式 | ⚠️ |
| P1 | 未成年保护 | 后端添加年龄验证中间件 + 监护人同意流程 | ⚠️ |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 数据分类 | 修复 15 个 Prisma model + 2 个 Rules 文件 + 5 张 RLS 表标注 |
| P2 | 渗透测试 | 添加命令注入 / SSTI / SSRF 检测项 |

---

## 🏷️ 变更日志

| 版本 | 日期 | 变更 |
|:----:|:----:|------|
| v1.6 | 2026-07-17 | 渗透测试更新: XSS 22↑, 未授权API 177↑ (含 V19 29 个新) |
| v1.5 | 2026-07-16 | 新增 未成年保护 基线项 |
| v1.4 | 2026-07-15 | RLS 表从5→9 (006+007), 数据分类修复暂停 |
| v1.3 | 2026-07-14 | 新增 渗透测试 + 数据分类 基线项 |

---

*下次检查: 2026-07-18 (每日自动化)*
