# OCR 文字识别

> AI 光学字符识别服务，支持识别任务管理

## 功能
- 识别任务管理
- 任务取消
- 任务删除

## 依赖
- AgentModule

## API
- POST /ocr/tasks — 创建任务
- GET /ocr/tasks — 任务列表
- GET /ocr/tasks/:id — 任务详情
- POST /ocr/tasks/:id/cancel — 取消任务
- DELETE /ocr/tasks/:id — 删除任务
