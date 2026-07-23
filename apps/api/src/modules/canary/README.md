# Canary 金丝雀发布

> 灰度发布管理服务，支持金丝雀版本的创建、激活与暂停

## 功能
- 金丝雀版本管理
- 灰度激活与暂停
- 发布列表查询

## 依赖
- AgentModule

## API
- GET /canary/list — 版本列表
- GET /canary/:id — 版本详情
- POST /canary/create — 创建版本
- POST /canary/:id/activate — 激活版本
- POST /canary/:id/pause — 暂停版本
