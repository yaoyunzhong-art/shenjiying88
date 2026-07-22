# 2026-07-22 下一阶段开发任务清单 v1

## 当前判断

- 当前生产环境已恢复稳态，发布门禁已全绿，但当前阶段不以“立刻发布”为目标。
- 下一阶段开发主轴应从“继续铺新功能”切换为“打穿前台交易主链”。
- 当前最值得优先投入的链路是:
  - `storefront-web / cashier`
  - `storefront-web / checkout`
  - `storefront-web / orders`
  - `storefront-web / h5 payment`
- 当前总体策略:
  - 先打穿 `收银 -> 支付 -> 订单 -> 退款 -> 财务`
  - 再强化 `会员 -> 优惠 -> 复购`
  - 最后统一 `SDK 真源 + 状态板 + 验收口径`

## 总目标

- 目标 1: 把 `storefront-web` 做成真正可演示、可联调、可验收的交易主入口
- 目标 2: 把支付与退款从“页面可展示”升级到“状态真驱动”
- 目标 3: 把会员权益接入交易链，让系统从收银工具升级为经营系统
- 目标 4: 把 `Web / App / API / SDK` 的字段和验收口径统一起来

## P0

### TASK-P0-01: storefront 收银页彻底去 Mock

- 目标:
  - 让 `cashier` 页面不再依赖隐性 mock、兼容壳或假商品回退
- 重点文件:
  - `apps/storefront-web/app/cashier/page.tsx`
  - `apps/storefront-web/lib/storefront-transactions.ts`
  - `apps/api/src/modules/cashier/cashier.controller.ts`
  - `packages/sdk/src/index.ts`
- 具体工作:
  - 清理残余假数据入口
  - 收口真实商品目录、扫码查商品、会员识别、订单创建
  - 明确加载态、空态、失败态、网络异常态
- 完成标准:
  - 浏览器可真实完成“选商品 + 识别会员 + 创建订单”
  - 页面不再隐式回退到 mock 数据
- 优先级:
  - `P0`

### TASK-P0-02: checkout 金额与优惠主链收口

- 目标:
  - 确保 `checkout` 页面金额、折扣、税费、支付方式与后端口径一致
- 重点文件:
  - `apps/storefront-web/app/checkout/page.tsx`
  - `apps/storefront-web/lib/storefront-transactions.ts`
  - `packages/sdk/src/index.ts`
  - `apps/api/src/modules/transactions/transactions.service.ts`
- 具体工作:
  - 统一金额计算来源
  - 核对优惠券、会员权益、折扣、税费的组合逻辑
  - 补金额边界、空商品、非法商品、重复提交等保护
- 完成标准:
  - checkout 展示金额与后端订单金额一致
  - 页面存在明确的异常反馈与防重复提交逻辑
- 优先级:
  - `P0`

### TASK-P0-03: orders 列表/详情页彻底真实化

- 目标:
  - 让 `orders` 页面成为真实订单查询入口，不再依赖 legacy 假回退
- 重点文件:
  - `apps/storefront-web/app/orders/page.tsx`
  - `apps/storefront-web/app/orders/[id]/page.tsx`
  - `apps/storefront-web/app/h5/orders/page.tsx`
  - `apps/storefront-web/lib/storefront-orders.ts`
- 具体工作:
  - 收口订单列表、分页、筛选、详情聚合
  - 完整展示支付状态、退款状态、商品明细、异常态
  - 清理遗留 `legacy order-service` 或兼容层
- 完成标准:
  - 浏览器中真实订单可查、可点、可看详情
  - 列表/详情/H5 页面统一使用真实 helper 与真实接口
- 优先级:
  - `P0`

### TASK-P0-04: H5 支付页真实浏览器验收

- 目标:
  - 补齐 `h5 payment` 最关键的运行证据
- 重点文件:
  - `apps/storefront-web/app/h5/payment/[orderId]/page.tsx`
  - `apps/storefront-web/lib/storefront-transactions.ts`
  - `apps/api/src/modules/cashier/cashier.service.ts`
  - `apps/api/src/modules/transactions/transactions.service.ts`
- 具体工作:
  - 跑通二维码/支付链接透传
  - 验证轮询、过期时间、状态刷新、失败态提示
  - 形成浏览器 smoke 证据
- 完成标准:
  - 页面只消费后端返回的支付状态与二维码字段
  - 有真实浏览器证据，不只停留在单测
- 优先级:
  - `P0`

## P1

### TASK-P1-01: 支付状态语义统一

- 目标:
  - 把“页面能发起支付”升级成“支付状态真驱动订单状态”
- 重点文件:
  - `apps/api/src/modules/cashier/ports/payment-channel.bootstrap.ts`
  - `apps/api/src/modules/cashier/cashier.service.ts`
  - `apps/api/src/modules/transactions/transactions.service.ts`
  - `packages/sdk/src/index.ts`
