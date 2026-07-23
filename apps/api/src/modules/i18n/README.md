# I18n 国际化

> 多语言国际化管理服务，支持翻译管理、批量导入与提取

## 功能
- 翻译条目 CRUD
- 批量翻译导入
- 翻译文本自动提取

## 依赖
- TenantModule

## API
- POST /i18n/translations — 创建翻译
- GET /i18n/translations — 翻译列表
- PUT /i18n/translations/:id — 更新翻译
- POST /i18n/translations/bulk — 批量操作
- GET /i18n/translations/extract — 文本提取
