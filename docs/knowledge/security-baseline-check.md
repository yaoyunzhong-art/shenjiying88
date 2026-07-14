# 🔐 安全基线检查报告

> 扫描时间: 2026-07-15 07:30 CST
> 项目: shenjiying88 (V17)
> 基线版本: v1.3
> 自上次基线以来: 无安全相关源代码变更, 仅有 TSC 持续集成脉冲验收

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局Guard + 显式Guard · 依然宽松模式)**

| 维度 | 结果 |
|------|------|
| 全局 Guard 注册 | ✅ **2 个全局 APP_GUARD**: `TrafficGovernanceGuard` (限流) + `IdentityAccessGuard` (身份/角色/权限) |
| V17 新增 Controller | devops, cdn-cache, chaos, db-knowledge, docs, edge, federated-learning, iot, observability, realtime, reports — 均通过全局 Guard |
| 显式 Guard | TenantGuard, LicenseGuard, TenantScopeGuard 等控制器级守卫 |
| IdentityAccessGuard 行为 | ❌ **宽松模式持续** — 无 `@Public()` 白名单机制, 当 roles/permissions/tenantScope 元数据为空时直接返回 `true`（即全放行）**距上次发现零改动** |
| JWT/认证 | 依然依赖 `actorContext` header 注入, 无独立 JWT 验证 Guard |

**风险标记: ⚠️ 中等**

**关键发现:**
- `IdentityAccessGuard` 保持声明式非强制式 — 未标注元数据的 controller/handler 全放行
- 无 `@Public()` 装饰器模式 — 无法标记公开端点
- V17 新增 9 个 Controller 均未使用显式 `@UseGuards`

**建议:**
- **P1**: IdentityAccessGuard 改为默认拒绝模式 + `@Public()` 白名单放行
- **P1**: 新 controller 必须声明 role/permission 要求
- **P2**: 引入独立 JWT Guard + 签名验证链 (RS256)

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (TokenBucket + 全局流量治理)**

| 维度 | 详情 |
|------|------|
| 限流算法 | TokenBucket (令牌桶) — `rate-limiter.port.ts` 端口抽象 |
| 全局 Guard | `TrafficGovernanceGuard` 注册为全局 APP_GUARD |
| 装饰器 | `@RateLimit()` — 元数据驱动限流配置 |
| 服务层 | `RequestGovernanceService` 评估限流决策 |
| 限流 headers | `applyRateLimitHeaders(res, decision)` 标准返回 |
| 管理页面 | admin-web 有 rate-limits 管理页面 |
| Redis 适配 | `rate-limit.adapter.ts` |

**风险标记: ⚠️ 低 (与上次持平)**

**关键发现:**
- TokenBucket 实现正确 (refill + burst 支持)
- 默认行为: 无 `@RateLimit()` 元数据时 guard 返回 `true` (不限流)
- **大部分 API 无显式限流配置**

**建议:**
- **P2**: 添加全局默认 QPS baseline (单 tenant 默认 1000/min, 敏感接口 100/min)

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (仅 5 张表受 RLS 保护 · V17 新增 RLS 管理 API)**

| 维度 | 详情 |
|------|------|
| RLS 迁移 | `002_rls_policies.sql` (agent_events) + `005_order_rls.sql` (orders/order_items/payments/refunds) |
| V17 新增 | 🆕 **RLS REST API**: `GET /api/rls/status`, `POST /api/rls/enable`, `POST /api/rls/policy`, `POST /api/rls/verify`, `POST /api/rls/setup` — 实现一键启用 RLS + 创建策略 + 强制 RLS |
| 受保护表 | **仅 5 张**: agent_events, orders, order_items, payments, refunds |
| 每表策略 | SELECT/INSERT/UPDATE/DELETE 全部 4 种操作 |
| RLS 服务 | `RlsService` (rls.helper.ts) — 含 SQL 安全检查 | 上下文注入 | `tenant-context.ts` — AsyncLocalStorage + `SET LOCAL app.tenant_id` |
| Prisma model 数 | 50 个 model |
| 剩余未覆盖 | **45 张表无 RLS** — 包括 MemberProfile, AuditLog, MarketProfile, SecretAsset, PiiPolicy 等核心表 |

**风险标记: 🚨 高 (与上次持平)**

**关键发现:**
- RLS API 端点提供管理能力, **但尚未用于扩展覆盖** — 45 张核心表仍裸露
- V17 引入的 RLS API 是一个良好起点, 需要配合自动化脚本批量启用

**建议:**
- **P1**: 利用新增的 RLS API 编写批量启用脚本, 覆盖 MemberProfile/PiiPolicy/SecretAsset 等所有核心业务表
- **P1**: 将 RLS 自动化脚本纳入 CI/CD 预检
- **P2**: RLS 覆盖率作为架构评审指标

