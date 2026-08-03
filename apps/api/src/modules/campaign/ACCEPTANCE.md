# ✅ ACCEPTANCE: campaign
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| campaign.controller.spec.ts | 29 |
| campaign.controller.test.ts | 20 |
| campaign.service.spec.ts | 25 |
| campaign.service.test.ts | 20 |
| campaign.e2e.test.ts | 18 |
| campaign.dto.test.ts | 35 |
| campaign.entity.test.ts | 3 |
| campaign.module.test.ts | 4 |
| campaign.contract.test.ts | 8 |
| campaign.role.test.ts | 20 |
| campaign.role-extended.test.ts | 20 |
| campaign.role-v3.test.ts | 17 |
| campaign.simulator.test.ts | 22 |
| campaign.trigger.test.ts | 24 |
| campaign-ringbeam.test.ts | 5 |
| campaign.evaluate-validation.e2e.test.ts | 31 |
| trigger.service.test.ts | 22 |
| 其它 | 15+ |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 营销活动创建/评估/触发已覆盖
- [x] Role 全版本已覆盖
- [x] 活动评估验证 E2E 覆盖

## 重点关注
- 20 个测试文件，覆盖 Controller/Service/E2E/Role/Trigger
- campaign.evaluate-validation.e2e.test.ts 31 cases — 评估验证端到端
- campaign.simulator.test.ts 22 cases + campaign.trigger.test.ts 24 cases
- trigger.service.test.ts 22 cases 覆盖触发引擎
- 完整角色版本矩阵 (role, role-extended, role-v3)
