# Employee Marketing 员工营销

> 员工营销推广服务，支持推广码生成、跟踪与统计分析

## 功能
- 员工推广码管理
- 推广追踪与统计
- 客户退订管理

## 依赖
- AgentModule

## API
- POST /employee-marketing/promo-code — 生成推广码
- GET /employee-marketing/promo-codes — 推广码列表
- POST /employee-marketing/track — 记录推广
- GET /employee-marketing/stats/:employeeId — 员工统计
- POST /employee-marketing/customer/opt-out/:trackingId — 客户退订
