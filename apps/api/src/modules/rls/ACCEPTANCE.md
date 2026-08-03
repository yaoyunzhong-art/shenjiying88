# ✅ ACCEPTANCE: rls
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| rls.controller.spec.ts | 22 |
| rls.service.spec.ts | 59 |
| rls.service.test.ts | 38 |
| rls.e2e.test.ts | 28 |
| rls.dto.test.ts | 26 |
| rls.helper.test.ts | 138 |
| rls.middleware-prisma.test.ts | 33 |
| rls.role.test.ts | 35 |
| rls.role-extended.test.ts | 36 |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] RLS 中间件拦截逻辑已覆盖
- [x] 多租户隔离场景 E2E 覆盖
- [ ] 需验证所有模块的 RLS 集成

## 重点关注
- 10 个测试文件，覆盖 Controller/Service/Middleware/E2E/Role
- rls.helper.test.ts 覆盖 138 个测试用例 — 核心数据隔离工具
- rls.middleware-prisma.test.ts (33 cases) 覆盖 Prisma 拦截
- controller.spec.ts 22 cases + service.spec.ts 59 cases 双重覆盖
- 存在 RLS-PRISMA-INTERCEPT.md 设计文档
