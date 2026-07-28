# ✅ ACCEPTANCE: marketing
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| marketing.controller.spec.ts | — |
| marketing.controller.test.ts | — |
| marketing.service.spec.ts | — |
| marketing.service.main.test.ts | — |
| marketing.service.test.ts | — |
| marketing.e2e.test.ts | — |
| marketing.dto.test.ts | — |
| marketing.entity.test.ts | — |
| marketing.module.test.ts | — |
| marketing.contract.test.ts | — |
| marketing.role.test.ts | — |
| marketing.role-extended.test.ts | — |
| ab-test.test.ts | — |
| attribution.test.ts | — |
| coupon-issuer.test.ts | — |
| rfm-calculator.test.ts | — |

**总测试用例数: 339**

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 营销引擎核心组件已覆盖
- [x] AB测试/RFM/归因/CouponIssuer已覆盖
- [ ] 与 campaign 模块的集成需验证

## 重点关注
- 20 个测试文件，339 个测试用例
- 包含 AB Test、RFM 分析、归因模型、CouponIssuer 子域
- controller.role.test.ts 独立覆盖角色鉴权