---

## 4️⃣ tenant_id 字段完整性

**状态: ✅ 完整 (50 个 Prisma model 均含 tenantId · 无新增发现)**

| 维度 | 结果 |
|------|------|
| Prisma model 总数 | 50 个 model |
| 含 `tenantId` 的 model | ✅ **全部 50 个 model 都有 tenantId 字段** |
| 前次报告结论 | ✅ 已验证正确 (上次纠正了"11个model缺少"的误报) |
| 三级租户关系 | Tenant → Brand → Store 关系完整 |
| 可空 tenantId | 部分 config/overrides 表使用 `String?` (设计允许) |

**风险标记: ✅ 低 (与上次持平)**

**建议:**
- 可空 tenantId 的 model 需在 service 层显式处理 "无 tenant" 场景的权限边界

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (revokeToken 仅内存标记 · 无持久化)**

| 组件 | 状态 | 详情 |
|------|------|------|
| PushRecord entity | ✅ | 定义完整 (含 tenantId/memberId/platform/status/Pending/Sent/Failed/Cancelled/Revoked) |
| revokeToken | ⚠️ 仅内存标记 | `APNsService.revokeToken()` 存在 — 但仅往 `Map` push 一条 `status: 'revoked'` 记录 |
| 持久化 | ❌ 无 | 所有 PushRecord 仅存于 `Map<string, PushRecord[]>` — 重启丢失 |
| Token 校验 | ⚠️ 仅长度校验 | `deviceToken.length < 64` 返回 false, 无结构/签名/吊销检查 |
| 容器化风险 | 🚨 | **`ScheduledPush` 使用 `setTimeout` 调度** — 容器多实例环境下极端不可靠 |

**风险标记: 🚨 高 (与上次持平)**

**关键发现:**
- `ScheduledPush` 的 `setTimeout` 调度仅在单进程生效, 容器多实例 0 保障
- `revokeToken()` 不持久化, 重启后 token 可重新使用
- deviceToken → user → tenant 映射缺失

**建议:**
- **P1**: PushRecord 持久化到数据库
- **P1**: 推送前验证 token 签名 + 吊销状态 + 租户归属
- **P1**: ScheduledPush 替换 `setTimeout` 为数据库轮询 (cron job)

---

## 6️⃣ Lua 沙箱

**状态: ✅ 不适用 (无变更)**

| 维度 | 详情 |
|------|------|
| Lua 文件 | ❌ 项目中不存在任何 `.lua` 文件 |
| sandbox 模块 | ✅ 业务沙箱环境管理 — 非代码执行沙箱 |
| 代码注入风险 | 未发现 `eval()` / `Function()` / `vm.runInThisContext` |

**风险标记: ✅ 安全**

