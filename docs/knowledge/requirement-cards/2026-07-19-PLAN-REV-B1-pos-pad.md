# PLAN-REV-B1 · POS/Pad 一线经营链任务卡

> 创建: 2026-07-19
> 关联行动卡: `PLAN-REV-B1`
> 截止: 2026-07-21
> 目标: 将 `POS/Pad` 从“计划项”推进为“有明确页面流、API 流、验收流、证据流”的真实交付链

---

## 1. 当前结论

- 当前状态: `✅ 已完成 1 条最小可演示链`
- 结论说明:
  - 仓库内已经存在 `收银页面 + POS 服务层 + Cashier API + 测试资产 + PRD/SOP`
  - 当前最大缺口不再是“没有最小演示链”，而是“真实后端接口尚未完全接线”
  - 2026-07-19 已完成浏览器级最小链验收，满足 `PLAN-REV-B1` 的完成条件

---

## 2. 最小一线经营链

### 2.1 页面流

1. `Pad` 角色入口进入收银工作台
2. 收银员执行选品/加购
3. 输入手机号识别会员并应用折扣
4. 选择支付方式完成支付
5. 生成小票/票据
6. 必要时进入退款查询

### 2.2 本仓现有落点

| 环节 | 现有资产 | 说明 |
|------|----------|------|
| Pad 入口 | [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/pad/page.tsx) | 已有 `CASHIER` 作为一线岗位入口 |
| 门店收银工作台 | [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/cashier/page.tsx) | 已有会员搜索、消费记录、CashierPanel、收银按钮 |
| 前台收银页 | [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/storefront-web/app/cashier/page.tsx) | 已有选品、会员识别、折扣计算、支付选择、支付成功态 |
| POS 服务层 | [cashier-pos-service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/tob-web/app/cashier-pos/cashier-pos-service.ts) | 已有离线队列、订单提交、会员、商品、票据、SSE 雏形 |
| 后端收银 API | [cashier.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/cashier/cashier.controller.ts) | 已有订单、支付、回调、退款 11 个端点 |

---

## 3. API 流对齐

### 3.1 已确认可对齐的主链

| 业务动作 | 前端/服务调用 | 后端端点 | 状态 |
|----------|---------------|----------|:----:|
| 创建订单 | `submitOrder()` | `POST /cashier/orders` | ✅ |
| 查询订单 | `queryOrder()` | `GET /cashier/orders/:id` | ✅ |
| 发起支付 | 需从页面接入支付分配/下单动作 | `POST /cashier/orders/:id/payments` | 🟡 |
| 支付确认 | 需接入回调或 mock 成功链 | `POST /cashier/payments/:id/callback` | 🟡 |
| 查询退款 | `queryRefundStatus()` | `GET /cashier/refunds/:id` | ✅ |

### 3.2 已确认的接口缺口

| 缺口 | 当前事实 | 必须动作 |
|------|----------|----------|
| 退款发起 path 错位 | `requestRefund()` 当前调用 `POST /cashier/refunds`，后端实际为 `POST /cashier/orders/:id/refunds` | 修正服务层 path，并按订单维度发起退款 |
| 会员 lookup 未落后端合同 | 服务层预留 `/cashier/members/lookup`，当前 `cashier.controller.ts` 未暴露该端点 | 决定由 `member` 模块承接，或在 `cashier` 下补 façade |
| 商品扫码未落后端合同 | 服务层预留 `/cashier/products/:sku`，当前 `cashier.controller.ts` 未暴露该端点 | 明确扫码查商品的归属接口 |
| 渠道统计未落后端合同 | 服务层预留 `/cashier/stats/channels`，当前控制器未暴露 | 决定是否并入收银报表域 |
| SSE 地址未收口 | 服务层当前使用 `/cashier/events`，后端实际已有 `orders/events` 与 `payments/events` | 明确订阅哪条事件流，并修正客户端路径 |

---

## 4. 测试与证据

### 4.1 已有证据

