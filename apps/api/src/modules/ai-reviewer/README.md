# AI Reviewer 代码审查器

> AI 自动化代码审查引擎，提供代码审查规则管理与 CI 集成

## 功能
- 自动化代码审查与评分
- 审查规则管理 (CRUD)
- CI 集成验证
- 审查统计与趋势分析

## 依赖
- AgentModule

## API
- POST /ai-reviewer/review — 提交审查
- GET /ai-reviewer/rules — 规则列表
- POST /ai-reviewer/rules — 创建规则
- GET /ai-reviewer/rules/:ruleId — 规则详情
- GET /ai-reviewer/stats — 审查统计
- POST /ai-reviewer/ci-verify — CI 集成验证