**建议:**
- 若未来引入脚本扩展, 应使用 WASM 沙箱或 `isolated-vm`

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (GDPR/PII/加密/审计/WAF/幂等性六维全栈)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|:----:|
| GDPR 合规 | `gdpr.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 级联清理 |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 检测 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument |
| 审计日志 | `audit-log.service.ts` | ✅ 全量 actor/resource/action |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM (salt 16 + iv 12 + authTag 16) |
| WAF | `waf.service.ts` | ✅ allow/block/challenge/log |
| 幂等性 | admin-web 管理页面 | ✅ 幂等 key 管理 |
| V17 新增 | 🆕 **ComplianceModule** 已注册到 app.module.ts | ✅ |
| V17 新增 | 🆕 **SecurityModule** 已注册到 app.module.ts | ✅ |

**风险标记: ✅ 良好 (与上次持平 · 新增合规与安全模块注册)**

**建议:**
- **P2**: 合规仪表盘 (Compliance Dashboard)

---

## 8️⃣ 未成年保护

**状态: ❌ 未实现 (与上次完全一致 · 零进展)**

| 维度 | 状态 |
|------|:----:|
| 年龄验证 | ❌ MemberProfile 无 `isMinor`/`age`/`birth` 字段 |
| 未成年模式 | ❌ 无 |
| BR-0046 P3阻断 | ❌ (14岁以下P3营销推送阻断) — **规则存在, 代码零落地** |
| BR-0034 消费阻断 | ❌ (未成年人消费阻断) — **规则存在, 代码零落地** |
| BR-0021 盲盒限额 | ❌ (未成年人单日¥200上限) — **规则存在, 代码零落地** |
| 合规矩阵 | 🔴 高风险项 (blindbox-engine-p0-audit-checklist.md: CHK-B6) |
| 自上次基线以来 | ❌ **零 commit 涉及未成年保护** |

**风险标记: 🚨 高 (持续未被修复)**

**关键发现:**
- 项目主要面向 B 端商户, 但商户可能面向 C 端未成年人
- **业务规则已明确定义** (BR-0046, BR-0034, BR-0021) 但 **全部未在代码中实现**
- 距上次基线 24h 零代码改动 — 持续风险累积

**建议:**
- **P0**: 实现 BR-0046 (年龄验证 + 14岁以下 P3 营销阻断)
- **P0**: 实现 BR-0034 (未成年人消费阻断)
- **P0**: 实现 BR-0021 (盲盒未成年人单日 ¥200 上限)

---

## 📊 汇总评分

| # | 基线项目 | 上次 (07-14) | 本次 (07-15) | 风险等级 | 变动 |
|---|---------|-------------|-------------|---------|:----:|
| 1 | AuthGuard 覆盖率 | ⚠️ 基本覆盖 | ⚠️ 基本覆盖 (仍宽松) | ⚠️ 中 | — |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 完善 (TokenBucket) | ⚠️ 低 | — |
| 3 | RLS 多租户隔离 | ⚠️ 仅5表 | ⚠️ 仅5表 (+新增RLS API) | 🚨 高 | 🆕 RLS API |
| 4 | tenant_id 完整性 | ✅ 完整 | ✅ 50个model均有tenantId | ✅ 低 | — |
| 5 | deviceToken 安全检查 | ⚠️ 内存标记 | ⚠️ 内存标记 (setTimeout调度问题) | 🚨 高 | 🔍 新发现: setTimeout |
| 6 | Lua 沙箱 | ✅ 不适用 | ✅ 不适用 | ✅ N/A | — |
| 7 | 合规检查 | ✅ 完整 | ✅ 完整 (新增 Compliance+Security Module) | ✅ 良好 | 🆕 模块注册 |
| 8 | 未成年保护 | ❌ 未实现 | ❌ 未实现 (零进展) | 🚨 高 | — |

**整体评分: 5/8 通过 | 3 项高风险 + 1 项中等风险 + 1 项低风险 | 1 项不适用**

---

## 🎯 优先修复建议 (P0-P2)

### P0 — 本周内

| 优先级 | 基线 | 行动项 | 风险 | 期限增加 |
|--------|------|--------|:----:|:--------:|
| P0 | 未成年保护 | BR-0046 (年龄认证 + 14岁以下 P3 阻断) | 🚨 | +24h |
| P0 | 未成年保护 | BR-0034 (未成年人消费阻断) + BR-0021 (¥200限额) | 🚨 | +24h |
| P0 | RLS | 扩展至 MemberProfile/PiiPolicy/SecretAsset 等核心表 | 🚨 | +24h |

### P1 — 本月内

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| P1 | deviceToken | PushRecord 持久化 + revoke 持久化验证 | 🚨 |
| P1 | AuthGuard | IdentityAccessGuard → 默认拒绝 + @Public() | ⚠️ |
| P1 | RLS | 批量启用 RLS 覆盖所有核心表 (>30 张) | 🚨 |
| P1 | deviceToken | ScheduledPush setTimeout → 数据库轮询 | 🚨 |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | RateLimit | 全局 QPS baseline 配置 |
| P2 | AuthGuard | JWT RS256 迁移时间表 |
| P2 | 合规 | Compliance Dashboard |
| P2 | tenant_id | 可空 tenantId model 的 service 层权限评审 |

---

## 🔄 相比上次报告 (07-14 → 07-15)

1. **AuthGuard**: — 无变化, 宽松模式持续
2. **RateLimit**: — 无变化
3. **RLS**: 🆕 新增 RLS REST API (status/enable/policy/verify/setup) — 但尚未用于扩展覆盖
4. **tenant_id**: — 确认完整, 无新增 model
5. **deviceToken**: 🔍 新发现: `ScheduledPush` 使用 `setTimeout` 调度, 容器多实例下极端不可靠
6. **Lua 沙箱**: — 无变化
7. **合规**: 🆕 ComplianceModule + SecurityModule 已注册 app.module.ts
8. **未成年保护**: — **零进展, 警告升级**

## 📈 7 日趋势

```
基线风险等级 (07-09 → 07-15):

  AuthGuard      ✅  →    ⚠️    →    ⚠️    →
  RateLimit      ✅  →    ✅     →    ⚠️    →
  RLS            ⚠️  →    🚨    →    🚨    →
  tenant_id      ⚠️  →    ✅     →    ✅    →
  deviceToken    🚨  →    🚨    →    🚨    →  (新: setTimeout)
  Lua沙箱        ✅  →    ✅     →    ✅    →
  合规           ✅  →    ✅     →    ✅    →  (新: Module注册)
  未成年保护      🔴  →    🚨    →    🚨    →  🔴 零进展!
```

---

*下次检查: 2026-07-16 (每日自动化)*
