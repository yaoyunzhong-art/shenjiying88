# V23 审计 · G8 租户+客户组
> 日期: 2026-07-20 · 评审专家: E40杨客户 + E26赵租户
> 版本: V23 v1.2

## 总体评级
🟢 **通过**

P-31 多租户隔离模块已完成 68 个文件构建，涵盖 tenant 上下文注入、隔离引擎、生命周期治理、配额治理、多级租户配置五大子域。租户隔离 main 证据链（tenant-ringbeam.test.ts 21 tests / tenant.e2e.test.ts 21 tests / tenant-config-ringbeam.test.ts 48 tests / tenant-config.e2e.test.ts 17 tests）全部通过。RLS 在应用层 Controller+19 model tenantId 全覆盖。

G5 数据组 V22 晚会点评确认 "RLS隔离100%"，Gateway5 签署确认 ✅ P-31 多租户隔离。

---

## 评审意见

### 1️⃣ RLS 隔离——应用层完备但数据库层半程

P-31 RLS 当前状态：

**应用层（✅ 已完成）**
- tenant.middleware.ts — 从请求头提取 tenantContext（x-tenant-id/x-brand-id/x-store-id/x-market-code）
- tenant.decorator.ts — @InjectTenant() 装饰器
- tenant-isolation.util.ts — 按 tenant 过滤、跨租户拒绝、scope key 隔离
- Controller+19 model tenantId 全覆盖
- PaymentGateway TenantGuard 双重保障（V22 PaymentGateway跨租户漏洞已修复）

**数据库层（🟡 未完整覆盖）**
- 审计结论：p31-tenant-audit.md 明确 "当前隔离主证据主要集中在 middleware/util/service/controller/e2e 层，数据库级 Prisma interceptor + RLS 全表自动覆盖仍待完整落地"
- 迁移工具（p31-multi-tenant-architecture.md）有设计说明，但未形成独立的 requirement card + ringbeam + e2e 闭环
- 不像 P-49 有完整的自动化迁移闭环

**风险**：数据库层无自动 RLS 拦截意味着：如果一个新的 API 路由未正确调用 tenant 过滤，数据可能在开发者未意识到的情况下跨租户暴露。V18 的 PaymentGateway 跨租户漏洞正源于此。

### 2️⃣ 租户生命周期治理——基础存在但缺少租户自助

tenant-lifecycle.service.ts 支持：初始化（initializeTenant）、暂停（suspendTenant）、恢复（resumeTenant）、逻辑删除（softDeleteTenant）。tenant-quota.service.ts 支持 tier/usage/reserve/超限拒绝。

**但**：
- 租户注册/初始化流程是管理后台操作，缺少**租户自助注册**流程（SaaS 典型场景）
- 租户套餐变更（upgrade/downgrade）的计费联动未明确——P-38 财务模块是否按 tier 自动计算账单？
- 租户暂停后的数据保留策略未单独记录——暂停多久后数据清除？

### 3️⃣ 客户界面一致性——Admin-web/Storefront/RN 三端覆盖但缺少跨租户一致性测试

V23 Day1 指标：admin-web 264页三态全覆盖 ✅，storefront/RN 全覆盖 ✅。G4 营销组点评："三态全覆盖大幅降低用户困惑"。

**但**：
- 从租户视角看，界面一致性是指：不同租户看到的同一页面在品牌参数化后体验是否一致（logo/颜色/域名）
- 品牌定制模块（brand-custom.service.ts）支持主题、域名、邮件模板、多租户品牌配置，但缺少**跨租户品牌渲染差异的视觉一致性测试**
- VRT（视觉回归测试）原型已有（snapshot+compare+report），但未专门覆盖多租户场景

**风险**：一个租户配置了极端品牌颜色（如深黑背景+深色文字）可能导致可访问性问题。缺少跨租户可视化验收。

---

## 关注点

### 🔴 关注点1: 数据库层 RLS 自动化——V23 最大待解决问题之一

| 层面 | 当前 | 需要 |
|:-----|:-----|:-----|
| 应用层 | `tenant.middleware.ts` + `tenant-isolation.util.ts` + 19 model tenantId | ✅ 已存在 |
| Service 层 | 每个 service 手动调用 tenant 过滤 | 🟡 可靠但错误率高 |
| 数据库层 | 无自动 RLS 拦截 | ❌ 不存在 |

**建议**：在 V23 Phase 2 中将 Prisma interceptor 自动注入 tenantId 作为 **P0 不可绕过项**。参考 PostgreSQL Row-Level Security 的 `current_setting('app.tenant_id')` 模式，实现数据库级别的第二层防护。这在 V23 roadmap 的圈梁细则中被多次提及，应不再拖延。

### 🟡 关注点2: 租户隔离实战验证范围偏窄

当前 E2E 测试主要验证 "A 租户不能访问 B 租户数据"。缺少以下场景：
- **租户停用后的数据隔离**：暂停的租户数据是否可被恢复的操作
- **多级租户配置冲突**：tenant/brand/store/market 四级配置的优先级链冲突处理
- **超大数据量租户隔离**：500+ 个租户同时操作时隔离性能
- **硬删除租户的数据残留**：softDeleteTenant 后物理清除的数据是否被正确隔离

### 🟡 关注点3: 租户仪表盘/自助门户缺失

客户视角的操作入口：
- 租户管理员没有自助 dashboard 查看配额使用率、活动日志、存储占用
- 没有租户级的操作日志界面（虽然 audit-trail/hourly/ 有小时快照，但不对租户可见）
- V23 roadmap 中没有安排租户自助门户的构建

---

## 建议

### 建议1: Phase 2 强制纳入 Prisma interceptor 自动 RLS
```typescript
// Prisma 查询中间件——自动注入 tenantId
// 当前架构需要所有 service 手动调用 tenant 过滤
// 改为 Prisma 中间件 + Promise chain
// 参考: ADR-001 p31-tenant-rls / PostgreSQL set_config('app.tenant_id', ...)

prisma.$use(async (params, next) => {
  const tenantId = getCurrentTenantId();
  if (tenantId && params.model && params.action?.startsWith('find') || params.action?.startsWith('create')) {
    params.args.where = { ...params.args.where, tenantId };
  }
  return next(params);
});
```
- 新增 ADR 记录此方案（P-31 RLS 自动化设计）
- 增加 ringbeam test 验证 interceptor 行为
- 验证跨租户 E2E 链不受影响

### 建议2: 跨租户品牌一致性 VRT 验收
- 在现有 VRT 原型（snapshot+compare+report）基础上增加多租户场景
- 创建测试配置：租户A (默认品牌) / 租户B (深色主题) / 租户C (大字号无障碍模式)
- 对 admin-web/storefront 核心页面截图对比
- 输出差异报告识别"品牌参数化后界面是否一致"

### 建议3: 租户自助门户排入 V23 Phase 3
- P-31 的后继任务：租户自助注册流程、quota dashboard、活动日志
- 至少为管理员提供一个 API 端的租户概览（建议使用 Knowledge Dashboard 的知识仪表盘作为底座）
- 时程建议：Phase 2 末期开始，Phase 3 内完成基础版

---

> 审计执行: 🐜 树哥 · 2026-07-20 23:10 CST
> 参考文献: V23 roadmap v1.2 · p31-tenant-audit.md · kb-035-tenant-isolation.md · ADR-001 · gateway5-signoff
