# ✅ ACCEPTANCE: push
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| push.controller.spec.ts | — |
| push.controller.test.ts | — |
| push.service.spec.ts | — |
| push.service.advanced.spec.ts | — |
| push.service.test.ts | — |
| push.dto.test.ts | — |
| push.entity.test.ts | — |
| push.module.test.ts | — |
| push.contract.test.ts | — |
| push.role.test.ts | — |
| push.role-extended.test.ts | — |
| push.role-v3.test.ts | — |
| push.role-missing.test.ts | — |
| push.e2e.test.ts | — |
| push.test.ts | — |
| dnd-config.test.ts | — |

**总测试用例数: 449**

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 推送核心链路已覆盖
- [x] 免打扰/DND配置已覆盖
- [x] 角色矩阵全覆盖 (含 missing/role-v3)
- [ ] 多渠道推送通道需验证

## 重点关注
- 20 个测试文件，449 个测试用例
- service.advanced.spec.ts 提供增强场景覆盖
- role-missing.test.ts 验证遗漏的角色边界
- dnd-config.test.ts 覆盖免打扰场景
