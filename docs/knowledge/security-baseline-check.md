# 🔐 安全基线检查报告

> 扫描时间: 2026-07-13 07:30 CST
> 项目: shenjiying88 (M5)
> 基线版本: v1.1

---

## 1️⃣ AuthGuard 覆盖率

**状态: ✅ 已覆盖 (有改善)**

| 维度 | 结果 |
|------|------|
| Guard 数量 | 5 个守卫 (TenantGuard, IdentityAccessGuard, TrafficGovernanceGuard, LicenseGuard, TenantScopeGuard) |
| 全局 Guard 注册 | ✅ **已确认** — `app.module.ts` 注册了 2 个全局 Guard: `TrafficGovernanceGuard` + `IdentityAccessGuard` |
| TenantGuard 应用 | cashier-billing.controller, cashier.controller, cashier.sse, finance.sse, member-config.controller, llm-config.controller |
| IdentityAccessGuard | 全局注册 — 身份访问控制 (角色+权限+租户范围) |
| TrafficGovernanceGuard | 全局注册 — 限流+流量治理 |
| JWT 实现 | `token.service.ts` — HS256 对称算法 (Phase-FP 阶段使用) |

**风险标记: ⚠️ 低**

- **重要修复**: 上次报告的"无全局 APP_GUARD"问题已确认不存在 — 实际 `app.module.ts` 已注册 `TrafficGovernanceGuard` 和 `IdentityAccessGuard` 两个全局守卫
- 部分 controller (如 audit.controller) 仅 import 了 `UseGuards` 但未标注使用
- JWT 仍使用 HS256 (Phase-FP)，已标记 Phase-46 切 RS256
- `token.service.ts` 使用自定义 HMAC 签名而非标准 `jsonwebtoken` 库

**建议:**
- 对合规、沙箱、auth 等关键模块补充白名单校验
- JWT 算法 HS256 → RS256 迁移制定时间表
- 新 controller 应默认受全局 Guard 保护，使用 `@Public()` 装饰器白名单放行

---

## 2️⃣ RateLimit 实现状态

**状态: ✅ 完善实现**

| 维度 | 详情 |
|------|------|
| 限流算法 | TokenBucket (令牌桶) |
| 端口抽象 | `rate-limiter.port.ts` — RateLimiter 接口 |
| 集成点 | `TrafficGovernanceGuard` (全局) + `RequestGovernanceService` |
| 装饰器 | `@RateLimit()` 元数据驱动 (RATE_LIMIT_METADATA_KEY) |
| 业务场景 | 收银台防刷, 微信 prepay 限频 (1000/min), LYT 事件限流 |
| 管理端 | admin-web 有完整的 rate-limits 管理页面 (策略/账本/详情) — **仍在** |
| 限流 header | `applyRateLimitHeaders(res, decision)` — 返回标准限流头 |
| Redis 适配器 | `packages/sdk/src/modules/openapi/datasources/rate-limit.adapter.ts` |

**风险标记: ✅ 安全**

- TokenBucket 算法正确 (refill 逻辑 + burst 支持)
- 限流判定返回 `429 Too Many Requests`
- 全局 TrafficGovernanceGuard 确保限流覆盖全 API

**建议:**
- 生产环境确认限流 key 与 Redis 集群的映射关系
- 建议补充全局 QPS baseline (单 tenant 默认 1000/min，敏感接口 100/min)

---

## 3️⃣ RLS 多租户行级安全

**状态: ✅ 数据库层已完整实现**

| 维度 | 详情 |
|------|------|
| RLS 迁移文件 | `002_rls_policies.sql` + `005_order_rls.sql` |
| 覆盖表 | agent_events, orders, order_items, payments, refunds — **共 5 张表** |
| 隔离方式 | `current_setting('app.tenant_id', true)` Session 变量 |
| 策略 | 每张表 SELECT/INSERT/UPDATE/DELETE 全部 4 种操作 |
| 上下文注入 | `tenant-context.ts` — AsyncLocalStorage + `SET LOCAL app.tenant_id` |
| 应用层保护 | `runWithTenant()` 包装函数自动设置 tenant context |
| layer2 防御 | 即使应用代码漏写 tenant_id 过滤，RLS policy 会拒绝或返回空 |

**风险标记: ⚠️ 中等**

