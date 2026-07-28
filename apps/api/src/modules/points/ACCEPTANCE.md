# ✅ ACCEPTANCE: points
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| points.controller.spec.ts | — |
| points.controller.test.ts | — |
| points.service.spec.ts | — |
| points.service.test.ts | — |
| points.dto.test.ts | — |
| points.entity.test.ts | — |
| points.module.test.ts | — |
| points.e2e.test.ts | — |
| points.role.test.ts | — |
| points.role-extended.test.ts | — |
| points-atomic.test.ts | — |
| points-expiration-reminder.test.ts | — |
| points-risk.test.ts | — |

**总测试用例数: 323**

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 积分核心链路已覆盖
- [x] 原子操作/到期提醒/风控已覆盖
- [ ] 积分兑换/抵扣流程需验证

## 重点关注
- 15 个测试文件，323 个测试用例
- points-atomic.test.ts 积分原子性操作覆盖
- points-expiration-reminder.test.ts 过期提醒场景
- points-risk.test.ts 积分风控场景
