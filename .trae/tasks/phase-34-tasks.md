# 📋 Phase-34 Tasks: view-model 强制 tenantId + RLS

> **Phase**: 34
> **总估时**: 8h
> **前置**: Phase-31 ✅ Phase-33 ✅

---

## T153 — RLS policy SQL + migration (1.5h)

**目标**: 新建 `002_rls_policies.sql` migration 文件

**AC**:
- [ ] `apps/api/src/database/migrations/002_rls_policies.sql` 新建
- [ ] agent_events 表 ALTER ... ENABLE ROW LEVEL SECURITY
- [ ] 4 个 policy: SELECT/INSERT/UPDATE/DELETE 全部带 USING tenant_id 校验
- [ ] audit_log 表 + 索引 (idx_audit_log_tenant_time)
- [ ] 注释清晰说明 SET app.tenant_id 用法

**输出**: `002_rls_policies.sql` 60-80 行

---

## T154 — ViewModelService + AuditService (2.5h)

**目标**: 新建两个 service

**AC**:
- [ ] `apps/api/src/modules/shared/view-model.service.ts` 新建
  - 7 个方法 (getAgentConfig / listAgentConfigs / getSession / listSessions / getSessionHistory / getEvaluation 等)
  - 每个方法必填 tenantId (TypeScript 强制)
  - 跨租户 → ForbiddenException + audit
- [ ] `apps/api/src/modules/shared/audit.service.ts` 新建
  - in-memory logCrossTenantAttempt / getAuditLog
  - 不抛异常 (异步写入,失败仅 warn)
- [ ] `apps/api/src/modules/shared/tenant-validator.ts` 工具
  - assertTenantId(tenantId) → 抛 ForbiddenException if 空
- [ ] 单元测试覆盖关键路径

**输出**: view-model.service.ts (180 行) + audit.service.ts (60 行) + tenant-validator.ts (30 行)

---

## T155 — Migration runner + RLS in-memory 模拟 (1.5h)

**目标**: 启动时自动应用 RLS policy (in-memory 实现)

**AC**:
- [ ] `apps/api/src/database/migration-runner.ts` 新建
- [ ] 扫描 `migrations/` 目录 SQL 文件,按文件名顺序应用
- [ ] in-memory 模式下,把 RLS policy 转译为 service 层校验 (复用 ViewModelService)
- [ ] 启动日志输出应用结果
- [ ] `apps/api/src/modules/agent/agent.module.ts` 注册新 service + onModuleInit 跑 migration

**输出**: migration-runner.ts (80 行)

---

## T156 — ViewModelProvider + useTenantId (1.5h)

**目标**: React Context + hook

**AC**:
- [ ] `packages/ui/src/providers/ViewModelProvider.tsx` 新建
- [ ] `useViewModel()` hook 暴露 { tenantId, userId }
- [ ] `useTenantId()` 便捷 hook
- [ ] `useUserId()` 便捷 hook
- [ ] 单元测试: Provider 注入 / 未 Provider 抛错 / 切换 tenant 触发 re-render
- [ ] data-testid: `view-model-provider` / `tenant-id-display`

**输出**: ViewModelProvider.tsx (60 行) + .test.tsx (50 行)

---

## T157 — E2E 42 断言 + 兼容回归 (1h) + retro (0.5h)

**目标**: 写 `scripts/phase34-e2e-viewmodel.ts` + 出 retro

**AC**:
- [ ] 42 断言全过 (Spec §7)
- [ ] Phase-31/32/33 E2E 仍过 (TenantGuard / EventBuffer / EventStore 兼容)
- [ ] 出 `.trae/specs/phase-34-retro.md`
- [ ] atomic commit 锁定

**依赖**: T153-T156 全部完成

**输出**: E2E 脚本 280 行 + retro 80 行

---

## 📊 任务依赖图

```
T153 (RLS SQL) ──┐
                  ├──→ T155 (migration runner + RLS 模拟) ──┐
T154 (Service) ───┤                                          ├──→ T157 (E2E + retro)
                  └─→ T156 (React Provider) ──────────────────┘
```

## 🎯 验收 checklist (🦞 openclaw)

- [ ] T153-T157 全部 commit 在 main 分支
- [ ] Phase-34 E2E 42 断言全过
- [ ] Phase-31/32/33 E2E 仍过 (回归确认)
- [ ] 静态扫描命中 ViewModelService / AuditService / tenantId / RLS
- [ ] ViewModelProvider 单元测试通过

---

> 📋 **"5 任务 + 42 断言 + 8h = 三层防御 + P0 收官"**