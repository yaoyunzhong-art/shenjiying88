# 场地模块 (Venue)

## 用途
场馆资源管理 P-25 + V24：场地 CRUD、时段定价、节假日定价、场地预订、类型/状态/搜索多维查询。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /venue` | 创建场地 |
| `GET /venue` | 场地列表（支持 type/status/search 筛选） |
| `GET /venue/:id` | 场地详情 |
| `PUT /venue/:id` | 更新场地信息 |
| `DELETE /venue/:id` | 删除场地 |
| `POST /venue/:id/bookings` | 场地预订 |

## 测试位置
`apps/api/src/modules/venue/` — **6** 个测试文件：控制器单测、服务单测、E2E (`.e2e.test.ts`)、角色权限测试、预订服务测试。
