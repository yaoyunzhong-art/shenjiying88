# CRM 模块 (Customer Relationship Management)

## 用途
客户全生命周期管理：客户信息 CRUD、交互记录追踪、评分体系、标签管理、工单追踪、统计概览。支持多租户隔离。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET/POST /api/crm/customers` | 客户列表 / 创建 |
| `GET/PUT/DELETE /api/crm/customers/:id` | 客户详情 / 更新 / 删除 |
| `PATCH /api/crm/customers/:id/score` | 评分更新（delta/直接） |
| `POST /api/crm/customers/:id/notes` | 添加备注 |
| `POST/DELETE /api/crm/customers/:id/tags` | 标签增删 |
| `GET/POST /api/crm/customers/:id/tickets` | 工单列表 / 创建 |

## 测试位置
`apps/api/src/modules/crm/` — **5** 个测试文件：控制器单测、服务单测、E2E、角色权限测试（role/role-extended）。
