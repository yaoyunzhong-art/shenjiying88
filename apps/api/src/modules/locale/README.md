# Locale 地域化

> 地域化服务，支持时区查询、国家转换与日期/数字格式化

## 功能
- 时区与国家查询
- 格式化 (日期/数字)
- 当前时间查询

## 依赖
- AgentModule

## API
- GET /locale/timezone/:countryCode — 时区查询
- GET /locale/country/:timeZone — 国家转换
- GET /locale/now/:timeZone — 当前时间
- POST /locale/format-date — 日期格式化
- POST /locale/format-number — 数字格式化
