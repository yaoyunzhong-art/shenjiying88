# AI Push AI 推送

> AI 智能推送引擎，管理推送任务、分群推送与 A/B 实验

## 功能
- 推送任务创建与管理
- 分群定向推送
- 推送统计
- A/B 实验管理

## 依赖
- AgentModule

## API
- POST /ai-push/tasks — 创建推送任务
- POST /ai-push/segment-push — 分群推送
- GET /ai-push/tasks — 任务列表
- GET /ai-push/stats — 推送统计
- POST /ai-push/experiments — 创建实验
