# Member Predict 会员预测

> 会员流失预测服务，支持流失风险评估与预测分析

## 功能
- 流失风险列表
- 风险分布统计
- 个体评估

## 依赖
- AgentModule

## API
- GET /member-predict — 预测列表
- GET /member-predict/summary — 摘要
- GET /member-predict/risk-distribution — 风险分布
- POST /member-predict/evaluate — 评估
- GET /member-predict/:id — 详情
