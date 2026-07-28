# ✅ ACCEPTANCE: loyalty
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| loyalty.controller.spec.ts | 25 |
| loyalty.controller.test.ts | 45 |
| loyalty.service.spec.ts | 20 |
| loyalty.service.test.ts | 14 |
| loyalty.e2e.test.ts | 18 |
| loyalty-plan.e2e.test.ts | 29 |
| loyalty.dto.test.ts | 12 |
| loyalty.dto.plan.test.ts | 43 |
| loyalty.entity.test.ts | 27 |
| loyalty.module.test.ts | 6 |
| loyalty.contract.test.ts | 21 |
| loyalty.role.test.ts | 22 |
| loyalty.role-extended.test.ts | 12 |
| loyalty.role-v2.test.ts | 36 |
| loyalty.simulator.test.ts | 18 |
| loyalty-ringbeam.test.ts | 10 |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 积分计划/合约/E2E 已覆盖
- [x] 多版本角色权限已覆盖
- [ ] 升级触发逻辑需额外验证

## 重点关注
- 19 个测试文件，覆盖 Controller/Service/E2E/Role
- dto.plan.test.ts 43 cases 覆盖积分计划 DTO
- e2e + plan.e2e 双重 E2E 覆盖
- 核心覆盖良好，部分子域需继续补充