| 类型 | 证据 | 说明 |
|------|------|------|
| 后端路由测试 | [cashier.controller.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/cashier/cashier.controller.test.ts) | 已验证订单/支付/退款 11 条路由元数据与正反例 |
| POS 服务测试 | [cashier-pos-service.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/tob-web/app/cashier-pos/cashier-pos-service.test.ts) | 已覆盖多付款、会员、票据、离线队列 |
| 产品 PRD | [prd-cashier-p35.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/prd/prd-cashier-p35.md) | 已定义前台收银主流程与验收卡 |
| 周检 SOP | [weekly-review-sop.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/weekly-review-sop.md) | 已有 `/cashier` 选品、结算、支付、打印口径 |
| 产品口径 | [help-center-data.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/help-center/help-center-data.ts) | 已明确 `PAD 端和 PC 端双端管理` 与 `开单收银` 叙事 |

### 4.2 当前还缺的证据

1. 页面与真实 API 贯通证据
2. 支付成功后票据/小票的真实页面证据
3. 退款申请到查询结果的最小闭环证据

### 4.3 新增验收证据

| 类型 | 证据 | 说明 |
|------|------|------|
| 浏览器验收记录 | [2026-07-19-b1-cashier-browser-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-b1-cashier-browser-acceptance.md) | 已记录人工浏览器走查与结论 |
| Playwright 用例 | [cashier-pos-minimal.spec.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/e2e/tests/cashier-pos-minimal.spec.ts) | 已固化 `选品 -> 会员 -> 微信支付成功` 自动化链路 |

---

## 5. 交付拆解

### B1-1 页面流收口

- 目标:
  - 选定 `storefront-web/cashier` 作为最小收银演示页
  - 选定 `admin-web/stores/[id]/cashier` 作为门店管理侧观测页
  - 选定 `admin-web/pad` 作为 Pad 角色入口证据
- 输出物:
  - 页面跳转图
  - 演示脚本
  - 截图/录屏位

### B1-2 API 流收口

- 目标:
  - 创建订单
  - 支付发起
  - 支付确认
  - 退款申请
  - 退款查询
- 输出物:
  - 接口映射表
  - path 对齐提交
  - mock/真实调用切换说明

### B1-3 验收流收口

- 目标:
  - 以 `AC-35-01` ~ `AC-35-08` 为主
  - 先保底打通 `选品 -> 会员 -> 支付 -> 成功 -> 小票`
- 输出物:
  - 浏览器验收脚本
  - 验收记录
  - 异常回退说明

### B1-4 证据流收口

- 目标:
  - 把代码证据、页面证据、测试证据、演示证据挂到同一处
- 输出物:
  - 本任务卡
  - 状态页回写
  - 复签检查表回写

---

## 6. 达标定义

### 达到“有明确交付链”

满足以下条件即可:

1. 已明确页面入口、业务路径、API 路径
2. 已指出现有证据与缺口
3. 已形成负责人和输出物

### 达到“至少 1 条可跑通”

必须同时满足:

1. 浏览器完成 `选品 -> 会员 -> 支付成功`
2. 后端至少完成 `订单 -> 支付 -> 查询` 真实或稳定 mock 闭环
3. 至少 1 份页面证据 + 1 份测试证据 + 1 份执行记录

### 当前判定

- `✅ 已满足`
- 依据:
  - 浏览器验收已通过
  - Playwright 用例已通过
  - 页面、测试、执行记录均已留存

---

## 7. 当前负责人

| 角色 | 负责人 | 当前动作 |
|------|--------|----------|
| 一线产品链 | `E20` | 确认最小演示页面与收银员动作路径 |
| 前端体验链 | `E13` | 对齐 Pad/PC 页面入口与收银页体验 |
| 验收证据链 | `E45` | 形成浏览器验收与演示证据 |

---

## 8. 下一刀

1. 明确 `members/products/events` 由哪个后端模块承接
2. 将 `storefront-web/cashier` 接到可验证的真实订单/支付链
3. 补齐退款申请与查询的最小闭环
4. 推进 `PLAN-REV-B2` 与 `PLAN-REV-C1`，继续松动 `G3`