- 具体工作:
  - 统一支付成功、失败、取消、过期状态语义
  - 明确 `prepay` 数据结构和渠道适配逻辑
  - 校准订单聚合里的支付字段透传
- 完成标准:
  - 支付状态不再依赖前端猜测或前端伪成功
  - API、SDK、前端对支付状态字段解释一致
- 优先级:
  - `P1`

### TASK-P1-02: 退款闭环联动订单与财务

- 目标:
  - 让退款链真正影响订单状态和财务记录
- 重点文件:
  - `apps/api/src/modules/cashier/cashier.controller.ts`
  - `apps/api/src/modules/transactions/transactions.service.ts`
  - `apps/api/src/modules/finance/finance.service.ts`
  - `packages/sdk/src/index.ts`
- 具体工作:
  - 打通退款申请、审批、完成后的状态回写
  - 确认退款记录与财务 ledger/account/settlement 的联动
  - 补 service + API + 浏览器级证据
- 完成标准:
  - 退款后订单状态、支付状态、财务记录同步变化
  - 前台可见退款进度，后台有真实落账证据
- 优先级:
  - `P1`

## P2

### TASK-P2-01: 会员权益接入收银主链

- 目标:
  - 把会员从“可查信息”升级成“真实影响结账结果”的经营能力
- 重点文件:
  - `apps/storefront-web/app/member-center/page.tsx`
  - `apps/storefront-web/app/member-login/page.tsx`
  - `apps/storefront-web/app/cashier/page.tsx`
  - `packages/sdk/src/index.ts`
- 具体工作:
  - 打通会员识别后的权益展示
  - 让优惠券、充值余额、等级权益与结账金额联动
  - 交易完成后沉淀会员订单/权益变化
- 完成标准:
  - 会员权益能真实影响支付前金额与支付后结果
  - 收银链和会员链不再割裂
- 优先级:
  - `P2`

### TASK-P2-02: finance 消费端全面改吃 SDK 真源

- 目标:
  - 让 `Web / App` 与 `API` 统一吃同一套 finance contract
- 重点文件:
  - `packages/sdk/src/index.ts`
  - `apps/storefront-web/lib/storefront-finance.ts`
  - `apps/app` 中 finance 相关消费页
  - `apps/api/src/modules/finance/finance.contract.ts`
- 具体工作:
  - 清理前端重复类型定义
  - 统一 `ledger / account / settlement / invoice / revenue` 的消费路径
  - 补消费端断言与回归
- 完成标准:
  - finance 字段口径不再在 `Web / App / SDK / API` 间漂移
- 优先级:
  - `P2`

## P3

### TASK-P3-01: 单一状态板与验收口径收口

- 目标:
  - 防止代码真相、状态板真相、验收真相继续分裂
- 重点文件:
  - `docs/knowledge/master-status-board.md`
  - `docs/knowledge/phase-progress.md`
  - `TASKS_STATUS.md`
  - 新增或补齐的交易链验收卡
- 具体工作:
  - 指定 `master-status-board.md` 为单主线状态真源
  - 为 `cashier / checkout / orders / payment / refund` 补独立验收卡
  - 每轮开发结束同步回写状态、证据和结论
- 完成标准:
  - 任务、状态、验收三套口径一致
  - 不再出现“代码已做，文档未回写”的情况
- 优先级:
  - `P3`

### TASK-P3-02: 开发证据模板标准化

- 目标:
  - 保证后续每一轮开发都有代码、配置、证据、回滚四要素
- 重点文件:
  - `docs/knowledge/acceptance/`
  - `scripts/pre-release-check.sh`
  - `scripts/run-g8-formal-window-ready.sh`
- 具体工作:
  - 沉淀交易链 smoke 模板
  - 固化发布前检查与页面运行证据模板
  - 对接事故结案卡、发布结论卡、验收卡
- 完成标准:
  - 每一轮任务都能快速形成标准化留档
- 优先级:
  - `P3`

## 推荐执行顺序

1. `TASK-P0-01 storefront 收银页彻底去 Mock`
2. `TASK-P0-02 checkout 金额与优惠主链收口`
3. `TASK-P0-03 orders 列表/详情页彻底真实化`
4. `TASK-P0-04 H5 支付页真实浏览器验收`
5. `TASK-P1-01 支付状态语义统一`
6. `TASK-P1-02 退款闭环联动订单与财务`
7. `TASK-P2-01 会员权益接入收银主链`
8. `TASK-P2-02 finance 消费端全面改吃 SDK 真源`
9. `TASK-P3-01 单一状态板与验收口径收口`
10. `TASK-P3-02 开发证据模板标准化`

## 当前结论

- 下一阶段开发不建议继续广撒网铺新功能。
- 最优路线是:
  - `先打穿 storefront-web 交易主链`
  - `再补支付与退款真闭环`
  - `再把会员权益接入经营链`
  - `最后统一 SDK、状态板和验收口径`
- 若按该清单推进，项目会从“很多模块都在推进”转成“主链真正可演示、可验收、可上线”。
