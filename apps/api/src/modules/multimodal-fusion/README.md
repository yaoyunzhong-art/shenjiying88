# Multimodal Fusion 多模态融合

> 多模态 AI 融合服务，支持多模态任务管理、搜索

## 功能
- 多模态任务管理
- 任务取消
- 多模态搜索

## 依赖
- AgentModule

## API
- POST /multimodal-fusion/tasks — 创建任务
- GET /multimodal-fusion/tasks — 任务列表
- GET /multimodal-fusion/tasks/:id — 任务详情
- POST /multimodal-fusion/tasks/:id/cancel — 取消任务
- POST /multimodal-fusion/search — 多模态搜索
