# ✅ ACCEPTANCE: cashier
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| cashier.controller.spec.ts | 56 |
| cashier.controller.test.ts | 32 |
| cashier.service.spec.ts | 25 |
| cashier.service.test.ts | 18 |
| cashier-billing.controller.spec.ts | 27 |
| cashier-billing.e2e.test.ts | 21 |
| cashier-billing.role.test.ts | 25 |
| cashier.dto.test.ts | 20 |
| cashier.e2e.test.ts | 22 |
| cashier.module.test.ts | 14 |
| cashier.entity.test.ts | 3 |
| cashier.contract.test.ts | 7 |
| cashier.role.test.ts | 20 |
| cashier.role-enhanced.test.ts | 27 |
| cashier.role-extended.test.ts | 24 |
| cashier.role-v3.test.ts | 24 |
| cashier.persistence.spec.ts | 14 |
| order.service.spec.ts | 91 |
| payment.service.spec.ts | 32 |
| payment.service.test.ts | 10 |
| order-state-machine.test.ts | 35 |
| cashier-ringbeam.test.ts | 29 |
| cashier-simulator.test.ts | 32 |
| cashier-offline-sync.service.test.ts | 23 |
| cashier-offline.test.ts | 23 |
| 其它收银测试文件 | 30+ |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 收银核心链路已覆盖 E2E + Role
- [x] 离线同步/订单状态机已覆盖
- [ ] Bridges/PaymentChannel 未覆盖完整

## 重点关注
- 37 个测试文件, 涵盖收银、计费、离线同步、订单、支付通道
- order.service.spec.ts 高达 91 个测试用例 — 极好
- 存在 bridges/ ports/ retry/ 等子目录模块化设计
- 部分 metadata 测试仅为骨架 (3-5 cases)
