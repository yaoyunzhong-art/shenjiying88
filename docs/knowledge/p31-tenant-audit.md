# P-31 多租户隔离专项审计

> 更新时间: 2026-07-14 10:42
> 范围: `PRD-011` / `apps/api/src/modules/tenant` / `apps/api/src/modules/tenant-config`

## 1. 审计结论

`P-31` 当前真实状态并非“零启动”或“缺测试”，而是“代码与测试已经大量存在，但缺少 requirement card / 专项 audit / 总表口径收口”。本轮已将 `P-31` 从“证据散落”推进到 `🟡 已补主圈梁，待补数据层自动化隔离`。

## 2. 证据总表

| 模块 | PRD | 代码入口 | 测试证据 | 审计结论 |
|:-----|:----|:---------|:---------|:---------|
| 租户上下文注入 | PRD-011 | `tenant.middleware.ts` / `tenant.decorator.ts` / `tenant.types.ts` | `tenant.e2e.test.ts` 21例 + `tenant.middleware.test.ts` | tenant/brand/store/market 头解析与默认回退可执行 |
| 租户隔离引擎 | PRD-011 | `tenant-isolation.util.ts` / `tenant.service.ts` | `tenant-ringbeam.test.ts` 21例 + `tenant.phase-p31.test.ts` 29例 + `tenant-isolation.util.test.ts` | 同租户访问、跨租户拒绝、平台超管绕过与作用域键隔离主链存在 |
| 生命周期治理 | PRD-011 | `tenant-lifecycle.service.ts` / `tenant-lifecycle.entity.ts` | `tenant-ringbeam.test.ts` + `tenant-lifecycle.service.test.ts` | 初始化、暂停、恢复、逻辑删除主链存在 |
| 配额治理 | PRD-011 | `tenant-quota.service.ts` / `tenant-quota.entity.ts` / `tenant-quota.controller.ts` | `tenant-ringbeam.test.ts` + `tenant-quota.service.test.ts` + `tenant-quota-integration.e2e.test.ts` | tier、usage、reserve、超限拒绝主链存在 |
| 多级租户配置 | PRD-011 | `tenant-config.service.ts` / `tenant-config-cache.service.ts` / `tenant-config.controller.ts` | `tenant-config-ringbeam.test.ts` 48例 + `tenant-config.e2e.test.ts` 17例 | store/tenant/brand 三级配置、脱敏、缓存与角色访问主链存在 |

## 3. 本轮补齐

1. 重新盘点 `PRD-011` 的真实代码与测试证据，确认 `tenant` + `tenant-config` 共 `68 files`
2. 运行主证据测试：
   - `tenant-ringbeam.test.ts` `21 tests`
   - `tenant.phase-p31.test.ts` `29 tests`
   - `tenant.e2e.test.ts` `21 tests`
   - `tenant-config-ringbeam.test.ts` `48 tests`
   - `tenant-config.e2e.test.ts` `17 tests`
3. 将分散的隔离证据收口到一张需求卡：
   - `docs/knowledge/requirement-cards/2026-07-14-P31-tenant.md`
4. 将总表口径从“缺测试+审计”修正为“已补主圈梁”

## 4. AC / RQ 映射

| 需求 | 证据 |
|:-----|:-----|
| RQ-31-01 / AC-31-01 | `tenant.middleware.ts` 注入 `tenantContext`；`tenant.e2e.test.ts` 验证 `x-tenant-id/x-brand-id/x-store-id/x-market-code` 解析与默认回退 |
| RQ-31-02 / AC-31-01 | `tenant-isolation.util.ts`、`tenant.service.ts`、`tenant.phase-p31.test.ts` 验证按 tenant 过滤、跨租户拒绝、scope key 隔离 |
| RQ-31-03 / AC-31-02 | `tenant.controller.ts`、`tenant-lifecycle.service.ts`、`tenant-quota.service.ts` 支持租户初始化、暂停/恢复、tier/配额设置与查询 |
| RQ-31-04 / AC-31-03 | `tenant.phase-p31.test.ts`、`tenant-multitenant.e2e.test.ts`、`tenant-isolation.e2e.test.ts` 验证平台级管理员可跨租户查看 |
| RQ-31-05 | `p31-multi-tenant-architecture.md` 已定义 RLS/迁移方向，但自动化迁移主链尚未闭环 |

## 5. 剩余缺口

1. 当前隔离主证据主要集中在 middleware / util / service / controller / e2e 层，数据库级 `Prisma interceptor + RLS 全表自动覆盖` 仍待完整落地。
2. 迁移工具目前有设计说明，但还没有像 `P-49` 那样形成单独的 requirement card + ringbeam + e2e 闭环。

## 6. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/tenant/tenant-ringbeam.test.ts src/modules/tenant/tenant.phase-p31.test.ts src/modules/tenant/tenant.e2e.test.ts
pnpm --dir apps/api exec vitest run src/modules/tenant-config/tenant-config-ringbeam.test.ts src/modules/tenant-config/tenant-config.e2e.test.ts
bash scripts/prd-validate.sh
```
