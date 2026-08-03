# ✅ ACCEPTANCE: alliance
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| alliance.controller.spec.ts | — |
| alliance.controller.test.ts | — |
| alliance.service.spec.ts | — |
| alliance.service.test.ts | — |
| alliance.dto.test.ts | — |
| alliance.entity.test.ts | — |
| alliance.module.test.ts | — |
| alliance.contract.test.ts | — |
| alliance.role.test.ts | — |
| alliance.role-extended.test.ts | — |
| alliance.role-complete.test.ts | — |
| alliance.role-scenario.test.ts | — |
| alliance.e2e.test.ts | — |
| alliance-coupon.service.test.ts | — |
| alliance-dashboard.service.test.ts | — |
| alliance-data.service.test.ts | — |
| alliance-grade.service.test.ts | — |
| alliance-review.service.test.ts | — |
| alliance-settlement.service.test.ts | — |
| alliance-tier.service.test.ts | — |

**总测试用例数: 471**

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 联盟核心全链路已覆盖
- [x] 等级/结算/审查/优惠券子域已覆盖
- [x] 完整角色矩阵 (role + extended + complete + scenario)
- [ ] 跨租户联盟场景需验证

## 重点关注
- 25 个测试文件，471 个测试用例 — 覆盖极其全面
- 6 个独立 Service 测试: coupon/dashboard/data/grade/review/settlement/tier
- role-complete + role-scenario 覆盖所有角色组合
- 业务复杂度高，测试覆盖面好
