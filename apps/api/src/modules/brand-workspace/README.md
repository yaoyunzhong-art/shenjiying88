# 🏢 brand-workspace — 品牌工作台

> V23 | 圈梁: 代码✅ 测试✅

品牌运营工作台模块。提供品牌团队的日常工作空间管理，包括布局配置、任务管理、审批流程、日历排期、快捷操作和汇总仪表盘。

## 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/brand-workspace/layout/:userId` | 获取用户布局 |
| PUT | `/brand-workspace/layout/:userId` | 保存布局配置 |
| GET | `/brand-workspace/tasks` | 任务列表 |
| POST | `/brand-workspace/tasks` | 创建任务 |
| PATCH | `/brand-workspace/tasks/:id` | 更新任务 |
| GET | `/brand-workspace/approvals` | 审批列表 |
| POST | `/brand-workspace/approvals/:id/approve` | 审批通过 |
| POST | `/brand-workspace/approvals/:id/reject` | 审批拒绝 |
| GET | `/brand-workspace/calendar` | 日历事件 |
| POST | `/brand-workspace/calendar` | 创建事件 |
| GET | `/brand-workspace/quick-actions` | 快捷操作 |
| POST | `/brand-workspace/quick-actions/execute` | 执行快捷操作 |
| GET | `/brand-workspace/summary` | 工作台汇总 |

## 测试
- `brand-workspace.service.spec.ts`
- `brand-workspace.controller.spec.ts`