**RLS 覆盖范围不足:**
- RLS 仅覆盖 **5 张表** (agent_events, orders, order_items, payments, refunds)
- 但 Prisma schema 中有 **~50 个 model**，大量核心表无 RLS 保护
- **未覆盖的业务表举例**: MemberProfile, AuditLog, MarketProfile, RegionalConfig, IdentityAccount, OrganizationNode, ConfigEntry, SecretAsset, CertificateAsset, FeatureFlag, AiExecutionRecord, NotificationTemplate, PiiPolicy 等
- RLS `agent_events` 表 `tenant_id` 列 — **已确认存在** (RLS 策略假设该列存在)

**建议:**
- **P1**: 将 RLS 覆盖范围扩展至所有核心业务表 (MemberProfile, AuditLog 等)
- 建议将 RLS 生成脚本纳入 CI/CD 预检

---

## 4️⃣ tenant_id 字段完整性

**状态: ⚠️ 部分覆盖 — 发现 11 个 model 缺少 tenantId**

| 维度 | 详情 |
|------|------|
| Prisma model 总数 | ~50 个 model |
| 含 `tenantId` 的 model | ~39 个 (含可空 `String?`) |
| ✅ 核心业务含 tenantId | Tenant, Brand, Store, User, MemberProfile, MemberProfileExtension, LytMemberSnapshot, LytOrderSnapshot, LytPaymentSnapshot, MemberOperationsTask, MemberOperationsExecutionReceipt, AuditLog, LytConnection, EdgeNode, ConfigAuditLog 等 |
| 三级租户关系 | Tenant → Brand → Store 关系完整 |
| **❌ 发现缺少 tenantId 的 model** | **11 个**: MarketProfile, EmailChannelConfig, SocialChannelConfig, TaxPolicyConfig, OrganizationMembership, ConfigRevision, AiPromptTemplate, EdgeSyncTask, QuotaLedger, WebhookDelivery, ConfigInstance |
| 可空 tenantId | RegionalConfigOverride, PortalSite, IdentityAccount, OrganizationNode, AccessPolicy, GovernanceApproval 等 |

**风险标记: ⚠️ 中等**

**新增发现:**
- **MarketProfile** (市场配置) 无 tenantId — 可能是全局配置，但需确认是否应为租户隔离
- **OrganizationMembership** (组织成员) 无 tenantId — 可能通过 OrganizationNode 间接关联
- **QuotaLedger** (配额账本) 无 tenantId — 计费相关应严格隔离
- **ConfigRevision** (配置修订历史) 无 tenantId — 配置变更审计需要租户上下文
- **ConfigInstance** (配置实例) 无 tenantId

**建议:**
- **P1**: 审查上述 11 个 model 是否需要添加 tenantId (部分可能为全局配置)
- 对需要隔离的添加 `tenantId` 字段 + 索引 + RLS policy

---

## 5️⃣ deviceToken 安全检查

**状态: ⚠️ 存在风险 (略有改善)**

| 组件 | 状态 | 详情 |
|------|------|------|
| Push 服务 | ⚠️ 非结构化 | `push.service.ts` 中 deviceToken 仅做长度校验 (>= 64)，无结构验证 |
| Push 模块 | ⚠️ revokeToken 已存在 | `APNsService.revokeToken()` 存在但功能简陋: 仅标记为 revoked 状态，无签名验证 |
| Device 模块 | ❌ 无 token 字段 | `device-adapter.dto.ts` 定义 DeviceType/Brand/Status — **未包含 deviceToken** |
| IdentityAccess | ⚠️ 有引用 | `identity-access.entity.ts` 引用 `authSource: 'device-token'`，但无实际注册流程 |
| Token 安全 | ⚠️ 不满足最低要求 | deviceToken 缺乏签名验证/吊销检测/过期检查 |

**风险标记: 🚨 高**

**发现更新:**
1. `APNsService.revokeToken()` 已实现 — 但仅为内存中标记 `status: 'revoked'`
2. Push 模块存储 deviceToken 到内存 Map — 无持久化，重启丢失
3. DeviceAdapter 模块管理物理设备 (POS/闸机/打印机) — 但不涉及推送 token
4. deviceToken → user → tenant 映射缺失

