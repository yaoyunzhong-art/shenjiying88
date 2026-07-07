# DR-005 · 跨租户隔离 Lint 规则

> 创建: 2026-06-26 (Phase-18 T21)
> ⚠️ DR编号冲突注意: 知识库中另有 `knowledge/decision-records/DR-005-rag-architecture.md` 讨论RAG架构
> 两者不同主题, 本DR仅聚焦 `跨租户隔离Lint规则`
> 状态: ✅ Accepted
> 关联: [phase-18/spec.md §4](../spec.md)

## Context

多租户 SaaS 平台,跨租户数据泄露是 P0 安全风险。
TypeORM `repo.findOne({ where: { id } })` 写法没有 tenantId filter,会导致:
- tenant-A 用户查询时,可能拿到 tenant-B 的数据
- 报告 / 导出 / 推送通知场景尤其危险

手工 review 容易漏,需要自动化检测。

## Decision

**实施 3 条 ESLint-style 规则**,扫描 `apps/api/src/modules/**/*.ts`:

| 规则 | 严重度 | 检测目标 |
|---|---|---|
| missing-tenant-guard | error | `repo.findOne({ where })` 不含 `tenantId` |
| missing-tenant-guard | error | `repo.find({ where })` 不含 `tenantId` |
| cross-tenant-join | error | `QueryBuilder.leftJoin/innerJoin` 后续无 tenantId filter |

集成测试 100 跨租户场景自动生成,期望 `passRate >= 99%`。

## Alternatives Considered

### A. ORM interceptor (TypeORM Subscriber)
- 拦截所有 query,自动注入 tenantId
- ✅ 一处生效,全模块覆盖
- ❌ 复杂查询 (动态 join) 难处理,debug 困难
- ❌ 测试 mock 成本高

### B. Repository pattern (BaseRepository)
- 强制所有 repository 继承 BaseRepository
- ✅ 类型安全
- ❌ 重构成本高,需要逐个 module 迁移
- ❌ 现存 30+ repository 一夜迁移风险大

### C. **Lint + 集成测试 (选定)**
- ✅ 渐进式,新代码立即生效,旧代码逐个修
- ✅ 测试驱动,100 场景覆盖
- ✅ 开发友好,CI 反馈即时
- ❌ 旧代码需要手动修

## Consequences

- ✅ 新代码自动防止跨租户泄露
- ✅ 100 场景集成测试保证覆盖率
- ⚠️ V1 规则依赖正则,复杂 case 可能漏检
- 🔜 Phase-19 升级:加入 ORM interceptor 兜底

## 实施

- [tenant-isolation.lint.ts](../../../../apps/api/src/modules/tenant/tenant-isolation.lint.ts)
- [tenant-isolation.service.ts](../../../../apps/api/src/modules/tenant/tenant-isolation.service.ts)
- [tenant-isolation.e2e.test.ts](../../../../apps/api/src/modules/tenant/tenant-isolation.e2e.test.ts) (10/10 PASS)