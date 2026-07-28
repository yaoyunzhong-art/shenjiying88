# ✅ ACCEPTANCE: return-request
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| return-request.controller.test.ts | — |
| return-request.service.spec.ts | — |
| return-request.service.test.ts | — |
| return-request.dto.test.ts | — |
| return-request.entity.test.ts | — |
| return-request.module.test.ts | — |
| return-request.role.test.ts | — |
| return-request.role-extended.test.ts | — |

**总测试用例数: 130**

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 退货申请核心链路已覆盖
- [x] 角色权限已覆盖
- [ ] 需要补 E2E 测试
- [ ] 退货审批流程需验证

## 重点关注
- 9 个测试文件，130 个测试用例
- Service spec + test 双重覆盖
- 缺少 e2e 测试（退货流程端到端）
- 缺少 controller.metadata 测试
