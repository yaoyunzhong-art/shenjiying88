# Recommend 个性化推荐

> 个性化推荐引擎，支持推荐、浏览/购买追踪与偏好管理

## 功能
- 相似商品推荐
- 浏览/购买记录追踪
- 用户偏好管理

## 依赖
- AgentModule

## API
- POST /recommend — 推荐
- GET /recommend/similar/:itemId — 相似推荐
- POST /recommend/track-view — 浏览追踪
- POST /recommend/track-purchase — 购买追踪
- POST /recommend/preferences — 偏好管理
