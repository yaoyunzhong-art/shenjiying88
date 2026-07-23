# AI Profile 用户画像

> AI 驱动的用户画像服务，管理用户标签与分群

## 功能
- 用户画像创建与更新
- 标签化用户分群查询
- 画像详情检索

## 依赖
- AgentModule

## API
- POST /ai-profile/profile — 创建画像
- GET /ai-profile/profile/:id — 画像详情
- GET /ai-profile/profile/user/:userId — 按用户查询
- GET /ai-profile/profiles — 画像列表
- GET /ai-profile/segment/:tags — 按标签分群查询
