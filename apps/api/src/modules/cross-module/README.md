# 跨模块 E2E 验证模块 (Cross-Module)

## 用途
多模块集成验证引擎，定义并执行跨模块业务链路 E2E 测试（30+ 条链路覆盖品牌、财务、CRM、营销、库存、支付等）。提供链路状态仪表、一键验证及破损检测，确保多模块协作完整性。

## 关键端点
- `GET /cross-module/chain-status` — 返回全部 E2E 验证链路清单
- `GET /cross-module/summary` — 验证摘要统计
- `POST /cross-module/validate` — 执行指定链路的跨模块验证
- `POST /cross-module/validate/:chainName` — 验证单条链路
- `GET /cross-module/all-verified` — 检查是否全部通过
- `GET /cross-module/has-broken` — 检查是否有断开链路

## 测试文件
- `cross-module.controller.test.ts` / `cross-module.controller.spec.ts` — 控制器测试
- `cross-module.service.test.ts` / `cross-module.service.spec.ts` — 服务层测试
- `cross-module.module.test.ts` — 模块测试
- `cross-module.dto.test.ts` — DTO 测试
- `cross-module.entity.test.ts` — 实体测试
- `cross-module.role-extended.test.ts` — 角色权限测试
- `cross-module-ringbeam.test.ts` — 环形测试
- `cross-module-e2e-*.test.ts` — 各业务链路 E2E 测试（30+ 条，如会员优惠券支付、品牌物流等）
- `test-helpers.ts` — 跨模块测试辅助工具
