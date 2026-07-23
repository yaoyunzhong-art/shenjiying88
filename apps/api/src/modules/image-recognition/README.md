# Image Recognition 图像识别

> AI 图像识别服务，支持识别任务管理、视觉搜索

## 功能
- 图像识别任务管理
- 任务取消
- 视觉相似搜索

## 依赖
- AgentModule

## API
- POST /image-recognition/tasks — 创建任务
- GET /image-recognition/tasks — 任务列表
- GET /image-recognition/tasks/:id — 任务详情
- POST /image-recognition/tasks/:id/cancel — 取消任务
- POST /image-recognition/visual-search — 视觉搜索
