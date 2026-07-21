# 财务模块 (Finance)

## 用途
核心财务引擎，涵盖总账、账户、结算、对账、发票、报表及成本现金流管理。支持 SaaS 多租户隔离，集成 SSE 推送与 AI 辅助记账。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /finance` | 总账/账户/结算 CRUD |
| `GET /finance/report` | 财务报告聚合 |
| `POST /finance/payment` | 支付处理 |
| `POST /finance/settlement` | 结算管理 |
| `POST /finance/reconciliation` | 对账操作 |
| `GET /finance/sse` | 实时财务事件推送 |

## 测试位置
`apps/api/src/modules/finance/` — **48** 个测试文件：控制器单测 (`.spec.ts`)、服务单测 (`.test.ts`)、实体/DTO 测试、E2E (`.e2e.test.ts`)、对账专项测试、AI 集成测试。
