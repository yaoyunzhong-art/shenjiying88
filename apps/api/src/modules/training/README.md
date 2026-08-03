# Training 培训

> 培训管理服务，支持课程管理、报名与角色课程查询

## 功能
- 课程 CRUD 管理
- 课程报名
- 按角色查询课程

## 依赖
- AgentModule

## API
- POST /training/courses — 创建课程
- GET /training/courses — 课程列表
- GET /training/courses/:id — 课程详情
- GET /training/courses/by-role/:role — 按角色查询
- POST /training/enroll — 报名
