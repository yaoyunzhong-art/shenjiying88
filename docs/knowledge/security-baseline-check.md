# 🔐 安全基线检查报告

> 扫描时间: 2026-07-14 07:30 CST
> 项目: shenjiying88 (V17)
> 基线版本: v1.2

---

## 1️⃣ AuthGuard 覆盖率

**状态: ⚠️ 基本覆盖 (全局Guard + 显式Guard)**

| 维度 | 结果 |
|------|------|
| 全局 Guard 注册 | ✅ **2 个全局 APP_GUARD**: `TrafficGovernanceGuard` (限流) + `IdentityAccessGuard` (身份/角色/权限) |
| 显式 Guard | TenantGuard, LicenseGuard, TenantScopeGuard 等控制器级守卫 |
| IdentityAccessGuard 行为 | ❌ **宽松模式** — 无 `@Public()` 白名单机制，当 roles/permissions/tenantScope 元数据为空时直接返回 `true`（即全放行）; **所有 139 个 controller 都通过全局 Guard**，但只要没声明 role/permission 要求就无强制认证 |
| JWT/认证 | 依赖 `actorContext` header 注入, 无独立 JWT 验证 Guard |
| 无显式 @UseGuards 的 controller | **139 个 controller 中仅 5 个使用显式 @UseGuards** (cashier-billing, cashier, cashier.sse, finance.sse, llm-config) — 其余靠全局 Guard 但 guard 本身宽松 |

**风险标记: ⚠️ 中等**

**关键发现:**
- `IdentityAccessGuard` 是声明式而非强制式 — 它只在 controller/handler 带有 `@Roles()`/`@Permissions()`/`@TenantScope()` 装饰器时才执行检查
- 未标注任何元数据的 controller/handler 可以通过全局 guard（因为 `roles.length===0 && permissions.length===0 && !tenantScopeMetadata → return true`）
- 没有独立的 JWT/API key 验证链 — 基于 `actorContext` header 信任
- 没有 `@Public()` 装饰器模式 — 无法标记公开端点

**建议:**
- **P1**: IdentityAccessGuard 改为默认拒绝模式: 所有未显式标记的 handler 默认拒绝，使用 `@Public()` 白名单放行
- **P1**: 新 controller 上线必须声明 role/permission 要求
- **P2**: 引入独立 JWT Guard + 签名验证链 (RS256)

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现 (TokenBucket + 全局流量治理)**

| 维度 | 详情 |
|------|------|
| 限流算法 | TokenBucket (令牌桶) — `rate-limiter.port.ts` 端口抽象 |
| 全局 Guard | `TrafficGovernanceGuard` 注册为全局 APP_GUARD |
| 装饰器 | `@RateLimit()` — 元数据驱动限流配置 (RATE_LIMIT_METADATA_KEY) |
| 服务层 | `RequestGovernanceService` 评估限流决策 |
| 限流 headers | `applyRateLimitHeaders(res, decision)` — 标准限流返回头 |
| 管理页面 | admin-web 有 rate-limits 管理页面 (策略/账本/详情) |
| Redis 适配 | `packages/sdk/src/modules/openapi/datasources/rate-limit.adapter.ts` |

**风险标记: ⚠️ 低**

**关键发现:**
- TokenBucket 实现正确 (refill + burst 支持)
- 默认行为: 当无 `@RateLimit()` 元数据时 guard 返回 `true` (不限流)
- **无全局 QPS baseline** — 仅对标注 `@RateLimit()` 的端点生效
- 大部分 API 无显式限流配置

**建议:**
- **P2**: 添加全局默认 QPS baseline (单 tenant 默认 1000/min, 敏感接口 100/min)
- **P2**: 生产确认 Redis 集群的限流 key 映射

---

## 3️⃣ RLS 多租户行级安全

**状态: ⚠️ 部分覆盖 (仅 5 张表受 RLS 保护)**

| 维度 | 详情 |
|------|------|
| RLS 迁移 | `002_rls_policies.sql` + `005_order_rls.sql` |
| 受保护表 | **5 张**: agent_events, orders, order_items, payments, refunds |
| 每表策略 | SELECT/INSERT/UPDATE/DELETE 全部 4 种操作 |
| 隔离机制 | `current_setting('app.tenant_id', true)` PG session 变量 |
| 上下文注入 | `tenant-context.ts` — AsyncLocalStorage + `SET LOCAL app.tenant_id` |
| 应用层 | `runWithTenant()` / `withTenantSession()` 包装函数 |
| 数据库表总数 | Prisma schema 定义 **~50 个 model** |
| 受保护比例 | ❌ **仅 10% (5/50)** |

