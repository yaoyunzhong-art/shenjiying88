# ✅ ACCEPTANCE: stock
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [ ] Controller 层所有端点有 AuthGuard (缺少 controller)
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| stock.test.ts | 36 |
| stock.service.boost.test.ts | 34 |
| stock.service.extended.spec.ts | 24 |
| stock.role-extended.test.ts | 20 |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [ ] 需要补 Controller 层测试
- [ ] 需要补 E2E 测试
- [ ] 需要补 DTO/Entity 测试

## 重点关注
- 5 个测试文件，核心 service 覆盖较好
- stock.test.ts 36 cases + service.boost.test.ts 34 cases
- 缺少 controller、e2e、dto、entity 测试文件
- 与 inventory 模块存在功能重叠，后续排查冗余
