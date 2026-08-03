# Loyalty 忠诚度

> 会员忠诚度管理服务，提供积分、优惠券、盲盒等数据的审计与统计

## 功能
- 积分账本审计
- 优惠券核销记录
- 盲盒发货/抽取记录
- 数据完整性校验

## 依赖
- MemberModule, MarketingMetricsModule, AgentModule, TenantModule

## API
- GET /loyalty/points-ledger — 积分账本
- GET /loyalty/coupon-redemptions — 优惠券核销
- GET /loyalty/blindbox-fulfillments — 盲盒发货
- GET /loyalty/blindbox-draw-records — 抽取记录
- GET /loyalty/blindbox-draw-records/integrity — 完整性校验