**风险标记: 🚨 高**

**关键发现:**
- RLS 是数据库层面的最后一道防线 (layer2 defense)
- 大部分核心业务表 **没有 RLS 保护**: MemberProfile, AuditLog, MarketProfile, IdentityAccount, OrganizationNode, ConfigEntry, SecretAsset, CertificateAsset, FeatureFlag, AiExecutionRecord, NotificationTemplate, PiiPolicy 等
- `tenant-context.ts` 实现正确 (`SET LOCAL app.tenant_id` + ALS)，但未覆盖的表即使 SET LOCAL 也无 RLS 策略拦截
- 未覆盖的表依赖应用层代码手动过滤 tenantId — 存在遗漏风险

**建议:**
- **P1**: 将 RLS 覆盖扩展至所有核心业务表 (MemberProfile, AuditLog, SecretAsset, PiiPolicy 等)
- **P1**: 建议将 RLS 生成脚本纳入 CI/CD 预检
- **P2**: 建立 "RLS 覆盖率" 指标用于架构评审

---

## 4️⃣ tenant_id 字段完整性

**状态: ✅ 基本完整 (未发现缺失)**

| 维度 | 结果 |
|------|------|
| Prisma model 总数 | 50 个 model |
| 含 `tenantId` 的 model | ✅ **全部 50 个 model 都有 tenantId 字段** |
| 核心业务含 tenantId | Tenant, Brand, Store, User, MemberProfile, AuditLog, SecretAsset, PiiPolicy 等全部通过 |
| 前次报告遗漏 | **已修复** — 上次报告的 11 个 model "缺少 tenantId" (MarketProfile 等) 经本次重新检查均 **存在 tenantId** |
| 三级租户关系 | Tenant → Brand → Store 关系完整 |
| 可空 tenantId | 部分 config/overrides 表使用 `String?` (可空, 用于全局配置) |

**风险标记: ✅ 低**

**关键发现:**
- 对比上次基线检查有**重大纠正**: 所有 50 个 Prisma model 都声明了 `tenantId` 字段
- 部分配置类 model (RegionalConfigOverride, PortalSite 等) 使用 `String?` 可空 — 设计上允许全局配置引用, 风险可控

**建议:**
- 可空 tenantId 的 model 需在 service 层显式处理 "无 tenant" 场景的权限边界

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (有改善但不足)**

| 组件 | 状态 | 详情 |
|------|------|------|
| Push 服务 | ⚠️ 仅长度校验 | `push.service.ts` 中 deviceToken 仅检查 `length >= 64`, 无结构验证 |
| revokeToken | ✅ 已实现 | `APNsService.revokeToken()` 存在 — 但仅内存标记 `status: 'revoked'` |
| 持久化 | ❌ 无 | deviceToken → PushRecord 存在 `push.entity.ts` 中定义完整 (含 tenantId/memberId) **但仅内存 Map 存储** |
| 设备模块 | ℹ️ 无关 | DeviceAdapter 管理物理设备 (POS/打印机) — 不涉及推送 token |
| 身份来源 | ✅ 定义 | `identity-access.entity.ts` 定义 `authSource: 'device-token'` |

**风险标记: 🚨 高**

**关键发现:**
- PushRecord entity 设计完整 (含 tenantId, memberId, platform, status) — **但仅内存存储，重启丢失**
- Token 仅有长度校验 (>64 chars), 无签名/过期/吊销检查
- deviceToken → user → tenant 映射缺失 — 无法判断 token 所属租户
- `revokeToken()` 仅内存标记，重启后所有 token 重新可用

**建议:**
- **P1**: 建立 DeviceToken 管理服务: register/rotate/revoke/validate，持久化到数据库
- **P1**: 推送前验证 token 签名 + 吊销状态 + 租户归属
- **P1**: 实现 `PushRecord` 实体到数据库的持久化映射

---

## 6️⃣ Lua 沙箱

**状态: ℹ️ 不适用**

| 维度 | 详情 |
|------|------|
| Lua 文件 | ❌ 项目中不存在任何 `.lua` 文件 |
| sandbox 模块 | ✅ `sandbox.service.ts` / `sandbox.controller.ts` — **业务沙箱环境管理** (创建/启动/停止租户隔离环境), **非代码执行沙箱** |
| 代码注入风险 | 未发现 `eval()` / `Function()` / `vm.runInThisContext` 等动态代码执行 |