**建议:**
- 建立 DeviceToken 管理服务: register/rotate/revoke/validate，持久化到数据库
- 推送前验证 token 签名 + 非吊销状态
- 设备注册需绑定 tenantId + userId，实现 deviceToken → 用户的映射

---

## 6️⃣ Lua 沙箱

**状态: ℹ️ 不适用 — 无变更**

| 维度 | 详情 |
|------|------|
| Lua 文件 | ❌ 项目中不存在任何 `.lua` 文件 |
| sandbox 模块 | ✅ 有 `sandbox.service.ts` — 但**仅为业务沙箱环境管理** (创建/启动/停止/删除环境) |
| sandbox 隔离 | 当前为内存模式 (`Map<string, SandboxEnvironment>`)，无代码执行沙箱 |
| 代码注入 | 未发现 eval() / Function() / vm.runInThisContext 等动态代码执行 |

**风险标记: ℹ️ 不适用**

- 项目不提供 Lua 脚本执行能力，故无 Lua 沙箱需求
- sandbox 模块是"租户隔离开发环境"而非"代码沙箱"

**建议:**
- 若未来引入 Lua/脚本扩展，应使用 WASM 沙箱或 `isolated-vm`
- 当前 sandbox 模块应增加权限边界 (每个环境绑定 tenantId)

---

## 7️⃣ 合规检查

**状态: ✅ 完整实现 (Phase-20 Compliance)**

| 维度 | 模块/文件 | 状态 |
|------|-----------|------|
| GDPR 合规 | `gdpr.service.ts` | ✅ Consent 管理 / DSR 请求 / 数据删除权 / 保留策略 |
| GDPR 擦除 | `gdpr-erasure.service.ts` | ✅ 用户数据擦除流程 |
| PII 检测 | `pii-detector.service.ts` | ✅ 手机/邮箱/身份证/信用卡/IP 正则检测 |
| PII 脱敏 | `pii-masker.service.ts` | ✅ MaskedDocument 脱敏实体 |
| 审计日志 | `audit-log.service.ts` | ✅ 全量 actor/resource/action 审计 (actorId, action, resource, resourceId) |
| 审计查询 | `audit-query.service.ts` | ✅ 审计记录检索 |
| 安全 E2E | `compliance-security-e2e.test.ts` | ✅ GDPR + WAF + 安全扫描 + RBAC 全流程 |
| 数据加密 | `encryption.util.ts` | ✅ AES-256-GCM (salt 16 + iv 12 + authTag 16) |
| WAF | `waf.service.ts` | ✅ Web 应用防火墙 |
| 安全扫描 | `security-scanner.service.ts` | ✅ 漏洞扫描 |
| 幂等性 | admin-web idempotency 页面 | ✅ 幂等 key 管理 |

**风险标记: ✅ 良好**

- 合规覆盖 GDPR/个人信息保护法/PII 三重标准
- 加密使用 AES-256-GCM + authTag 完整性验证
- 审计日志记录 actor/timestamp/resource 全维度
- 幂等性支持确保关键操作不会重复执行

**建议:**
- 增加合规仪表盘 (Compliance Dashboard) 实时展示 consent 状态/PII 扫描覆盖率
- 建议补充 SOC2/ISO27001 层面的自动化合规检查项

---

## 8️⃣ 未成年保护

**状态: ❌ 未实现 (业务规则已定义但未落地)**

| 维度 | 状态 |
|------|------|
| 年龄验证 | ❌ 无年龄验证/生日收集 — MemberProfile 无 age/birth 字段 |
| 未成年模式 | ❌ 无 |
| BR-0046 实现 | ❌ `BR-0046` 业务规则已定义 (14岁以下P3营销推送阻断) **但代码未实现** |
| 消费阻断 | ❌ BR-0034 (未成年人消费阻断) — 规则已存在但代码未实现 |
| 盲盒限额 | ❌ BR-0021 (未成年人单日¥200上限) — 规则已存在但代码未实现 |
| 家长同意 | ❌ 无 |
| 使用时长限制 | ❌ 无 |
| 数据收集限制 | ❌ 无 |
| MemberProfile | ❌ 无 `isMinor` 标志位 |

**风险标记: 🚨 高 (如面向中国大陆未成年人)**

