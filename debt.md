# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-06-24 21:14 CST · Pulse-59

---

## 🟥 P0 · 阻塞级 (需立即人工关注)

### P0-001: @m5/api 22 测试失败回归 🔴
- **发现**: Pulse-59 (2026-06-24 21:14)
- **根因分析**:
  1. **Market 模块 (~13 fail)** — controller test, role test, role-extended test, dto test 全 fail。根因: `MODULE_NOT_FOUND` 错误指向市场模块的 credit-role test 中 `require('./market.controller')` 路径解析失败，但单独运行可过。全量运行时因 test runner 状态污染导致。
  2. **VIP 模块 (~9 fail)** — 店长/前台/运行专员/营销视角全 fail。根因: 角色测试中 mock service 返回 undefined 或不完整，导致 VIP 领域测试全部断裂。
  3. **MemberService persistent (3 fail)** — `TypeError: recorder.onModuleInit is not a function`。根因: `createApprovalClosureHarness` 中 `recorder` 接口变更（governance-approval module 重构后 onModuleInit 签名变化），测试未同步更新。
  4. **Tournament Simulator (2 fail)** — draw 和 bye 场景边界用例。
  5. **Governance-approval (1 fail)** — EXECUTED/EXECUTION_FAILED status flow 失败。
  6. **Product CRUD E2E (1 fail)** — E2E 生命周期测试失败。
  7. **Member controller (1 fail)** — getBootstrap 路由元数据检查。
  8. **Member-approval recorder (1 fail)** — onModuleInit 注册测试。

- **分类 + 修复难度**:
  - P0a. Market 模块 (13 fail) → 🟡 中等, root cause 是测试文件之间的状态污染 + dist 与 src 混用
  - P0b. VIP 模块 (9 fail) → 🟡 中等, mock 需要补全
  - P0c. recorder.onModuleInit (3+1 fail) → 🟢 简单, 接口未对齐
  - P0d. Tournament (2 fail) → 🔴 历史遗留, 连续多轮修复仍不稳定
  - P0e. Governance/Product (2 fail) → 🟡 中等
- **连续修复尝试**: 0 (Pulse-59 首次发现回归)
- **升级条件**: 连续 2 脉冲同一模块修复失败 → 人工介入

---

### P0-002: @m5/app app-journey.test.ts 耗时 66s 🔴
- **发现**: Pulse-59 (2026-06-24 21:14)
- **根因**: app-journey.test.ts E2E 测试超时 (66389ms), 可能集成测试需要更多超时或实际 API 不可达
- **状态**: 首次标记，待分析

---

## 🟡 P1 · 阻塞级 (已知持续问题)

### P1-001: @m5/ui build fail 🔴
- **发现**: Pulse-59 (2026-06-24 21:14)
- **根因**: `@m5/ui#build` 退出代码 1，具体构建错误未捕获到
- **状态**: 首次标记，待进一步日志分析

---

## 存档

### Pulse-58 (2026-06-24 08:37)
- **状态**: ✅ **0 fail** (全量 11224 tests 全绿) + TSC 全绿
- **全模块健康**: api/ui/admin/tob/sf/miniapp 全部通过

### Pulse-57 (2026-06-23 19:58)
- tournament simulator 2 fails → 已修复并闭环 ✅
- 连续 2 脉冲 0 fail 验证通过