**风险标记: ✅ 安全**

- 项目不提供 Lua/脚本执行能力
- sandbox 是"租户隔离开发环境"而非"代码沙箱"

**建议:**
- 若未来引入脚本扩展, 应使用 WASM 沙箱或 `isolated-vm`
- 当前 sandbox 模块应增加权限边界 (每个环境绑定 tenantId) — 已部分实现

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (Phase-20 Compliance)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|------|
| GDPR 合规 | `gdpr.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 / 保留策略 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 用户数据擦除 + 级联清理 |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 正则检测 + 单元测试 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument 脱敏 |
| 审计日志 | `audit-log.service.ts` | ✅ 全量 actor/resource/action 审计 |
| 审计查询 | `audit-query.service.ts` | ✅ 审计记录检索 + 分页 |
| 安全 E2E | `compliance-security-e2e.test.ts` | ✅ GDPR + WAF + 安全扫描 + RBAC 全流程 |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM (salt 16 + iv 12 + authTag 16) |
| WAF | `waf.service.ts` | ✅ Web 应用防火墙 (allow/block/challenge/log) + 单元测试 |
| 幂等性 | admin-web idempotency 页面 | ✅ 幂等 key 管理 |
| 合规合同 | `compliance.contract.test.ts` | ✅ 合同/接口协议测试 |
| 角色测试 | `compliance.role.test.ts` | ✅ 角色权限合规验证 |
| 环形测试 | `compliance-ringbeam.test.ts` | ✅ 合规环形验证 |

**风险标记: ✅ 良好**

- 合规武器库完整: GDPR/PII/加密/审计/WAF/幂等性 六维全栈
- 加密使用 AES-256-GCM + authTag 完整性验证 (authenticated encryption)
- 审计日志记录 actor/timestamp/resource 全维度
- E2E 测试覆盖安全 + 合规全链路

**建议:**
- **P2**: 增加合规仪表盘 (Compliance Dashboard) 实时展示 consent 状态/PII 扫描覆盖率
- **P2**: 补充 SOC2/ISO27001 层面自动化合规检查项

---

## 8️⃣ 未成年保护

**状态: ❌ 未实现 (BR-0046/0034/0021 规则已定义但代码未落地)**

| 维度 | 状态 |
|------|------|
| 年龄验证 | ❌ MemberProfile 无 `isMinor`/`age`/`birth` 字段 |
| 未成年模式 | ❌ 无 |
| BR-0046 P3阻断 | ❌ (14岁以下P3营销推送阻断) — **规则存在但代码未实现** |
| BR-0034 消费阻断 | ❌ (未成年人消费阻断) — **规则存在但代码未实现** |
| BR-0021 盲盒限额 | ❌ (未成年人单日¥200上限) — **规则存在但代码未实现** |
| 家长同意 | ❌ 无 |
| 数据收集限制 | ❌ 无 |
| 合规矩阵标记 | 🔴 高风险项 (docs/compliance/blindbox-engine-p0-audit-checklist.md: CHK-B6) |
| 盲盒审计 | docs/compliance/blindbox-engine-p0-audit-checklist.md 明确标注 E38洞察4 (未成年保护) |

**风险标记: 🚨 高 (如面向中国大陆未成年人)**

**关键发现:**
- 项目主要面向 B 端商户 (盲盒/会员/收银) — 但商户可能面向 C 端未成年人
- **业务规则已明确定义** (BR-0046, BR-0034, BR-0021) 但 **全部未在代码中实现**
- 合规审计清单 (blindbox-engine-p0-audit-checklist.md) 明确标记 P0 紧急: CHK-B6 实名校验/未成年人保护
- 每日简报 (brief-2026-07-06.md) 将三项合规风险列为 🔴 级: 未成年人/个保法/盲盒监管
- 7 日内无任何代码变更涉及未成年保护

**建议:**
- **P0**: 实现 BR-0046 (年龄验证 + 14岁以下 P3 营销阻断)
- **P0**: 实现 BR-0034 (未成年人消费阻断)
- **P0**: 实现 BR-0021 (盲盒未成年人单日 ¥200 上限)
- MemberProfile 增加 `isMinor` 标志位 + 年龄验证流程
- 若当前无 C 端未成年人场景，应在服务条款中明确声明

---

## 📊 汇总评分

| # | 基线项目 | 上次 (07-13) | 本次 (07-14) | 风险等级 | 变动 |
|---|---------|-------------|-------------|---------|------|
| 1 | AuthGuard 覆盖率 | ✅ 已覆盖 (2全局Guard) | ⚠️ 基本覆盖 (但全局Guard宽松模式) | ⚠️ 中 | ⬇️ 降级 |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 完善 (TokenBucket + TrafficGovernanceGuard) | ⚠️ 低 | — |
| 3 | RLS 多租户隔离 | ⚠️ 仅5表RLS | ⚠️ 仅5表RLS, 45表无 | 🚨 高 | — |
| 4 | tenant_id 字段完整性 | ⚠️ 11个model缺少 | ✅ 已纠正 — 50个model均有tenantId | ✅ 低 | ⬆️ 升级 |
| 5 | deviceToken 安全检查 | ⚠️ revokeToken简陋 | ⚠️ revokeToken存在但内存存储·无持久化 | 🚨 高 | — |
| 6 | Lua 沙箱 | ℹ️ 不适用 | ℹ️ 不适用 | ✅ N/A | — |
| 7 | 合规检查 | ✅ 完整 | ✅ 完整 (AES-256-GCM + WAF + 幂等性 + E2E) | ✅ 良好 | — |
| 8 | 未成年保护 | ❌ 未实现 | ❌ 未实现 (BR-0046/0034/0021已定义未落地) | 🚨 高 | — |

**整体评分: 5/8 通过 | 2 项高风险 + 1 项中等风险 + 1 项低风险 | 1 项不适用**

---

## 🎯 优先修复建议 (P0-P2)

### P0 — 本周内

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| P0 | 未成年保护 | 实现 BR-0046 (年龄认证 + 14岁以下 P3 阻断) | 🚨 |
| P0 | 未成年保护 | 实现 BR-0034 (未成年人消费阻断) + BR-0021 (盲盒¥200限额) | 🚨 |
| P0 | RLS | 扩展 RLS 至 MemberProfile, PiiPolicy, SecretAsset 等核心表 | 🚨 |

### P1 — 本月内

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|:----:|
| P1 | deviceToken | DeviceToken 持久化管理: register/rotate/revoke/validate | 🚨 |
| P1 | AuthGuard | IdentityAccessGuard 改为默认拒绝 + @Public() 白名单 | ⚠️ |
| P1 | RLS | 扩展 RLS 至所有核心业务表 (~30+表) | 🚨 |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 合规 | Compliance Dashboard — 实时合规状态展示 |
| P2 | 审计 | SOC2/ISO27001 自动化合规检查项 |
| P2 | RateLimit | 全局 QPS baseline 配置 (单 tenant 默认值) |
| P2 | AuthGuard | JWT RS256 迁移时间表 |
| P2 | tenant_id | 可空 tenantId model 的 service 层权限边界评审 |

---

## 🔄 相比上次报告的变更

1. **AuthGuard**: ⬇️ 降级 — 发现全局 IdentityAccessGuard 为宽松模式，无 @Public() 机制，无 metadata 的 handler 全放行
2. **tenant_id**: ⬆️ 升级 — **重大纠正**: 上次报告"11个model缺少 tenantId"为误报，本次逐个检查确认 50 个 model 均含 tenantId
3. **合规**: ✅ 确认 — 完整武器库 (GDPR/PII/AES-256-GCM/WAF/幂等性/E2E)
4. **未成年保护**: 🔴 持续高风险 — 7日内零代码改动，BR-0046/0034/0021 规则仍未落地

---

## 📈 趋势图

```
风险等级变化 (07-13 → 07-14):

  AuthGuard      ✅ 低    →    ⚠️ 中    ⬇️
  RateLimit      ✅ 安全   →    ⚠️ 低    ⬇️
  RLS            ⚠️ 中     →    🚨 高    ⬇️
  tenant_id      ⚠️ 中     →    ✅ 低    ⬆️
  deviceToken    🚨 高     →    🚨 高    —
  Lua沙箱        ✅ N/A    →    ✅ N/A   —
  合规           ✅ 良好   →    ✅ 良好   —
  未成年保护      🚨 高     →    🚨 高    —
```

---

*下次检查: 2026-07-15 (每日自动化)*
