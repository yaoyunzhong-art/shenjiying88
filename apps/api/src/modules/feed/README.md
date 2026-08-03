# Feed 动态流

> 社交动态流服务，支持帖子发布、互动与时间线

## 功能
- 帖子 CRUD 管理
- 帖子点赞/取消点赞
- 动态时间线

## 依赖
- AgentModule

## API
- GET /feed — 动态列表
- GET /feed/posts/:id — 帖子详情
- POST /feed/posts — 发布帖子
- POST /feed/posts/:id/like — 点赞
- POST /feed/posts/:id/unlike — 取消点赞
