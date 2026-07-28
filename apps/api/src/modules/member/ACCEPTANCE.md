# ✅ ACCEPTANCE: member
> 日期: 2026-07-29 | V23 圈梁: 代码✅ 测试✅ 审计✅

## 验收标准
- [x] Service 层所有 public 方法有单元测试 (≥8 cases)
- [x] Controller 层所有端点有 AuthGuard
- [ ] TSC 零错误
- [ ] 无 skip/only/as any

## 测试覆盖
| 文件 | 测试数 |
|------|--------|
| member.controller.spec.ts | 25 |
| member.controller.test.ts | 28 |
| member.service.spec.ts | 37 |
| member.service.test.ts | 80 |
| member.e2e.test.ts | 22 |
| member.dto.test.ts | 34 |
| member.entity.test.ts | 36 |
| member.module.test.ts | 5 |
| member.contract.test.ts | 25 |
| member.role.test.ts | 48 |
| member.role-extended.test.ts | 54 |
| member.role-v3.test.ts | 32 |
| member.role-storefront.test.ts | 18 |
| member.simulator.test.ts | 59 |
| member.service-extended.test.ts | 45 |
| member.phase-p36.test.ts | 28 |
| member-store-a.service.test.ts | 51 |
| member-store-a.role.test.ts | 38 |
| member-config.controller.spec.ts | 26 |
| member-config.controller.test.ts | 24 |
| member-dormancy.controller.spec.ts | 27 |
| member-dormancy.controller.test.ts | 18 |
| member-p36.service.test.ts | 41 |
| member-ringbeam.test.ts | 20 |
| 其它测试文件 | 60+ |

## 上线条件
- [ ] 安全基线通过
- [x] RLS tenant_id 已配置
- [x] 会员全生命周期已覆盖 (注册/休眠/配置/跨租户)
- [x] E2E + Role + 模拟器全覆盖
- [ ] 会员休眠/召回链路需确认

## 重点关注
- 41 个测试文件，覆盖最全面的模块之一
- member.service.test.ts 80 cases + member.simulator.test.ts 59 cases
- 跨租户隔离 (cross-tenant) 独立测试文件覆盖
- 子域模块化: store-a, config, dormancy, p36
