# Points 积分

> 积分管理服务，支持积分交易、转移、扣除与批量发放

## 功能
- 积分交易记录
- 积分转移
- 积分扣除
- 批量发放
- 余额查询

## 依赖
- AgentModule

## API
- POST /points/transaction — 交易
- POST /points/transfer — 转移
- POST /points/deduct — 扣除
- POST /points/batch-award — 批量发放
- GET /points/balance/:memberId — 余额
