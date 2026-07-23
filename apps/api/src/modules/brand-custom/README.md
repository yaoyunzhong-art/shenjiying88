# Brand Custom 品牌定制

> 品牌个性化配置服务，管理租户品牌主题与自定义设置

## 功能
- 租户品牌管理
- 主题配置
- 品牌激活控制

## 依赖
- AgentModule

## API
- POST /brand-custom/tenants — 创建品牌
- GET /brand-custom/tenants — 品牌列表
- PATCH /brand-custom/tenants/:tenantId/active — 激活品牌
- GET /brand-custom/tenants/:tenantId/theme — 主题查询
- PATCH /brand-custom/tenants/:tenantId/theme — 主题更新
