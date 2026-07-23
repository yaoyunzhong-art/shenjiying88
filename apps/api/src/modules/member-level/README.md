# Member Level 会员等级

> 会员等级评估与管理服务，支持等级评估、计算与升级路径查询

## 功能
- 会员等级评估
- 等级计算
- 批量评估
- 等级配置
- 升级路径查询

## 依赖
- AgentModule

## API
- POST /member-level/evaluate — 等级评估
- POST /member-level/calculate — 等级计算
- POST /member-level/batch — 批量评估
- GET /member-level/config — 配置查询
- GET /member-level/upgrade-path/:fromTier/:fromSub/:toTier/:toSub — 升级路径
