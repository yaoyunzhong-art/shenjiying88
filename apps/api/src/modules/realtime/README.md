# Realtime 实时协作

> 实时协同编辑服务，支持文档协作与邀请管理

## 功能
- 服务健康检查
- 协作文档管理
- 协作邀请
- 实时更新

## API
- GET /realtime/health — 健康检查
- POST /realtime/collab/document — 创建文档
- POST /realtime/collab/invite — 邀请
- POST /realtime/collab/update — 更新
- GET /realtime/collab/document/:docId — 文档查询
