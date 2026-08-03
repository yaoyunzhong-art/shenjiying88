# Transactions 交易

> 交易订单管理服务，支持订单创建、支付回调与持久化快照

## 功能
- 订单创建与查询
- 标准化支付回调
- 持久化订单快照

## 依赖
- CashierModule, FinanceModule, LoyaltyModule, MemberModule, PrismaModule, AgentModule, TenantModule

## API
- POST /transactions/checkout — 结算
- POST /transactions/payments/standardized-callback — 支付回调
- GET /transactions/orders/:orderId — 订单详情
- GET /transactions/orders — 订单列表
- GET /transactions/persistent/snapshots/orders — 持久化快照
