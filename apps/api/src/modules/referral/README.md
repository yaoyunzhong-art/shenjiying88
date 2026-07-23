# Referral 推荐有礼

> 推荐有礼营销服务，支持推荐码生成、点击追踪与奖励管理

## 功能
- 推荐码生成与查询
- 点击追踪
- 注册转化
- 奖励记录

## 依赖
- MarketingMetricsModule, AgentModule

## API
- POST /referral/code — 生成推荐码
- GET /referral/code/:shortCode — 查询推荐码
- POST /referral/click — 点击追踪
- POST /referral/signup — 注册记录
- POST /referral/rewards/:recordId — 奖励发放
