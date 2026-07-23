# AI Sales 导购副驾

> AI 销售助手，提供智能推荐、异议处理、跟进排程等销售赋能能力

## 功能
- 商品智能推荐 (推荐/升级销售/交叉销售)
- 客户异议分类与自动应答
- 异议情景模拟
- 跟进排程与提醒
- 生日营销跟进

## API
- POST /ai-sales/recommend — 商品推荐
- POST /ai-sales/recommend/upsell — 升级推荐
- POST /ai-sales/recommend/cross-sell — 交叉推荐
- GET /ai-sales/products — 商品列表
- GET /ai-sales/products/:id — 商品详情
- POST /ai-sales/purchase — 模拟购买
- POST /ai-sales/objection/classify — 异议分类
- POST /ai-sales/objection/respond — 异议应答
- POST /ai-sales/objection/simulate — 异议模拟
- POST /ai-sales/follow-up — 创建跟进
- GET /ai-sales/follow-up/upcoming-birthdays — 即将生日列表
