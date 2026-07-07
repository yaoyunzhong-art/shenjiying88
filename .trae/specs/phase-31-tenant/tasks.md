# Phase-31 Tasks: 多租户隔离

## 任务列表

| ID | 任务 | 状态 | 提交 |
|----|------|------|------|
| T139 | TenantGuard 后端 | ✅ | step 1 |
| T140 | AgentService row-level filter | ✅ | step 2+4 |
| T141 | E2E 47 断言 | ✅ | step 3+5 |
| T142 | spec + retro + atomic commit | ✅ | T142 |

## 子任务明细

### T139 TenantGuard

- [x] CanActivate 实现
- [x] x-tenant-id header 读取
- [x] 大小写兼容
- [x] 缺失/空白 → 401
- [x] request.tenantId 注入

### T140 AgentService row-level filter

- [x] `getConfigs(tenantId?)`
- [x] `getConfig(id, tenantId?)` 跨租户校验
- [x] `getSessions(tenantId?)`
- [x] `getSession(id, tenantId?)` 跨租户校验
- [x] `getEvaluations(tenantId?)`
- [x] `getStats(tenantId?)` 已存在

### T141 E2E 47 断言

- [x] Section 1: TenantGuard 行为 (5 断言)
- [x] Section 2: AgentService filter (10 断言)
- [x] Section 3: getSessions 跨租户 (8 断言)
- [x] Section 4: getEvaluations 跨租户 (3 断言)
- [x] Section 5: getStats 跨租户 (5 断言)
- [x] Section 6: 端到端隔离 (2 断言)
- [x] Section 7: 边界 (2 断言)
- [x] Section 8: 文件静态扫描 (8 断言)

### T142 文档

- [x] spec.md (10 节)
- [x] retrospective.md (8 节)
- [x] tasks.md (当前文件)

## 验收

```bash
$ npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase31-e2e-tenant.ts
Phase-31 E2E 结果: 47 pass / 0 fail
✓ 全部断言通过
```

## 关键文件路径

- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/tenant.guard.ts`
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/agent.service.ts`
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/phase31-e2e-tenant.ts`
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.trae/specs/phase-31-tenant/{spec,retrospective,tasks}.md`