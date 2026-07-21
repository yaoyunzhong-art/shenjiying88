# 收银模块 (Cashier)

## 用途
门店收银台核心能力：订单生命周期管理（草稿→提交→履约→取消）、支付发起与回调、退款流程、离线同步、开票扩展。内嵌订单状态机与模拟器。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /cashier/orders` | 创建订单 |
| `POST /cashier/orders/:id/submit` | 提交订单 |
| `POST /cashier/orders/:id/payments` | 发起支付 |
| `POST /cashier/payments/:id/callback` | 支付回调 |
| `POST /cashier/orders/:id/refunds` | 申请退款 |
| `GET /cashier/orders` | 订单列表查询 |

## 测试位置
`apps/api/src/modules/cashier/` — **37** 个测试文件：控制器单测 (`.spec.ts`)、服务单测 (`.test.ts`)、E2E (`.e2e.test.ts`)、订单状态机测试、离线同步测试、角色权限测试、计费扩展测试。
