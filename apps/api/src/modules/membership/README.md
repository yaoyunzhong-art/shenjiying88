# Membership 会员注册

> 会员注册与管理服务，支持注册、查询与信息更新

## 功能
- 会员注册
- 会员查询 (ID/手机号)
- 会员信息更新

## API
- POST /membership/register — 注册会员
- POST /membership/get-or-create — 获取或创建
- GET /membership/:id — 按 ID 查询
- GET /membership/phone/:phone — 按手机号查询
- PUT /membership/:id — 更新信息
