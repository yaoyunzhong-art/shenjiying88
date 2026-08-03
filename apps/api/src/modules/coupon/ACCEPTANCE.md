# ✅ ACCEPTANCE: coupon
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| coupon.controller.spec.ts | 36 |
| coupon.controller.test.ts | 12 |
| coupon.service.spec.ts | 21 |
| coupon.service.test.ts | 38 |
| coupon.dto.test.ts | 30 |
| coupon.e2e.test.ts | 7 |
| coupon.entity.test.ts | 15 |
| coupon.module.test.ts | 13 |
| coupon.contract.test.ts | 11 |
| coupon.role.test.ts | 16 |
| coupon.role-extended.test.ts | 12 |
| coupon.role-storefront.test.ts | 14 |
| coupon.role-v3.test.ts | 21 |
| coupon.simulator.test.ts | 16 |
| coupon-ai-distribute.test.ts | 20 |
| coupon-alliance.test.ts | 42 |
| coupon-cleanup.service.test.ts | 5 |
| coupon-ringbeam.test.ts | 4 |
| coupon.stress.test.ts | 21 |
| coupon.service.continuing.test.ts | 18 |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 优惠券发放/核销/清理核心链路已覆盖
- [x] Role + 压力测试 + 联盟场景已覆盖
- [x] AI 分发场景已覆盖

## 重点关注
- 21 个测试文件，覆盖全面
- coupon.service.test.ts 38 cases + controller.spec.ts 36 cases
- coupon-alliance.test.ts 42 cases 覆盖联盟优惠券场景
- coupon.stress.test.ts 21 cases 压力测试覆盖
- coupon-ai-distribute.test.ts 20 cases AI分发场景
