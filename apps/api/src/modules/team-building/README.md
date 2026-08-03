# Team Building 团建营销引擎

> WP-16 团建活动营销引擎，管理团建推荐、活动策划与设备检查

## 功能
- 团建活动 CRUD 管理
- 活动类型配置
- 智能团建推荐
- 设备检查与场地验证
- 活动事件跟踪

## API
- GET /team-building — 活动列表
- GET /team-building/stats — 统计概览
- GET /team-building/types — 活动类型
- GET /team-building/:id — 活动详情
- POST /team-building — 创建活动
- PATCH /team-building/:id — 更新活动
- DELETE /team-building/:id — 删除活动
- POST /team-building/recommend — 智能推荐
- POST /team-building/check-equipment — 设备检查
- POST /team-building/events — 创建事件
- GET /team-building/events — 事件列表
