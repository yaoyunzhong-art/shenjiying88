# Feedback 反馈管理

> 用户反馈收集与管理服务，支持反馈提交、回复与统计

## 功能
- 反馈 CRUD 管理
- 反馈回复
- 反馈统计分析

## 依赖
- AgentModule

## API
- POST /feedback — 提交反馈
- GET /feedback — 反馈列表
- GET /feedback/stats — 统计
- GET /feedback/:id — 详情
- POST /feedback/:id/reply — 回复
