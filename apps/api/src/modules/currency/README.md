# Currency 货币汇率

> 多币种汇率管理服务，支持汇率查询、转换与管理

## 功能
- 汇率查询 (基础/所有)
- 货币转换
- 汇率维护

## 依赖
- AgentModule

## API
- GET /currency/rates — 所有汇率
- GET /currency/rates/base — 基础汇率
- POST /currency/convert — 货币转换
- POST /currency/rates — 更新汇率
- POST /currency/add — 新增货币
