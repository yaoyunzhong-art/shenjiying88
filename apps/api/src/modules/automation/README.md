# Automation 自动化引擎

> 规则驱动的自动化工作流引擎，支持条件规则评估与工作流编排

## 功能
- 自动化规则管理 (CRUD)
- 规则条件评估
- 工作流定义与执行

## API
- GET /automation/rules — 规则列表
- GET /automation/rules/:id — 规则详情
- POST /automation/rules — 创建规则
- POST /automation/rules/:id/evaluate — 评估规则
- POST /automation/workflows — 创建工作流