**分析:**
- 项目面向商户/B 端为主 (会员管理、收银、门店运营)
- **业务规则已明确定义了未成年人相关限制** (BR-0021, BR-0034, BR-0046)
- 但 **全部未在代码中实现** — 规则文档与实现之间存在 gap
- MemberProfile 存储用户个人信息 (points/growthValue/contact)

**建议:**
- **P0**: 匹配业务规则 BR-0046 (年龄认证 + 14岁以下 P3 营销阻断)
- **P0**: 实现 BR-0034 (未成年人消费阻断)
- **P0**: 实现 BR-0021 (盲盒未成年人单日¥200上限)
- MemberProfile 增加 `isMinor` 标志位 + 年龄验证流程
- 若当前无 C 端未成年人场景，应在服务条款中声明"不主动收集未成年人信息"

---

## 📊 汇总评分

| # | 基线项目 | 上次 (07-12) | 本次 (07-13) | 风险等级 | 变动 |
|---|---------|-------------|-------------|---------|------|
| 1 | AuthGuard 覆盖率 | ✅ 已覆盖 (误判无全局Guard) | ✅ 已覆盖 (确认有2个全局Guard) | ⚠️ 低 | ✅ 修复误判 |
| 2 | RateLimit 实现 | ✅ 完善 | ✅ 完善 (全局 TrafficGovernanceGuard) | ✅ 安全 | — |
| 3 | RLS 多租户隔离 | ✅ 完整 | ⚠️ 仅5表RLS，50表无 | ⚠️ 中 | ⬇️ 降级 |
| 4 | tenant_id 字段完整性 | ✅ 全覆盖 | ⚠️ 发现11个model缺少tenantId | ⚠️ 中 | ⬇️ 降级 |
| 5 | deviceToken 安全检查 | ❌ 不规范 | ⚠️ revokeToken存在但无生命周期管理 | 🚨 高 | ⬆️ 微改善 |
| 6 | Lua 沙箱 | ℹ️ 不适用 | ℹ️ 不适用 | ✅ N/A | — |
| 7 | 合规检查 | ✅ 完整 | ✅ 完整 (AES-256-GCM确认 + 幂等性支持) | ✅ 良好 | — |
| 8 | 未成年保护 | ❌ 未实现 | ❌ 未实现 (BR-0046/0034/0021已定义未落地) | 🚨 高 | — |

**整体评分: 5/8 通过 | 1 项高风险 + 2 项中等风险 | 1 项不适用**

---

## 🎯 优先修复建议 (P0-P1)

### P0 — 本周内

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|------|
| P0 | 未成年保护 | 实现 BR-0046 (年龄认证 + 14岁以下P3阻断)、BR-0034 (消费阻断)、BR-0021 (盲盒¥200限额) | 🚨 |
| P0 | deviceToken | 建立持久化 DeviceToken 管理服务 (注册/吊销/过期) | 🚨 |

### P1 — 本月内

| 优先级 | 基线 | 行动项 | 风险 |
|--------|------|--------|------|
| P1 | RLS 扩展 | 将 RLS 覆盖从5张表扩展至所有核心业务表 (~30+表) | ⚠️ |
| P1 | tenant_id 完整性 | 审查11个缺少tenantId的model，添加字段及索引 | ⚠️ |
| P1 | AuthGuard | JWT HS256 → RS256 迁移时间表 | ⚠️ |

### P2 — 持续改进

| 优先级 | 基线 | 行动项 |
|--------|------|--------|
| P2 | 合规 | Compliance Dashboard — 实时合规状态展示 |
| P2 | 审计 | SOC2/ISO27001 自动化合规检查项 |
| P2 | RateLimit | 全局 QPS baseline 配置 (单tenant默认值) |

---

## 🔄 相比上次报告的变更

1. **AuthGuard**: 纠正了"无全局 APP_GUARD"的误判 — 实际有 2 个全局 Guard
2. **RLS**: 降级评估 — 上次仅检查了 RLS 策略文件存在性，本次发现仅 5 张表受保护
3. **tenant_id**: 降级评估 — 上次简单假设全覆盖，本次发现 11 个 model 缺少
4. **deviceToken**: 微改善 — 发现 `revokeToken()` 已存在 (但功能简陋)

---

*下次检查: 2026-07-20 (每周自动化)*
