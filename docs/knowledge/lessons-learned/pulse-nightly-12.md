# 📘 Pulse-Nightly-12 经验教训 · 2026-07-10

> 跨模块 E2E 扩展 34→37链 · +35 subtests · 0 fail · 3 种新模式 · 修复P1-021(链30/31升级)

---

## 新增跨模块模式

### 1. Nest TestingModule 升级版 — MultiRegion→Health→AutoRollback + Content→Brand→I18n→Multimedia (链35)
**核心设计**:
- 首次在同一链中融合**两大子链路**: Part A 涵盖多区域故障转移, Part B 涵盖品牌内容多语言发布
- MultiRegion Store+Service + Health Store+Service + AutoRollbackService 的 DI 分层
- BrandContentPipelineService 管理品牌→内容→翻译→发布全链路
- 13 subtests (6+7): 正例4 + 反例4 + 边界5

**经验教训**:
- **日期戳 ID 冲突**: `Date.now()` 在同一毫秒内重合导致 `findIndex()` 误匹配两个不同 draft。修复方式: 加入递增序列号 `seq` 保证 ID 唯一
- **变量提升问题**: vitest `describe` 块内的 `let svc` 变量被多个 `it` 回调捕获时, 由于 `afterEach` 未正确重置, 导致后续 test 读到前序 test 的数据。修复方式: 每个 test 使用 `createServices()` 返回独立实例, 不依赖共享变量

### 2. 跨租户数据隔离 + 治理审计 (链36)
**核心设计**:
- 三层隔离: TenantProfile/User 边界 → IdentityAccessService 验证 → DataShieldService 脱敏 → GovernanceAuditService 审计追溯
- 多维角色: 普通用户(仅租户内)、超级管理员(全局) 
- 三种脱敏级别: `full`（全屏蔽）、`partial`（部分遮盖）、`none`（不处理）
- 10 subtests: 正例3 + 反例3 + 边界3 + 数据脱敏2

**经验**:
- 跨租户审计日志完整记录每次 blocked access, 包括 actorId、resource、action 和 reason
- 超级管理员虽然可跨租户，但数据仍经过脱敏层（避免敏感数据泄露）

### 3. 边缘缓存 + CDN 失效工作流 (链37)
**核心设计**:
- PublishService(发布)→CacheInvalidationService(失效)→CacheAnalyticsService(分析) 三层架构
- 失效策略: 精确匹配(exact)、前缀匹配(prefix)、全量(wildcard)
- 缓存预热: 只预热已发布(非draft/archived)的内容
- 12 subtests: 正例4 + 反例3 + 边界4 + 分析1

**经验**:
- purgeAll() 应返回实际清除条目数（空气缓存返回0）
- 预热时仅处理 `published` 状态的内容
- TTL 过期自动失效在内存缓存中需要用 `age > entry.ttl` 判断

---

## 通用教训

### 1. 测试隔离重要性（Vitest）
在 vitest 中使用 `let svc` 声明在 `describe` 块时, 每个 `it()` 回调虽然闭包捕获相同变量, 但 vitest 按顺序执行 test。如果某个 test 忘记调用 `afterEach` 重置, 前序 test 的副作用会泄漏到后续 test。**最佳实践**: 每个 test 内部使用 `const svc = createServices()` 创建独立实例, 彻底避免共享状态。

### 2. ID 唯一性
测试中使用 timestamp-based ID(`draft-${Date.now()}`) 在同一毫秒内可能冲突。改用 `seq-${Date.now()}` 或在 Store 中维护递增计数器。

### 3. 内联 domain 升级最佳实践
从链30/31 的内联单函数模式升级为链35 的 DI 风格模式时:
- 保持 Store 与 Service 分离
- Store 之间不直接引用（通过 Service 层协调）
- 每个 `createServices()` 创建完整的新实例
- 文档化每个 subtests 的验证目标（正例/反例/边界）

---

## 覆盖缺口更新 (Pulse-Nightly-12)

| 缺口 | 状态 | 说明 |
|------|:----:|------|
| 链30/31 内联domain → DI 升级 | ✅ **已修复** | 链35 完成升级 (13 subtests) |
| 跨租户数据隔离治理 | ✅ **已修复** | 链36 新增 (10 subtests) |
| CDN 缓存失效工作流 | ✅ **已修复** | 链37 新增 (12 subtests) |
| 共享状态隔离 (全局变量模式) | 🟡 部分修复 | 新链35-37 采用 `createTestStores()` 模式 |
| @m5/api full-regression false positive | 🔴 持续 | Vitest 4 API 不兼容 |
| @m5/api timeout 问题 | 🔴 持续 | Nest TestingModule |
