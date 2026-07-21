# 通知模块 (Notification)

## 用途
多通道通知推送引擎。支持通知模板注册与渲染、多渠道下发（站内信/Push/SMS等）、调度记录追踪、重试与取消机制。覆盖多租户/品牌/门店维度的通知场景，具备可观测性指标。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST/GET /notifications/templates` | 通知模板注册与列表 |
| `PATCH /notifications/templates/:id` | 更新模板 |
| `POST /notifications/send` | 发送通知 |
| `GET /notifications/dispatches` | 下发记录查询 |
| `POST /notifications/dispatches/:id/retry` | 重试下发 |
| `POST /notifications/dispatches/:id/cancel` | 取消下发 |

## 测试位置
`apps/api/src/modules/notification/` — **10** 个测试文件：控制器单测、服务单测、DTO/Entity 测试、角色权限测试、合约测试、E2E 集成测试、可观测性指标测试、圈梁测试。
